import type { SharedPageProps } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    LayoutDashboard,
    Image,
    FileText,
    MessageSquare,
    Users,
    UserCheck,
    LogOut,
    Menu,
    X,
    Mail,
    Bell,
    Briefcase,
    Layers,
    Star,
    CheckCircle2,
    AlertCircle,
    HelpCircle,
} from 'lucide-react';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import NotificationListener from '@/components/Admin/NotificationListener';
import useEchoReady from '@/hooks/useEchoReady';
import adminRoutes from '@/routes/admin';

interface AdminLayoutProps {
    children: React.ReactNode;
    title?: string;
}

const CHAT_PAGE_PATH = '/admin/customer-conversations';

const NAV_ITEMS = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    {
        name: 'Customer Support',
        href: '/admin/customer-conversations',
        icon: MessageSquare,
    },
    { name: 'Portfolios', href: '/admin/portfolios', icon: Image },
    { name: 'Sub Categories', href: '/admin/sub-categories', icon: Layers },
    { name: 'Blogs', href: '/admin/blogs', icon: FileText },
    { name: 'FAQs', href: '/admin/faqs', icon: HelpCircle },
    { name: 'Chat Archive', href: '/admin/chats', icon: MessageSquare },
    { name: 'Contacts', href: '/admin/contacts', icon: Mail },
    { name: 'Brands', href: '/admin/brands', icon: Briefcase },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Clients', href: '/admin/clients', icon: UserCheck },
    { name: 'Client Workflow', href: '/admin/tasks', icon: Briefcase },
    { name: 'Review Control', href: '/admin/client-reviews', icon: Star },
    { name: 'Testimonials', href: '/admin/testimonials', icon: Star },
];

