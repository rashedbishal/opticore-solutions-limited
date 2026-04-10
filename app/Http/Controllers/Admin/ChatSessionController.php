<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ChatSession;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class ChatSessionController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Chat/Index', [
            'sessions' => ChatSession::withCount('messages')->latest()->paginate(20)
        ]);
    }

    public function show(ChatSession $chat): Response
    {
        $chat->load('messages');
        return Inertia::render('Admin/Chat/Show', [
            'chatSession' => $chat,
            'sessions' => ChatSession::withCount('messages')->latest()->get()
        ]);
    }

    public function destroy(ChatSession $chat): RedirectResponse
    {
        $chat->delete();
        return redirect()->route('admin.chats.index')->with('success', 'Chat session deleted.');
    }
}
