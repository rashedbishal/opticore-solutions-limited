<?php

namespace App\Http\Controllers\Admin\LeadSettings;

use App\Http\Controllers\Controller;
use App\Leads\CallingApp\CallingAppFirebase;
use App\Leads\CallingApp\CallingAppRelease;
use App\Leads\Models\LeadSetting;
use App\Models\Admin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

/**
 * Lead Settings → Calling app (mother admin): the Firebase key the app
 * rings through, and the APK people download.
 */
class CallingAppSettingsController extends Controller
{
    public function edit(CallingAppFirebase $firebase, CallingAppRelease $release): Response
    {
        $this->mother();
        $current = $release->current();

        return Inertia::render('Admin/LeadSettings/CallingApp', [
            'firebase' => $firebase->summary(),
            'expectedProject' => (string) config('calling.calling_app.firebase_project_id'),
            'release' => $current === null ? null : [
                'version' => $current['version'],
                'size' => $current['size'],
                'notes' => $current['notes'],
                'uploaded_at' => LeadSetting::current()->apk_uploaded_at?->toIso8601String(),
            ],
            'chunkBytes' => CallingAppRelease::CHUNK_BYTES,
        ]);
    }

    public function storeFirebase(Request $request, CallingAppFirebase $firebase): RedirectResponse
    {
        $this->mother();
        $request->validate(['key' => ['required', 'file', 'max:64']]);
        $file = $request->file('key');
        abort_if($file === null || is_array($file), 422);

        $account = json_decode((string) file_get_contents($file->getRealPath()), true);

        if (($error = CallingAppFirebase::validationError($account)) !== null) {
            throw ValidationException::withMessages(['key' => $error]);
        }

        /** @var array<string, mixed> $account */
        $firebase->store($account);

        return back()->with('success', 'Firebase key saved. Connected phones now ring.');
    }

    public function destroyFirebase(CallingAppFirebase $firebase): RedirectResponse
    {
        $this->mother();
        $firebase->remove();

        return back()->with('success', 'Firebase key removed. Phones no longer ring; calls ring in browsers.');
    }

    public function startApk(Request $request, CallingAppRelease $release): JsonResponse
    {
        $this->mother();
        $validated = $request->validate(['size' => ['required', 'integer', 'min:1'], 'notes' => ['nullable', 'string', 'max:1000']]);

        return $this->attempt(fn () => ['upload_id' => $release->startUpload((int) $validated['size'], $validated['notes'] ?? null)]);
    }

    public function chunkApk(Request $request, string $upload, int $index, CallingAppRelease $release): JsonResponse
    {
        $this->mother();

        return $this->attempt(function () use ($request, $upload, $index, $release): array {
            $release->putChunk($upload, $index, $request->getContent());

            return ['ok' => true];
        });
    }

    public function completeApk(string $upload, CallingAppRelease $release): JsonResponse
    {
        $this->mother();

        return $this->attempt(fn () => $release->completeUpload($upload));
    }

    public function destroyApk(CallingAppRelease $release): RedirectResponse
    {
        $this->mother();
        $release->remove();

        return back()->with('success', 'App download removed.');
    }

    /**
     * @param  callable(): array<string, mixed>  $work
     */
    private function attempt(callable $work): JsonResponse
    {
        try {
            return response()->json(['data' => $work()]);
        } catch (RuntimeException $e) {
            return response()->json(['error' => ['message' => $e->getMessage()]], 422);
        }
    }

    private function mother(): Admin
    {
        /** @var Admin $admin */
        $admin = Auth::guard('admin')->user();
        abort_unless($admin->isMotherAdmin(), 403);

        return $admin;
    }
}
