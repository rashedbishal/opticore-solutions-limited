import { Head, Form, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    MailCheck,
    ArrowRight,
    LogOut,
} from 'lucide-react';
import GuestLayout from '@/components/Layout/GuestLayout';

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <GuestLayout maxWidth="lg">
            <Head title="Verify Email | Opticore Solutions Ltd." />

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
        </GuestLayout>
    );
}
