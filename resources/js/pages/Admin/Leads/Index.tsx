import type {
    AssignableUser,
    CurrencyOption,
    LeadDetail,
    LeadFilterValues,
    LeadRow,
    LeadStatusOption,
    PriorityOption,
} from '@/types/leads';
import type { ReactNode } from 'react';
import { Link } from '@inertiajs/react';
import { AlarmClock, CalendarClock, Download, Plus } from 'lucide-react';
import { useState } from 'react';
import { CmsErrorDialog } from '@/components/Admin/CmsErrorDialog';
import CreateLeadModal from '@/components/Admin/Leads/CreateLeadModal';
import LeadFiltersBar from '@/components/Admin/Leads/LeadFiltersBar';
import LeadPanel from '@/components/Admin/Leads/LeadPanel';
import LeadsLiveRefresh from '@/components/Admin/Leads/LeadsLiveRefresh';
import { setPanelLead } from '@/components/Admin/Leads/panel';
import { TagChips } from '@/components/Admin/Leads/PipelineCards';
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from '@/components/Admin/Leads/ui';
import AdminLayout from '@/components/Layout/AdminLayout';
import { badgeClass, dotClass, formatDate } from '@/lib/leadColors';
import leadRoutes from '@/routes/admin/leads';
import adSourceRoutes from '@/routes/admin/leads/ad-sources';

interface Props {
    leads: {
        data: LeadRow[];
        links: { url: string | null; label: string; active: boolean }[];
        total: number;
    };
    filters: LeadFilterValues;
    statuses: LeadStatusOption[];
    priorities: PriorityOption[];
    currencies: CurrencyOption[];
    assignableUsers: AssignableUser[];
    can: { create: boolean; assign: boolean; export: boolean };
    selectedLead: LeadDetail | null;
    adSources: {
        id: string;
        name: string;
        leads_count: number;
        latest_at: string | null;
    }[];
}

const TH =
    'px-4 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase';

/**
 * Leads → All Leads, for managers and the mother admin: a searchable,
 * filterable table. Clicking a row opens the lead in the side panel.
 */
