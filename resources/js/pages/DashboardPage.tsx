import React from 'react';
import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LayoutDashboard, ShoppingBag, Star, Bell, Settings } from 'lucide-react'; // Mock icons for dashboard

const DashboardPage = () => {
    // Mock data for dashboard sections
    const dashboardSections = [
        { title: 'Current Orders', icon: ShoppingBag, count: 3, link: '/dashboard/orders' },
        { title: 'Reviews Pending', icon: Star, count: 1, link: '/dashboard/reviews' },
        { title: 'Notifications', icon: Bell, count: 5, link: '/dashboard/notifications' },
        { title: 'Account Settings', icon: Settings, link: '/dashboard/settings' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 to-black text-white p-8">
            <div className="max-w-6xl mx-auto">
                <header className="mb-12 text-center">
                    <h1 className="text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
                        Your Dashboard
                    </h1>
                    <p className="text-xl font-light text-white/80 max-w-2xl mx-auto">
                        Manage your projects, track orders, and review your services all in one place.
                    </p>
                </header>

                <Card className="w-full bg-gray-900/70 border-white/10 backdrop-blur-lg shadow-xl shadow-black/30 mb-8">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold text-white flex items-center gap-3">
                            <LayoutDashboard size={32} className="text-violet-500" />
                            Welcome, User!
                        </CardTitle>
                        <CardDescription className="text-gray-400">Here's a summary of your activity.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Add a summary section here if needed, e.g., quick stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-4 bg-gray-800/50 rounded-lg border border-white/5">
                                <h3 className="text-lg font-semibold text-violet-400 mb-2">Active Projects</h3>
                                <p className="text-3xl font-bold text-white">2</p>
                            </div>
                            <div className="p-4 bg-gray-800/50 rounded-lg border border-white/5">
                                <h3 className="text-lg font-semibold text-indigo-400 mb-2">Total Spent</h3>
                                <p className="text-3xl font-bold text-white">10,500 BDT</p>
                            </div>
                            <div className="p-4 bg-gray-800/50 rounded-lg border border-white/5">
                                <h3 className="text-lg font-semibold text-cyan-400 mb-2">Upcoming Deadlines</h3>
                                <p className="text-3xl font-bold text-white">1</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dashboardSections.map((section) => (
                        <Link key={section.title} href={section.link} className="block">
                            <Card className="h-full bg-gray-800/50 border border-white/5 hover:shadow-xl hover:shadow-violet-500/20 transition-all duration-300">
                                <CardHeader>
                                    <div className="flex items-center justify-between mb-2">
                                        <section.icon size={32} className="text-violet-500" />
                                        {section.count && (
                                            <span className="bg-violet-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                                                {section.count}
                                            </span>
                                        )}
                                    </div>
                                    <CardTitle className="text-xl font-bold text-white">{section.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-300">View and manage your {section.title.toLowerCase()}.</p>
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
