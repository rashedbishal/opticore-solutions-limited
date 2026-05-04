import type { ReactNode } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Mail, Lock, ArrowRight } from 'lucide-react';
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

            <div className="mb-[min(3vh,1.5rem)] text-center [@media(max-height:400px)]:mb-2">
                <h1 className="mb-[min(1vh,0.375rem)] text-[clamp(1.25rem,4vh,2.5rem)] font-black tracking-tighter text-foreground uppercase">
                    Welcome Back
                </h1>
                <p className="text-sm font-medium text-theme-muted sm:text-base [@media(max-height:500px)]:hidden">
                    Enter your credentials to access your dashboard.
                </p>
            </div>

            {status && (
                <div className="mb-[min(2vh,1rem)] rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-center text-xs font-bold text-emerald-400 sm:rounded-2xl [@media(max-height:500px)]:p-2 [@media(max-height:500px)]:text-[10px]">
                    {status}
                </div>
            )}

            {(errors as Record<string, string | undefined>).social && (
                <div className="mb-[min(2vh,1rem)] rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-xs font-bold text-red-400 sm:rounded-2xl [@media(max-height:500px)]:p-2 [@media(max-height:500px)]:text-[10px]">
                    {(errors as Record<string, string | undefined>).social}
                </div>
            )}

            <form
                onSubmit={submit}
                className="space-y-3 sm:space-y-5 [@media(max-height:500px)]:space-y-2"
            >
                <div className="space-y-2 sm:space-y-3 [@media(max-height:500px)]:space-y-1.5">
                    <div className="group relative">
                        <div className="absolute top-1/2 left-4 -translate-y-1/2 text-theme-muted transition-colors group-focus-within:text-cyan-400 sm:left-5">
                            <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        <input
                            type="email"
                            name="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="Email Address"
                            className="w-full rounded-xl border border-theme bg-theme-surface py-3 pr-5 pl-12 text-sm text-foreground transition-all placeholder:text-theme-subtle focus:border-cyan-500/50 focus:outline-none sm:rounded-2xl sm:py-4 sm:pr-6 sm:pl-14 sm:text-base [@media(max-height:500px)]:py-2"
                            required
                            autoFocus
                        />
                        {errors.email && (
                            <p className="mt-1 ml-4 text-[10px] text-red-500">
                                {errors.email}
                            </p>
                        )}
                    </div>

                    <div className="group relative">
                        <div className="absolute top-1/2 left-4 -translate-y-1/2 text-theme-muted transition-colors group-focus-within:text-violet-400 sm:left-5">
                            <Lock className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        <input
                            type="password"
                            name="password"
                            value={data.password}
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                            placeholder="Password"
                            className="w-full rounded-xl border border-theme bg-theme-surface py-3 pr-5 pl-12 text-sm text-foreground transition-all placeholder:text-theme-subtle focus:border-violet-500/50 focus:outline-none sm:rounded-2xl sm:py-4 sm:pr-6 sm:pl-14 sm:text-base [@media(max-height:500px)]:py-2"
                            required
                        />
                        {errors.password && (
                            <p className="mt-1 ml-4 text-[10px] text-red-500">
                                {errors.password}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between px-1 sm:px-2">
                    <label className="flex cursor-pointer items-center gap-1.5 sm:gap-2">
                        <input
                            type="checkbox"
                            name="remember"
                            checked={data.remember}
                            onChange={(e) =>
                                setData('remember', e.target.checked)
                            }
                            className="h-3.5 w-3.5 rounded border-theme bg-theme-surface text-cyan-500 focus:ring-offset-background sm:h-4 sm:w-4"
                        />
                        <span className="text-[10px] font-bold tracking-widest text-theme-muted uppercase sm:text-xs">
                            Remember Me
                        </span>
                    </label>
                    <Link
                        href="/forgot-password"
                        className="text-[10px] font-bold tracking-widest text-theme-muted uppercase transition-colors hover:text-foreground sm:text-xs"
                    >
                        Forgot Password?
                    </Link>
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3 text-xs font-black tracking-widest text-background uppercase shadow-lg transition-all hover:bg-cyan-400 hover:text-white sm:rounded-2xl sm:py-4 sm:text-sm sm:shadow-2xl [@media(max-height:500px)]:py-2"
                >
                    {processing ? 'Signing In...' : 'Sign In'}{' '}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 sm:h-5 sm:w-5" />
                </button>

                <div className="flex items-center gap-3 py-1 sm:gap-4 sm:py-2 [@media(max-height:500px)]:py-0.5">
                    <div className="flex-1 border-t border-theme"></div>
                    <span className="text-[10px] font-bold tracking-widest text-theme-subtle uppercase sm:text-xs">
                        Or continue with
                    </span>
                    <div className="flex-1 border-t border-theme"></div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4 [@media(max-height:500px)]:gap-2">
                    <a
                        href="/auth/google/redirect"
                        className="flex items-center justify-center gap-2 rounded-xl border border-theme bg-theme-surface py-3 transition-colors hover:bg-theme-surface-hover sm:gap-3 sm:rounded-2xl sm:py-4 [@media(max-height:500px)]:py-2"
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
                        className="flex items-center justify-center gap-2 rounded-xl border border-theme bg-theme-surface py-3 transition-colors hover:bg-theme-surface-hover sm:gap-3 sm:rounded-2xl sm:py-4 [@media(max-height:500px)]:py-2"
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

            <div className="mt-[min(2vh,2.5rem)] text-center [@media(max-height:500px)]:mt-2">
                <p className="text-sm text-theme-muted sm:text-base">
                    New to Opticore?{' '}
                    <Link
                        href="/register"
                        className="font-bold text-foreground transition-colors hover:text-cyan-400"
                    >
                        Create account
                    </Link>
                </p>
            </div>
        </>
    );
}

Login.layout = (page: ReactNode) => (
    <GuestLayout children={page} maxWidth="lg" />
);
