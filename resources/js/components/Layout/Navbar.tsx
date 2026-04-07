import { Head, Link, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, Aperture } from 'lucide-react';
import { useEffect, useState } from 'react';
import MagneticButton from '@/components/UI/MagneticButton';
import { navigationItems } from '@/lib/site';
import { cn } from '@/lib/utils';
import type { SharedPageProps } from '@/types';
import HoverScramble from '@/components/text-animations/hover-scramble';

export default function Navbar() {
    const { url, props } = usePage<SharedPageProps>();
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => {
            setScrolled(window.scrollY > 24);
        };

        onScroll();
        window.addEventListener('scroll', onScroll);

        return () => {
            window.removeEventListener('scroll', onScroll);
        };
    }, []);

    return (
        <>
            {props.meta?.title && <Head title={props.meta.title} />}
            <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
                <nav
                    className={cn(
                        'mx-auto flex max-w-7xl items-center justify-between rounded-full border px-4 py-3 transition-all duration-300 lg:px-6',
                        scrolled
                            ? 'border-white/10 bg-black/60 shadow-2xl shadow-black/30 backdrop-blur-xl'
                            : 'border-transparent bg-transparent',
                    )}
                >
                    <Link
                        href="/"
                        className="touch-target inline-flex min-w-0 items-center gap-3 rounded-full px-2 text-sm font-semibold text-white"
                        aria-label="Opticore Solutions Ltd. home"
                    >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5">
                            <Aperture className="h-5 w-5 text-violet-300" />
                        </span>
                        <span className="max-w-[9.5rem] text-xs leading-tight font-semibold tracking-[0.08em] text-zinc-100 sm:max-w-none sm:text-sm">
                            Opticore Solutions Ltd.
                        </span>
                    </Link>

                    <div className="hidden flex-1 items-center justify-center gap-6 lg:flex lg:gap-8">
                        {navigationItems.map((item) => {
                            const active = url === item.href;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="group relative py-2 text-sm font-medium text-white/70 transition-colors hover:text-white"
                                >
                                    <HoverScramble
                                        duration={0.6}
                                        speed={0.8}
                                        scrambleChars="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
                                        className="text-[13px]"
                                    >
                                        {item.label}
                                    </HoverScramble>
                                    <span
                                        className={cn(
                                            'absolute -bottom-1 left-0 h-px bg-linear-to-r from-violet-500 to-cyan-400 transition-all duration-300',
                                            active
                                                ? 'w-full'
                                                : 'w-0 group-hover:w-full',
                                        )}
                                    />
                                </Link>
                            );
                        })}
                    </div>

                    <div className="hidden lg:block">
                        <MagneticButton
                            href="/request-appointment"
                            ariaLabel="Get a quote from Opticore Solutions Ltd."
                        >
                            Get a Quote
                        </MagneticButton>
                    </div>

                    <button
                        type="button"
                        aria-label={
                            open
                                ? 'Close navigation menu'
                                : 'Open navigation menu'
                        }
                        className="touch-target inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 text-white lg:hidden"
                        onClick={() => setOpen((current) => !current)}
                    >
                        {open ? (
                            <X className="h-5 w-5" />
                        ) : (
                            <Menu className="h-5 w-5" />
                        )}
                    </button>
                </nav>
            </header>

            <AnimatePresence>
                {open ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 flex min-h-screen flex-col bg-black/95 px-4 pt-28 pb-8 backdrop-blur-2xl lg:hidden"
                    >
                        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-between gap-8">
                            <div className="space-y-2">
                                {navigationItems.map((item, index) => (
                                    <motion.div
                                        key={item.href}
                                        initial={{ opacity: 0, y: 24 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 16 }}
                                        transition={{
                                            delay: index * 0.08,
                                            duration: 0.35,
                                        }}
                                    >
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                'touch-target flex w-full items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-2xl font-semibold text-white',
                                                url === item.href &&
                                                    'border-violet-400/40 bg-violet-500/10',
                                            )}
                                            onClick={() => setOpen(false)}
                                        >
                                            {item.label}
                                            <span className="text-sm text-zinc-400">
                                                Explore
                                            </span>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>

                            <motion.div
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 16 }}
                                transition={{ delay: 0.35, duration: 0.35 }}
                            >
                                <MagneticButton
                                    href="/request-appointment"
                                    fullWidth
                                    ariaLabel="Open project request page"
                                    onClick={() => setOpen(false)}
                                >
                                    Get a Quote
                                </MagneticButton>
                            </motion.div>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </>
    );
}
