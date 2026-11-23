<?php

namespace App\Http\Controllers\Admin\Leads;

use App\Http\Controllers\Controller;
use App\Leads\CallingApp\CallingAppDevice;
use App\Leads\CallingApp\CallingAppPairing;
use App\Leads\CallingApp\CallingAppRelease;
use App\Models\Admin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Leads → Calling app (anyone with a lead role): connect this phone to the
 * app, see/disconnect the connected phone, download the app.
 */
class CallingAppPageController extends Controller
{
    public function index(CallingAppRelease $release): Response
    {
        $admin = $this->admin();
        $device = CallingAppDevice::query()->where('admin_id', $admin->id)->first();
        $current = $release->current();

        return Inertia::render('Admin/Leads/CallingApp', [
            'device' => $device === null ? null : [
                'name' => $device->device_name,
                'connected_at' => $device->created_at?->toIso8601String(),
                'last_seen_at' => $device->last_seen_at?->toIso8601String(),
                'rings' => $device->fcm_token !== null,
            ],
            'release' => $current === null ? null : ['version' => $current['version'], 'size' => $current['size'], 'notes' => $current['notes']],
        ]);
    }

    /** A one-time connect link for the app (valid two minutes). */
    public function connect(CallingAppPairing $pairing): JsonResponse
    {
        return response()->json(['data' => $pairing->issue($this->admin())])->header('Cache-Control', 'no-store, private');
    }

    public function disconnect(): RedirectResponse
    {
        CallingAppDevice::query()->where('admin_id', $this->admin()->id)->get()->each->disconnect();

        return back()->with('success', 'Phone disconnected. Calls ring in the browser again.');
    }

    public function download(CallingAppRelease $release): StreamedResponse
    {
        $this->admin();
        $current = $release->current();
        abort_if($current === null, 404);

        return Storage::disk('local')->download($current['path'], 'opticore-whatsapp-calling-'.$current['version'].'.apk', [
            'Content-Type' => 'application/vnd.android.package-archive',
        ]);
    }

    private function admin(): Admin
    {
        /** @var Admin $admin */
        $admin = Auth::guard('admin')->user();
        abort_unless($admin->canUseLeads(), 403);

        return $admin;
    }
}
