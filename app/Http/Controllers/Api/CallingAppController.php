<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Leads\CallingApp\CallingAppDevice;
use App\Leads\CallingApp\CallingAppPairing;
use App\Leads\CallingApp\CallingAppRelease;
use App\Models\Admin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * The phone app's own endpoints (same request/response shapes as OptiFin,
 * so the one app works with both). Call actions go to the browser's own
 * LeadCallController.
 */
class CallingAppController extends Controller
{
    public function pair(Request $request, CallingAppPairing $pairing): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:255'],
            'device_name' => ['nullable', 'string', 'max:255'],
        ]);

        $result = $pairing->pair($validated['code'], $validated['device_name'] ?? null);

        if ($result === null) {
            return response()->json(['error' => [
                'code' => 'invalid_pairing_code',
                'message' => 'This connect link has expired or was already used. Tap "Connect calling app" again.',
                'retryable' => false,
            ]], 422);
        }

        return response()->json(['data' => ['token' => $result['token'], 'user' => $this->user($result['admin'])]])
            ->header('Cache-Control', 'no-store, private');
    }

    public function me(): JsonResponse
    {
        return response()->json(['data' => ['user' => $this->user($this->admin())]]);
    }

    public function heartbeat(): JsonResponse
    {
        return response()->json(['data' => ['ok' => true]]);
    }

    public function pushToken(Request $request): JsonResponse
    {
        $validated = $request->validate(['token' => ['required', 'string', 'max:512']]);
        $this->device($request)->forceFill(['fcm_token' => $validated['token'], 'fcm_token_updated_at' => now()])->save();

        return response()->json(['data' => ['ok' => true]]);
    }

    public function latestVersion(CallingAppRelease $release): JsonResponse
    {
        $current = $release->current();

        return response()->json(['data' => $current === null ? null : [
            'version' => $current['version'],
            'version_code' => $current['version_code'],
            'notes' => $current['notes'],
            'size_bytes' => $current['size'],
            'download_page_url' => route('admin.leads.calling-app.index'),
        ]]);
    }

    public function unpair(Request $request): JsonResponse
    {
        $this->device($request)->disconnect();

        return response()->json(['data' => ['ok' => true]]);
    }

    /**
     * @return array{id: string, name: string, email: string, tenant: string}
     */
    private function user(Admin $admin): array
    {
        // The app reads the id as text (OptiFin ids are text).
        return ['id' => (string) $admin->id, 'name' => $admin->name, 'email' => $admin->email, 'tenant' => (string) config('app.name')];
    }

    private function admin(): Admin
    {
        /** @var Admin $admin */
        $admin = Auth::guard('admin')->user();

        return $admin;
    }

    private function device(Request $request): CallingAppDevice
    {
        $device = $request->attributes->get('callingAppDevice');
        abort_unless($device instanceof CallingAppDevice, 401);

        return $device;
    }
}
