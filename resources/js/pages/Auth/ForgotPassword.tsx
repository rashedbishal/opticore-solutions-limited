import type { ReactNode } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, KeyRound } from 'lucide-react';
import GuestLayout from '@/components/Layout/GuestLayout';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/forgot-password');
    };

    return (
        <>
            <Head title="Forgot Password | Opticore Solutions Ltd." />

            {/* Header */}
            <div className="mb-12 text-center">
                <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-cyan-500 to-violet-600 shadow-[0_0_40px_rgba(34,211,238,0.3)]"
                >
                    <KeyRound className="h-10 w-10 text-white" />
                </motion.div>
                <h1 className="mb-4 text-4xl font-black tracking-tighter text-foreground uppercase">
                    Recover Access
                </h1>
                <p className="font-medium text-theme-muted">
                    Enter your email and we'll send you a secure reset link.
                </p>
            </div>

            {status && (
                <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center text-sm font-bold text-emerald-400">
                    {status}
                </div>
            )}

            {/* Form */}
            <form onSubmit={submit} className="space-y-6">
                <div className="space-y-4">
                    <div className="group relative">
                        <div className="absolute top-1/2 left-5 -translate-y-1/2 text-theme-muted transition-colors group-focus-within:text-cyan-400">
                            <Mail className="h-5 w-5" />
                        </div>
                        <input
                            type="email"
                            name="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="Email Address"
                            className="w-full rounded-2xl border border-theme bg-theme-surface py-5 pr-6 pl-14 text-foreground transition-all placeholder:text-theme-subtle focus:border-cyan-500/50 focus:outline-none"
                            required
                            autoFocus
                        />
                        {errors.email && (
                            <p className="mt-2 ml-4 text-xs text-red-500">
                                {errors.email}
                            </p>
                        )}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-5 font-black tracking-widest text-background uppercase shadow-[0_20px_40px_rgba(0,0,0,0.15)] transition-all hover:bg-cyan-400 hover:text-white"
                >
                    {processing ? 'Sending Link...' : 'Send Reset Link'}{' '}
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>
            </form>

            <div className="mt-12 text-center">
                <p className="text-theme-muted">
                    Remembered your password?{' '}
                    <Link
                        href="/login"
                        className="font-bold text-foreground transition-colors hover:text-cyan-400"
                    >
                        Go back to login
                    </Link>
                </p>
            </div>
        </>
    );
}

ForgotPassword.layout = (page: ReactNode) => (
    <GuestLayout children={page} maxWidth="lg" />
);
