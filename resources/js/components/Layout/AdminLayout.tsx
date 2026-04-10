import { Head, Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    Image,
    FileText,
    MessageSquare,
    Users,
    LogOut,
    Menu,
    X,
    Mail
} from 'lucide-react';
import React, { useState } from 'react';
import type { SharedPageProps } from '@/types';

interface AdminLayoutProps {
    children: React.ReactNode;
    title?: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
    const { auth } = usePage<SharedPageProps>().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navigation = [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { name: 'Portfolios', href: '/admin/portfolios', icon: Image },
        { name: 'Blogs', href: '/admin/blogs', icon: FileText },
        { name: 'Chat Archive', href: '/admin/chats', icon: MessageSquare },
        { name: 'Contacts & Feedback', href: '/admin/contacts', icon: Mail },
        { name: 'Users', href: '/admin/users', icon: Users },
    ];

    return (
        <div className="min-h-screen bg-black text-zinc-100">
            {title && <Head title={`${title} - Admin Panel`} />}

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div
                className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-white/10 bg-zinc-950 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex h-16 items-center justify-between px-6 border-b border-white/10">
                    <span className="text-xl font-bold tracking-tight text-white">Opticore CMS</span>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-zinc-400 hover:text-white">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-4">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4 px-2">
                        Menu
                    </p>
                    <nav className="space-y-1">
                        {navigation.map((item) => {
                            const active = window.location.pathname.startsWith(item.href) && 
                                (item.href !== '/admin' || window.location.pathname === '/admin');
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                                        active
                                            ? 'bg-violet-500/15 text-violet-400'
                                            : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                                    }`}
                                >
                                    <item.icon className="mr-3 h-5 w-5 shrink-0" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="absolute bottom-0 w-full p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white font-semibold">
                            {auth.user?.name?.charAt(0) || 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                                {auth.user?.name}
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
                    >
                        <LogOut className="mr-3 h-5 w-5 shrink-0" />
                        Sign Out
                    </Link>
                </div>
            </div>

            {/* Main content */}
            <div className="lg:pl-64 flex flex-col min-h-screen">
                <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-white/10 bg-zinc-950/80 px-4 backdrop-blur-md sm:gap-x-6 sm:px-6 lg:px-8 shadow-sm">
                    <button
                        type="button"
                        className="-m-2.5 p-2.5 text-zinc-400 hover:text-white lg:hidden"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <span className="sr-only">Open sidebar</span>
                        <Menu className="h-6 w-6" aria-hidden="true" />
                    </button>
                    <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-end items-center">
                         {/* Header right side */}
                    </div>
                </header>

                <main className="flex-1 py-8">
                    <div className="px-4 sm:px-6 lg:px-8">
                        {title && <h1 className="text-2xl font-semibold mb-6">{title}</h1>}
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
