<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ConfigurationController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Configuration/Index', [
            'settings' => SiteSetting::current(),
        ]);
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
