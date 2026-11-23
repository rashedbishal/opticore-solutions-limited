import { Link, router } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { AnimatePresence, m as motion } from 'framer-motion';
import {
    Bell,
    CheckCheck,
    Loader2,
    MessageSquare,
    Target,
    Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/apiFetch';
import leadNotifications from '@/routes/admin/leads/notifications';

interface LeadNotification {
    id: string;
    title: string;
    message: string;
    read: boolean;
    created_at: string | null;
}

interface LeadNotificationsResponse {
    unread_count: number;
    notifications: LeadNotification[];
}

type Tab = 'support' | 'leads';

interface Props {
    adminId: number;
    echoReady: boolean;
    /** Admin may open Customer Support (shows the "Support chats" tab). */
    showSupport: boolean;
    /** Admin holds a lead role (shows the "Leads" tab). */
    showLeads: boolean;
    /** New support chat messages since the page loaded (existing live counter). */
    chatCount: number;
    isOnChatPage: boolean;
    chatPagePath: string;
}

/**
 * The CMS top-bar bell: one bell, one tab per kind of alert the admin can
 * see ("Support chats", "Leads"). The red number is the sum of both.
 */
export default function AdminNotificationBell({
    adminId,
    echoReady,
    showSupport,
    showLeads,
    chatCount,
    isOnChatPage,
    chatPagePath,
}: Props) {
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState<Tab>(showSupport ? 'support' : 'leads');
    const [leadUnread, setLeadUnread] = useState(0);
    const [leadItems, setLeadItems] = useState<LeadNotification[]>([]);
    const [leadsLoaded, setLeadsLoaded] = useState(false);
    const [leadsLoading, setLeadsLoading] = useState(false);
    const [confirmingClear, setConfirmingClear] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const supportCount = showSupport && !isOnChatPage ? chatCount : 0;
    const total = supportCount + (showLeads ? leadUnread : 0);

    const loadLeads = useCallback(async () => {
        if (!showLeads) {
            return;
        }

        setLeadsLoading(true);

        try {
            const { data } = await api.get<LeadNotificationsResponse>(
                leadNotifications.index.url(),
            );
            setLeadUnread(data.unread_count);
            setLeadItems(data.notifications);
            setLeadsLoaded(true);
        } catch {
            // Keep whatever was shown; the next event or open retries.
        } finally {
            setLeadsLoading(false);
        }
    }, [showLeads]);

    useEffect(() => {
        void loadLeads();
    }, [loadLeads]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const onPointerDown = (event: PointerEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) {
                setOpen(false);
                setConfirmingClear(false);
            }
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false);
                setConfirmingClear(false);
            }
        };

        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    const toggle = () => {
        const next = !open;
        setOpen(next);
        setConfirmingClear(false);

        if (next) {
            // Land on the tab that has something new, if any.
            if (showLeads && leadUnread > 0 && supportCount === 0) {
                setTab('leads');
            } else if (showSupport && supportCount > 0) {
                setTab('support');
            } else if (!showSupport) {
                setTab('leads');
            }

            void loadLeads();
        }
    };

    const markRead = async (id: string) => {
        setLeadItems((items) =>
            items.map((item) =>
                item.id === id ? { ...item, read: true } : item,
            ),
        );
        setLeadUnread((count) => Math.max(0, count - 1));
        await api.post(leadNotifications.read.url(id)).catch(() => loadLeads());
    };

    const markAllRead = async () => {
        setLeadItems((items) => items.map((item) => ({ ...item, read: true })));
        setLeadUnread(0);
        await api
            .post(leadNotifications.readAll.url())
            .catch(() => loadLeads());
    };

    const clearAll = async () => {
        setConfirmingClear(false);
        setLeadItems([]);
        setLeadUnread(0);
        await api
            .delete(leadNotifications.clear.url())
            .catch(() => loadLeads());
    };

    const tabs: {
        key: Tab;
        label: string;
        count: number;
        icon: typeof Bell;
    }[] = [
        ...(showSupport
            ? [
                  {
                      key: 'support' as Tab,
                      label: 'Support chats',
                      count: supportCount,
                      icon: MessageSquare,
                  },
              ]
            : []),
        ...(showLeads
            ? [
                  {
                      key: 'leads' as Tab,
                      label: 'Leads',
                      count: leadUnread,
                      icon: Target,
                  },
              ]
            : []),
    ];
    const activeTab = tabs.some((t) => t.key === tab) ? tab : tabs[0]?.key;

    return (
        <div ref={containerRef} className="relative">
            {echoReady && showLeads && (
                <LeadNotificationListener
                    adminId={adminId}
                    onNotified={loadLeads}
                />
            )}

            <button
                type="button"
                onClick={toggle}
                aria-expanded={open}
                aria-haspopup="dialog"
                className={`relative -m-2 rounded-lg p-2 transition-colors ${
                    total > 0
                        ? 'text-violet-400 hover:text-violet-300'
                        : 'text-slate-500 hover:text-violet-400'
                }`}
            >
                <span className="sr-only">Notifications</span>
                <Bell className="h-5 w-5" />
                {total > 0 && (
                    <span className="absolute -top-1 -right-1">
                        <span className="absolute inline-flex h-5 w-5 animate-ping rounded-full bg-rose-400 opacity-40" />
                        <motion.span
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 1.0, repeat: Infinity }}
                            className="relative flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-0.5 font-mono text-[9px] font-bold text-white"
                            style={{
                                boxShadow:
                                    '0 0 10px rgba(244,63,94,0.9), 0 0 20px rgba(244,63,94,0.4)',
                            }}
                        >
                            {total > 99 ? '99+' : total}
                        </motion.span>
                    </span>
                )}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        role="dialog"
                        aria-label="Notifications"
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute right-0 z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] origin-top-right overflow-hidden rounded-xl border border-violet-500/20 bg-[#070a17]/95 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-xl"
                    >
                        {tabs.length === 0 ? (
                            <p className="px-4 py-8 text-center text-sm text-slate-500">
                                No notifications.
                            </p>
                        ) : (
                            <>
                                {tabs.length > 1 && (
                                    <div className="flex border-b border-white/5 p-1">
                                        {tabs.map((t) => (
                                            <button
                                                key={t.key}
                                                type="button"
                                                onClick={() => {
                                                    setTab(t.key);
                                                    setConfirmingClear(false);
                                                }}
                                                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                                                    activeTab === t.key
                                                        ? 'bg-violet-500/15 text-violet-100'
                                                        : 'text-slate-500 hover:text-slate-200'
                                                }`}
                                            >
                                                <t.icon className="h-3.5 w-3.5" />
                                                {t.label}
                                                {t.count > 0 && (
                                                    <span className="rounded-full bg-rose-500/90 px-1.5 font-mono text-[9px] font-bold text-white">
                                                        {t.count > 99
                                                            ? '99+'
                                                            : t.count}
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {activeTab === 'support' && (
                                    <div className="space-y-4 px-4 py-6 text-center">
                                        <MessageSquare className="mx-auto h-6 w-6 text-violet-400/70" />
                                        <p className="text-sm text-slate-300">
                                            {supportCount > 0
                                                ? `You have ${supportCount} new chat ${supportCount === 1 ? 'message' : 'messages'}.`
                                                : 'No new chat messages.'}
                                        </p>
                                        <Link
                                            href={chatPagePath}
                                            onClick={() => setOpen(false)}
                                            className="inline-flex items-center gap-2 rounded-lg border border-violet-400/30 bg-violet-500/15 px-4 py-2 text-xs font-semibold text-violet-100 transition-colors hover:bg-violet-500/25"
                                        >
                                            Open Customer Support
                                        </Link>
                                    </div>
                                )}

                                {activeTab === 'leads' && (
                                    <div>
                                        <div className="flex items-center justify-between gap-2 border-b border-white/5 px-4 py-2">
                                            <span className="font-mono text-[10px] tracking-[0.18em] text-violet-400/60 uppercase">
                                                Lead alerts
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={markAllRead}
                                                    disabled={leadUnread === 0}
                                                    title="Mark all as read"
                                                    className="rounded-md p-1.5 text-slate-500 transition-colors hover:text-violet-300 disabled:opacity-30"
                                                >
                                                    <CheckCheck className="h-4 w-4" />
                                                </button>
                                                {confirmingClear ? (
                                                    <button
                                                        type="button"
                                                        onClick={clearAll}
                                                        className="rounded-md bg-rose-500/15 px-2 py-1 text-[11px] font-semibold text-rose-300 transition-colors hover:bg-rose-500/25"
                                                    >
                                                        Clear all?
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setConfirmingClear(
                                                                true,
                                                            )
                                                        }
                                                        disabled={
                                                            leadItems.length ===
                                                            0
                                                        }
                                                        title="Clear all"
                                                        className="rounded-md p-1.5 text-slate-500 transition-colors hover:text-rose-300 disabled:opacity-30"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="max-h-96 overflow-y-auto">
                                            {!leadsLoaded && leadsLoading ? (
                                                <div className="flex justify-center py-8">
                                                    <Loader2 className="h-5 w-5 animate-spin text-violet-400/70" />
                                                </div>
                                            ) : leadItems.length === 0 ? (
                                                <p className="px-4 py-8 text-center text-sm text-slate-500">
                                                    No lead alerts yet.
                                                </p>
                                            ) : (
                                                <ul className="divide-y divide-white/5">
                                                    {leadItems.map((item) => (
                                                        <li
                                                            key={item.id}
                                                            className="group relative"
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setOpen(
                                                                        false,
                                                                    );
                                                                    router.visit(
                                                                        leadNotifications.open.url(
                                                                            item.id,
                                                                        ),
                                                                    );
                                                                }}
                                                                className="block w-full px-4 py-3 pr-10 text-left transition-colors hover:bg-white/[0.03]"
                                                            >
                                                                <p
                                                                    className={`text-sm ${item.read ? 'text-slate-400' : 'font-semibold text-white'}`}
                                                                >
                                                                    {item.title}
                                                                </p>
                                                                {item.message && (
                                                                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                                                                        {
                                                                            item.message
                                                                        }
                                                                    </p>
                                                                )}
                                                                {item.created_at && (
                                                                    <p className="mt-1 font-mono text-[10px] text-slate-600">
                                                                        {timeAgo(
                                                                            item.created_at,
                                                                        )}
                                                                    </p>
                                                                )}
                                                            </button>
                                                            {!item.read && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        markRead(
                                                                            item.id,
                                                                        )
                                                                    }
                                                                    title="Mark as read"
                                                                    className="absolute top-4 right-4 flex h-4 w-4 items-center justify-center"
                                                                >
                                                                    <span className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.9)]" />
                                                                </button>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function LeadNotificationListener({
    adminId,
    onNotified,
}: {
    adminId: number;
    onNotified: () => void;
}) {
    useEcho(
        `admin.lead-notifications.${adminId}`,
        '.notification.created',
        () => onNotified(),
        [onNotified],
    );

    return null;
}

function timeAgo(iso: string): string {
    const seconds = Math.max(
        0,
        Math.round((Date.now() - new Date(iso).getTime()) / 1000),
    );

    if (seconds < 60) {
        return 'just now';
    }

    const units: [number, string][] = [
        [60 * 60 * 24 * 7, 'week'],
        [60 * 60 * 24, 'day'],
        [60 * 60, 'hour'],
        [60, 'minute'],
    ];

    for (const [size, unit] of units) {
        if (seconds >= size) {
            const value = Math.floor(seconds / size);

            return `${value} ${unit}${value === 1 ? '' : 's'} ago`;
        }
    }

    return 'just now';
}
