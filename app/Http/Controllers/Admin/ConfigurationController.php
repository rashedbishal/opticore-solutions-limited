<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use App\Support\DatabaseBackupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Throwable;

class ConfigurationController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Configuration/Index', [
            'settings' => SiteSetting::current(),
        ]);
    }

    /**
     * Streams a zip of plain-SQL pg_dump backups for all three Postgres
     * databases (client, admin, meal) — see DatabaseBackupService for why
     * pg_dump rather than a hand-rolled export.
     */
    public function downloadBackup(DatabaseBackupService $backups): BinaryFileResponse|JsonResponse
    {
        // Each pg_dump already has its own 240s budget; this is the ceiling
        // for all three plus zipping, comfortably above that.
        set_time_limit(300);

        try {
            $zipPath = $backups->createZipArchive();
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Unable to generate the database backup. Please try again or check the server logs.',
            ], 500);
        }

        return response()->download($zipPath)->deleteFileAfterSend();
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'contact_email' => ['nullable', 'email', 'max:255'],
            'phone_usa' => ['nullable', 'string', 'max:50'],
            'phone_bangladesh' => ['nullable', 'string', 'max:50'],
            'address_usa' => ['nullable', 'string', 'max:1000'],
            'address_usa_map_url' => ['nullable', 'url', 'max:500'],
            'address_bangladesh' => ['nullable', 'string', 'max:1000'],
            'address_bangladesh_map_url' => ['nullable', 'url', 'max:500'],
            'social_facebook' => ['nullable', 'url', 'max:500'],
            'social_x' => ['nullable', 'url', 'max:500'],
            'social_instagram' => ['nullable', 'url', 'max:500'],
            'social_linkedin' => ['nullable', 'url', 'max:500'],
            'social_youtube' => ['nullable', 'url', 'max:500'],
            'social_behance' => ['nullable', 'url', 'max:500'],
            'social_pinterest' => ['nullable', 'url', 'max:500'],
            'social_tiktok' => ['nullable', 'url', 'max:500'],
        ]);

        SiteSetting::current()->update($validated);
        SiteSetting::forgetCache();

        return redirect()->route('admin.configuration.index')->with('success', 'Configuration updated.');
    }
}
