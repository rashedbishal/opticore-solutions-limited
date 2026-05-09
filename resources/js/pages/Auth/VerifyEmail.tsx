import type { ReactNode } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowRight, LogOut, Loader2 } from 'lucide-react';
import GuestLayout from '@/components/Layout/GuestLayout';

export default function VerifyEmail({ status }: { status?: string }) {
    const { post, processing } = useForm({});

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/email/verification-notification');
    };

    return (
        <>
            <Head title="Verify Email | Opticore Solutions Ltd." />

            <div className="mb-[min(3vh,1.5rem)] text-center [@media(max-height:400px)]:mb-2">
                <h1 className="mb-[min(1vh,0.375rem)] text-[clamp(1.25rem,4vh,2.5rem)] font-black tracking-tighter text-foreground uppercase">
                    Verify Email
                </h1>
                <p className="text-sm font-medium text-theme-muted sm:text-base [@media(max-height:500px)]:hidden">
                    Please check your inbox for a verification link to activate
                    your account.
                </p>
            </div>

            {status === 'verification-link-sent' && (
                <div className="mb-[min(2vh,1rem)] rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-center text-xs font-bold text-emerald-400 sm:rounded-2xl sm:p-4 sm:text-sm [@media(max-height:500px)]:p-2 [@media(max-height:500px)]:text-[10px]">
                    A new verification link has been sent to your email address.
                </div>
            )}

            <form
                onSubmit={submit}
                className="space-y-4 sm:space-y-6 [@media(max-height:500px)]:space-y-3"
            >
                <button
                    type="submit"
                    disabled={processing}
                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3 text-xs font-black tracking-widest text-background uppercase shadow-lg transition-all hover:bg-cyan-400 hover:text-white sm:rounded-2xl sm:py-4 sm:text-sm sm:shadow-2xl [@media(max-height:500px)]:py-2"
                >
                    {processing ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin sm:h-5 sm:w-5" />
                            Sending Link...
                        </>
                    ) : (
                        <>
                            Resend Verification Email
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 sm:h-5 sm:w-5" />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-[min(3vh,3rem)] text-center [@media(max-height:500px)]:mt-3">
                <Link
                    href="/logout"
                    method="post"
                    as="button"
                    className="mx-auto flex items-center justify-center gap-2 text-[10px] font-bold tracking-widest text-theme-muted uppercase transition-colors hover:text-foreground sm:text-xs"
                >
                    <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Sign Out
                </Link>
            </div>
        </>
    );
}

VerifyEmail.layout = (page: ReactNode) => (
    <GuestLayout children={page} maxWidth="lg" />
);
