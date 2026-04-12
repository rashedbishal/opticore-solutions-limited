import { Head, Link, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import HoverScramble from '@/components/text-animations/hover-scramble';
import MagneticButton from '@/components/UI/MagneticButton';
import { navigationItems } from '@/lib/site';
import { cn } from '@/lib/utils';
import type { SharedPageProps } from '@/types';

function NavLink({
    item,
    url,
}: {
    item: (typeof navigationItems)[0];
    url: string;
}) {
    const [hovered, setHovered] = useState(false);
    const active = url === item.href;

    return (
        <Link
            key={item.href}
            href={item.href}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="group relative py-2 text-sm font-medium text-white/70 transition-colors hover:text-white"
        >
            <HoverScramble
                duration={0.6}
                speed={0.8}
                scrambleChars="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
                className="font-[family-name:var(--font-geist-mono)] text-[13px]"
                trigger={hovered}
            >
                {item.label}
            </HoverScramble>
            <span
                className={cn(
                    'absolute -bottom-1 left-0 h-px bg-linear-to-r from-violet-500 to-cyan-400 transition-all duration-300',
                    active ? 'w-full' : 'w-0 group-hover:w-full',
                )}
            />
        </Link>
    );
}

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
                        <img
                            src="/images/logo/logo.svg"
                            alt="Opticore Solutions Logo"
                            className="h-9 w-9 shrink-0 object-contain"
                        />
                        <span className="max-w-[9.5rem] text-xs leading-tight font-semibold tracking-[0.08em] text-zinc-100 sm:max-w-none sm:text-sm">
                            Opticore Solutions Ltd.
                        </span>
                    </Link>

                    <div className="hidden flex-1 items-center justify-center gap-6 lg:flex lg:gap-8">
                        {navigationItems.map((item) => (
                            <NavLink key={item.href} item={item} url={url} />
                        ))}
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
                        className="fixed inset-0 z-60 flex flex-col bg-black/98 p-4 backdrop-blur-2xl lg:hidden"
                    >
                        <div className="flex h-full flex-col">
                            {/* Header inside the menu for consistent top spacing and close button */}
                            <div className="flex items-center justify-between pt-4 pb-6 sm:px-2">
                                <Link
                                    href="/"
                                    className="flex items-center gap-3"
                                    onClick={() => setOpen(false)}
                                >
                                    <img
                                        src="/images/logo/logo.svg"
                                        alt="Opticore Solutions Logo"
                                        className="h-9 w-9 shrink-0 object-contain"
                                    />
                                    <span className="text-xs font-semibold tracking-wide text-zinc-100">
                                        Opticore Solutions Ltd.
                                    </span>
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Scrollable links area */}
                            <div className="hide-scrollbar flex-1 overflow-y-auto overscroll-contain py-4">
                                <div className="mx-auto w-full max-w-md space-y-2">
                                    {navigationItems.map((item, index) => (
                                        <motion.div
                                            key={item.href}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            transition={{
                                                delay: index * 0.05,
                                                duration: 0.3,
                                            }}
                                        >
                                            <Link
                                                href={item.href}
                                                className={cn(
                                                    'flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 transition-colors active:bg-white/10',
                                                    url === item.href &&
                                                        'border-violet-400/40 bg-violet-500/10',
                                                )}
                                                onClick={() => setOpen(false)}
                                            >
                                                <HoverScramble
                                                    duration={0.8}
                                                    speed={1}
                                                    scrambleChars="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
                                                    triggerOnMount={true}
                                                    className="text-lg font-semibold text-white sm:text-xl"
                                                >
                                                    {item.label}
                                                </HoverScramble>
                                                <span className="font-[family-name:var(--font-geist-mono)] text-[10px] font-medium tracking-widest text-zinc-500 uppercase">
                                                    Explore
                                                </span>
                                            </Link>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Footer CTA */}
                            <div className="mt-auto pt-6 pb-4">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    transition={{ delay: 0.25 }}
                                    className="mx-auto w-full max-w-md"
                                >
                                    <MagneticButton
                                        href="/request-appointment"
                                        fullWidth
                                        ariaLabel="Open project request page"
                                        onClick={() => setOpen(false)}
                                        className="py-4 text-base font-bold tracking-wide uppercase"
                                    >
                                        Get a Quote
                                    </MagneticButton>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </>
    );
}
