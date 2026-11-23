import type {
    AssignableUser,
    LeadFilterValues,
    LeadStatusOption,
    PriorityOption,
} from '@/types/leads';
import { router } from '@inertiajs/react';
import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { INPUT, SELECT } from '@/components/Admin/Leads/ui';

interface Props {
    filters: LeadFilterValues;
    statuses: LeadStatusOption[];
    priorities: PriorityOption[];
    assignableUsers: AssignableUser[];
    showStatus?: boolean;
    showOwner: boolean;
}

/**
 * Search + filters for the lead list/board. Changes go into the URL, so a
 * filtered view can be reloaded or shared.
 */
export default function LeadFiltersBar({
    filters,
    statuses,
    priorities,
    assignableUsers,
    showStatus = true,
    showOwner,
}: Props) {
    const [search, setSearch] = useState(filters.search);
    const first = useRef(true);

    const apply = (changes: Partial<LeadFilterValues>) => {
        const next = { ...filters, search, ...changes };
        const query = Object.fromEntries(
            Object.entries(next).filter(([, value]) => value !== ''),
        );

        router.get(window.location.pathname, query, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    useEffect(() => {
        if (first.current) {
            first.current = false;

            return;
        }

        const timeout = setTimeout(() => apply({ search }), 350);

        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const active = Object.values(filters).some((value) => value !== '');

    return (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:flex xl:flex-wrap xl:items-center">
            <div className="relative col-span-2 md:col-span-3 xl:w-72">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name, phone, email, number…"
                    className={`${INPUT} pl-9`}
                    aria-label="Search leads"
                />
            </div>
            {showStatus && (
                <select
                    aria-label="Status"
                    className={`${SELECT} xl:w-40`}
                    value={filters.status}
                    onChange={(e) => apply({ status: e.target.value })}
                >
                    <option value="">All statuses</option>
                    {statuses.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.name}
                        </option>
                    ))}
                </select>
            )}
            <select
                aria-label="Priority"
                className={`${SELECT} xl:w-36`}
                value={filters.priority}
                onChange={(e) => apply({ priority: e.target.value })}
            >
                <option value="">All priorities</option>
                {priorities.map((p) => (
                    <option key={p.value} value={p.value}>
                        {p.label}
                    </option>
                ))}
            </select>
            {showOwner && (
                <select
                    aria-label="Assigned to"
                    className={`${SELECT} xl:w-44`}
                    value={filters.assigned_to}
                    onChange={(e) => apply({ assigned_to: e.target.value })}
                >
                    <option value="">Anyone</option>
                    <option value="unassigned">Unassigned</option>
                    {assignableUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                            {u.name}
                        </option>
                    ))}
                </select>
            )}
            <input
                type="date"
                aria-label="Added from"
                className={`${INPUT} xl:w-40`}
                value={filters.from}
                onChange={(e) => apply({ from: e.target.value })}
            />
            <input
                type="date"
                aria-label="Added until"
                className={`${INPUT} xl:w-40`}
                value={filters.to}
                onChange={(e) => apply({ to: e.target.value })}
            />
            {active && (
                <button
                    type="button"
                    onClick={() => {
                        setSearch('');
                        router.get(
                            window.location.pathname,
                            {},
                            {
                                preserveState: true,
                                preserveScroll: true,
                                replace: true,
                            },
                        );
                    }}
                    className="inline-flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs text-zinc-400 transition-colors hover:text-white"
                >
                    <X className="h-3.5 w-3.5" /> Clear
                </button>
            )}
        </div>
    );
}
