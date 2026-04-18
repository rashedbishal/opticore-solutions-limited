import type { SharedPageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    LayoutDashboard,
    Image,
    FileText,
    MessageSquare,
    Users,
    LogOut,
    Menu,
    X,
    Mail,
    Bell,
    Briefcase,
    Layers,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

interface AdminLayoutProps {
    children: React.ReactNode;
    title?: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
    const { auth, flash } = usePage<SharedPageProps>().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        if (flash?.success) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setShowToast(true);
            const timer = setTimeout(() => setShowToast(false), 4000);

            return () => clearTimeout(timer);
        }
    }, [flash]);

    const navigation = [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { name: 'Customer Support', href: '/admin/customer-conversations', icon: MessageSquare },
        { name: 'Portfolios', href: '/admin/portfolios', icon: Image },
        {
            name: 'Sub-Categories',
            href: '/admin/portfolio-sub-categories',
            icon: Layers,
        },
        { name: 'Blogs', href: '/admin/blogs', icon: FileText },
        { name: 'Chat Archive', href: '/admin/chats', icon: MessageSquare },
        { name: 'Contacts & Feedback', href: '/admin/contacts', icon: Mail },
        { name: 'Brands', href: '/admin/brands', icon: Briefcase },
        { name: 'Users', href: '/admin/users', icon: Users },
    ];

    return (
        <div className="min-h-screen bg-[#050B14] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(29,78,216,0.15),rgba(255,255,255,0))] font-sans text-slate-200 selection:bg-cyan-500/30">
            {title && <Head title={`${title} - Admin Panel`} />}

            {/* General App Toast / Flash Notification */}
            <AnimatePresence>
                {showToast && flash?.success && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{
                            opacity: 0,
                            scale: 0.95,
                            transition: { duration: 0.15 },
                        }}
                        className="fixed top-6 right-6 z-[100] flex min-w-[300px] items-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 shadow-2xl backdrop-blur-xl"
                    >
                        <div className="mr-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                            <svg
                                className="h-5 w-5 text-emerald-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-semibold text-emerald-400">
                                Success
                            </h4>
                            <p className="mt-0.5 text-sm text-zinc-200">
                                {flash.success}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowToast(false)}
                            className="ml-4 p-1 text-emerald-400/60 transition-colors hover:text-emerald-400"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </motion.div>
                )}
                {flash?.error && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{
                            opacity: 0,
                            scale: 0.95,
                            transition: { duration: 0.15 },
                        }}
                        className="fixed top-6 right-6 z-[100] flex min-w-[300px] items-center rounded-2xl border border-red-500/30 bg-red-500/10 p-4 shadow-2xl backdrop-blur-xl"
                    >
                        <div className="mr-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/20">
                            <X className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-semibold text-red-400">
                                Error
                            </h4>
                            <p className="mt-0.5 text-sm text-zinc-200">
                                {flash.error}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-[#050B14]/80 backdrop-blur-sm transition-opacity lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div
                className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-white/5 bg-[#0A1222]/80 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex h-20 items-center justify-between border-b border-white/5 px-6">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                            <span className="text-lg leading-none font-bold text-white">
                                O
                            </span>
                        </div>
                        <span className="text-xl font-semibold tracking-tight text-white">
                            Opticore CMS
                        </span>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="text-slate-400 transition-colors hover:text-white lg:hidden"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="h-[calc(100vh-80px-90px)] overflow-y-auto p-4">
                    <p className="mb-4 px-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                        Menu
                    </p>
                    <nav className="space-y-1">
                        {navigation.map((item) => {
                            const active =
                                window.location.pathname.startsWith(
                                    item.href,
                                ) &&
                                (item.href !== '/admin' ||
                                    window.location.pathname === '/admin');

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`group flex items-center rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 ${
                                        active
                                            ? 'border border-blue-500/20 bg-blue-500/10 text-cyan-400 shadow-[inset_0_0_20px_rgba(59,130,246,0.05)]'
                                            : 'border border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-100'
                                    }`}
                                >
                                    <item.icon
                                        className={`mr-3 h-5 w-5 shrink-0 transition-colors ${active ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`}
                                    />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Profile Section in Sidebar Bottom */}
                <div className="absolute bottom-0 w-full border-t border-white/5 bg-[#0A1222]/90 p-4 backdrop-blur-xl">
                    <div className="mb-3 flex items-center gap-3 px-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-indigo-500 to-blue-500 font-semibold text-white shadow-lg shadow-blue-500/20">
                            {auth.user?.name?.charAt(0) || 'A'}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-white">
                                {auth.user?.name || 'Admin User'}
                            </p>
                            <p className="truncate text-xs text-slate-400">
                                Administrator
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="flex w-full items-center justify-center rounded-xl px-3 py-2 text-sm font-medium text-slate-400 transition-colors duration-200 hover:bg-white/5 hover:text-red-400"
                    >
                        <LogOut className="mr-2 h-4 w-4 shrink-0" />
                        Sign Out
                    </Link>
                </div>
            </div>

            {/* Main content */}
            <div className="flex min-h-screen flex-col lg:pl-64">
                <header className="sticky top-0 z-30 flex h-20 shrink-0 items-center gap-x-4 border-b border-white/5 bg-[#050B14]/60 px-4 backdrop-blur-xl sm:gap-x-6 sm:px-6 lg:px-8">
                    <button
                        type="button"
                        className="-m-2.5 p-2.5 text-slate-400 transition-colors hover:text-white lg:hidden"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <span className="sr-only">Open sidebar</span>
                        <Menu className="h-6 w-6" aria-hidden="true" />
                    </button>

                    <div className="flex flex-1 items-center justify-end gap-x-4 self-stretch lg:gap-x-6">
                        {/* Top Right Actions */}
                        <div className="flex items-center gap-x-4 lg:gap-x-6">
                            <button
                                type="button"
                                className="relative -m-2.5 p-2.5 text-slate-400 transition-colors hover:text-cyan-400"
                            >
                                <span className="sr-only">
                                    View notifications
                                </span>
                                <Bell className="h-5 w-5" aria-hidden="true" />
                                <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
                            </button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 py-8">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-8 flex items-center justify-between">
                            {title && (
                                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                                    {title}
                                </h1>
                            )}
                        </div>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
