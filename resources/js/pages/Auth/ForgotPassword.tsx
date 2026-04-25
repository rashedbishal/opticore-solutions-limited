import type { ReactNode } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Mail, ArrowRight } from 'lucide-react';
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

            <div className="mb-[min(3vh,1.5rem)] text-center [@media(max-height:400px)]:mb-2">
                <h1 className="mb-[min(1vh,0.375rem)] text-[clamp(1.25rem,4vh,2.5rem)] font-black tracking-tighter text-foreground uppercase">
                    Recover Access
                </h1>
                <p className="text-sm font-medium text-theme-muted sm:text-base [@media(max-height:500px)]:hidden">
                    Enter your email and we'll send you a secure reset link.
                </p>
            </div>

            {status && (
                <div className="mb-[min(2vh,1rem)] rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-center text-xs font-bold text-emerald-400 sm:rounded-2xl [@media(max-height:500px)]:p-2 [@media(max-height:500px)]:text-[10px]">
                    {status}
                </div>
            )}

            <form
                onSubmit={submit}
                className="space-y-4 sm:space-y-6 [@media(max-height:500px)]:space-y-3"
            >
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
                        <p className="mt-1 ml-4 text-[10px] text-red-500 sm:mt-2 sm:text-xs">
                            {errors.email}
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3 text-xs font-black tracking-widest text-background uppercase shadow-[0_10px_30px_rgba(0,0,0,0.15)] transition-all hover:bg-cyan-400 hover:text-white sm:rounded-2xl sm:py-4 sm:text-sm sm:shadow-[0_20px_40px_rgba(0,0,0,0.15)] [@media(max-height:500px)]:py-2"
                >
                    {processing ? 'Sending Link...' : 'Send Reset Link'}{' '}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 sm:h-5 sm:w-5" />
                </button>
            </form>

            <div className="mt-[min(3vh,3rem)] text-center [@media(max-height:500px)]:mt-3">
                <p className="text-sm text-theme-muted sm:text-base">
                    Remembered?{' '}
                    <Link
                        href="/login"
                        className="font-bold text-foreground transition-colors hover:text-cyan-400"
                    >
                        Login here
                    </Link>
                </p>
            </div>
        </>
    );
}

ForgotPassword.layout = (page: ReactNode) => (
    <GuestLayout children={page} maxWidth="lg" />
);
