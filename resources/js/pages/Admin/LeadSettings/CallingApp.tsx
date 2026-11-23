import type { ReactNode } from 'react';
import { router } from '@inertiajs/react';
import { Loader2, Upload } from 'lucide-react';
import { useState } from 'react';
import { CmsErrorDialog } from '@/components/Admin/CmsErrorDialog';
import { CARD, CARD_TITLE, INPUT, LABEL } from '@/components/Admin/Leads/ui';
import AdminLayout from '@/components/Layout/AdminLayout';
import { api } from '@/lib/apiFetch';
import { formatDateTime } from '@/lib/leadColors';
import settings from '@/routes/admin/lead-settings/calling-app';

interface Props {
    firebase: { project_id: string; client_email: string } | null;
    expectedProject: string;
    release: {
        version: string;
        size: number;
        notes: string | null;
        uploaded_at: string | null;
    } | null;
    chunkBytes: number;
}

function csrf(): string {
    return (
        document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
            ?.content ?? ''
    );
}

/**
 * Lead Settings → Calling app (mother admin): Firebase key + APK.
 */
export default function CallingAppSettings({
    firebase,
    expectedProject,
    release,
    chunkBytes,
}: Props) {
    const [errors, setErrors] = useState<string[]>([]);
    const [progress, setProgress] = useState<number | null>(null);
    const [notes, setNotes] = useState('');

    const uploadKey = (file: File) =>
        router.post(
            settings.firebase.store.url(),
            { key: file },
            {
                forceFormData: true,
                preserveScroll: true,
                onError: (e) => setErrors(Object.values(e).filter(Boolean)),
            },
        );

    // Sent in small pieces so a big APK works whatever the server's limit.
    const uploadApk = async (file: File) => {
        setProgress(0);

        try {
            const start = await api.post<{ data: { upload_id: string } }>(
                settings.apk.start.url(),
                { size: file.size, notes: notes || null },
            );
            const id = start.data.data.upload_id;
            const chunks = Math.ceil(file.size / chunkBytes);

            for (let i = 0; i < chunks; i++) {
                const body = file.slice(i * chunkBytes, (i + 1) * chunkBytes);
                const res = await fetch(settings.apk.chunk.url([id, i]), {
                    method: 'PUT',
                    body,
                    headers: {
                        'Content-Type': 'application/octet-stream',
                        'X-CSRF-TOKEN': csrf(),
                        Accept: 'application/json',
                    },
                });

                if (!res.ok) {
                    const json = await res.json().catch(() => null);

                    throw new Error(json?.error?.message ?? 'Upload failed.');
                }

                setProgress(Math.round(((i + 1) / chunks) * 100));
            }

            await api.post(settings.apk.complete.url(id));
            router.reload();
        } catch (e) {
            const err = e as {
                responseData?: { error?: { message?: string } };
                message?: string;
            };
            setErrors([
                err.responseData?.error?.message ??
                    err.message ??
                    'Upload failed.',
            ]);
        } finally {
            setProgress(null);
        }
    };

    return (
        <div className="relative space-y-6">
            <CmsErrorDialog messages={errors} onClose={() => setErrors([])} />
            <div>
                <h1 className="text-2xl font-bold text-white">Calling app</h1>
                <p className="mt-1 text-sm text-zinc-500">
                    Settings for the Opticore WhatsApp Calling phone app.
                </p>
            </div>

            <section className={CARD}>
                <p className={`${CARD_TITLE} mb-1`}>Firebase key</p>
                <p className="mb-3 text-sm text-zinc-500">
                    Connected phones ring through Firebase project “
                    {expectedProject}”. In Firebase: Project settings → Service
                    accounts → Generate new private key, then upload that JSON
                    file here. It’s stored encrypted.
                </p>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-zinc-300">
                        {firebase
                            ? `Saved — ${firebase.project_id} (${firebase.client_email})`
                            : 'Not set — phones won’t ring; calls ring in browsers.'}
                    </p>
                    <div className="flex gap-2">
                        <label className="cursor-pointer rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-200 hover:bg-white/5">
                            {firebase ? 'Replace key' : 'Upload key file'}
                            <input
                                type="file"
                                accept=".json,application/json"
                                className="sr-only"
                                onChange={(e) =>
                                    e.target.files?.[0] &&
                                    uploadKey(e.target.files[0])
                                }
                            />
                        </label>
                        {firebase && (
                            <button
                                type="button"
                                onClick={() =>
                                    router.delete(
                                        settings.firebase.destroy.url(),
                                        { preserveScroll: true },
                                    )
                                }
                                className="text-sm text-red-300 hover:underline"
                            >
                                Remove
                            </button>
                        )}
                    </div>
                </div>
            </section>

            <section className={CARD}>
                <p className={`${CARD_TITLE} mb-1`}>App download (APK)</p>
                <p className="mb-3 text-sm text-zinc-500">
                    {release
                        ? `Version ${release.version} (${(release.size / 1024 / 1024).toFixed(1)} MB), uploaded ${formatDateTime(release.uploaded_at)}.`
                        : 'No app uploaded yet.'}{' '}
                    The version is read from the file. Only a newer version
                    replaces the current one.
                </p>
                <label className="mb-3 block">
                    <span className={LABEL}>What’s new (optional)</span>
                    <input
                        className={INPUT}
                        value={notes}
                        maxLength={1000}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </label>
                <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-200 hover:bg-white/5">
                        {progress === null ? (
                            <Upload className="h-4 w-4" />
                        ) : (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        {progress === null
                            ? 'Upload APK'
                            : `Uploading… ${progress}%`}
                        <input
                            type="file"
                            accept=".apk,application/vnd.android.package-archive"
                            className="sr-only"
                            disabled={progress !== null}
                            onChange={(e) =>
                                e.target.files?.[0] &&
                                void uploadApk(e.target.files[0])
                            }
                        />
                    </label>
                    {release && (
                        <button
                            type="button"
                            onClick={() =>
                                router.delete(settings.apk.destroy.url(), {
                                    preserveScroll: true,
                                })
                            }
                            className="text-sm text-red-300 hover:underline"
                        >
                            Remove download
                        </button>
                    )}
                </div>
            </section>
        </div>
    );
}

CallingAppSettings.layout = (page: ReactNode) => (
    <AdminLayout title="Calling app settings">{page}</AdminLayout>
);
