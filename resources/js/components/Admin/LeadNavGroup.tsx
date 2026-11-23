import type { LucideIcon } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { AnimatePresence, m as motion } from 'framer-motion';
import {
    ChevronDown,
    FileCode2,
    Coins,
    Inbox,
    ListOrdered,
    Radio,
    SlidersHorizontal,
    Target,
} from 'lucide-react';
import { useState } from 'react';
import { canManageLeadSettings, canUseLeads } from '@/lib/leadAccess';
import currencies from '@/routes/admin/lead-settings/currencies';
import general from '@/routes/admin/lead-settings/general';
import statuses from '@/routes/admin/lead-settings/statuses';
import websiteForms from '@/routes/admin/lead-settings/website-forms';
import leads from '@/routes/admin/leads';
import leadSources from '@/routes/admin/leads/sources';

type LeadAdmin =
    | { is_super_admin?: boolean; lead_role?: string | null }
    | undefined;

interface LeadNavLink {
    name: string;
    href: string;
    icon: LucideIcon;
    /** Lead Settings pages are mother-admin-only; the rest need any lead role. */
    section: 'leads' | 'settings';
    /** Overrides the default "path starts with href" active check. */
    isActive?: (path: string) => boolean;
}

/**
 * Every page of the lead system, in sidebar order.
 */
const LEAD_NAV_LINKS: LeadNavLink[] = [
    {
        name: 'All Leads',
        href: leads.index.url(),
        icon: Inbox,
        section: 'leads',
        // The list and each lead's own page, but not the other lead pages.
        isActive: (path) =>
            path === leads.index.url() ||
            /^\/admin\/leads\/[0-9A-Za-z]{26}$/.test(path),
    },
    {
        name: 'Lead Sources',
        href: leadSources.index.url(),
        icon: Radio,
        section: 'leads',
    },
    {
        name: 'General',
        href: general.edit.url(),
        icon: SlidersHorizontal,
        section: 'settings',
    },
    {
        name: 'Website Forms',
        href: websiteForms.index.url(),
        icon: FileCode2,
        section: 'settings',
    },
    {
        name: 'Statuses',
        href: statuses.index.url(),
        icon: ListOrdered,
        section: 'settings',
    },
    {
        name: 'Currencies',
        href: currencies.index.url(),
        icon: Coins,
        section: 'settings',
    },
];

const STORAGE_KEY = 'cms-leads-group';

export function visibleLeadNavLinks(admin: LeadAdmin): LeadNavLink[] {
    return LEAD_NAV_LINKS.filter((link) =>
        link.section === 'settings'
            ? canManageLeadSettings(admin)
            : canUseLeads(admin),
    );
}

interface Props {
    admin: LeadAdmin;
    currentPath: string;
}

/**
 * The "Leads" fold-out group in the CMS sidebar. Opens automatically on any
 * lead page and otherwise remembers whether it was left open.
 */
export default function LeadNavGroup({ admin, currentPath }: Props) {
    const links = visibleLeadNavLinks(admin);
    const leadLinks = links.filter((link) => link.section === 'leads');
    const settingsLinks = links.filter((link) => link.section === 'settings');
    const isLinkActive = (link: LeadNavLink) =>
        link.isActive
            ? link.isActive(currentPath)
            : currentPath.startsWith(link.href);
    const groupActive = links.some(isLinkActive);

    const [open, setOpen] = useState<boolean>(() => {
        if (groupActive) {
            return true;
        }

        try {
            return localStorage.getItem(STORAGE_KEY) === 'open';
        } catch {
            return false;
        }
    });

    if (links.length === 0) {
        return null;
    }

    const toggle = () => {
        const next = !open;
        setOpen(next);

        try {
            localStorage.setItem(STORAGE_KEY, next ? 'open' : 'closed');
        } catch {
            // Storage unavailable — the group just won't remember its state.
        }
    };

    const renderLink = (link: LeadNavLink) => {
        const active = isLinkActive(link);

        return (
            <Link
                key={link.href}
                href={link.href}
                className={`group relative flex items-center rounded-lg py-2 pr-3 pl-9 text-xs font-medium transition-all duration-200 ${
                    active
                        ? 'border border-violet-500/30 bg-violet-500/20 text-violet-100'
                        : 'border border-transparent text-slate-500 hover:border-white/5 hover:bg-white/4 hover:text-slate-200'
                }`}
            >
                {active && (
                    <div className="absolute top-1/2 left-0 h-4 w-0.5 -translate-y-1/2 rounded-full bg-gradient-to-b from-violet-400 to-cyan-400" />
                )}
                <link.icon
                    className={`mr-3 h-3.5 w-3.5 shrink-0 transition-colors ${
                        active
                            ? 'text-violet-400'
                            : 'text-slate-600 group-hover:text-slate-400'
                    }`}
                />
                <span className="truncate font-mono text-xs tracking-[0.04em]">
                    {link.name}
                </span>
            </Link>
        );
    };

    return (
        <div>
            <button
                type="button"
                onClick={toggle}
                aria-expanded={open}
                className={`group relative flex w-full items-center rounded-lg border px-3 py-2.5 text-xs font-medium transition-all duration-200 ${
                    groupActive && !open
                        ? 'border-violet-500/30 bg-violet-500/20 text-violet-100'
                        : 'border-transparent text-slate-500 hover:border-white/5 hover:bg-white/4 hover:text-slate-200'
                }`}
            >
                <Target
                    className={`mr-3 h-4 w-4 shrink-0 transition-colors ${
                        groupActive
                            ? 'text-violet-400'
                            : 'text-slate-600 group-hover:text-slate-400'
                    }`}
                />
                <span className="truncate font-mono text-xs tracking-[0.04em]">
                    Leads
                </span>
                <ChevronDown
                    className={`ml-auto h-3.5 w-3.5 shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
                />
            </button>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="space-y-0.5 py-1">
                            {leadLinks.map(renderLink)}
                            {settingsLinks.length > 0 && (
                                <>
                                    <p className="px-9 pt-2 pb-1 font-mono text-[9px] font-semibold tracking-[0.24em] text-violet-400/40 uppercase">
                                        Settings
                                    </p>
                                    {settingsLinks.map(renderLink)}
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
