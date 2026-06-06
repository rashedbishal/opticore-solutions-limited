<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ChatSession;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ChatSessionController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Chat/Index', [
            'sessions' => ChatSession::withCount('messages')
                ->with(['messages' => function ($query) {
                    $query->orderBy('created_at', 'asc');
                }])
                ->latest()
                ->paginate(10),
        ]);
    }

    public function show(ChatSession $chat): Response
    {
        $chat->load('messages');

        return Inertia::render('Admin/Chat/Show', [
            'chatSession' => $chat,
            'sessions' => ChatSession::withCount('messages')->latest()->get(),
        ]);
    }

    public function destroy(ChatSession $chat): RedirectResponse
    {
        $chat->delete();

        return redirect()->route('admin.chats.index')->with('success', 'Chat session deleted.');
    }
}
