import { router } from '@inertiajs/react';

/**
 * Opens/closes a lead in the side panel by setting ?lead=ID on the current
 * list URL, so the panel survives a reload and shares a link.
 */
export function setPanelLead(leadId: string | null): void {
    const url = new URL(window.location.href);

    if (leadId) {
        url.searchParams.set('lead', leadId);
    } else {
        url.searchParams.delete('lead');
    }

    router.visit(url.pathname + url.search, {
        only: ['selectedLead'],
        preserveState: true,
        preserveScroll: true,
        replace: true,
    });
}
