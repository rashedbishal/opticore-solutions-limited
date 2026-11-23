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
}

/**
 * Leads → Calling (managers): backup call receivers and who's reachable.
 */
export default function Calling({ people }: { people: Person[] }) {
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
