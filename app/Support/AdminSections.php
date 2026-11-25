<?php

namespace App\Support;

use App\Models\Admin;

/**
 * Registry of the three CMS sections (the grouping from the AgencyOS plan,
 * docs/agencyos/gap-analysis-and-development-plan.md section 7) and which
 * module belongs to which. It only GROUPS modules: module access is still
 * decided by AdminPermissions keys, the lead role and the mother-admin
 * gates, exactly as before.
 *
 * Module `key` is one of:
 *   - an AdminPermissions key (must stay in sync with AdminPermissions::all())
 *   - 'dashboard'  always allowed for every admin
 *   - 'leads'      allowed by lead role, never by a permission key
 *   - a mother-admin-only item ('storage-cleanup', 'pulse', 'health', 'horizon')
 *
 * `planned` lists modules from the plan that are not built yet; they are
 * only displayed (greyed out) and grant nothing.
 */
class AdminSections
{
    public const CLIENT_FACING = 'client-facing';

    public const AGENCY_OPERATIONS = 'agency-operations';

    public const MANAGEMENT = 'management-administration';

    /** Module keys that only the mother admin may see, whatever their permissions. */
    public const MOTHER_ONLY_KEYS = ['storage-cleanup', 'pulse', 'health', 'horizon'];

    /** Mother-admin-only modules that are separate non-Inertia pages. */
    public const EXTERNAL_KEYS = ['pulse', 'health', 'horizon'];

    /**
     * @return array<int, array{key: string, label: string, role: string, description: string, modules: array<int, array{key: string, label: string, href: string}>, planned: array<int, array{code: string, label: string}>}>
     */
    public static function all(): array
    {
        return [
            [
                'key' => self::CLIENT_FACING,
                'label' => 'Client-facing',
                'role' => 'Client-facing role',
                'description' => 'Clients, orders, support and the public website.',
                'modules' => [
                    ['key' => 'customer-conversations', 'label' => 'Customer Support', 'href' => '/admin/customer-conversations'],
                    ['key' => 'leads', 'label' => 'Leads', 'href' => '/admin/leads'],
                    ['key' => 'clients', 'label' => 'Clients', 'href' => '/admin/clients'],
                    ['key' => 'orders', 'label' => 'Orders', 'href' => '/admin/orders'],
                    ['key' => 'portfolios', 'label' => 'Portfolios', 'href' => '/admin/portfolios'],
                    ['key' => 'categories', 'label' => 'Categories', 'href' => '/admin/categories'],
                    ['key' => 'sub-categories', 'label' => 'Sub Categories', 'href' => '/admin/sub-categories'],
                    ['key' => 'blogs', 'label' => 'Blogs', 'href' => '/admin/blogs'],
                    ['key' => 'faqs', 'label' => 'FAQs', 'href' => '/admin/faqs'],
                    ['key' => 'brands', 'label' => 'Brands', 'href' => '/admin/brands'],
                    ['key' => 'testimonials', 'label' => 'Testimonials', 'href' => '/admin/testimonials'],
                    ['key' => 'client-reviews', 'label' => 'Review Control', 'href' => '/admin/client-reviews'],
                    ['key' => 'contacts', 'label' => 'Contacts', 'href' => '/admin/contacts'],
                    ['key' => 'subscriptions', 'label' => 'Subscriptions', 'href' => '/admin/subscriptions'],
                    ['key' => 'chats', 'label' => 'Chat Archive', 'href' => '/admin/chats'],
                ],
                'planned' => [
                    ['code' => 'M1', 'label' => 'Client registration and companies'],
                    ['code' => 'M3', 'label' => 'Project room'],
                    ['code' => 'M4', 'label' => 'Service catalogue and order forms'],
                    ['code' => 'M5', 'label' => 'Quotations and service orders'],
                ],
            ],
            [
                'key' => self::AGENCY_OPERATIONS,
                'label' => 'Agency Operations',
                'role' => 'Agency Operations role',
                'description' => 'Projects, tasks, staff and daily operations.',
                'modules' => [
                    ['key' => 'tasks', 'label' => 'Client Workflow', 'href' => '/admin/tasks'],
                    ['key' => 'job-listings', 'label' => 'Job Listings', 'href' => '/admin/job-listings'],
                    ['key' => 'job-applications', 'label' => 'Job Applications', 'href' => '/admin/job-applications'],
                    ['key' => 'meal-management', 'label' => 'Meal Management', 'href' => '/admin/meal-management'],
                ],
                'planned' => [
                    ['code' => 'M6', 'label' => 'Projects and tasks'],
                    ['code' => 'M7', 'label' => 'Templates and assignment'],
                    ['code' => 'M8', 'label' => 'Employees and departments'],
                    ['code' => 'M9', 'label' => 'Attendance and leave'],
                    ['code' => 'M10', 'label' => 'Performance and evaluation'],
                    ['code' => 'M18', 'label' => 'Internal chat'],
                ],
            ],
            [
                'key' => self::MANAGEMENT,
                'label' => 'Management & Administration',
                'role' => 'Management & Administration role',
                'description' => 'Dashboard, money, admins, settings and system health.',
                'modules' => [
                    ['key' => 'dashboard', 'label' => 'Dashboard', 'href' => '/admin/dashboard'],
                    ['key' => 'transactions', 'label' => 'Transactions', 'href' => '/admin/transactions'],
                    ['key' => 'users', 'label' => 'Admins', 'href' => '/admin/users'],
                    ['key' => 'configuration', 'label' => 'Configuration', 'href' => '/admin/configuration'],
                    ['key' => 'storage-cleanup', 'label' => 'Storage clean-up', 'href' => '/admin/storage-cleanup'],
                    ['key' => 'pulse', 'label' => 'Pulse', 'href' => '/pulse'],
                    ['key' => 'health', 'label' => 'Health', 'href' => '/health'],
                    ['key' => 'horizon', 'label' => 'Horizon', 'href' => '/horizon'],
                ],
                'planned' => [
                    ['code' => 'M11', 'label' => 'Super Admin control center'],
                    ['code' => 'M12', 'label' => 'Finance and budget'],
                    ['code' => 'M13', 'label' => 'Meetings and notifications'],
                    ['code' => 'M14', 'label' => 'AI and automation'],
                    ['code' => 'M15', 'label' => 'Audit and recycle bin'],
                    ['code' => 'M19', 'label' => 'Payroll'],
                    ['code' => 'M20', 'label' => 'Billing and collections'],
                    ['code' => 'M21', 'label' => 'Approvals'],
                ],
            ],
        ];
    }