export default function AdminLayout({ children, title }: AdminLayoutProps) {
    const page = usePage<SharedPageProps>();
    const { auth, flash } = page.props;
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (window.innerWidth < 1024) {
            return false;
        }

        const stored = localStorage.getItem('cms-sidebar');

        return stored === null ? true : stored === 'open';
    });

    const toggleSidebar = () => {
        setSidebarOpen((prev) => {
            const next = !prev;

            if (window.innerWidth >= 1024) {
                localStorage.setItem('cms-sidebar', next ? 'open' : 'closed');
            }

            return next;
        });
    };

    const [showToast, setShowToast] = useState(false);
    const [msgToast, setMsgToast] = useState<{ show: boolean; name?: string }>({
        show: false,
    });
    const msgToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const echoReady = useEchoReady();
    const [notificationCount, setNotificationCount] = useState(0);

    const isOnChatPage = page.url.startsWith(CHAT_PAGE_PATH);

    useEffect(() => {
        return router.on('navigate', (event) => {
            if (window.innerWidth < 1024) {
                setSidebarOpen(false);
            }

            if (event.detail.page.url.startsWith(CHAT_PAGE_PATH)) {
                setNotificationCount(0);
            }
        });
    }, []);

    const handleNewNotification = useCallback((senderName?: string) => {
        setNotificationCount((prev) => prev + 1);
        setMsgToast({ show: true, name: senderName });

        if (msgToastTimerRef.current) {
            clearTimeout(msgToastTimerRef.current);
        }

        msgToastTimerRef.current = setTimeout(
            () => setMsgToast({ show: false }),
            6000,
        );
    }, []);

    useEffect(() => {
        if (!flash?.success) {
            return;
        }

        const showTimer = setTimeout(() => setShowToast(true), 0);
        const hideTimer = setTimeout(() => setShowToast(false), 4500);

        return () => {
            clearTimeout(showTimer);
            clearTimeout(hideTimer);
        };
    }, [flash]);

    return (
        <div className="relative min-h-screen overflow-x-hidden bg-[#03050d] font-sans text-slate-200 selection:bg-violet-500/30">
            {title && <Head title={`${title} — CMS`} />}

            {/* ── Global ambient background ── */}
            <div className="pointer-events-none fixed inset-0 z-0">
                <div
                    className="absolute inset-0 opacity-[0.035]"
                    style={{
                        backgroundImage:
                            'linear-gradient(rgba(139,92,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,1) 1px, transparent 1px)',
                        backgroundSize: '64px 64px',
                    }}
                />
                <div className="absolute -top-60 -left-60 h-[640px] w-[640px] rounded-full bg-violet-700/12 blur-[180px]" />
                <div className="absolute -right-60 -bottom-60 h-[520px] w-[520px] rounded-full bg-cyan-700/8 blur-[160px]" />
            </div>

            {/* ── Echo / notification listener ── */}
            {echoReady && (
                <NotificationListener
                    isOnChatPage={isOnChatPage}
                    onNewMessage={handleNewNotification}
                />
            )}

            {/* ── Toast notifications ── */}
            <AnimatePresence>
                {showToast && flash?.success && (
                    <motion.div
                        key="toast-success"
                        initial={{ opacity: 0, y: -16, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{
                            opacity: 0,
                            y: -8,
                            scale: 0.95,
                            transition: { duration: 0.2 },
                        }}
                        className="fixed top-5 right-5 z-[200] flex max-w-sm min-w-[300px] items-start gap-3 overflow-hidden rounded-xl border border-emerald-500/25 bg-[#060c1a]/95 p-4 shadow-2xl backdrop-blur-xl"
                        style={{ boxShadow: '0 0 40px rgba(16,185,129,0.12)' }}
                    >
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="font-mono text-[10px] tracking-[0.2em] text-emerald-400 uppercase">
                                Success
                            </p>
                            <p className="mt-0.5 text-sm text-slate-200">
                                {flash.success}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowToast(false)}
                            className="shrink-0 text-slate-500 hover:text-slate-300"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </motion.div>
                )}
                {flash?.error && (
                    <motion.div
                        key="toast-error"
                        initial={{ opacity: 0, y: -16, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{
                            opacity: 0,
                            scale: 0.95,
                            transition: { duration: 0.2 },
                        }}
                        className="fixed top-5 right-5 z-[200] flex max-w-sm min-w-[300px] items-start gap-3 overflow-hidden rounded-xl border border-red-500/25 bg-[#060c1a]/95 p-4 shadow-2xl backdrop-blur-xl"
                        style={{ boxShadow: '0 0 40px rgba(239,68,68,0.1)' }}
                    >
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/60 to-transparent" />
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/15">
                            <AlertCircle className="h-4 w-4 text-red-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="font-mono text-[10px] tracking-[0.2em] text-red-400 uppercase">
                                Error
                            </p>
                            <p className="mt-0.5 text-sm text-slate-200">
                                {flash.error}
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* ── New message notification toast ── */}
                {msgToast.show && (
                    <motion.div
                        key="toast-new-message"
                        initial={{ opacity: 0, x: 60, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{
                            opacity: 0,
                            x: 60,
                            scale: 0.95,
                            transition: { duration: 0.25 },
                        }}
                        className="fixed top-20 right-5 z-[200] w-80 overflow-hidden rounded-xl border border-cyan-500/30 bg-[#060c1a]/98 shadow-2xl backdrop-blur-xl"
                        style={{
                            boxShadow:
                                '0 0 50px rgba(6,182,212,0.18), 0 0 100px rgba(6,182,212,0.06)',
                        }}
                    >
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
                        <Link
                            href={CHAT_PAGE_PATH}
                            onClick={() => setMsgToast({ show: false })}
                            className="flex items-start gap-3 p-4"
                        >
                            <div className="relative shrink-0">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/15">
                                    <MessageSquare className="h-4 w-4 text-cyan-400" />
                                </div>
                                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5 items-center justify-center">
                                    <span className="absolute inline-flex h-2.5 w-2.5 animate-ping rounded-full bg-cyan-400 opacity-60" />
                                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400" />
                                </span>
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-mono text-[9px] tracking-[0.25em] text-cyan-400/80 uppercase">
                                    Incoming Transmission
                                </p>
                                <p className="mt-0.5 text-sm font-medium text-white">
                                    {msgToast.name
                                        ? msgToast.name
                                        : 'A customer'}{' '}
                                    <span className="font-normal text-slate-300">
                                        sent a message
                                    </span>
                                </p>
                                <p className="mt-1.5 font-mono text-[9px] tracking-[0.18em] text-violet-400/60 uppercase">
                                    Tap to open channel →
                                </p>
                            </div>
                        </Link>
                        <button
                            onClick={() => setMsgToast({ show: false })}
                            className="absolute top-3 right-3 rounded p-0.5 text-slate-600 transition-colors hover:text-slate-300"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Mobile overlay ── */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        key="overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* ── Sidebar ── */}
            <div
                className={`fixed inset-y-0 left-0 z-50 flex w-64 transform flex-col border-r border-violet-500/10 bg-[#03050d]/98 backdrop-blur-xl transition-transform duration-300 ease-in-out ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {/* Sidebar inner grid */}
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage:
                            'linear-gradient(rgba(139,92,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,1) 1px, transparent 1px)',
                        backgroundSize: '32px 32px',
                    }}
                />
                {/* Sidebar top glow */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/60 to-transparent" />

                {/* Logo */}
                <div className="relative flex h-16 shrink-0 items-center justify-between border-b border-violet-500/10 px-5">
                    <div className="flex items-center gap-3">
                        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{
                                    duration: 12,
                                    repeat: Infinity,
                                    ease: 'linear',
                                }}
                                className="absolute inset-0 rounded-lg border border-dashed border-violet-500/40"
                            />
                            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-violet-600/30 to-cyan-600/20" />
                            <img
                                src="/favicon.ico"
                                alt="Opticore"
                                className="relative h-5 w-5 object-contain"
                            />
                        </div>
                        <div>
                            <p className="text-[11px] leading-tight font-bold tracking-[0.08em] text-white uppercase">
                                Opticore Solutions
                            </p>
                            <p className="font-mono text-[9px] tracking-[0.22em] text-violet-400/60 uppercase">
                                Limited
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="text-slate-500 transition-colors hover:text-slate-200 lg:hidden"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Navigation */}
                <div className="relative flex-1 overflow-y-auto px-3 py-4">
                    <p className="mb-3 px-3 font-mono text-[9px] font-semibold tracking-[0.28em] text-violet-400/40 uppercase">
                        Navigation
                    </p>
                    <nav className="space-y-0.5">
                        {NAV_ITEMS.map((item) => {
                            const currentPath = page.url.split('?')[0];
                            const active =
                                currentPath.startsWith(item.href) &&
                                (item.href !== '/admin' ||
                                    currentPath === '/admin');

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`group relative flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                                        active
                                            ? 'border border-violet-500/30 bg-violet-500/20 text-violet-100'
                                            : 'border border-transparent text-slate-500 hover:border-white/5 hover:bg-white/4 hover:text-slate-200'
                                    }`}
                                >
                                    {active && (
                                        <div className="absolute top-1/2 left-0 h-4 w-0.5 -translate-y-1/2 rounded-full bg-gradient-to-b from-violet-400 to-cyan-400" />
                                    )}
                                    <item.icon
                                        className={`mr-3 h-4 w-4 shrink-0 transition-colors ${
                                            active
                                                ? 'text-violet-400'
                                                : 'text-slate-600 group-hover:text-slate-400'
                                        }`}
                                    />
                                    <span className="truncate font-mono text-sm tracking-[0.04em]">
                                        {item.name}
                                    </span>
                                    {item.href === CHAT_PAGE_PATH &&
                                        notificationCount > 0 &&
                                        !isOnChatPage && (
                                            <span className="relative ml-auto flex h-3 w-3 shrink-0 items-center justify-center">
                                                <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-rose-400 opacity-60" />
                                                <span
                                                    className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"
                                                    style={{
                                                        boxShadow:
                                                            '0 0 8px rgba(244,63,94,1), 0 0 16px rgba(244,63,94,0.5)',
                                                    }}
                                                />
                                            </span>
                                        )}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Sidebar footer */}
                <div className="relative shrink-0 border-t border-violet-500/10 p-4">
                    {/* System status */}
                    <div className="mb-3 flex items-center gap-2 px-1">
                        <motion.div
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ duration: 1.8, repeat: Infinity }}
                            className="h-1.5 w-1.5 rounded-full bg-green-400"
                        />
                        <span className="font-mono text-[9px] tracking-[0.2em] text-green-400/70 uppercase">
                            System Online
                        </span>
                    </div>

                    {/* User info */}
                    <div className="mb-2 flex items-center gap-3 rounded-lg border border-white/5 bg-white/4 px-3 py-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-cyan-600 text-xs font-bold text-white">
                            {auth.user?.name?.charAt(0)?.toUpperCase() || 'A'}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-white">
                                {auth.user?.name || 'Admin User'}
                            </p>
                            <p className="font-mono text-[9px] tracking-wide text-violet-400/60 uppercase">
                                Administrator
                            </p>
                        </div>
                    </div>

                    <Link
                        href={adminRoutes.logout.url()}
                        method="post"
                        as="button"
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/10 bg-red-500/5 py-2 text-xs font-medium text-red-400/70 transition-all hover:border-red-500/25 hover:bg-red-500/10 hover:text-red-400"
                    >
                        <LogOut className="h-3.5 w-3.5" />
                        Sign Out
                    </Link>
                </div>
            </div>

            {/* ── Main area ── */}
            <div
                className={`relative z-10 flex min-h-screen flex-col transition-all duration-300 ease-in-out ${sidebarOpen ? 'lg:pl-64' : 'lg:pl-0'}`}
            >
                {/* Header */}
                <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-4 border-b border-violet-500/10 bg-[#03050d]/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
                    <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />

                    <button
                        type="button"
                        className="-m-2 rounded-lg p-2 text-slate-500 transition-colors hover:text-slate-200"
                        onClick={toggleSidebar}
                    >
                        <span className="sr-only">Toggle sidebar</span>
                        <Menu className="h-5 w-5" />
                    </button>

                    {/* Breadcrumb / page indicator */}
                    <div className="hidden items-center gap-2 lg:flex">
                        <span className="font-mono text-[10px] tracking-[0.2em] text-violet-400/40 uppercase">
                            CMS
                        </span>
                        {title && (
                            <>
                                <span className="text-violet-500/30">›</span>
                                <span className="font-mono text-[10px] tracking-[0.15em] text-violet-400/60 uppercase">
                                    {title}
                                </span>
                            </>
                        )}
                    </div>

                    <div className="flex flex-1 items-center justify-end gap-4">
                        <Link
                            href={CHAT_PAGE_PATH}
                            className={`relative -m-2 rounded-lg p-2 transition-colors ${
                                notificationCount > 0 && !isOnChatPage
                                    ? 'text-violet-400 hover:text-violet-300'
                                    : 'text-slate-500 hover:text-violet-400'
                            }`}
                        >
                            <span className="sr-only">Notifications</span>
                            <Bell className="h-5 w-5" />
                            {notificationCount > 0 && !isOnChatPage && (
                                <span className="absolute -top-1 -right-1">
                                    <span className="absolute inline-flex h-5 w-5 animate-ping rounded-full bg-rose-400 opacity-40" />
                                    <motion.span
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{
                                            duration: 1.0,
                                            repeat: Infinity,
                                        }}
                                        className="relative flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-0.5 font-mono text-[9px] font-bold text-white"
                                        style={{
                                            boxShadow:
                                                '0 0 10px rgba(244,63,94,0.9), 0 0 20px rgba(244,63,94,0.4)',
                                        }}
                                    >
                                        {notificationCount > 99
                                            ? '99+'
                                            : notificationCount}
                                    </motion.span>
                                </span>
                            )}
                        </Link>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 py-6 md:py-8">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
