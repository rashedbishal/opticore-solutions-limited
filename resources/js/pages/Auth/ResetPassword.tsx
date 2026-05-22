import type { ReactNode } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import GuestLayout from '@/components/Layout/GuestLayout';

export default function ResetPassword({
    token,
    email,
}: {
    token: string;
    email: string;
}) {
    const { data, setData, post, processing, errors } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/reset-password');
    };

    return (
        <>
            <Head title="Reset Password | Opticore Solutions Ltd." />

            <div className="mb-[min(3vh,1.5rem)] text-center [@media(max-height:400px)]:mb-2">
                <h1 className="mb-[min(1vh,0.375rem)] text-[clamp(1.25rem,4vh,2.5rem)] font-black tracking-tighter text-foreground uppercase">
                    New Credentials
                </h1>
                <p className="text-sm font-medium text-theme-muted sm:text-base [@media(max-height:500px)]:hidden">
                    Secure your account with a strong new password.
                </p>
            </div>

            <form
                onSubmit={submit}
                className="space-y-3 sm:space-y-4 [@media(max-height:500px)]:space-y-2"
            >
                <input type="hidden" name="token" value={data.token} />

                <div className="space-y-2.5 sm:space-y-3 [@media(max-height:500px)]:space-y-1.5">
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
                        />
                        {errors.email && (
                            <p className="mt-1 ml-4 text-[10px] text-red-500 sm:mt-2 sm:text-xs">
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
                            placeholder="New Password"
                            className="w-full rounded-xl border border-theme bg-theme-surface py-3 pr-5 pl-12 text-sm text-foreground transition-all placeholder:text-theme-subtle focus:border-violet-500/50 focus:outline-none sm:rounded-2xl sm:py-4 sm:pr-6 sm:pl-14 sm:text-base [@media(max-height:500px)]:py-2"
                            required
                            autoFocus
                        />
                        {errors.password && (
                            <p className="mt-1 ml-4 text-[10px] text-red-500 sm:mt-2 sm:text-xs">
                                {errors.password}
                            </p>
                        )}
                    </div>

                    <div className="group relative">
                        <div className="absolute top-1/2 left-4 -translate-y-1/2 text-theme-muted transition-colors group-focus-within:text-violet-400 sm:left-5">
                            <Lock className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        <input
                            type="password"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            onChange={(e) =>
                                setData('password_confirmation', e.target.value)
                            }
                            placeholder="Confirm New Password"
                            className="w-full rounded-xl border border-theme bg-theme-surface py-3 pr-5 pl-12 text-sm text-foreground transition-all placeholder:text-theme-subtle focus:border-violet-500/50 focus:outline-none sm:rounded-2xl sm:py-4 sm:pr-6 sm:pl-14 sm:text-base [@media(max-height:500px)]:py-2"
                            required
                        />
                        {errors.password_confirmation && (
                            <p className="mt-1 ml-4 text-[10px] text-red-500 sm:mt-2 sm:text-xs">
                                {errors.password_confirmation}
                            </p>
                        )}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3 text-xs font-black tracking-widest text-background uppercase shadow-lg transition-all hover:bg-cyan-400 hover:text-white sm:rounded-2xl sm:py-4 sm:text-sm sm:shadow-2xl [@media(max-height:500px)]:py-2"
                >
                    {processing ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin sm:h-5 sm:w-5" />
                            Updating Password...
                        </>
                    ) : (
                        <>
                            Reset Password
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 sm:h-5 sm:w-5" />
                        </>
                    )}
                </button>
            </form>
        </>
    );
}

ResetPassword.layout = (page: ReactNode) => (
    <GuestLayout children={page} maxWidth="lg" />
);
