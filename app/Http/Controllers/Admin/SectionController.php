<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Support\AdminSections;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The CMS landing page (one card per section the admin holds a role for) and
 * the page listing a section's modules. Grouping only: module access is still
 * enforced per route by EnsureAdminHasPermission.
 */
class SectionController extends Controller
{
    public function home(): Response|RedirectResponse
    {
        $admin = $this->admin();

        // Same funnel as before: every post-login visit lands here first, so
        // meal-only admins are sent straight to their section from here.
        if ($admin->isMealManagementOnly()) {
            return redirect()->route('admin.meal-management.index');
        }

        return Inertia::render('Admin/Home', [
            'sections' => array_map(
                fn (array $section): array => [
                    'key' => $section['key'],
                    'label' => $section['label'],
                    'description' => $section['description'],
                    'moduleCount' => count($section['modules']),
                ],
                AdminSections::forAdmin($admin),
            ),
        ]);
    }

    public function show(string $section): Response
    {
        $admin = $this->admin();

        abort_unless(AdminSections::isValidKey($section), 404);
        abort_unless($admin->canAccessSection($section), 403);

        $current = collect(AdminSections::forAdmin($admin))->firstWhere('key', $section);

        return Inertia::render('Admin/Section', [
            'section' => $current,
        ]);
    }

    private function admin(): Admin
    {
        /** @var Admin */
        return Auth::guard('admin')->user();
    }
}
