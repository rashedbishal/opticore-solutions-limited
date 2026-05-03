import type { SharedPageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Menu,
    X,
    PenTool,
    Globe,
    Film,
    Box,
    Code2,
    Mail,
    User,
    LogOut,
    LogIn,
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import HoverScramble from '@/components/text-animations/hover-scramble';
import MagneticButton from '@/components/UI/MagneticButton';
import ThemeSwitcher from '@/components/UI/ThemeSwitcher';
import { navigationItems } from '@/lib/site';
import { cn } from '@/lib/utils';

const IconMap: Record<string, any> = {
    PenTool,
    Globe,
    Film,
    Box,
    Code2,
    Mail,
    User,
};

function NavLink({
    item,
    url,
}: {
    item: { label: string; href: string; icon?: string };
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
            className={cn(
                'group relative flex items-center gap-2 rounded-full border px-4 py-2 shadow-[0_3px_10px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.85)] transition-all duration-300 dark:shadow-[0_3px_10px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]',
                active
                    ? 'border-violet-400 bg-violet-100 shadow-[0_3px_10px_rgba(139,92,246,0.2),inset_0_1px_0_rgba(255,255,255,0.85)] dark:border-violet-500 dark:bg-violet-950 dark:shadow-[0_3px_10px_rgba(139,92,246,0.35),inset_0_1px_0_rgba(255,255,255,0.06)]'
                    : 'border-slate-300 bg-slate-100 hover:border-slate-400 hover:bg-white dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600 dark:hover:bg-zinc-800',
            )}
        >
            {Icon && (
                <Icon
                    className={cn(
                        'h-4 w-4 transition-colors duration-300',
                        active
                            ? 'text-violet-600 dark:text-violet-400'
                            : 'text-zinc-500 group-hover:text-violet-600 dark:text-zinc-400 dark:group-hover:text-violet-400',
                    )}
                />
            )}
            <HoverScramble
                duration={0.6}
                speed={0.8}
                scrambleChars="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
                className={cn(
                    'font-[family-name:var(--font-geist-mono)] text-[13px] font-semibold tracking-normal transition-colors md:text-[13.5px] md:tracking-wide',
                    active
                        ? 'text-violet-900 dark:text-violet-100'
                        : 'text-zinc-700 dark:text-white/70',
                )}
                trigger={hovered}
            >
                {item.label}
            </HoverScramble>
        </Link>
    );
}

export default function Navbar() {
    const { url, props } = usePage<SharedPageProps>();
    const [open, setOpen] = useState(false);
    const [visible, setVisible] = useState(true);
    const lastScrollY = useRef(0);
    const { user } = props.auth;

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Headroom logic
            if (currentScrollY < 50) {
                setVisible(true);
            } else if (
                currentScrollY > lastScrollY.current &&
                currentScrollY > 120
            ) {
                // Scrolling down - hide
                setVisible(false);
            } else if (currentScrollY < lastScrollY.current) {
                // Scrolling up - show
                setVisible(true);
            }

            lastScrollY.current = currentScrollY;
        };

        const handleMouseMove = (e: MouseEvent) => {
            // Show if mouse is near the top
            if (e.clientY < 40) {
                setVisible(true);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    const navItems = [...navigationItems];

    return (
        <>
            {props.meta?.title && <Head title={props.meta.title} />}
            <header
                className={cn(
                    'fixed inset-x-0 top-0 z-50 px-4 pt-4 drop-shadow-[0_12px_32px_rgba(0,0,0,0.15)] transition-all duration-500 will-change-transform sm:px-6 md:px-4 2xl:px-8 dark:drop-shadow-[0_12px_32px_rgba(0,0,0,0.6)]',
                    visible
                        ? 'translate-y-0 opacity-100'
                        : 'pointer-events-none -translate-y-full opacity-0',
                )}
            >
                <nav className="mx-auto flex max-w-7xl items-center justify-between transition-all duration-300 md:px-3 2xl:px-4">
                    {/* Left Side: Logo */}
                    <div className="flex flex-1 justify-start">
                        <Link
                            href="/"
                            className={cn(
                                'touch-target inline-flex items-center rounded-full border border-slate-300 bg-slate-100 shadow-[0_3px_10px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.85)] transition-all duration-300 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-[0_3px_10px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]',
                            )}
                            aria-label="Opticore Solutions home"
                        >
                            <img
                                src="/images/logo/opticore.webp"
                                alt="Opticore Solutions"
                                className="block h-12 w-auto shrink-0 object-contain md:h-14 lg:h-20 dark:hidden"
                            />
                            <img
                                src="/images/logo/opticore-white.webp"
                                alt="Opticore Solutions"
                                className="hidden h-12 w-auto shrink-0 object-contain md:h-14 lg:h-20 dark:block"
                            />
                        </Link>
                    </div>

                    {/* Center Side: Nav Items */}
                    <div className="hidden flex-none items-center justify-center gap-6 md:flex md:gap-2 2xl:gap-3">
                        {navItems.map((item) => (
                            <NavLink key={item.href} item={item} url={url} />
                        ))}
                    </div>

                    {/* Right Side: Auth & Mobile Toggle */}
                    <div className="flex flex-1 items-center justify-end gap-3">
                        <div className="hidden items-center gap-3 md:flex">
                            <div className="flex h-10 items-center gap-1 rounded-full border border-slate-300 bg-slate-100 p-1 shadow-[0_3px_10px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.85)] dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-[0_3px_10px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]">
                                <ThemeSwitcher className="h-8 w-8 border-0 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10" />
                                {user ? (
                                    <>
                                        <Link
                                            href="/profile"
                                            className={cn(
                                                'group relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300',
                                                url === '/profile'
                                                    ? 'bg-violet-600 text-white shadow-lg dark:bg-violet-500'
                                                    : 'bg-black/5 text-zinc-800 hover:bg-black/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10',
                                            )}
                                            aria-label="Profile"
                                        >
                                            <User className="h-4 w-4" />
                                        </Link>
                                        <Link
                                            href="/logout"
                                            method="post"
                                            as="button"
                                            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-zinc-800 transition-all hover:bg-black/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                                            aria-label="Sign out"
                                        >
                                            <LogOut className="h-4 w-4 text-violet-400" />
                                        </Link>
                                    </>
                                ) : (
                                    <Link
                                        href="/login"
                                        className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-zinc-800 transition-all hover:bg-black/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                                        aria-label="Sign in"
                                    >
                                        <LogIn className="h-4 w-4 text-violet-400" />
                                    </Link>
                                )}
                            </div>
                        </div>

                        <button
                            type="button"
                            aria-label={
                                open
                                    ? 'Close navigation menu'
                                    : 'Open navigation menu'
                            }
                            className={cn(
                                'touch-target inline-flex items-center justify-center rounded-full transition-all duration-300 md:hidden',
                                'h-11 w-11 border border-slate-300 bg-slate-100 text-zinc-800 shadow-[0_3px_10px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.85)] dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:shadow-[0_3px_10px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]',
                            )}
                            onClick={() => setOpen((current) => !current)}
                        >
                            {open ? (
                                <X className="h-5 w-5" />
                            ) : (
                                <Menu className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                </nav>
            </header>

            <AnimatePresence>
                {open ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-60 flex flex-col bg-slate-100 xl:hidden dark:bg-zinc-900"
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
                                            src="/images/logo/opticore.webp"
                                            alt="Opticore Solutions"
                                            className="block h-12 w-auto shrink-0 object-contain md:h-20 dark:hidden"
                                        />
                                        <img
                                            src="/images/logo/opticore-white.webp"
                                            alt="Opticore Solutions"
                                            className="hidden h-12 w-auto shrink-0 object-contain md:h-20 dark:block"
                                        />
                                    </Link>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setOpen(false)}
                                            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-slate-200 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Scrollable links area */}
                            <div className="hide-scrollbar flex-1 overflow-y-auto overscroll-contain p-4">
                                <div className="mx-auto w-full max-w-md space-y-2">
                                    {navItems.map((item, index) => (
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
                                                    'flex w-full items-center justify-center rounded-2xl border border-slate-300 bg-slate-200 px-2 py-2.5 transition-colors active:bg-slate-300 md:px-3 md:py-3 lg:px-4 lg:py-3.5 dark:border-zinc-700 dark:bg-zinc-800 dark:active:bg-zinc-700',
                                                    url === item.href &&
                                                        'border-violet-500/40 bg-violet-500/10 dark:border-violet-400/40',
                                                )}
                                                onClick={() => setOpen(false)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    {item.icon &&
                                                        IconMap[item.icon] && (
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
                                                        className="sm:text-md text-sm font-semibold text-zinc-900 dark:text-white"
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
                            <div className="mt-auto px-4 pt-6 pb-4 sm:px-6">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    transition={{ delay: 0.25 }}
                                    className="mx-auto w-full max-w-md"
                                >
                                    <div className="flex items-start gap-3">
                                        <ThemeSwitcher className="shrink-0" />
                                        <div className="flex-1">
                                            {user ? (
                                                <div className="flex flex-col gap-3">
                                                    <Link
                                                        href="/profile"
                                                        onClick={() =>
                                                            setOpen(false)
                                                        }
                                                        className={cn(
                                                            'flex w-full items-center justify-center gap-3 rounded-full py-4 text-base font-bold tracking-wide uppercase transition-all',
                                                            url === '/profile'
                                                                ? 'bg-violet-600 text-white'
                                                                : 'bg-slate-200 text-zinc-900 dark:bg-zinc-800 dark:text-white',
                                                        )}
                                                    >
                                                        <User className="h-5 w-5" />
                                                        Profile
                                                    </Link>
                                                    <Link
                                                        href="/logout"
                                                        method="post"
                                                        as="button"
                                                        onClick={() =>
                                                            setOpen(false)
                                                        }
                                                        className="flex w-full items-center justify-center gap-3 rounded-full bg-linear-to-r from-violet-600 to-cyan-500 py-4 text-base font-bold tracking-wide text-white uppercase"
                                                    >
                                                        <LogOut className="h-5 w-5" />
                                                        Sign out
                                                    </Link>
                                                </div>
                                            ) : (
                                                <MagneticButton
                                                    href="/login"
                                                    fullWidth
                                                    ariaLabel="Sign in to your account"
                                                    onClick={() =>
                                                        setOpen(false)
                                                    }
                                                    className="py-4 text-base font-bold tracking-wide uppercase"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <LogIn className="h-5 w-5" />
                                                        Sign in
                                                    </div>
                                                </MagneticButton>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </>
    );
}
