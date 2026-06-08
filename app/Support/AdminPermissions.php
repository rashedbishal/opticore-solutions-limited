<?php

namespace App\Support;

/**
 * Canonical, ordered registry of CMS sidebar sections that can be granted
 * individually to regular admins. "dashboard" is intentionally excluded —
 * every admin always sees it regardless of their permissions.
 *
 * Each `key` MUST match:
 *   - the segment immediately following `admin.` in that section's route
 *     names (e.g. route `admin.portfolios.index` -> key `portfolios`)
 *   - the `key` on the matching NAV_ITEMS entry in AdminLayout.tsx
 *
 * This registry is the single source of truth for: store/update validation
 * rules, the permission checkbox UI (passed as an Inertia prop), and the
 * permission middleware's key whitelist.
 */
class AdminPermissions
{
    /**
     * @return array<int, array{key: string, label: string}>
     */
    public static function all(): array
    {
        return [
            ['key' => 'customer-conversations', 'label' => 'Customer Support'],
            ['key' => 'portfolios', 'label' => 'Portfolios'],
            ['key' => 'sub-categories', 'label' => 'Sub Categories'],
            ['key' => 'blogs', 'label' => 'Blogs'],
            ['key' => 'faqs', 'label' => 'FAQs'],
            ['key' => 'job-listings', 'label' => 'Job Listings'],
            ['key' => 'job-applications', 'label' => 'Job Applications'],
            ['key' => 'chats', 'label' => 'Chat Archive'],
            ['key' => 'contacts', 'label' => 'Contacts'],
            ['key' => 'brands', 'label' => 'Brands'],
            ['key' => 'users', 'label' => 'Admins'],
            ['key' => 'clients', 'label' => 'Clients'],
            ['key' => 'tasks', 'label' => 'Client Workflow'],
            ['key' => 'client-reviews', 'label' => 'Review Control'],
            ['key' => 'testimonials', 'label' => 'Testimonials'],
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
}
