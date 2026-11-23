import type { ReactNode } from 'react';
import { router } from '@inertiajs/react';
import { CARD } from '@/components/Admin/Leads/ui';
import AdminLayout from '@/components/Layout/AdminLayout';
import calling from '@/routes/admin/leads/calling';

interface Person {
    id: number;
    name: string;
    role: string;
    is_backup: boolean;
    online: boolean;
    on_call: boolean;
    phone: string | null;
}

/**
 * Leads → Calling (managers): backup call receivers and who's reachable.
 */
interface WhatsAppNumber {
    id: string;
    name: string;
    calling_enabled: boolean;
    template_name: string;
    template_status: string | null;
    has_waba: boolean;
}

export default function Calling({
    people,
    numbers,
    ringtone,
}: {
    people: Person[];
    numbers: WhatsAppNumber[];
    ringtone: string | null;
}) {
    return (
        <div className="relative space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">
                    WhatsApp Calling
                </h1>
                <p className="mt-1 text-sm text-zinc-500">
                    A call rings the lead&apos;s own person first, if their CMS
                    is open and they&apos;re free. If not, it rings every backup
                    receiver at once. If there are none, it rings the managers.
                    New or unowned leads ring the managers directly.
                </p>
            </div>
            <section className={CARD}>
                <p className="mb-1 text-sm font-semibold text-white">
                    Ringtone
                </p>
                <p className="mb-3 text-xs text-zinc-500">
                    {ringtone
                        ? `Everyone’s call box rings with “${ringtone}”.`
                        : 'Everyone’s call box uses the built-in ring. Upload an MP3 (up to 1 MB) to change it.'}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                    <label className="cursor-pointer rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/5">
                        {ringtone ? 'Replace MP3' : 'Upload MP3'}
                        <input
                            type="file"
                            accept=".mp3,audio/mpeg"
                            className="sr-only"
                            onChange={(e) => {
                                const file = e.target.files?.[0];

                                if (file) {
                                    router.post(
                                        calling.ringtone.upload.url(),
                                        { ringtone: file },
                                        {
                                            forceFormData: true,
                                            preserveScroll: true,
                                        },
                                    );
                                }
                            }}
                        />
                    </label>
                    {ringtone && (
                        <button
                            type="button"
                            onClick={() =>
                                router.delete(calling.ringtone.remove.url(), {
                                    preserveScroll: true,
                                })
                            }
                            className="text-xs text-red-300 hover:underline"
                        >
                            Use the built-in ring
                        </button>
                    )}
                </div>
            </section>

            {numbers.length > 0 && (
                <section className={CARD}>
                    <p className="mb-1 text-sm font-semibold text-white">
                        Permission message
                    </p>
                    <p className="mb-3 text-xs text-zinc-500">
                        Before calling a lead, Meta requires sending them an
                        approved message with an “Allow calls” button. Create it
                        once per WhatsApp number; Meta approves it, usually
                        within a few hours.
                    </p>
                    <ul className="divide-y divide-white/5">
                        {numbers.map((number) => (
                            <li
                                key={number.id}
                                className="flex flex-wrap items-center justify-between gap-3 py-2.5"
                            >
                                <div className="min-w-0">
                                    <p className="text-sm text-white">
                                        {number.name}
                                    </p>
                                    <p className="text-xs text-zinc-500">
                                        {number.template_status
                                            ? `“${number.template_name}” sent to Meta (${number.template_status})`
                                            : 'Not created yet'}
                                        {!number.calling_enabled &&
                                            ' · calling is off'}
                                        {!number.has_waba &&
                                            ' · needs the WhatsApp Business Account ID'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    disabled={!number.has_waba}
                                    onClick={() =>
                                        router.post(
                                            calling.template.url(number.id),
                                            {},
                                            { preserveScroll: true },
                                        )
                                    }
                                    className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/5 disabled:opacity-40"
                                >
                                    {number.template_status
                                        ? 'Create again'
                                        : 'Create permission message'}
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            <section className={CARD}>
                <ul className="divide-y divide-white/5">
                    {people.map((person) => (
                        <li
                            key={person.id}
                            className="flex flex-wrap items-center justify-between gap-3 py-3"
                        >
                            <div className="flex min-w-0 items-center gap-3">
                                <span
                                    title={
                                        person.on_call
                                            ? 'On a call'
                                            : person.online
                                              ? 'CMS open'
                                              : 'Away'
                                    }
                                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                                        person.on_call
                                            ? 'bg-amber-400'
                                            : person.online
                                              ? 'bg-emerald-400'
                                              : 'bg-zinc-600'
                                    }`}
                                />
                                <div className="min-w-0">
                                    <p className="truncate text-sm text-white">
                                        {person.name}
                                    </p>
                                    <p className="text-xs text-zinc-500">
                                        {person.role} ·{' '}
                                        {person.on_call
                                            ? 'on a call'
                                            : person.online
                                              ? 'online'
                                              : 'away'}
                                    </p>
                                </div>
                            </div>
                            {person.phone && (
                                <span className="flex items-center gap-2 text-xs text-zinc-400">
                                    App: {person.phone}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            router.delete(
                                                calling.phones.disconnect.url(
                                                    person.id,
                                                ),
                                                { preserveScroll: true },
                                            )
                                        }
                                        className="text-red-300 hover:underline"
                                    >
                                        Disconnect
                                    </button>
                                </span>
                            )}
                            <label className="flex items-center gap-2 text-sm text-zinc-300">
                                <input
                                    type="checkbox"
                                    checked={person.is_backup}
                                    onChange={() =>
                                        router.post(
                                            calling.backups.toggle.url(
                                                person.id,
                                            ),
                                            {},
                                            { preserveScroll: true },
                                        )
                                    }
                                />
                                Backup receiver
                            </label>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}

Calling.layout = (page: ReactNode) => (
    <AdminLayout title="WhatsApp Calling">{page}</AdminLayout>
);
