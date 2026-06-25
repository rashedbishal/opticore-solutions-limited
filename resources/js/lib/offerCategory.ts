// Cosmetic-only: dedicated labels/colors for the categories this agency
// originally shipped with. This must never be the source of truth for which
// category_slug values are selectable — that has to come from the live
// `categories` prop (which mirrors what the backend actually validates
// against), otherwise a renamed/removed category here would still render as
// pickable but fail with a 422 the moment it's submitted.
export const CATEGORY_LABELS: Record<string, string> = {
    'graphic-design': 'Graphic Design',
    'digital-marketing': 'Digital Marketing',
    'video-editing': 'Video Editing',
    '3d-production': '3D Production',
    'web-development': 'Web Development',
};

export const CATEGORY_COLORS: Record<string, string> = {
    'graphic-design': 'from-purple-600 to-violet-700',
    'digital-marketing': 'from-blue-600 to-sky-700',
    'video-editing': 'from-orange-600 to-red-700',
    '3d-production': 'from-cyan-600 to-teal-700',
    'web-development': 'from-green-600 to-emerald-700',
};

/**
 * Resolve a human-readable label for a category slug, falling back to the
 * CMS-managed category label for categories beyond the original 5, then to
 * the raw slug.
 */
export function resolveCategoryLabel(
    slug: string | null | undefined,
    categories: Record<string, { label: string }>,
): string {
    if (!slug) {
        return '';
    }

    return CATEGORY_LABELS[slug] ?? categories[slug]?.label ?? slug;
}
