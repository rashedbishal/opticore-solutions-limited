import type { FormEventHandler } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import GuestLayout from '@/components/Layout/GuestLayout';

export default function VerifyEmail({ status }: { status?: string }) {
    const { post, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/email/verification-notification');
    };

    return (
        <GuestLayout>
            <Head title="Email Verification" />

            <div className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                    Verify your email
                </h1>
                <p className="mt-2 text-sm text-zinc-400">
                    Thanks for signing up! Before getting started, could you
                    verify your email address by clicking on the link we just
                    emailed to you? If you didn't receive the email, we will
                    gladly send you another.
                </p>
            </div>

            {status === 'verification-link-sent' && (
                <div className="mb-4 text-sm font-medium text-green-400">
                    A new verification link has been sent to the email address
                    you provided during registration.
                </div>
            )}

            <form onSubmit={submit}>
                <div className="mt-4 flex items-center justify-between">
                    <button
                        type="submit"
                        disabled={processing}
                        className="group relative flex justify-center rounded-full bg-linear-to-r from-violet-600 to-cyan-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 disabled:opacity-50"
                    >
                        Resend Verification Email
                    </button>

                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="text-sm font-medium text-zinc-400 underline hover:text-zinc-300 focus:outline-hidden"
                    >
                        Log Out
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}

VerifyEmail.layout = (page: import('react').ReactNode) => <>{page}</>;
