import type { FormEventHandler, ReactNode } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import GuestLayout from '@/components/Layout/GuestLayout';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/forgot-password');
    };

    return (
        <GuestLayout>
            <Head title="Forgot Password" />

            <div className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                    Forgot your password?
                </h1>
                <p className="mt-2 text-sm text-zinc-400">
                    No problem. Just let us know your email address and we will
                    email you a password reset link.
                </p>
            </div>

            {status && (
                <div className="mb-4 text-sm font-medium text-green-400">
                    {status}
                </div>
            )}

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
                            placeholder="you@example.com"
                            autoFocus
                            onChange={(e) => setData('email', e.target.value)}
                        />
                        {errors.email && (
                            <p className="mt-2 text-sm text-red-400">
                                {errors.email}
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
                        Email Password Reset Link
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                </button>
            </form>
        </GuestLayout>
    );
}

ForgotPassword.layout = (page: ReactNode) => <>{page}</>;
