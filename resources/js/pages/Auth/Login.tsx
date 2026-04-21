import type { ReactNode } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import GuestLayout from '@/components/Layout/GuestLayout';

export default function Login({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <>
            <Head title="Sign In | Opticore Solutions Ltd." />

            {/* Header */}
            <div className="mb-12 text-center">
                <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-cyan-500 to-violet-600 shadow-[0_0_40px_rgba(34,211,238,0.3)]"
                >
                    <ShieldCheck className="h-10 w-10 text-white" />
                </motion.div>
                <h1 className="mb-4 text-4xl font-black tracking-tighter text-white uppercase">
                    Welcome Back
                </h1>
                <p className="font-medium text-zinc-500">
                    Enter your credentials to access your dashboard.
                </p>
            </div>

            {status && (
                <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center text-sm font-bold text-emerald-400">
                    {status}
                </div>
            )}

            {errors.social && (
                <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-center text-sm font-bold text-red-400">
                    {errors.social}
                </div>
            )}

            {/* Form */}
            <form onSubmit={submit} className="space-y-6">
                <div className="space-y-4">
                    <div className="group relative">
                        <div className="absolute top-1/2 left-5 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-cyan-400">
                            <Mail className="h-5 w-5" />
                        </div>
                        <input
                            type="email"
                            name="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="Email Address"
                            className="w-full rounded-2xl border border-white/5 bg-black/40 py-5 pr-6 pl-14 text-white transition-all placeholder:text-zinc-600 focus:border-cyan-500/50 focus:outline-none"
                            required
                            autoFocus
                        />
                        {errors.email && (
                            <p className="mt-2 ml-4 text-xs text-red-500">
                                {errors.email}
                            </p>
                        )}
                    </div>

                    <div className="group relative">
                        <div className="absolute top-1/2 left-5 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-violet-400">
                            <Lock className="h-5 w-5" />
                        </div>
                        <input
                            type="password"
                            name="password"
                            value={data.password}
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                            placeholder="Password"
                            className="w-full rounded-2xl border border-white/5 bg-black/40 py-5 pr-6 pl-14 text-white transition-all placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none"
                            required
                        />
                        {errors.password && (
                            <p className="mt-2 ml-4 text-xs text-red-500">
                                {errors.password}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between px-2">
                    <label className="flex cursor-pointer items-center gap-2">
                        <input
                            type="checkbox"
                            name="remember"
                            checked={data.remember}
                            onChange={(e) =>
                                setData('remember', e.target.checked)
                            }
                            className="h-4 w-4 rounded border-white/10 bg-black/40 text-cyan-500 focus:ring-offset-black"
                        />
                        <span className="text-xs font-bold tracking-widest text-zinc-500 uppercase">
                            Remember Me
                        </span>
                    </label>
                    <Link
                        href="/forgot-password"
                        className="text-xs font-bold tracking-widest text-zinc-500 uppercase transition-colors hover:text-white"
                    >
                        Forgot Password?
                    </Link>
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-5 font-black tracking-widest text-black uppercase shadow-[0_20px_40px_rgba(0,0,0,0.3)] transition-all hover:bg-cyan-400"
                >
                    {processing ? 'Signing In...' : 'Sign In'}{' '}
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>

                <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/5"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-zinc-900/40 px-4 font-bold tracking-widest text-zinc-600">
                            Or continue with
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <a
                        href="/auth/google/redirect"
                        className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 py-4 transition-colors hover:bg-white/10"
                    >
                        <img
                            src="https://www.svgrepo.com/show/475656/google-color.svg"
                            className="h-5 w-5"
                            alt="Google"
                        />
                        <span className="text-sm font-bold text-white">
                            Google
                        </span>
                    </a>
                    <a
                        href="/auth/facebook/redirect"
                        className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 py-4 transition-colors hover:bg-white/10"
                    >
                        <svg
                            className="h-5 w-5 text-blue-500"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3l-.5 3H13v6.8c4.56-.93 8-4.96 8-9.8z" />
                        </svg>
                        <span className="text-sm font-bold text-white">
                            Facebook
                        </span>
                    </a>
                </div>
            </form>

            <div className="mt-12 text-center">
                <p className="text-zinc-500">
                    New to Opticore?{' '}
                    <Link
                        href="/register"
                        className="font-bold text-white transition-colors hover:text-cyan-400"
                    >
                        Create an account
                    </Link>
                </p>
            </div>
        </>
    );
}

Login.layout = (page: ReactNode) => (
    <GuestLayout children={page} maxWidth="lg" />
);
