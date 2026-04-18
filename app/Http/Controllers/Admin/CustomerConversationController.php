<?php

namespace App\Http\Controllers\Admin;

use App\Events\MessageSent;
use App\Http\Controllers\Controller;
use App\Models\Conversation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CustomerConversationController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/CustomerChat/Index');
    }

    public function getConversations()
    {
        $conversations = Conversation::with('user')
            ->withCount(['messages as unread_count' => function ($query) {
                $query->where('sender_type', 'user')
                      ->whereNull('read_at');
            }])
            ->orderBy('last_message_at', 'desc')
            ->paginate(50);

        return response()->json($conversations);
    }

    public function fetchMessages(Conversation $conversation)
    {
        $messages = $conversation->messages()
            ->latest()
            ->paginate(20);

        return response()->json($messages);
    }

    public function sendMessage(Conversation $conversation, Request $request)
    {
        $admin = Auth::guard('admin')->user();

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
            'sender_type' => 'admin',
            'sender_id' => $admin->id,
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
        $conversation->messages()
            ->where('sender_type', 'user')
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['success' => true]);
    }
}
