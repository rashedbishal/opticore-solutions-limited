<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Blog;
use App\Models\ChatSession;
use App\Models\Contact;
use App\Models\Portfolio;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'portfolios' => Portfolio::count(),
                'blogs' => Blog::count(),
                'chat_sessions' => ChatSession::count(),
                'contacts' => Contact::count(),
                'users' => User::count(),
            ],
        ]);
    }
}