export default function LeadsIndex({
    leads,
    filters,
    statuses,
    priorities,
    currencies,
    assignableUsers,
    can,
    selectedLead,
    adSources,
}: Props) {
    const [creating, setCreating] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const statusById = Object.fromEntries(statuses.map((s) => [s.id, s]));
    const priorityByValue = Object.fromEntries(
        priorities.map((p) => [p.value, p]),
    );
    const options = { statuses, priorities, currencies, assignableUsers };
    const exportUrl = leadRoutes.export.url({
        query: Object.fromEntries(
            Object.entries(filters).filter(([, v]) => v !== ''),
        ),
    });

    return (
        <div className="relative space-y-5">
            <LeadsLiveRefresh only={['leads', 'selectedLead', 'adSources']} />
            <CmsErrorDialog messages={errors} onClose={() => setErrors([])} />

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-white">Leads</h1>
                    <p className="mt-1 text-sm text-zinc-500">
                        {leads.total} {leads.total === 1 ? 'lead' : 'leads'}
                    </p>
                </div>
                <div className="flex gap-2">
                    {can.export && (
                        <a href={exportUrl} className={SECONDARY_BUTTON}>
                            <Download className="h-4 w-4" /> Export CSV
                        </a>
                    )}
                    {can.create && (
                        <button
                            type="button"
                            onClick={() => setCreating(true)}
                            className={PRIMARY_BUTTON}
                        >
                            <Plus className="h-4 w-4" /> Add Lead
                        </button>
                    )}
                </div>
            </div>

            <LeadFiltersBar
                filters={filters}
                statuses={statuses}
                priorities={priorities}
                assignableUsers={assignableUsers}
                showOwner
            />

            <div className="relative overflow-x-auto rounded-xl border border-violet-500/15 bg-[#060c1a]/80 backdrop-blur-sm">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b border-violet-500/10 bg-violet-500/5">
                            <th className={TH}>Lead</th>
                            <th className={`${TH} hidden md:table-cell`}>
                                Contact
                            </th>
                            <th className={`${TH} hidden lg:table-cell`}>
                                Source
                            </th>
                            <th className={TH}>Status</th>
                            <th className={`${TH} hidden sm:table-cell`}>
                                Priority
                            </th>
                            <th className={`${TH} hidden md:table-cell`}>
                                Assigned
                            </th>
                            <th className={`${TH} hidden xl:table-cell`}>
                                Added
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {adSources.map((adSource) => (
                            <tr
                                key={`ads-${adSource.id}`}
                                className="border-b border-white/4 bg-cyan-500/[0.03]"
                            >
                                <td colSpan={7} className="px-4 py-3">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-medium text-white">
                                                {adSource.name}
                                            </p>
                                            <p className="text-xs text-zinc-500">
                                                Facebook Lead Ads ·{' '}
                                                {adSource.leads_count}{' '}
                                                {adSource.leads_count === 1
                                                    ? 'lead'
                                                    : 'leads'}
                                                {adSource.latest_at &&
                                                    ` · latest ${formatDate(adSource.latest_at)}`}
                                            </p>
                                        </div>
                                        <Link
                                            href={adSourceRoutes.show.url(
                                                adSource.id,
                                            )}
                                            className={SECONDARY_BUTTON}
                                        >
                                            View all
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {leads.data.length === 0 &&
                        adSources.length > 0 ? null : leads.data.length ===
                          0 ? (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="px-6 py-16 text-center font-mono text-xs tracking-[0.2em] text-violet-400/30 uppercase"
                                >
                                    No leads found
                                </td>
                            </tr>
                        ) : (
                            leads.data.map((lead) => {
                                const status = statusById[lead.status_id];
                                const priority = priorityByValue[lead.priority];

                                return (
                                    <tr
                                        key={lead.id}
                                        onClick={() => setPanelLead(lead.id)}
                                        className={`cursor-pointer border-b border-white/4 transition-colors last:border-0 hover:bg-violet-500/5 ${
                                            lead.has_unseen_update
                                                ? 'bg-amber-500/[0.04]'
                                                : ''
                                        }`}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {lead.has_unseen_update && (
                                                    <span
                                                        className="h-2 w-2 shrink-0 rounded-full bg-amber-400"
                                                        title="Updated since last opened"
                                                    />
                                                )}
                                                <div className="min-w-0">
                                                    <p
                                                        className={`truncate text-sm text-white ${lead.has_unseen_update ? 'font-bold' : 'font-medium'}`}
                                                    >
                                                        {lead.name}
                                                    </p>
                                                    <p className="font-mono text-[11px] text-zinc-500">
                                                        {lead.identifier}
                                                    </p>
                                                    <TagChips
                                                        tags={lead.tags}
                                                    />
                                                </div>
                                                {lead.meeting_alert && (
                                                    <CalendarClock
                                                        className="h-4 w-4 shrink-0 animate-pulse text-amber-300"
                                                        aria-label="Meeting reminder"
                                                    />
                                                )}
                                                {lead.follow_up_alert && (
                                                    <AlarmClock
                                                        className="h-4 w-4 shrink-0 animate-pulse text-amber-300"
                                                        aria-label="Follow-up reminder"
                                                    />
                                                )}
                                            </div>
                                        </td>
                                        <td className="hidden px-4 py-3 text-sm text-zinc-400 md:table-cell">
                                            <p className="truncate">
                                                {lead.phone ?? '—'}
                                            </p>
                                            <p className="truncate text-xs text-zinc-500">
                                                {lead.email}
                                            </p>
                                        </td>
                                        <td className="hidden px-4 py-3 text-sm text-zinc-400 lg:table-cell">
                                            {lead.source.name}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs whitespace-nowrap ${badgeClass(status?.color)}`}
                                            >
                                                <span
                                                    className={`h-1.5 w-1.5 rounded-full ${dotClass(status?.color)}`}
                                                />
                                                {status?.name ?? '—'}
                                            </span>
                                        </td>
                                        <td className="hidden px-4 py-3 sm:table-cell">
                                            <span
                                                className={`rounded-full border px-2 py-0.5 text-xs ${badgeClass(priority?.color)}`}
                                            >
                                                {priority?.label ??
                                                    lead.priority}
                                            </span>
                                        </td>
                                        <td className="hidden px-4 py-3 text-sm whitespace-nowrap text-zinc-300 md:table-cell">
                                            {lead.assigned_to_name ?? (
                                                <span className="text-zinc-500">
                                                    Unassigned
                                                </span>
                                            )}
                                        </td>
                                        <td className="hidden px-4 py-3 text-sm whitespace-nowrap text-zinc-500 xl:table-cell">
                                            {formatDate(lead.created_at)}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {leads.links.filter((l) => l.url !== null).length > 2 && (
                <div className="flex flex-wrap items-center justify-center gap-1 pt-2">
                    {leads.links.map((link, i) => {
                        const label = link.label
                            .replace(/&laquo;/g, '«')
                            .replace(/&raquo;/g, '»');

                        return link.url ? (
                            <Link
                                key={i}
                                href={link.url}
                                preserveScroll
                                className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors ${
                                    link.active
                                        ? 'border border-violet-500/30 bg-violet-500/10 text-violet-300'
                                        : 'border border-white/8 bg-white/4 text-zinc-400 hover:bg-white/8'
                                }`}
                            >
                                {label}
                            </Link>
                        ) : (
                            <span
                                key={i}
                                className="flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm text-zinc-600"
                            >
                                {label}
                            </span>
                        );
                    })}
                </div>
            )}

            <CreateLeadModal
                open={creating}
                onClose={() => setCreating(false)}
                onErrors={setErrors}
                canAssign={can.assign}
                {...options}
            />
            <LeadPanel
                lead={selectedLead}
                onClose={() => setPanelLead(null)}
                {...options}
            />
        </div>
    );
}

LeadsIndex.layout = (page: ReactNode) => (
    <AdminLayout title="Leads">{page}</AdminLayout>
);
