import type { FormEventHandler, ReactNode } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import GuestLayout from '@/components/Layout/GuestLayout';

export default function ResetPassword({
    token,
    email,
}: {
    token: string;
    email: string;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/reset-password', {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Reset Password" />

            <div className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                    Reset Password
                </h1>
                <p className="mt-2 text-sm text-zinc-400">
                    Enter your new password below.
                </p>
            </div>

            <form onSubmit={submit} className="space-y-6">
                <div>
                    <label
                        htmlFor="email"
                        className="block text-sm font-medium text-zinc-300"
                    >
                        Email address
                    </label>
                    <div className="mt-2">
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-zinc-500 focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                            autoComplete="email"
                            onChange={(e) => setData('email', e.target.value)}
                        />
                        {errors.email && (
                            <p className="mt-2 text-sm text-red-400">
                                {errors.email}
                            </p>
                        )}
                    </div>
                </div>

                <div>
                    <label
                        htmlFor="password"
                        className="block text-sm font-medium text-zinc-300"
                    >
                        Password
                    </label>
                    <div className="mt-2">
                        <input
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-zinc-500 focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                            autoComplete="new-password"
                            autoFocus
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                        />
                        {errors.password && (
                            <p className="mt-2 text-sm text-red-400">
                                {errors.password}
                            </p>
                        )}
                    </div>
                </div>

                <div>
                    <label
                        htmlFor="password_confirmation"
                        className="block text-sm font-medium text-zinc-300"
                    >
                        Confirm Password
                    </label>
                    <div className="mt-2">
                        <input
                            id="password_confirmation"
                            type="password"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            className="block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-zinc-500 focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                            autoComplete="new-password"
                            onChange={(e) =>
                                setData('password_confirmation', e.target.value)
                            }
                        />
                        {errors.password_confirmation && (
                            <p className="mt-2 text-sm text-red-400">
                                {errors.password_confirmation}
                            </p>
                        )}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="group relative flex w-full justify-center rounded-full bg-linear-to-r from-violet-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 disabled:opacity-50"
                >
                    <span className="flex items-center gap-2">
                        Reset Password
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                </button>
            </form>
        </GuestLayout>
    );
}

ResetPassword.layout = (page: ReactNode) => <>{page}</>;
