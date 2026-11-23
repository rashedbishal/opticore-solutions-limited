/**
 * Is this browser on the phone that's connected to the calling app? The
 * connect step left a secret marker in this browser; the CMS only knows its
 * hash. If they match, calls go to the app instead of the browser.
 */
export const BROWSER_MARKER_KEY = 'opticore.callingApp.browserMarker';

export interface CallingAppInfo {
    paired: boolean;
    browser_marker_hash: string | null;
    deep_link_scheme: string;
}

async function sha256Hex(text: string): Promise<string> {
    const digest = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(text),
    );

    return [...new Uint8Array(digest)]
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

export async function isAppPhone(
    info: CallingAppInfo | null,
): Promise<boolean> {
    if (!info?.paired || !info.browser_marker_hash || !crypto?.subtle) {
        return false;
    }

    try {
        const marker = window.localStorage.getItem(BROWSER_MARKER_KEY);

        return (
            !!marker && (await sha256Hex(marker)) === info.browser_marker_hash
        );
    } catch {
        return false;
    }
}

export function storeMarker(marker: string): void {
    try {
        window.localStorage.setItem(BROWSER_MARKER_KEY, marker);
    } catch {
        // Private mode: the hand-off just won't happen on this browser.
    }
}

/** Opens a call to the lead in the app (same link format as OptiFin). */
export function callInApp(
    info: CallingAppInfo,
    adminId: number,
    leadId: string,
    leadName: string,
): void {
    const params = new URLSearchParams({
        lead: leadId,
        user: String(adminId),
        t: String(Date.now()),
    });

    if (leadName) {
        params.set('name', leadName);
    }

    window.location.href = `${info.deep_link_scheme}://call?${params.toString()}`;
}
