import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Mail,
    Lock,
    User,
    Phone,
    ArrowRight,
    Sparkles,
} from 'lucide-react';
import GuestLayout from '@/components/Layout/GuestLayout';

export default function Register() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone_number: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/register');
    };

    return (
        <GuestLayout maxWidth="xl">
            <Head title="Create Account | Opticore Solutions Ltd." />

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
            <form onSubmit={submit} className="space-y-6">
                <div className="space-y-4">
                    <div className="group relative">
                        <div className="absolute top-1/2 left-5 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-cyan-400">
                            <User className="h-5 w-5" />
                        </div>
                        <input
                            type="text"
                            name="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
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
                            value={data.email}
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
                        <div className="absolute top-1/2 left-5 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-cyan-400">
                            <Phone className="h-5 w-5" />
                        </div>
                        <input
                            type="tel"
                            name="phone_number"
                            value={data.phone_number}
                            onChange={(e) => setData('phone_number', e.target.value)}
                            placeholder="Phone Number"
                            className="w-full rounded-2xl border border-white/5 bg-black/40 py-5 pr-6 pl-14 text-white transition-all placeholder:text-zinc-600 focus:border-cyan-500/50 focus:outline-none"
                        />
                        {errors.phone_number && (
                            <p className="mt-2 ml-4 text-xs text-red-500">
                                {errors.phone_number}
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
                            onChange={(e) => setData('password', e.target.value)}
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

                    <div className="group relative">
                        <div className="absolute top-1/2 left-5 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-violet-400">
                            <Lock className="h-5 w-5" />
                        </div>
                        <input
                            type="password"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            placeholder="Confirm Password"
                            className="w-full rounded-2xl border border-white/5 bg-black/40 py-5 pr-6 pl-14 text-white transition-all placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none"
                            required
                        />
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
                        <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
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
                    Already have an account?{' '}
                    <Link
                        href="/login"
                        className="font-bold text-white transition-colors hover:text-cyan-400"
                    >
                        Sign in here
                    </Link>
                </p>
            </div>
        </GuestLayout>
    );
}
