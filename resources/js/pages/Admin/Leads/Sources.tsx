import type { ReactNode } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';

interface Source {
    id: string;
    name: string;
    type: string;
    type_label: string;
    is_active: boolean;
    leads_count: number;
}

const TH =
    'px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase';

/** Leads → Lead Sources: where leads come from (read-only). */
export default function LeadSources({ sources }: { sources: Source[] }) {
    return (
        <div className="relative space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Lead Sources</h1>
                <p className="mt-1 text-sm text-zinc-500">
                    Where your leads come from. Sources are set up by the mother
                    admin.
                </p>
            </div>

            <div className="relative overflow-x-auto rounded-xl border border-violet-500/15 bg-[#060c1a]/80 backdrop-blur-sm">
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b border-violet-500/10 bg-violet-500/5">
                            <th className={TH}>Source</th>
                            <th className={TH}>Type</th>
                            <th className={TH}>Status</th>
                            <th className={`${TH} text-right`}>Leads</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sources.map((source) => (
                            <tr
                                key={source.id}
                                className="border-b border-white/4 last:border-0"
                            >
                                <td className="px-6 py-4 text-sm font-medium text-white">
                                    {source.name}
                                </td>
                                <td className="px-6 py-4 text-sm text-zinc-400">
                                    {source.type_label}
                                </td>
                                <td className="px-6 py-4">
                                    <span
                                        className={`rounded-full border px-2 py-0.5 text-xs ${
                                            source.is_active
                                                ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
                                                : 'border-zinc-400/30 bg-zinc-500/10 text-zinc-400'
                                        }`}
                                    >
                                        {source.is_active ? 'Active' : 'Off'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right font-mono text-sm text-zinc-300">
                                    {source.leads_count}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

LeadSources.layout = (page: ReactNode) => (
    <AdminLayout title="Lead Sources">{page}</AdminLayout>
);
