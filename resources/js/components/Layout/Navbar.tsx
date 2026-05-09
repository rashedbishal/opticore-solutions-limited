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
    Home,
    Briefcase,
    Loader2,
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
    Home,
    Briefcase,
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
                'group relative flex h-10 items-center gap-2 rounded-full px-5 transition-all duration-300 hover:scale-105',
                active ? 'neo-btn-primary' : 'neo-btn-ghost',
            )}
        >
            {Icon && (
                <Icon
                    className={cn(
                        'drop-icon dark:drop-icon h-4 w-4 transition-colors duration-300',
                        active
                            ? 'text-white'
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
                        ? 'drop-icon text-white'
                        : 'text-zinc-700 dark:text-zinc-300',
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
    const [isLoggingOut, setIsLoggingOut] = useState(false);
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
                    <div className="hidden flex-none items-center justify-center md:flex md:gap-3 2xl:gap-4">
                        {navItems.map((item) => (
                            <NavLink key={item.href} item={item} url={url} />
                        ))}
                    </div>

                    {/* Right Side: Auth & Mobile Toggle */}
                    <div className="flex flex-1 items-center justify-end gap-3">
                        <div className="hidden items-center gap-3 md:flex">
                            <div className="flex h-11 items-center gap-1.5 rounded-full border border-slate-300 bg-slate-100 p-1.5 shadow-[0_3px_10px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.85)] dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-[0_3px_10px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]">
                                <ThemeSwitcher className="[&>svg]:drop-icon dark:[&>svg]:drop-icon h-8 w-8 !border-0 bg-gradient-to-b from-white to-slate-50 shadow-[0_3px_8px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(0,0,0,0.05),inset_0_1px_2px_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.05)] transition-all duration-300 hover:scale-105 hover:shadow-[0_6px_12px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.06),inset_0_0_0_1px_rgba(0,0,0,0.05),inset_0_1px_2px_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.05)] dark:from-zinc-700 dark:to-zinc-800 dark:shadow-[0_4px_6px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] dark:hover:shadow-[0_6px_12px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.2)]" />
                                {user ? (
                                    <>
                                        <Link
                                            href="/profile"
                                            className={cn(
                                                'group relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 hover:scale-105',
                                                url === '/profile'
                                                    ? 'neo-btn-primary'
                                                    : 'neo-btn-ghost',
                                            )}
                                            aria-label="Profile"
                                        >
                                            <User
                                                className={cn(
                                                    'drop-icon h-4 w-4',
                                                    url === '/profile'
                                                        ? 'text-white'
                                                        : 'text-zinc-600 dark:text-zinc-300',
                                                )}
                                            />
                                        </Link>
                                        <Link
                                            href="/logout"
                                            method="post"
                                            as="button"
                                            onStart={() => setIsLoggingOut(true)}
                                            onFinish={() => setIsLoggingOut(false)}
                                            disabled={isLoggingOut}
                                            className="neo-btn-ghost group relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 hover:scale-105 disabled:opacity-50"
                                            aria-label="Sign out"
                                        >
                                            {isLoggingOut ? (
                                                <Loader2 className="drop-icon dark:drop-icon h-4 w-4 animate-spin text-violet-500 dark:text-violet-400" />
                                            ) : (
                                                <LogOut className="drop-icon dark:drop-icon h-4 w-4 text-violet-500 dark:text-violet-400" />
                                            )}
                                        </Link>
                                    </>
                                ) : (
                                    <Link
                                        href="/login"
                                        className="neo-btn-ghost group relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 hover:scale-105"
                                        aria-label="Sign in"
                                    >
                                        <LogIn className="drop-icon dark:drop-icon h-4 w-4 text-violet-500 dark:text-violet-400" />
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Mobile Toggle & Theme Switcher */}
                        <div className="flex h-11 items-center gap-1.5 rounded-full border border-slate-300 bg-slate-100 p-1.5 shadow-[0_3px_10px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.85)] md:hidden dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-[0_3px_10px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]">
                            <ThemeSwitcher className="[&>svg]:drop-icon dark:[&>svg]:drop-icon h-8 w-8 !border-0 bg-gradient-to-b from-white to-slate-50 shadow-[0_3px_8px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(0,0,0,0.05),inset_0_1px_2px_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.05)] transition-all duration-300 hover:scale-105 hover:shadow-[0_6px_12px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.06),inset_0_0_0_1px_rgba(0,0,0,0.05),inset_0_1px_2px_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.05)] dark:from-zinc-700 dark:to-zinc-800 dark:shadow-[0_4px_6px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] dark:hover:shadow-[0_6px_12px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.2)]" />
                            <button
                                type="button"
                                aria-label={
                                    open
                                        ? 'Close navigation menu'
                                        : 'Open navigation menu'
                                }
                                className="neo-btn-ghost group relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 hover:scale-105"
                                onClick={() => setOpen((current) => !current)}
                            >
                                {open ? (
                                    <X className="drop-icon dark:drop-icon h-4 w-4 text-zinc-600 dark:text-zinc-300" />
                                ) : (
                                    <Menu className="drop-icon dark:drop-icon h-4 w-4 text-zinc-600 dark:text-zinc-300" />
                                )}
                            </button>
                        </div>
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
                                                    'flex w-full items-center justify-center rounded-2xl border transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] px-2 py-2.5 md:px-3 md:py-3 lg:px-4 lg:py-3.5',
                                                    url === item.href
                                                        ? 'neo-btn-primary border-violet-500/40'
                                                        : 'border-slate-300 bg-slate-100 shadow-[0_3px_10px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.85)] dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-[0_3px_10px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]'
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
                                    <div className="flex-1">
                                        {user ? (
                                            <div className="flex flex-col gap-3">
                                                <Link
                                                    href="/profile"
                                                    onClick={() =>
                                                        setOpen(false)
                                                    }
                                                    className={cn(
                                                        'flex w-full items-center justify-center gap-3 rounded-full py-4 text-base font-bold tracking-wide uppercase transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]',
                                                        url === '/profile'
                                                            ? 'neo-btn-primary'
                                                            : 'border border-slate-300 bg-slate-100 shadow-[0_3px_10px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.85)] text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-[0_3px_10px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)] dark:text-white',
                                                    )}
                                                >
                                                    <User className="h-5 w-5" />
                                                    Profile
                                                </Link>
                                                <Link
                                                    href="/logout"
                                                    method="post"
                                                    as="button"
                                                    onStart={() => setIsLoggingOut(true)}
                                                    onFinish={() => setIsLoggingOut(false)}
                                                    disabled={isLoggingOut}
                                                    onClick={(e) => {
                                                        if (isLoggingOut) {
                                                            e.preventDefault();
                                                            return;
                                                        }
                                                        setOpen(false);
                                                    }}
                                                    className="neo-btn-primary flex w-full items-center justify-center gap-3 rounded-full py-4 text-base font-bold tracking-wide text-white uppercase disabled:opacity-50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                                                >
                                                    {isLoggingOut ? (
                                                        <>
                                                            <Loader2 className="h-5 w-5 animate-spin" />
                                                            Signing out...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <LogOut className="h-5 w-5" />
                                                            Sign out
                                                        </>
                                                    )}
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
                                                className="neo-btn-primary py-4 text-base font-bold tracking-wide uppercase"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <LogIn className="h-5 w-5" />
                                                    Sign in
                                                </div>
                                            </MagneticButton>
                                        )}
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
