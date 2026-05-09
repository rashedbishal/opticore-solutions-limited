import type { FormEventHandler, ReactNode } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowRight, Lock, Loader2 } from 'lucide-react';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/admin/login');
    };

    return (
        <>
            <Head title="Log In" />

            <div className="flex h-[100dvh] items-center justify-center overflow-hidden bg-black p-4 text-white">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md rounded-[2rem] border border-white/10 bg-zinc-950 p-[min(5vh,2.5rem)] shadow-2xl [@media(max-height:400px)]:p-4"
                >
                    <div className="mb-[min(3vh,2.5rem)] text-center [@media(max-height:400px)]:mb-3">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600/20 text-violet-500 sm:h-14 sm:w-14 [@media(max-height:400px)]:mb-2 [@media(max-height:500px)]:h-10 [@media(max-height:500px)]:w-10">
                            <Lock className="h-6 w-6 sm:h-7 sm:w-7 [@media(max-height:500px)]:h-5 [@media(max-height:500px)]:w-5" />
                        </div>
                        <h1 className="text-[clamp(1.1rem,3vh,1.5rem)] font-bold tracking-tight text-white">
                            Opticore CMS
                        </h1>
                        <p className="mt-1 text-xs text-zinc-400 sm:mt-2 sm:text-sm [@media(max-height:500px)]:hidden">
                            Sign in to manage your website content.
                        </p>
                    </div>

                    <form
                        onSubmit={submit}
                        className="space-y-4 sm:space-y-5 [@media(max-height:500px)]:space-y-3"
                    >
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-xs font-medium text-zinc-300 sm:text-sm"
                            >
                                Email address
                            </label>
                            <div className="mt-1.5 sm:mt-2">
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    className="block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-violet-500 focus:ring-violet-500 sm:text-sm [@media(max-height:500px)]:py-2"
                                    placeholder="admin@opticore.com"
                                    autoComplete="email"
                                    autoFocus
                                    onChange={(e) =>
                                        setData('email', e.target.value)
                                    }
                                />
                                {errors.email && (
                                    <p className="mt-1.5 text-xs text-red-400">
                                        {errors.email}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="block text-xs font-medium text-zinc-300 sm:text-sm"
                            >
                                Password
                            </label>
                            <div className="mt-1.5 sm:mt-2">
                                <input
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    className="block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-violet-500 focus:ring-violet-500 sm:text-sm [@media(max-height:500px)]:py-2"
                                    autoComplete="current-password"
                                    onChange={(e) =>
                                        setData('password', e.target.value)
                                    }
                                />
                                {errors.password && (
                                    <p className="mt-1.5 text-xs text-red-400">
                                        {errors.password}
                                    </p>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="group relative flex w-full justify-center rounded-full bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 disabled:opacity-50 sm:py-3 sm:text-sm [@media(max-height:500px)]:py-2"
                        >
                            {processing ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin sm:h-4 sm:w-4" />
                                    Signing in...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Sign in
                                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 sm:h-4 sm:w-4" />
                                </span>
                            )}
                        </button>
                    </form>
                </motion.div>
            </div>
        </>
    );
}

Login.layout = (page: ReactNode) => <>{page}</>;