    /**
     * @return array<int, string>
     */
    public static function keys(): array
    {
        return array_column(self::all(), 'key');
    }

    public static function isValidKey(string $key): bool
    {
        return in_array($key, self::keys(), true);
    }

    /**
     * Section key a module belongs to, or null if it is in none.
     */
    public static function sectionOf(string $moduleKey): ?string
    {
        foreach (self::all() as $section) {
            foreach ($section['modules'] as $module) {
                if ($module['key'] === $moduleKey) {
                    return $section['key'];
                }
            }
        }

        return null;
    }

    /**
     * Section the current admin route belongs to, used to show only that
     * section's modules in the sidebar. Derived from the route name
     * (`admin.<module>.*`), so it is stateless and survives refresh and direct
     * links. `admin.sections.show` uses its own `{section}` parameter; the
     * landing cards (`admin.home`) and non-module routes return null.
     */
    public static function sectionForRoute(?string $routeName, ?string $sectionParam = null): ?string
    {
        if ($routeName === null || ! str_starts_with($routeName, 'admin.')) {
            return null;
        }

        $segment = explode('.', $routeName)[1] ?? '';

        if ($segment === 'sections') {
            return $sectionParam !== null && self::isValidKey($sectionParam) ? $sectionParam : null;
        }

        // Lead set-up pages belong to the Leads module.
        if ($segment === 'lead-settings') {
            $segment = 'leads';
        }

        return self::sectionOf($segment);
    }

    /**
     * Whether this admin may use the given module right now. Mirrors the
     * existing gates: dashboard for everyone, leads by lead role,
     * mother-only items by mother admin, everything else by permission key.
     */
    public static function canUseModule(Admin $admin, string $moduleKey): bool
    {
        if ($moduleKey === 'dashboard') {
            return true;
        }

        if ($moduleKey === 'leads') {
            return $admin->canUseLeads();
        }

        if (in_array($moduleKey, self::MOTHER_ONLY_KEYS, true)) {
            return $admin->isMotherAdmin();
        }

        return $admin->canAccess($moduleKey);
    }

    /**
     * Sections this admin may enter. The mother admin and full-access admins
     * get all three; anyone else gets the roles stored on their account plus
     * the section of every module they already hold (so accounts created
     * before section roles existed keep working with no data migration).
     *
     * @return array<int, string>
     */
    public static function rolesFor(Admin $admin): array
    {
        if ($admin->is_super_admin || $admin->full_access) {
            return self::keys();
        }

        // Unknown values are dropped by the final filter against keys().
        $roles = $admin->section_roles ?? [];

        foreach ($admin->permissions ?? [] as $permission) {
            $section = self::sectionOf((string) $permission);

            if ($section !== null) {
                $roles[] = $section;
            }
        }

        if ($admin->canUseLeads()) {
            $roles[] = self::sectionOf('leads');
        }

        return array_values(array_filter(
            self::keys(),
            fn (string $key): bool => in_array($key, $roles, true),
        ));
    }

    /**
     * The sections this admin may enter, each with only the modules they may
     * use. Shared with every admin page (sidebar) and used by the home cards
     * and section pages.
     *
     * @return array<int, array{key: string, label: string, role: string, description: string, modules: array<int, array{key: string, label: string, href: string, external: bool}>, planned: array<int, array{code: string, label: string}>}>
     */
    public static function forAdmin(Admin $admin): array
    {
        $roles = self::rolesFor($admin);
        $sections = [];

        foreach (self::all() as $section) {
            if (! in_array($section['key'], $roles, true)) {
                continue;
            }

            $modules = [];

            foreach ($section['modules'] as $module) {
                if (self::canUseModule($admin, $module['key'])) {
                    $modules[] = [
                        ...$module,
                        'external' => in_array($module['key'], self::EXTERNAL_KEYS, true),
                    ];
                }
            }

            $sections[] = [...$section, 'modules' => $modules];
        }

        return $sections;
    }

    /**
     * Section keys with the AdminPermissions module keys inside each, for the
     * admin create/edit form (mother-admin-only items and dashboard/leads are
     * not grantable here, so they are left out).
     *
     * @return array<int, array{key: string, label: string, role: string, description: string, modules: array<int, array{key: string, label: string}>}>
     */
    public static function grantableOptions(): array
    {
        $grantable = AdminPermissions::keys();

        return array_map(function (array $section) use ($grantable): array {
            $modules = array_values(array_filter(
                $section['modules'],
                fn (array $module): bool => in_array($module['key'], $grantable, true),
            ));

            return [
                'key' => $section['key'],
                'label' => $section['label'],
                'role' => $section['role'],
                'description' => $section['description'],
                'modules' => array_map(
                    fn (array $module): array => ['key' => $module['key'], 'label' => $module['label']],
                    $modules,
                ),
            ];
        }, self::all());
    }
}
