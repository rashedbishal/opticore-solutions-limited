import type { FormEventHandler, ReactNode } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowRight, Lock } from 'lucide-react';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <>
            <Head title="Log In" />

            <div className="flex min-h-screen items-center justify-center bg-black p-4 text-white">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md rounded-[2rem] border border-white/10 bg-zinc-950 p-8 shadow-2xl sm:p-10"
                >
                    <div className="mb-10 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-600/20 text-violet-500">
                            <Lock className="h-8 w-8" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-white">
                            Opticore CMS
                        </h1>
                        <p className="mt-2 text-sm text-zinc-400">
                            Sign in to manage your website content.
                        </p>
                    </div>

                    <form onSubmit={submit} className="space-y-6">
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
                                    placeholder="admin@opticore.com"
                                    autoComplete="email"
                                    autoFocus
                                    onChange={(e) =>
                                        setData('email', e.target.value)
                                    }
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
                                    autoComplete="current-password"
                                    onChange={(e) =>
                                        setData('password', e.target.value)
                                    }
                                />
                                {errors.password && (
                                    <p className="mt-2 text-sm text-red-400">
                                        {errors.password}
                                    </p>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="group relative flex w-full justify-center rounded-full bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 disabled:opacity-50"
                        >
                            <span className="flex items-center gap-2">
                                Sign in
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </span>
                        </button>
                    </form>
                </motion.div>
            </div>
        </>
    );
}

Login.layout = (page: ReactNode) => <>{page}</>;
