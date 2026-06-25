import type { SharedPageProps } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { AnimatePresence, m as motion } from 'framer-motion';
import {
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
    X,
    Loader2,
} from 'lucide-react';
import { useState } from 'react';
import HoverScramble from '@/components/text-animations/hover-scramble';
import MagneticButton from '@/components/UI/MagneticButton';
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

interface MobileMenuProps {
    url: string;
    onClose: () => void;
}

export default function MobileMenu({ url, onClose }: MobileMenuProps) {
    const { props } = usePage<SharedPageProps>();
    const { user } = props.auth;
    const navItems = [...navigationItems];
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-60 flex flex-col bg-slate-100 xl:hidden dark:bg-zinc-900"
            >
                <div className="flex h-full flex-col">
                    <div className="px-4 pt-4 sm:px-6">
                        <div className="mx-auto flex max-w-7xl items-center justify-between">
                            <Link
                                href="/"
                                className="touch-target inline-flex items-center rounded-full border border-transparent bg-transparent p-2"
                                onClick={onClose}
                            >
                                <img
                                    src="/images/logo/opticore.webp"
                                    alt="Opticore Solutions"
                                    decoding="async"
                                    className="block h-12 w-auto shrink-0 object-contain md:h-20 dark:hidden"
                                />
                                <img
                                    src="/images/logo/opticore-white.webp"
                                    alt="Opticore Solutions"
                                    decoding="async"
                                    className="hidden h-12 w-auto shrink-0 object-contain md:h-20 dark:block"
                                />
                            </Link>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-slate-200 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>

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
                                            'flex w-full items-center justify-center rounded-2xl border px-2 py-2.5 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] md:px-3 md:py-3 lg:px-4 lg:py-3.5',
                                            url === item.href
                                                ? 'neo-btn-primary border-violet-500/40'
                                                : 'border-slate-300 bg-slate-100 shadow-[0_3px_10px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.85)] dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-[0_3px_10px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]',
                                        )}
                                        onClick={onClose}
                                    >
                                        <div className="flex items-center gap-4">
                                            {item.icon &&
                                                IconMap[item.icon] && (
                                                    <div className="items-center justify-center rounded-xl text-violet-400">
                                                        {(() => {
                                                            const Icon =
                                                                IconMap[
                                                                    item.icon!
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
                                            onClick={onClose}
                                            className={cn(
                                                'flex w-full items-center justify-center gap-3 rounded-full py-4 text-base font-bold tracking-wide uppercase transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]',
                                                url === '/profile'
                                                    ? 'neo-btn-primary'
                                                    : 'border border-slate-300 bg-slate-100 text-zinc-900 shadow-[0_3px_10px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.85)] dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:shadow-[0_3px_10px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]',
                                            )}
                                        >
                                            <User className="h-5 w-5" />
                                            Profile
                                        </Link>
                                        <Link
                                            href="/logout"
                                            method="post"
                                            as="button"
                                            onStart={() =>
                                                setIsLoggingOut(true)
                                            }
                                            onFinish={() =>
                                                setIsLoggingOut(false)
                                            }
                                            disabled={isLoggingOut}
                                            onClick={(e) => {
                                                if (isLoggingOut) {
                                                    e.preventDefault();

                                                    return;
                                                }

                                                window.dispatchEvent(
                                                    new CustomEvent(
                                                        'logout:start',
                                                    ),
                                                );
                                                onClose();
                                            }}
                                            className="neo-btn-primary flex w-full items-center justify-center gap-3 rounded-full py-4 text-base font-bold tracking-wide text-white uppercase transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
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
                                        onClick={onClose}
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
        </AnimatePresence>
    );
}
