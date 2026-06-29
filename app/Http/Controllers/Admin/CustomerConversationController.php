<?php

namespace App\Http\Controllers\Admin;

use App\Events\ConversationDeleted;
use App\Events\MessageSent;
use App\Events\MessageStatusUpdated;
use App\Http\Controllers\Controller;
use App\Mail\ChatMessageReceivedMail;
use App\Models\Admin;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CustomerConversationController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/CustomerChat/Index');
    }

    public function getConversations(Request $request)
    {
        $search = $request->query('search', '');

        $conversations = Conversation::with('user')
            ->withCount(['messages as unread_count' => function ($query) {
                $query->where('sender_type', 'user')
                    ->whereNull('read_at');
            }])
            ->when($search, function ($query) use ($search) {
                $query->whereHas('user', fn ($q) => $q->where('name', 'like', "%{$search}%"));
            })
            ->orderByRaw('last_message_at DESC NULLS LAST')
            ->paginate(50);

        $collection = $conversations->getCollection();

        $onlineStatuses = Cache::many(
            $collection->map(fn (Conversation $c) => "user_chat_online_{$c->user_id}")->all()
        );

        $collection->transform(function (Conversation $conversation) use ($onlineStatuses) {
            $conversation->setAttribute('is_online', $onlineStatuses["user_chat_online_{$conversation->user_id}"] !== null);

            return $conversation;
        });

        return response()->json($conversations);
    }

    public function fetchMessages(Conversation $conversation)
    {
        $this->markIncomingMessagesAsDelivered($conversation, 'user');

        $messages = $conversation->messages()
            ->with(['offer.subCategory', 'offer.milestones'])
            ->latest()
            ->paginate(20);

        return response()->json($messages);
    }

    public function sendMessage(Conversation $conversation, Request $request)
    {
        $admin = Auth::guard('admin')->user();

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

        $userOnline = Cache::has("user_chat_online_{$conversation->user_id}");

        $message = $conversation->messages()->create([
            'sender_type' => 'admin',
            'sender_id' => $admin->id,
            'message' => $request->message,
            'attachment_path' => $path,
            'attachment_type' => $type,
            'delivered_at' => $userOnline ? now() : null,
        ]);

        $conversation->update([
            'last_message' => $request->hasFile('attachment') ? 'Sent an attachment' : $request->message,
            'last_message_at' => now(),
        ]);

        // Load relations needed by the event and mailables
        $message->load('conversation.user');

        broadcast(new MessageSent($message))->toOthers();

        if (! $userOnline) {
            $user = $conversation->user;

            // A trashed user's email is rewritten to an unreachable
            // placeholder on self-deletion — never queue mail to it even
            // though the relation is kept (for CMS display) after deletion.
            if ($user && ! $user->trashed()) {
                Mail::to($user->email)->queue(new ChatMessageReceivedMail($message));
            }
        }

        return response()->json($message);
    }

    public function markAsRead(Conversation $conversation)
    {
        $this->markIncomingMessagesAsRead($conversation, 'user');

        return response()->json(['success' => true]);
    }

    /**
     * Permanently delete a conversation (and its messages, attachments, and
     * offers) for both the admin and the client. Requires the mother admin's
     * password regardless of who is currently logged in.
     */
    public function destroy(Conversation $conversation, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'password' => ['required', 'string'],
        ]);

        $motherAdmin = Admin::motherAdmin();

        if (! $motherAdmin || ! Hash::check($validated['password'], $motherAdmin->password)) {
            return response()->json(['message' => 'The password you entered is incorrect.'], 422);
        }

        $conversationId = $conversation->id;

        $conversation->messages()
            ->whereNotNull('attachment_path')
            ->pluck('attachment_path')
            ->each(fn (string $path) => Storage::disk('local')->delete($path));

        $conversation->delete();

        broadcast(new ConversationDeleted($conversationId));

        return response()->json(['success' => true]);
    }

    /**
     * Return active (non-delivered) tasks for the conversation's user,
     * newest first, including their associated order number.
     */
    public function currentOrders(Conversation $conversation): JsonResponse
    {
        $tasks = Task::with('transaction')
            ->where('user_id', $conversation->user_id)
            ->where('state', '!=', 'delivered')
            ->latest()
            ->get()
            ->map(fn (Task $t) => [
                'id' => $t->id,
                'task_name' => $t->task_name,
                'order_number' => $t->transaction?->order_number,
                'state' => $t->state,
                'date' => $t->date?->format('Y-m-d'),
            ])
            ->values();

        return response()->json($tasks);
    }

    /**
     * Called by the frontend to mark admin as online (ping endpoint).
     * Stores a cache key that expires in 2 minutes.
     * On transition from offline → online, marks any "sent" user messages as "delivered".
     */
    public function pingOnline()
    {
        $wasOffline = ! Cache::has('admin_online');

        Cache::put('admin_online', true, now()->addMinutes(2));

        if ($wasOffline) {
            // Admin just came online — upgrade all "sent" user messages across every conversation
            $this->markAllUserMessagesAsDelivered();
        }

        return response()->json(['ok' => true]);
    }

    private function markAllUserMessagesAsDelivered(): void
    {
        $now = now();

        $messageIds = Message::where('sender_type', 'user')
            ->whereNull('delivered_at')
            ->pluck('id');

        if ($messageIds->isEmpty()) {
            return;
        }

        Message::whereIn('id', $messageIds)->update(['delivered_at' => $now]);

        $messages = Message::whereKey($messageIds)->get(['id', 'conversation_id', 'delivered_at', 'read_at']);

        $grouped = $messages->groupBy('conversation_id');

        $conversations = Conversation::whereIn('id', $grouped->keys())->get()->keyBy('id');

        foreach ($grouped as $conversationId => $group) {
            $conversation = $conversations->get($conversationId);
            if ($conversation) {
                $this->broadcastMessageStatuses($conversation, $group);
            }
        }
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
