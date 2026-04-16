import type { PropsWithChildren } from 'react';
import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';

export default function GuestLayout({ children }: PropsWithChildren) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-black pt-6 sm:justify-center sm:pt-0">
            <div className="relative w-full max-w-md">
                {/* Background glow effects */}
                <div className="pointer-events-none absolute -inset-48 overflow-hidden opacity-30">
                    <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/30 blur-[100px]" />
                    <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/20 blur-[80px]" />
                </div>

                <div className="relative mb-8 flex justify-center">
                    <Link href="/">
                        <img
                            src="/images/logo/opticore-white.webp"
                            alt="Opticore Solutions"
                            className="h-20 w-auto"
                        />
                    </Link>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative w-full overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950/50 p-8 shadow-2xl backdrop-blur-xl sm:p-10"
                >
                    {children}
                </motion.div>
            </div>
        </div>
    );
}
