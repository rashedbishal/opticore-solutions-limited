import { Head } from '@inertiajs/react';

interface ErrorPageProps {
    status: number;
    message?: string;
}

const titles: Record<number, string> = {
    403: 'Access Denied',
    404: 'Page Not Found',
    429: 'Too Many Requests',
    500: 'Server Error',
    503: 'Service Unavailable',
};

const descriptions: Record<number, string> = {
    403: "You don't have permission to access this page.",
    404: "The page you're looking for doesn't exist or has been moved.",
    429: "You've made too many attempts in a short time. Please wait a moment and try again.",
    500: 'Something went wrong on our end. Please try again later.',
    503: "We're currently undergoing maintenance. Please check back shortly.",
};

export default function Error({ status, message }: ErrorPageProps) {
    const title = titles[status] || 'Error';
    const description =
        message || descriptions[status] || 'An unexpected error occurred.';

    return (
        <>
            <Head>
                <title>{`${status} — ${title}`}</title>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <section className="flex min-h-screen items-center justify-center bg-zinc-950 px-6">
                <div className="text-center">
                    <p className="gradient-text text-8xl font-black tracking-tighter sm:text-9xl">
                        {status}
                    </p>

                    <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
                        {title}
                    </h1>

                    <p className="mx-auto mt-4 max-w-md text-lg text-zinc-400">
                        {description}
                    </p>

                    <div className="mt-10 flex items-center justify-center gap-4">
                        <a
                            href="/"
                            className="rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-violet-500"
                        >
                            Go Home
                        </a>

                        <button
                            onClick={() => window.history.back()}
                            className="rounded-xl border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-white"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </section>
        </>
    );
}

// Opt-out of default layout; this is a full-screen standalone page.
Error.layout = (page: React.ReactNode) => page;
