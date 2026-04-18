<?php

namespace App\Http\Controllers;

use App\Events\MessageSent;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;

class ConversationController extends Controller
{
    public function init(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            abort(401);
        }

        $conversation = $user->conversation()->firstOrCreate([]);
        return response()->json([
            'conversation' => $conversation
        ]);
    }

    public function fetchMessages(Conversation $conversation, Request $request)
    {
        $user = Auth::user();
        if (!$user || $conversation->user_id !== $user->id) {
            abort(403);
        }

        $messages = $conversation->messages()
            ->latest()
            ->paginate(20);

        return response()->json($messages);
    }

    public function sendMessage(Conversation $conversation, Request $request)
    {
        $user = Auth::user();
        if (!$user || $conversation->user_id !== $user->id) {
            abort(403);
        }

        $request->validate([
            'message' => 'nullable|string|max:5000',
            'attachment' => 'nullable|file|max:5120|mimes:jpeg,png,jpg,gif,pdf,doc,docx'
        ]);

        if (!$request->filled('message') && !$request->hasFile('attachment')) {
            return response()->json(['error' => 'Message or attachment is required'], 422);
        }

        $path = null;
        $type = null;

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $path = $file->store('chat_attachments', 'local');
            $type = explode('/', $file->getMimeType())[0] === 'image' ? 'image' : 'document';
        }

        $message = $conversation->messages()->create([
            'sender_type' => 'user',
            'sender_id' => $user->id,
            'message' => $request->message,
            'attachment_path' => $path,
            'attachment_type' => $type,
        ]);

        $conversation->update([
            'last_message' => $request->hasFile('attachment') ? 'Sent an attachment' : $request->message,
            'last_message_at' => now(),
        ]);

        broadcast(new MessageSent($message))->toOthers();

        return response()->json($message);
    }

    public function markAsRead(Conversation $conversation)
    {
        $user = Auth::user();
        if (!$user || $conversation->user_id !== $user->id) {
            abort(403);
        }

        $conversation->messages()
            ->where('sender_type', 'admin')
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['success' => true]);
    }

    public function downloadAttachment(Message $message)
    {
        $user = Auth::user();
        $admin = Auth::guard('admin')->user();
        
        if (!$user && !$admin) {
            abort(401);
        }

        if (!$admin) {
            if ($message->conversation->user_id !== $user->id) {
                abort(403);
            }
        }

        if (!$message->attachment_path || !Storage::disk('local')->exists($message->attachment_path)) {
            abort(404);
        }

        return Storage::disk('local')->response($message->attachment_path);
    }
}
