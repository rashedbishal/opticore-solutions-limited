import { Head } from '@inertiajs/react';
import AppLayout from '@/components/Layout/AppLayout';

export default function Settings() {
    return (
        <AppLayout>
            <Head title="Settings" />

            <div className="py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-zinc-950/50 p-8 backdrop-blur-xl md:p-12">
                        <h1 className="text-3xl font-bold text-white md:text-4xl">
                            User Settings
                        </h1>
                        <p className="mt-4 text-zinc-400">
                            Manage your account preferences and settings here.
                        </p>

                        <div className="mt-12 space-y-8">
                            <div className="rounded-2xl border border-white/5 bg-white/5 p-6">
                                <h2 className="text-xl font-semibold text-white">
                                    Profile Information
                                </h2>
                                <p className="mt-2 text-sm text-zinc-500">
                                    Update your account's profile information
                                    and email address.
                                </p>
                                {/* Form would go here */}
                                <div className="mt-6 text-zinc-400 italic">
                                    Settings implementation coming soon...
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
