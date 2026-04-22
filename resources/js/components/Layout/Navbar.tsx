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
    Settings,
    LogOut,
    LogIn,
} from 'lucide-react';
import { useEffect, useState } from 'react';
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
    Settings,
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
            className="group text-md relative flex items-center gap-1 py-2 font-medium text-zinc-700 transition-colors hover:text-zinc-900 dark:text-white/70 dark:hover:text-white"
        >
            {Icon && (
                <Icon
                    className={cn(
                        'h-4 w-4 transition-colors duration-300',
                        active
                            ? 'text-cyan-600 dark:text-cyan-400'
                            : 'text-zinc-400 group-hover:text-violet-600 dark:text-zinc-500 dark:group-hover:text-violet-400',
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
    const { user } = props.auth;

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

    const navItems = [...navigationItems];

    if (user) {
        navItems.push({
            label: 'Settings',
            href: '/settings',
            icon: 'Settings',
        });
    }

    return (
        <>
            {props.meta?.title && <Head title={props.meta.title} />}
            <header
                className="fixed inset-x-0 top-0 z-50 px-4 pt-4 will-change-transform sm:px-6 xl:px-4 2xl:px-8"
                style={{ transform: 'translateZ(0)' }}
            >
                <nav
                    className={cn(
                        'mx-auto flex max-w-7xl items-center justify-between transition-all duration-300 xl:px-3 2xl:px-4',
                        scrolled
                            ? 'xl:rounded-full xl:border xl:border-black/10 xl:bg-white/85 xl:shadow-2xl xl:shadow-black/10 xl:backdrop-blur-xl dark:xl:border-white/10 dark:xl:bg-black/60 dark:xl:shadow-black/30'
                            : 'border-transparent bg-transparent',
                    )}
                >
                    <Link
                        href="/"
                        className={cn(
                            'touch-target inline-flex items-center rounded-full transition-all duration-300',
                            'border border-black/10 bg-white/80 backdrop-blur-md xl:border-transparent xl:bg-transparent xl:backdrop-blur-none dark:border-white/10 dark:bg-black/40',
                        )}
                        aria-label="Opticore Solutions home"
                    >
                        <img
                            src="/images/logo/opticore-white.webp"
                            alt="Opticore Solutions"
                            className="h-16 w-auto shrink-0 object-contain md:h-20"
                        />
                    </Link>

                    <div className="hidden flex-1 items-center justify-center gap-6 xl:flex xl:gap-3 2xl:gap-4">
                        {navItems.map((item) => (
                            <NavLink key={item.href} item={item} url={url} />
                        ))}
                    </div>

                    <div className="hidden items-center gap-3 xl:flex">
                        <ThemeSwitcher />
                        {user ? (
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                className="group relative flex items-center gap-2 rounded-full border border-black/10 bg-black/5 px-6 py-2.5 text-sm font-medium text-zinc-800 transition-all hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                            >
                                <LogOut className="h-4 w-4 text-violet-400" />
                                Sign out
                            </Link>
                        ) : (
                            <MagneticButton
                                href="/login"
                                ariaLabel="Sign in to your account"
                            >
                                <div className="flex items-center gap-2">
                                    <LogIn className="h-4 w-4" />
                                    Sign in
                                </div>
                            </MagneticButton>
                        )}
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
                            'h-14 w-14 border border-black/10 bg-white/80 text-zinc-800 backdrop-blur-md dark:border-white/10 dark:bg-black/40 dark:text-white',
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
                        className="fixed inset-0 z-60 flex flex-col bg-white/98 backdrop-blur-2xl xl:hidden dark:bg-black/98"
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
                                            className="h-16 w-auto shrink-0 object-contain md:h-20"
                                        />
                                    </Link>
                                    <div className="flex items-center gap-2">
                                        <ThemeSwitcher />
                                        <button
                                            type="button"
                                            onClick={() => setOpen(false)}
                                            className="flex h-14 w-14 items-center justify-center rounded-full border border-black/10 bg-black/5 text-zinc-800 dark:border-white/10 dark:bg-white/5 dark:text-white"
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
                                                    'flex w-full items-center justify-center rounded-2xl border border-black/10 bg-black/5 px-2 py-2.5 transition-colors active:bg-black/10 md:px-3 md:py-3 lg:px-4 lg:py-3.5 dark:border-white/10 dark:bg-white/5 dark:active:bg-white/10',
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
                            <div className="mt-auto pt-6 pb-4">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    transition={{ delay: 0.25 }}
                                    className="mx-auto w-full max-w-md"
                                >
                                    {user ? (
                                        <Link
                                            href="/logout"
                                            method="post"
                                            as="button"
                                            onClick={() => setOpen(false)}
                                            className="flex w-full items-center justify-center gap-3 rounded-full bg-linear-to-r from-violet-600 to-cyan-500 py-4 text-base font-bold tracking-wide text-white uppercase"
                                        >
                                            <LogOut className="h-5 w-5" />
                                            Sign out
                                        </Link>
                                    ) : (
                                        <MagneticButton
                                            href="/login"
                                            fullWidth
                                            ariaLabel="Sign in to your account"
                                            onClick={() => setOpen(false)}
                                            className="py-4 text-base font-bold tracking-wide uppercase"
                                        >
                                            <div className="flex items-center gap-2">
                                                <LogIn className="h-5 w-5" />
                                                Sign in
                                            </div>
                                        </MagneticButton>
                                    )}
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </>
    );
}
