import { Head, Form, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Mail,
    ArrowRight,
    Sparkles,
    KeyRound,
} from 'lucide-react';
import AppLayout from '@/components/Layout/AppLayout';
import GradientOrb from '@/components/UI/GradientOrb';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <AppLayout>
            <Head title="Forgot Password | Opticore Solutions Ltd." />

            <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-4 py-24">
                {/* Background Decor */}
                <GradientOrb className="top-[-10%] left-[-10%] h-[600px] w-[600px] bg-cyan-500/10 blur-[120px]" />
                <GradientOrb className="right-[-10%] bottom-[-10%] h-[600px] w-[600px] bg-violet-600/10 blur-[120px]" />

                <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]">
                    <div
                        className="h-full w-full"
                        style={{
                            backgroundImage:
                                'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                            backgroundSize: '40px 40px',
                        }}
                    />
                </div>

                <div className="relative z-10 w-full max-w-lg">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-panel rounded-[3rem] border border-white/10 bg-zinc-900/40 p-8 backdrop-blur-3xl md:p-12"
                    >
                        {/* Header */}
                        <div className="mb-12 text-center">
                            <motion.div
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-cyan-500 to-violet-600 shadow-[0_0_40px_rgba(34,211,238,0.3)]"
                            >
                                <KeyRound className="h-10 w-10 text-white" />
                            </motion.div>
                            <h1 className="mb-4 text-4xl font-black tracking-tighter text-white uppercase">
                                Recover Access
                            </h1>
                            <p className="font-medium text-zinc-500">
                                Enter your email and we'll send you a secure reset link.
                            </p>
                        </div>

                        {status && (
                            <div className="mb-6 rounded-2xl bg-emerald-500/10 p-4 text-center text-sm font-bold text-emerald-400 border border-emerald-500/20">
                                {status}
                            </div>
                        )}

                        {/* Form */}
                        <Form
                            action="/forgot-password"
                            method="post"
                            className="space-y-6"
                        >
                            {({ data, setData, errors, processing }) => (
                                <>
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
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-5 font-black tracking-widest text-black uppercase shadow-[0_20px_40px_rgba(0,0,0,0.3)] transition-all hover:bg-cyan-400"
                                    >
                                        {processing
                                            ? 'Sending Link...'
                                            : 'Send Reset Link'}{' '}
                                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                    </button>
                                </>
                            )}
                        </Form>

                        <div className="mt-12 text-center">
                            <p className="text-zinc-500">
                                Remembered your password?{' '}
                                <Link
                                    href="/login"
                                    className="font-bold text-white transition-colors hover:text-cyan-400"
                                >
                                    Go back to login
                                </Link>
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </AppLayout>
    );
}
