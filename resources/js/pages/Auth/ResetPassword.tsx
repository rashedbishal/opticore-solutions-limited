import { Head, Form } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Mail,
    Lock,
    ArrowRight,
    KeyRound,
} from 'lucide-react';
import GuestLayout from '@/components/Layout/GuestLayout';

export default function ResetPassword({
    token,
    email,
}: {
    token: string;
    email: string;
}) {
    return (
        <GuestLayout maxWidth="lg">
            <Head title="Reset Password | Opticore Solutions Ltd." />

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
                    New Credentials
                </h1>
                <p className="font-medium text-zinc-500">
                    Secure your account with a strong new password.
                </p>
            </div>

            {/* Form */}
            <Form
                action="/reset-password"
                method="post"
                initialValues={{
                    token: token,
                    email: email,
                    password: '',
                    password_confirmation: '',
                }}
                className="space-y-6"
            >
                {({ data, setData, errors, processing }) => (
                    <>
                        <input type="hidden" name="token" value={data?.token || token} />
                        
                        <div className="space-y-4">
                            <div className="group relative">
                                <div className="absolute top-1/2 left-5 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-cyan-400">
                                    <Mail className="h-5 w-5" />
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    value={data?.email || email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="Email Address"
                                    className="w-full rounded-2xl border border-white/5 bg-black/40 py-5 pr-6 pl-14 text-white transition-all placeholder:text-zinc-600 focus:border-cyan-500/50 focus:outline-none"
                                    required
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
                                    value={data?.password || ''}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="New Password"
                                    className="w-full rounded-2xl border border-white/5 bg-black/40 py-5 pr-6 pl-14 text-white transition-all placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none"
                                    required
                                    autoFocus
                                />
                                {errors.password && (
                                    <p className="mt-2 ml-4 text-xs text-red-500">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            <div className="group relative">
                                <div className="absolute top-1/2 left-5 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-violet-400">
                                    <Lock className="h-5 w-5" />
                                </div>
                                <input
                                    type="password"
                                    name="password_confirmation"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    placeholder="Confirm New Password"
                                    className="w-full rounded-2xl border border-white/5 bg-black/40 py-5 pr-6 pl-14 text-white transition-all placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-5 font-black tracking-widest text-black uppercase shadow-[0_20px_40px_rgba(0,0,0,0.3)] transition-all hover:bg-cyan-400"
                        >
                            {processing
                                ? 'Updating Password...'
                                : 'Reset Password'}{' '}
                            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </button>
                    </>
                )}
            </Form>
        </GuestLayout>
    );
}
