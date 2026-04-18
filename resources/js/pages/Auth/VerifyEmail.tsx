import { Head, Form, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    MailCheck,
    ArrowRight,
    LogOut,
} from 'lucide-react';
import AppLayout from '@/components/Layout/AppLayout';
import GradientOrb from '@/components/UI/GradientOrb';

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <AppLayout>
            <Head title="Verify Email | Opticore Solutions Ltd." />

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
                                <MailCheck className="h-10 w-10 text-white" />
                            </motion.div>
                            <h1 className="mb-4 text-4xl font-black tracking-tighter text-white uppercase">
                                Verify Email
                            </h1>
                            <p className="font-medium text-zinc-500">
                                Please check your inbox for a verification link to activate your account.
                            </p>
                        </div>

                        {status === 'verification-link-sent' && (
                            <div className="mb-6 rounded-2xl bg-emerald-500/10 p-4 text-center text-sm font-bold text-emerald-400 border border-emerald-500/20">
                                A new verification link has been sent to your email address.
                            </div>
                        )}

                        {/* Form */}
                        <Form
                            action="/email/verification-notification"
                            method="post"
                            className="space-y-6"
                        >
                            {({ processing }) => (
                                <>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-5 font-black tracking-widest text-black uppercase shadow-[0_20px_40px_rgba(0,0,0,0.3)] transition-all hover:bg-cyan-400"
                                    >
                                        {processing
                                            ? 'Sending Link...'
                                            : 'Resend Verification Email'}{' '}
                                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                    </button>
                                </>
                            )}
                        </Form>

                        <div className="mt-12 text-center">
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                className="flex items-center justify-center gap-2 mx-auto font-bold text-zinc-500 transition-colors hover:text-white uppercase tracking-widest text-xs"
                            >
                                <LogOut className="h-4 w-4" />
                                Sign Out
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        </AppLayout>
    );
}
