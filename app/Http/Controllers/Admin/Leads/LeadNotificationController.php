<?php

namespace App\Http\Controllers\Admin\Leads;

use App\Http\Controllers\Controller;
use App\Leads\Models\AdminNotification;
use App\Leads\Support\LeadNotificationPresenter;
use App\Models\Admin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

/**
 * The lead alerts tab of the CMS bell. Every query is scoped to the
 * signed-in admin's own notifications, so an id belonging to someone else
 * is simply "not found". Wording and links come from
 * LeadNotificationPresenter.
 */
class LeadNotificationController extends Controller
{
    private const RECENT_LIMIT = 20;

    public function __construct(private readonly LeadNotificationPresenter $presenter) {}

    public function index(): JsonResponse
    {
        $admin = $this->admin();

        return response()->json([
            'unread_count' => $admin->unreadNotifications()->count(),
            'notifications' => $admin->notifications()
                ->limit(self::RECENT_LIMIT)
                ->get()
                ->map(fn (AdminNotification $notification): array => [
                    'id' => $notification->id,
                    ...collect($this->presenter->present($notification, $admin))->only(['title', 'message'])->all(),
                    'read' => $notification->read_at !== null,
                    'created_at' => $notification->created_at?->toIso8601String(),
                ])
                ->values(),
        ]);
    }

    /**
     * Marks the alert read and sends the admin to its target in one
     * request, so "mark read" and "navigate" can never race each other.
     */
    public function open(string $notification): RedirectResponse
    {
        $record = $this->admin()->notifications()->whereKey($notification)->firstOrFail();

        $record->markAsRead();

        return redirect()->to($this->safeTarget($this->presenter->present($record, $this->admin())['url']));
    }

    public function markRead(string $notification): JsonResponse
    {
        $this->admin()->notifications()->whereKey($notification)->firstOrFail()->markAsRead();

        return response()->json(['ok' => true]);
    }

    public function markAllRead(): JsonResponse
    {
        $this->admin()->unreadNotifications()->update(['read_at' => now()]);

        return response()->json(['ok' => true]);
    }

    public function clearAll(): JsonResponse
    {
        $this->admin()->notifications()->delete();

        return response()->json(['ok' => true]);
    }

    /**
     * Only ever redirect inside the CMS — a stored URL is never trusted to
     * point off-site.
     */
    private function safeTarget(mixed $url): string
    {
        if (is_string($url) && Str::startsWith($url, '/admin') && ! Str::startsWith($url, '//')) {
            return $url;
        }

        return route('admin.home');
    }

    private function admin(): Admin
    {
        /** @var Admin $admin */
        $admin = Auth::guard('admin')->user();

        return $admin;
    }
}
