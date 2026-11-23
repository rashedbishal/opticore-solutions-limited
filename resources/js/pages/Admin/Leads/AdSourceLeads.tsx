import type {
    AssignableUser,
    LeadFilterValues,
    LeadStatusOption,
    PriorityOption,
} from '@/types/leads';
import type { ReactNode } from 'react';
import { Link } from '@inertiajs/react';
import { ArrowLeft, FileSpreadsheet } from 'lucide-react';
import LeadFiltersBar from '@/components/Admin/Leads/LeadFiltersBar';
import LeadsLiveRefresh from '@/components/Admin/Leads/LeadsLiveRefresh';
import { SECONDARY_BUTTON } from '@/components/Admin/Leads/ui';
import AdminLayout from '@/components/Layout/AdminLayout';
import { badgeClass, formatDateTime } from '@/lib/leadColors';
import leadRoutes from '@/routes/admin/leads';
import adSources from '@/routes/admin/leads/ad-sources';

interface AdLeadRow {
    id: string;
    identifier: string;
    name: string;
    fields: Record<string, string>;
    form_name: string | null;
    status_id: string;
    assigned_to_name: string | null;
    created_at: string | null;
}

interface Props {
    source: { id: string; name: string };
    columns: string[];
    leads: {
        data: AdLeadRow[];
        links: { url: string | null; label: string; active: boolean }[];
        total: number;
    };
    filters: LeadFilterValues;
    statuses: LeadStatusOption[];
    priorities: PriorityOption[];
    assignableUsers: AssignableUser[];
}

const TH =
    'sticky top-0 px-3 py-2.5 text-left font-mono text-[10px] font-medium tracking-[0.14em] whitespace-nowrap text-violet-400/70 uppercase bg-[#0a1024]';

/**
 * One Facebook Lead Ads source as a spreadsheet: one column per form
 * question, plus Excel export. Search here matches the lead number.
 */
export default function AdSourceLeads({
    source,
    columns,
    leads,
    filters,
    statuses,
    priorities,
    assignableUsers,
}: Props) {
    const statusById = Object.fromEntries(statuses.map((s) => [s.id, s]));
    const query = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== ''),
    );

    return (
        <div className="relative space-y-5">
            <LeadsLiveRefresh only={['leads', 'columns']} />
            <Link
                href={leadRoutes.index.url()}
                className="inline-flex items-center gap-2 font-mono text-xs text-zinc-400 hover:text-white"
            >
                <ArrowLeft className="h-4 w-4" /> All leads
            </Link>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        {source.name}
                    </h1>
                    <p className="mt-1 text-sm text-zinc-500">
                        Facebook Lead Ads · {leads.total}{' '}
                        {leads.total === 1 ? 'lead' : 'leads'}
                    </p>
                </div>
                <a
                    href={adSources.export.url(source.id, { query })}
                    className={SECONDARY_BUTTON}
                >
                    <FileSpreadsheet className="h-4 w-4" /> Download Excel
                </a>
            </div>

            <LeadFiltersBar
                filters={filters}
                statuses={statuses}
                priorities={priorities}
                assignableUsers={assignableUsers}
                showOwner={assignableUsers.length > 0}
            />

            <div className="relative max-h-[70vh] overflow-auto rounded-xl border border-violet-500/15 bg-[#060c1a]/80">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr>
                            <th className={TH}>Lead</th>
                            {columns.map((column) => (
                                <th key={column} className={TH}>
                                    {column.replace(/_/g, ' ')}
                                </th>
                            ))}
                            <th className={TH}>Form</th>
                            <th className={TH}>Status</th>
                            <th className={TH}>Assigned</th>
                            <th className={TH}>Submitted</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leads.data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length + 5}
                                    className="px-6 py-16 text-center font-mono text-xs tracking-[0.2em] text-violet-400/30 uppercase"
                                >
                                    No leads yet
                                </td>
                            </tr>
                        ) : (
                            leads.data.map((lead) => {
                                const status = statusById[lead.status_id];

                                return (
                                    <tr
                                        key={lead.id}
                                        className="border-t border-white/4 hover:bg-violet-500/5"
                                    >
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <Link
                                                href={leadRoutes.show.url(
                                                    lead.id,
                                                )}
                                                className="font-medium text-white hover:text-cyan-300"
                                            >
                                                {lead.name}
                                            </Link>
                                            <p className="font-mono text-[10px] text-zinc-500">
                                                {lead.identifier}
                                            </p>
                                        </td>
                                        {columns.map((column) => (
                                            <td
                                                key={column}
                                                className="max-w-56 truncate px-3 py-2 text-zinc-300"
                                                title={lead.fields[column]}
                                            >
                                                {lead.fields[column] ?? '—'}
                                            </td>
                                        ))}
                                        <td className="px-3 py-2 whitespace-nowrap text-zinc-400">
                                            {lead.form_name ?? '—'}
                                        </td>
                                        <td className="px-3 py-2">
                                            <span
                                                className={`rounded-full border px-2 py-0.5 text-xs whitespace-nowrap ${badgeClass(status?.color)}`}
                                            >
                                                {status?.name ?? '—'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-zinc-300">
                                            {lead.assigned_to_name ?? (
                                                <span className="text-zinc-500">
                                                    Unassigned
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-zinc-500">
                                            {formatDateTime(lead.created_at)}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {leads.links.filter((l) => l.url !== null).length > 2 && (
                <div className="flex flex-wrap justify-center gap-1">
                    {leads.links.map((link, i) =>
                        link.url ? (
                            <Link
                                key={i}
                                href={link.url}
                                preserveScroll
                                className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm ${
                                    link.active
                                        ? 'border border-violet-500/30 bg-violet-500/10 text-violet-300'
                                        : 'border border-white/8 bg-white/4 text-zinc-400 hover:bg-white/8'
                                }`}
                            >
                                {link.label
                                    .replace(/&laquo;/g, '«')
                                    .replace(/&raquo;/g, '»')}
                            </Link>
                        ) : null,
                    )}
                </div>
            )}
        </div>
    );
}

AdSourceLeads.layout = (page: ReactNode) => (
    <AdminLayout title="Facebook Lead Ads">{page}</AdminLayout>
);
