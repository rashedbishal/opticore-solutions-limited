import type { ReactNode } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Mail, Lock, User, Phone, ArrowRight, Loader2 } from 'lucide-react';
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
        <>
            <Head title="Create Account | Opticore Solutions Ltd." />

            <div className="mb-[min(2vh,1rem)] text-center [@media(max-height:400px)]:mb-1.5">
                <h1 className="mb-[min(1vh,0.375rem)] text-[clamp(1.1rem,3.5vh,2rem)] font-black tracking-tighter text-foreground uppercase">
                    Start Your Journey
                </h1>
                <p className="text-[10px] font-medium text-theme-muted sm:text-sm [@media(max-height:400px)]:hidden">
                    Join 50+ brands and creators at Opticore.
                </p>
            </div>

            {(errors as Record<string, string | undefined>).social && (
                <div className="mb-[min(2vh,0.75rem)] rounded-xl border border-red-500/20 bg-red-500/10 p-2 text-center text-[10px] font-bold text-red-400 sm:p-4 sm:text-sm">
                    {(errors as Record<string, string | undefined>).social}
                </div>
            )}

            <form
                onSubmit={submit}
                className="space-y-2.5 sm:space-y-3 [@media(max-height:500px)]:space-y-1.5"
            >
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 [@media(max-height:500px)]:grid-cols-2 [@media(max-height:500px)]:gap-1.5">
                    <div className="group relative">
                        <div className="absolute top-1/2 left-4 -translate-y-1/2 text-theme-muted transition-colors group-focus-within:text-cyan-400">
                            <User className="h-4 w-4" />
                        </div>
                        <input
                            type="text"
                            name="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Full Name"
                            className="w-full rounded-xl border border-theme bg-theme-surface py-2.5 pr-4 pl-11 text-xs text-foreground transition-all placeholder:text-theme-subtle focus:border-cyan-500/50 focus:outline-none sm:py-3 sm:text-sm [@media(max-height:500px)]:py-1.5"
                            required
                        />
                        {errors.name && (
                            <p className="mt-1 ml-3 text-[10px] text-red-500">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    <div className="group relative">
                        <div className="absolute top-1/2 left-4 -translate-y-1/2 text-theme-muted transition-colors group-focus-within:text-cyan-400">
                            <Mail className="h-4 w-4" />
                        </div>
                        <input
                            type="email"
                            name="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="Email Address"
                            className="w-full rounded-xl border border-theme bg-theme-surface py-2.5 pr-4 pl-11 text-xs text-foreground transition-all placeholder:text-theme-subtle focus:border-cyan-500/50 focus:outline-none sm:py-3 sm:text-sm [@media(max-height:500px)]:py-1.5"
                            required
                        />
                        {errors.email && (
                            <p className="mt-1 ml-3 text-[10px] text-red-500">
                                {errors.email}
                            </p>
                        )}
                    </div>

                    <div className="group relative sm:col-span-2 [@media(max-height:500px)]:col-span-2">
                        <div className="absolute top-1/2 left-4 -translate-y-1/2 text-theme-muted transition-colors group-focus-within:text-cyan-400">
                            <Phone className="h-4 w-4" />
                        </div>
                        <input
                            type="tel"
                            name="phone_number"
                            value={data.phone_number}
                            onChange={(e) =>
                                setData('phone_number', e.target.value)
                            }
                            placeholder="Phone Number"
                            className="w-full rounded-xl border border-theme bg-theme-surface py-2.5 pr-4 pl-11 text-xs text-foreground transition-all placeholder:text-theme-subtle focus:border-cyan-500/50 focus:outline-none sm:py-3 sm:text-sm [@media(max-height:500px)]:py-1.5"
                        />
                        {errors.phone_number && (
                            <p className="mt-1 ml-3 text-[10px] text-red-500">
                                {errors.phone_number}
                            </p>
                        )}
                    </div>

                    <div className="group relative">
                        <div className="absolute top-1/2 left-4 -translate-y-1/2 text-theme-muted transition-colors group-focus-within:text-violet-400">
                            <Lock className="h-4 w-4" />
                        </div>
                        <input
                            type="password"
                            name="password"
                            value={data.password}
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                            placeholder="Create Password"
                            className="w-full rounded-xl border border-theme bg-theme-surface py-2.5 pr-4 pl-11 text-xs text-foreground transition-all placeholder:text-theme-subtle focus:border-violet-500/50 focus:outline-none sm:py-3 sm:text-sm [@media(max-height:500px)]:py-1.5"
                            required
                        />
                        {errors.password && (
                            <p className="mt-1 ml-3 text-[10px] text-red-500">
                                {errors.password}
                            </p>
                        )}
                    </div>

                    <div className="group relative">
                        <div className="absolute top-1/2 left-4 -translate-y-1/2 text-theme-muted transition-colors group-focus-within:text-violet-400">
                            <Lock className="h-4 w-4" />
                        </div>
                        <input
                            type="password"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            onChange={(e) =>
                                setData('password_confirmation', e.target.value)
                            }
                            placeholder="Confirm Password"
                            className="w-full rounded-xl border border-theme bg-theme-surface py-2.5 pr-4 pl-11 text-xs text-foreground transition-all placeholder:text-theme-subtle focus:border-violet-500/50 focus:outline-none sm:py-3 sm:text-sm [@media(max-height:500px)]:py-1.5"
                            required
                        />
                    </div>
                </div>

                <div className="flex items-center px-1">
                    <label className="group flex cursor-pointer items-start gap-2 sm:gap-3">
                        <input
                            type="checkbox"
                            className="mt-0.5 h-3.5 w-3.5 rounded border-theme bg-theme-surface text-cyan-500 focus:ring-offset-background sm:h-4 sm:w-4"
                            required
                        />
                        <span className="text-[10px] leading-tight text-theme-muted sm:text-xs sm:leading-relaxed">
                            I agree to the{' '}
                            <Link
                                href="/terms-conditions"
                                className="text-foreground hover:text-cyan-400"
                            >
                                Terms
                            </Link>{' '}
                            and{' '}
                            <Link
                                href="/privacy-policy"
                                className="text-foreground hover:text-cyan-400"
                            >
                                Privacy
                            </Link>
                            .
                        </span>
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3 text-xs font-black tracking-widest text-background uppercase shadow-lg transition-all hover:bg-cyan-400 hover:text-white sm:py-3.5 sm:text-sm [@media(max-height:500px)]:py-2"
                >
                    {processing ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Creating...
                        </>
                    ) : (
                        <>
                            Create Account
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </>
                    )}
                </button>

                <div className="flex items-center gap-3 py-0.5 sm:gap-4 sm:py-1 [@media(max-height:400px)]:hidden">
                    <div className="flex-1 border-t border-theme"></div>
                    <span className="text-[10px] font-bold tracking-widest text-theme-subtle uppercase">
                        Or sign up with
                    </span>
                    <div className="flex-1 border-t border-theme"></div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:gap-3 [@media(max-height:400px)]:hidden">
                    <a
                        href="/auth/google/redirect"
                        className="flex items-center justify-center gap-2 rounded-xl border border-theme bg-theme-surface py-2.5 transition-colors hover:bg-theme-surface-hover sm:gap-3 sm:py-3 [@media(max-height:500px)]:py-2"
                    >
                        <img
                            src="https://www.svgrepo.com/show/475656/google-color.svg"
                            className="h-4 w-4 sm:h-5 sm:w-5"
                            alt="Google"
                        />
                        <span className="text-xs font-bold text-foreground sm:text-sm [@media(max-height:500px)]:hidden">
                            Google
                        </span>
                    </a>
                    <a
                        href="/auth/facebook/redirect"
                        className="flex items-center justify-center gap-2 rounded-xl border border-theme bg-theme-surface py-2.5 transition-colors hover:bg-theme-surface-hover sm:gap-3 sm:py-3 [@media(max-height:500px)]:py-2"
                    >
                        <svg
                            className="h-4 w-4 text-blue-500 sm:h-5 sm:w-5"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3l-.5 3H13v6.8c4.56-.93 8-4.96 8-9.8z" />
                        </svg>
                        <span className="text-xs font-bold text-foreground sm:text-sm [@media(max-height:500px)]:hidden">
                            Facebook
                        </span>
                    </a>
                </div>
            </form>

            <div className="mt-[min(2vh,2rem)] text-center [@media(max-height:500px)]:mt-1.5">
                <p className="text-xs text-theme-muted sm:text-sm">
                    Already have an account?{' '}
                    <Link
                        href="/login"
                        className="font-bold text-foreground transition-colors hover:text-cyan-400"
                    >
                        Sign in
                    </Link>
                </p>
            </div>
        </>
    );
}

Register.layout = (page: ReactNode) => (
    <GuestLayout children={page} maxWidth="xl" />
);
