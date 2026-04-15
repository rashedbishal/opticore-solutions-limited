import type { SharedPageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, PenTool, Globe, Film, Box, Code2, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import HoverScramble from '@/components/text-animations/hover-scramble';
import MagneticButton from '@/components/UI/MagneticButton';
import { bangladeshPhoneLink, navigationItems } from '@/lib/site';
import { cn } from '@/lib/utils';

const IconMap: Record<string, typeof Globe> = {
    PenTool,
    Globe,
    Film,
    Box,
    Code2,
    Mail,
};

function NavLink({
    item,
    url,
}: {
    item: (typeof navigationItems)[0];
    url: string;
}) {
    const [hovered, setHovered] = useState(false);
    const active = url === item.href;
    const Icon = item.icon ? IconMap[item.icon] : null;

    return (
        <Link
            key={item.href}
            href={item.href}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="group relative flex items-center gap-1 py-2 text-md font-medium text-white/70 transition-colors hover:text-white"
        >
            {Icon && (
                <Icon
                    className={cn(
                        'h-4 w-4 transition-colors duration-300',
                        active ? 'text-cyan-400' : 'text-zinc-500 group-hover:text-violet-400',
                    )}
                />
            )}
            <HoverScramble
                duration={0.6}
                speed={0.8}
                scrambleChars="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
                className="font-[family-name:var(--font-geist-mono)] text-[13px] tracking-normal xl:text-[13.5px] xl:tracking-wide 2xl:text-[14px]"
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
            <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 xl:px-4 2xl:px-8">
                <nav
                    className={cn(
                        'mx-auto flex max-w-7xl items-center justify-between transition-all duration-300 xl:px-3 2xl:px-4',
                        scrolled
                            ? 'xl:rounded-full xl:border xl:border-white/10 xl:bg-black/60 xl:shadow-2xl xl:shadow-black/30 xl:backdrop-blur-xl'
                            : 'border-transparent bg-transparent',
                    )}
                >
                    <Link
                        href="/"
                        className={cn(
                            'touch-target inline-flex items-center rounded-full transition-all duration-300',
                            'bg-black/40 backdrop-blur-md border border-white/10 xl:border-transparent xl:bg-transparent xl:backdrop-blur-none'
                        )}
                        aria-label="Opticore Solutions home"
                    >
                        <img
                            src="/images/logo/opticore-white.webp"
                            alt="Opticore Solutions"
                            className="h-16 md:h-20 w-auto shrink-0 object-contain"
                        />
                    </Link>

                    <div className="hidden flex-1 items-center justify-center gap-6 xl:flex xl:gap-3 2xl:gap-4">
                        {navigationItems.map((item) => (
                            <NavLink key={item.href} item={item} url={url} />
                        ))}
                    </div>

                    <div className="hidden xl:block">
                        <MagneticButton
                            href={bangladeshPhoneLink}
                            ariaLabel="Call Opticore Solutions Ltd. now"
                        >
                            Call now
                        </MagneticButton>
                    </div>

                    <button
                        type="button"
                        aria-label={
                            open
                                ? 'Close navigation menu'
                                : 'Open navigation menu'
                        }
                        className={cn(
                            'touch-target inline-flex items-center justify-center rounded-full transition-all duration-300 xl:hidden',
                            'h-14 w-14 border border-white/10 bg-black/40 text-white backdrop-blur-md',
                        )}
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
                        className="fixed inset-0 z-60 flex flex-col bg-black/98 backdrop-blur-2xl xl:hidden"
                    >
                        <div className="flex h-full flex-col">
                            {/* Header inside the menu for consistent top spacing and close button */}
                            <div className="px-4 pt-4 sm:px-6">
                                <div className="mx-auto flex max-w-7xl items-center justify-between">
                                    <Link
                                        href="/"
                                        className="touch-target inline-flex items-center rounded-full border border-transparent bg-transparent p-2"
                                        onClick={() => setOpen(false)}
                                    >
                                        <img
                                            src="/images/logo/opticore-white.webp"
                                            alt="Opticore Solutions"
                                            className="h-16 md:h-20 w-auto shrink-0 object-contain"
                                        />
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => setOpen(false)}
                                        className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Scrollable links area */}
                            <div className="hide-scrollbar flex-1 overflow-y-auto overscroll-contain p-4">
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
                                                    'flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-2 md:px-3 lg:px-4 py-2.5 md:py-3 lg:py-3.5 transition-colors active:bg-white/10',
                                                    url === item.href &&
                                                        'border-violet-400/40 bg-violet-500/10',
                                                )}
                                                onClick={() => setOpen(false)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    {item.icon && IconMap[item.icon] && (
                                                        <div className="items-center justify-center rounded-xl text-violet-400">
                                                            {(() => {
                                                                const Icon =
                                                                    IconMap[
                                                                        item
                                                                            .icon
                                                                    ];

                                                                    return (
                                                                        <Icon className="h-5 w-5" />
                                                                    );
                                                                })()}
                                                            </div>
                                                        )}
                                                    <HoverScramble
                                                        duration={0.8}
                                                        speed={1}
                                                        scrambleChars="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
                                                        triggerOnMount={true}
                                                        className="text-sm font-semibold text-white sm:text-md"
                                                    >
                                                        {item.label}
                                                    </HoverScramble>
                                                </div>
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
                                        href={bangladeshPhoneLink}
                                        fullWidth
                                        ariaLabel="Call Opticore Solutions Ltd. now"
                                        onClick={() => setOpen(false)}
                                        className="py-4 text-base font-bold tracking-wide uppercase"
                                    >
                                        Call now
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
