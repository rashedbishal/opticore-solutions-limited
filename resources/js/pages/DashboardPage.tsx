import { Link } from '@inertiajs/react';
import {
    LayoutDashboard,
    ShoppingBag,
    Star,
    Bell,
    Settings,
} from 'lucide-react'; // Mock icons for dashboard
import React from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/UI/card';

const DashboardPage = () => {
    // Mock data for dashboard sections
    const dashboardSections = [
        {
            title: 'Current Orders',
            icon: ShoppingBag,
            count: 3,
            link: '/dashboard/orders',
        },
        {
            title: 'Reviews Pending',
            icon: Star,
            count: 1,
            link: '/dashboard/reviews',
        },
        {
            title: 'Notifications',
            icon: Bell,
            count: 5,
            link: '/dashboard/notifications',
        },
        {
            title: 'Account Settings',
            icon: Settings,
            link: '/dashboard/settings',
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 to-black p-8 text-white">
            <div className="mx-auto max-w-6xl">
                <header className="mb-12 text-center">
                    <h1 className="mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-5xl font-bold text-transparent">
                        Your Dashboard
                    </h1>
                    <p className="mx-auto max-w-2xl text-xl font-light text-white/80">
                        Manage your projects, track orders, and review your
                        services all in one place.
                    </p>
                </header>

                <Card className="mb-8 w-full border-white/10 bg-gray-900/70 shadow-xl shadow-black/30 backdrop-blur-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-3xl font-bold text-white">
                            <LayoutDashboard
                                size={32}
                                className="text-violet-500"
                            />
                            Welcome, User!
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                            Here's a summary of your activity.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Add a summary section here if needed, e.g., quick stats */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            <div className="rounded-lg border border-white/5 bg-gray-800/50 p-4">
                                <h3 className="mb-2 text-lg font-semibold text-violet-400">
                                    Active Projects
                                </h3>
                                <p className="text-3xl font-bold text-white">
                                    2
                                </p>
                            </div>
                            <div className="rounded-lg border border-white/5 bg-gray-800/50 p-4">
                                <h3 className="mb-2 text-lg font-semibold text-indigo-400">
                                    Total Spent
                                </h3>
                                <p className="text-3xl font-bold text-white">
                                    10,500 BDT
                                </p>
                            </div>
                            <div className="rounded-lg border border-white/5 bg-gray-800/50 p-4">
                                <h3 className="mb-2 text-lg font-semibold text-cyan-400">
                                    Upcoming Deadlines
                                </h3>
                                <p className="text-3xl font-bold text-white">
                                    1
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {dashboardSections.map((section) => (
                        <Link
                            key={section.title}
                            href={section.link}
                            className="block"
                        >
                            <Card className="h-full border border-white/5 bg-gray-800/50 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/20">
                                <CardHeader>
                                    <div className="mb-2 flex items-center justify-between">
                                        <section.icon
                                            size={32}
                                            className="text-violet-500"
                                        />
                                        {section.count && (
                                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
                                                {section.count}
                                            </span>
                                        )}
                                    </div>
                                    <CardTitle className="text-xl font-bold text-white">
                                        {section.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-300">
                                        View and manage your{' '}
                                        {section.title.toLowerCase()}.
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
