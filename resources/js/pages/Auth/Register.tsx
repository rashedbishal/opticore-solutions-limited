import type { FormEventHandler, ReactNode } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import GuestLayout from '@/components/Layout/GuestLayout';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        phone_number: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/register', {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Register" />

            <div className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                    Create an account
                </h1>
                <p className="mt-2 text-sm text-zinc-400">
                    Join Opticore Solutions today.
                </p>
            </div>

            <form onSubmit={submit} className="space-y-6">
                <div>
                    <label
                        htmlFor="name"
                        className="block text-sm font-medium text-zinc-300"
                    >
                        Full Name
                    </label>
                    <div className="mt-2">
                        <input
                            id="name"
                            name="name"
                            value={data.name}
                            className="block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-zinc-500 focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                            placeholder="John Doe"
                            autoComplete="name"
                            autoFocus
                            required
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        {errors.name && (
                            <p className="mt-2 text-sm text-red-400">
                                {errors.name}
                            </p>
                        )}
                    </div>
                </div>

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
                            autoComplete="email"
                            required
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
                        htmlFor="phone_number"
                        className="block text-sm font-medium text-zinc-300"
                    >
                        Phone Number
                    </label>
                    <div className="mt-2">
                        <input
                            id="phone_number"
                            name="phone_number"
                            value={data.phone_number}
                            className="block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-zinc-500 focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                            placeholder="+880123456789"
                            autoComplete="tel"
                            onChange={(e) =>
                                setData('phone_number', e.target.value)
                            }
                        />
                        {errors.phone_number && (
                            <p className="mt-2 text-sm text-red-400">
                                {errors.phone_number}
                            </p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                                required
                                onChange={(e) =>
                                    setData('password', e.target.value)
                                }
                            />
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
                                required
                                onChange={(e) =>
                                    setData(
                                        'password_confirmation',
                                        e.target.value,
                                    )
                                }
                            />
                        </div>
                    </div>
                </div>

                {(errors.password || errors.password_confirmation) && (
                    <p className="mt-2 text-sm text-red-400">
                        {errors.password || errors.password_confirmation}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={processing}
                    className="group relative flex w-full justify-center rounded-full bg-linear-to-r from-violet-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 disabled:opacity-50"
                >
                    <span className="flex items-center gap-2">
                        Create account
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                </button>
            </form>

            <div className="mt-8">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="bg-zinc-950 px-2 text-zinc-500">
                            Or register with
                        </span>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                    <a
                        href="/auth/google/redirect"
                        className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Google
                    </a>
                    <a
                        href="/auth/facebook/redirect"
                        className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
                    >
                        <svg
                            className="h-5 w-5"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3l-.5 3H13v6.8c4.56-.93 8-4.96 8-9.8z" />
                        </svg>
                        Facebook
                    </a>
                </div>
            </div>

            <p className="mt-8 text-center text-sm text-zinc-500">
                Already have an account?{' '}
                <Link
                    href="/login"
                    className="font-medium text-violet-400 hover:text-violet-300"
                >
                    Sign in
                </Link>
            </p>
        </GuestLayout>
    );
}

Register.layout = (page: ReactNode) => <>{page}</>;
