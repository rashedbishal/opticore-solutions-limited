<<<<<<< HEAD
import type { FormEventHandler } from 'react';
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
                            onChange={(e) => setData('phone_number', e.target.value)}
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
                                onChange={(e) => setData('password', e.target.value)}
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
                                onChange={(e) => setData('password_confirmation', e.target.value)}
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
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
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

Register.layout = (page: import('react').ReactNode) => <>{page}</>;
=======
import { Head, Link, Form } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Mail,
    Lock,
    User,
    ArrowRight,
    Sparkles,
    ShieldCheck,
    Zap,
    Code2,
} from 'lucide-react';
import AppLayout from '@/components/Layout/AppLayout';
import GradientOrb from '@/components/UI/GradientOrb';

export default function Register() {
    return (
        <AppLayout>
            <Head title="Create Account | Opticore Solutions Ltd." />

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

                <div className="relative z-10 w-full max-w-xl">
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
                                <Sparkles className="h-10 w-10 text-white" />
                            </motion.div>
                            <h1 className="mb-4 text-4xl font-black tracking-tighter text-white uppercase">
                                Start Your Journey
                            </h1>
                            <p className="font-medium text-zinc-500">
                                Join 50+ brands and creators at Opticore.
                            </p>
                        </div>

                        {/* Form */}
                        <Form
                            action="/register"
                            method="post"
                            className="space-y-6"
                        >
                            {({ errors, processing }) => (
                                <>
                                    <div className="space-y-4">
                                        <div className="group relative">
                                            <div className="absolute top-1/2 left-5 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-cyan-400">
                                                <User className="h-5 w-5" />
                                            </div>
                                            <input
                                                type="text"
                                                name="name"
                                                placeholder="Full Name"
                                                className="w-full rounded-2xl border border-white/5 bg-black/40 py-5 pr-6 pl-14 text-white transition-all placeholder:text-zinc-600 focus:border-cyan-500/50 focus:outline-none"
                                                required
                                            />
                                            {errors.name && (
                                                <p className="mt-2 ml-4 text-xs text-red-500">
                                                    {errors.name}
                                                </p>
                                            )}
                                        </div>

                                        <div className="group relative">
                                            <div className="absolute top-1/2 left-5 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-cyan-400">
                                                <Mail className="h-5 w-5" />
                                            </div>
                                            <input
                                                type="email"
                                                name="email"
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
                                                placeholder="Create Password"
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

                                    <div className="flex items-center px-2">
                                        <label className="group flex cursor-pointer items-start gap-3">
                                            <input
                                                type="checkbox"
                                                className="mt-1 h-4 w-4 rounded border-white/10 bg-black/40 text-cyan-500 focus:ring-offset-black"
                                                required
                                            />
                                            <span className="text-xs leading-relaxed text-zinc-500">
                                                I agree to the{' '}
                                                <Link
                                                    href="/terms-conditions"
                                                    className="text-white hover:text-cyan-400"
                                                >
                                                    Terms of Service
                                                </Link>{' '}
                                                and{' '}
                                                <Link
                                                    href="/privacy-policy"
                                                    className="text-white hover:text-cyan-400"
                                                >
                                                    Privacy Policy
                                                </Link>
                                                .
                                            </span>
                                        </label>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-5 font-black tracking-widest text-black uppercase shadow-[0_20px_40px_rgba(0,0,0,0.3)] transition-all hover:bg-cyan-400"
                                    >
                                        {processing
                                            ? 'Creating Account...'
                                            : 'Create Account'}{' '}
                                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                    </button>

                                    <div className="relative py-4">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-white/5"></div>
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-zinc-900/40 px-4 font-bold tracking-widest text-zinc-600">
                                                Or sign up with
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 py-4 transition-colors hover:bg-white/10"
                                        >
                                            <Code2 className="h-5 w-5 text-white" />
                                            <span className="text-sm font-bold text-white">
                                                Github
                                            </span>
                                        </button>
                                        <button
                                            type="button"
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
                                        </button>
                                    </div>
                                </>
                            )}
                        </Form>

                        <div className="mt-12 text-center">
                            <p className="text-zinc-500">
                                Already have an account?{' '}
                                <Link
                                    href="/login"
                                    className="font-bold text-white transition-colors hover:text-cyan-400"
                                >
                                    Sign in here
                                </Link>
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </AppLayout>
    );
}
>>>>>>> @{-1}
