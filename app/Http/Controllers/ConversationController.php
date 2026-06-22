<?php

namespace App\Http\Controllers;

use App\Events\MessageSent;
use App\Events\MessageStatusUpdated;
use App\Events\UserPresenceUpdated;
use App\Mail\AdminChatMessageReceivedMail;
use App\Models\Admin;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

class ConversationController extends Controller
{
    public function init(Request $request)
    {
        $user = Auth::user();
        if (! $user) {
            abort(401);
        }

        $conversation = $user->conversation()->firstOrCreate([]);

        $unreadCount = $conversation->messages()
            ->where('sender_type', 'admin')
            ->whereNull('read_at')
            ->count();

        return response()->json([
            'conversation' => $conversation,
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Called when the user's session ends (logout, tab close, navigation away).
     * Immediately clears the online cache and broadcasts the offline presence event.
     */
    public function goOffline(Request $request)
    {
        $user = Auth::user();
        if (! $user) {
            return response()->json(['ok' => true]);
        }

        $cacheKey = "user_chat_online_{$user->id}";

        if (Cache::has($cacheKey)) {
            Cache::forget($cacheKey);
            broadcast(new UserPresenceUpdated(userId: $user->id, online: false));
        }

        return response()->json(['ok' => true]);
    }

    /**
     * Called by the frontend periodically to mark the user as online.
     * Stores a per-user cache key that expires in 2 minutes.
     * On transition from offline → online, marks any "sent" admin messages as "delivered".
     */
    public function pingOnline(Request $request)
    {
        $user = Auth::user();
        if (! $user) {
            abort(401);
        }

        $cacheKey = "user_chat_online_{$user->id}";
        $wasOffline = ! Cache::has($cacheKey);

        Cache::put($cacheKey, true, now()->addMinutes(2));

        if ($wasOffline) {
            // User just came online — upgrade any "sent" admin messages to "delivered"
            $conversation = $user->conversation;
            if ($conversation) {
                $this->markIncomingMessagesAsDelivered($conversation, 'admin');
            }
        }

        // Always broadcast so the admin sidebar green dot stays current
        broadcast(new UserPresenceUpdated(userId: $user->id, online: true));

        return response()->json(['ok' => true]);
    }

    public function fetchMessages(Conversation $conversation, Request $request)
    {
        $user = Auth::user();
        if (! $user || $conversation->user_id !== $user->id) {
            abort(403);
        }

        $this->markIncomingMessagesAsDelivered($conversation, 'admin');

        $messages = $conversation->messages()
            ->with(['offer.subCategory', 'offer.milestones'])
            ->latest()
            ->paginate(20);

        return response()->json($messages);
    }

    public function sendMessage(Conversation $conversation, Request $request)
    {
        $user = Auth::user();
        if (! $user || $conversation->user_id !== $user->id) {
            abort(403);
        }

        $request->validate([
            'message' => 'nullable|string|max:5000',
            'attachment' => 'nullable|file|max:15360|mimes:jpeg,png,jpg,gif,pdf,doc,docx,zip,txt',
        ]);

        if (! $request->filled('message') && ! $request->hasFile('attachment')) {
            return response()->json(['error' => 'Message or attachment is required'], 422);
        }

        $path = null;
        $type = null;

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $path = $file->store('chat_attachments', 'local');
            $type = str_starts_with($file->getMimeType() ?? '', 'image/') ? 'image' : 'document';
        }

        $anyAdminOnline = Cache::has('admin_online');

        $message = $conversation->messages()->create([
            'sender_type' => 'user',
            'sender_id' => $user->id,
            'message' => $request->message,
            'attachment_path' => $path,
            'attachment_type' => $type,
            'delivered_at' => $anyAdminOnline ? now() : null,
        ]);

        $conversation->update([
            'last_message' => $request->hasFile('attachment') ? 'Sent an attachment' : $request->message,
            'last_message_at' => now(),
        ]);

        // Load relations needed by the event and mailables
        $message->load('conversation.user');

        broadcast(new MessageSent($message))->toOthers();

        if (! $anyAdminOnline) {
            Admin::all()->each(function (Admin $admin) use ($message) {
                Mail::to($admin->email)->queue(new AdminChatMessageReceivedMail($message));
            });
        }

        return response()->json($message);
    }

    public function markAsRead(Conversation $conversation)
    {
        $user = Auth::user();
        if (! $user || $conversation->user_id !== $user->id) {
            abort(403);
        }

        $this->markIncomingMessagesAsRead($conversation, 'admin');

        return response()->json(['success' => true]);
    }

    public function downloadAttachment(Message $message)
    {
        $user = Auth::user();
        $admin = Auth::guard('admin')->user();

        if (! $user && ! $admin) {
            abort(401);
        }

        if (! $admin) {
            if ($message->conversation->user_id !== $user->id) {
                abort(403);
            }
        }

        if (! $message->attachment_path || ! Storage::disk('local')->exists($message->attachment_path)) {
            abort(404);
        }

        return Storage::disk('local')->download(
            $message->attachment_path,
            basename($message->attachment_path)
        );
    }

    private function markIncomingMessagesAsDelivered(Conversation $conversation, string $senderType): void
    {
        $messageIds = $conversation->messages()
            ->where('sender_type', $senderType)
            ->whereNull('delivered_at')
            ->pluck('id');

        if ($messageIds->isEmpty()) {
            return;
        }

        $deliveredAt = now();

        Message::query()
            ->whereIn('id', $messageIds)
            ->update(['delivered_at' => $deliveredAt]);

        $this->broadcastMessageStatuses(
            $conversation,
            Message::query()->whereKey($messageIds)->get(['id', 'delivered_at', 'read_at'])
        );
    }

    private function markIncomingMessagesAsRead(Conversation $conversation, string $senderType): void
    {
        $messageIds = $conversation->messages()
            ->where('sender_type', $senderType)
            ->where(function (Builder $query) {
                $query->whereNull('delivered_at')
                    ->orWhereNull('read_at');
            })
            ->pluck('id');

        if ($messageIds->isEmpty()) {
            return;
        }

        $seenAt = now();

        Message::query()
            ->whereIn('id', $messageIds)
            ->update([
                'delivered_at' => $seenAt,
                'read_at' => $seenAt,
            ]);

        $this->broadcastMessageStatuses(
            $conversation,
            Message::query()->whereKey($messageIds)->get(['id', 'delivered_at', 'read_at'])
        );
    }

    /**
     * @param  Collection<int, Message>  $messages
     */
    private function broadcastMessageStatuses(Conversation $conversation, $messages): void
    {
        if ($messages->isEmpty()) {
            return;
        }

        broadcast(new MessageStatusUpdated(
            conversationId: $conversation->id,
            messages: $messages
                ->map(fn (Message $message) => [
                    'id' => $message->id,
                    'delivered_at' => $message->delivered_at?->toJSON(),
                    'read_at' => $message->read_at?->toJSON(),
                ])
                ->values()
                ->all(),
        ))->toOthers();
    }
}
