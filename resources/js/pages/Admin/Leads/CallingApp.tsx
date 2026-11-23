import type { ReactNode } from 'react';
import { router } from '@inertiajs/react';
import { Download, Link2, Smartphone } from 'lucide-react';
import { useState } from 'react';
import { storeMarker } from '@/components/Admin/Calling/appHandoff';
import {
    CARD,
    CARD_TITLE,
    PRIMARY_BUTTON,
    SECONDARY_BUTTON,
} from '@/components/Admin/Leads/ui';
import AdminLayout from '@/components/Layout/AdminLayout';
import { api } from '@/lib/apiFetch';
import { formatDateTime } from '@/lib/leadColors';
import appRoutes from '@/routes/admin/leads/calling-app';

interface Props {
    device: {
        name: string | null;
        connected_at: string | null;
        last_seen_at: string | null;
        rings: boolean;
    } | null;
    release: { version: string; size: number; notes: string | null } | null;
}

/**
 * Leads → Calling app: the "Opticore WhatsApp Calling" phone app (better
 * earpiece/speaker than a browser). Connect it from this phone's browser.
 */
export default function CallingApp({ device, release }: Props) {
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const connect = async () => {
        setBusy(true);
        setError(null);

        try {
            const { data } = await api.post<{
                data: { deep_link: string; browser_marker: string };
            }>(appRoutes.connect.url());
            storeMarker(data.data.browser_marker);
            window.location.href = data.data.deep_link;
        } catch {
            setError('Could not create a connect link. Try again.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="relative space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Calling app</h1>
                <p className="mt-1 text-sm text-zinc-500">
                    The Opticore WhatsApp Calling app (Android) answers and
                    makes WhatsApp calls with the phone’s earpiece and
                    loudspeaker, and rings even when the CMS is closed. Without
                    it, calls work in the browser as usual.
                </p>
            </div>

            <section className={CARD}>
                <p className={`${CARD_TITLE} mb-3 flex items-center gap-2`}>
                    <Smartphone className="h-3.5 w-3.5" /> This account’s phone
                </p>
                {device ? (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="text-sm">
                            <p className="text-white">
                                {device.name ?? 'Phone'} — connected
                            </p>
                            <p className="text-xs text-zinc-500">
                                {[
                                    `since ${formatDateTime(device.connected_at)}`,
                                    device.last_seen_at &&
                                        `last used ${formatDateTime(device.last_seen_at)}`,
                                    !device.rings &&
                                        'not ready to ring yet — open the app once',
                                ]
                                    .filter(Boolean)
                                    .join(' · ')}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => void connect()}
                                className={SECONDARY_BUTTON}
                            >
                                <Link2 className="h-4 w-4" /> Reconnect this
                                phone
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    router.delete(appRoutes.disconnect.url(), {
                                        preserveScroll: true,
                                    })
                                }
                                className="rounded-lg border border-red-400/30 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10"
                            >
                                Disconnect
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <ol className="list-inside list-decimal space-y-1 text-sm text-zinc-300">
                            <li>
                                Install the app on your Android phone (below).
                            </li>
                            <li>
                                Open this page in that phone’s browser, signed
                                in to the CMS.
                            </li>
                            <li>
                                Tap <b>Connect calling app</b>. The app opens
                                and connects (it may ask for this site’s address
                                once).
                            </li>
                        </ol>
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => void connect()}
                            className={PRIMARY_BUTTON}
                        >
                            <Link2 className="h-4 w-4" /> Connect calling app
                        </button>
                    </div>
                )}
                {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
            </section>

            <section className={CARD}>
                <p className={`${CARD_TITLE} mb-3`}>Download</p>
                {release ? (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-zinc-300">
                            Version {release.version} ·{' '}
                            {(release.size / 1024 / 1024).toFixed(1)} MB
                            {release.notes && (
                                <span className="block text-xs text-zinc-500">
                                    {release.notes}
                                </span>
                            )}
                        </p>
                        <a
                            href={appRoutes.download.url()}
                            className={PRIMARY_BUTTON}
                        >
                            <Download className="h-4 w-4" /> Download the app
                        </a>
                    </div>
                ) : (
                    <p className="text-sm text-zinc-500">
                        The app isn’t available to download yet.
                    </p>
                )}
            </section>
        </div>
    );
}

CallingApp.layout = (page: ReactNode) => (
    <AdminLayout title="Calling app">{page}</AdminLayout>
);
