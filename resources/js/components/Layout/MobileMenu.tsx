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
    ArrowRight,
    Loader2,
} from 'lucide-react';
import { useState } from 'react';
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
    LogOut,
    LogIn,
};

interface MobileMenuProps {
    url: string;
    open: boolean;
    onClose: () => void;
}

const railSpring = { type: 'spring', damping: 30, stiffness: 320, mass: 0.85 } as const;

export default function MobileMenu({ url, open, onClose }: MobileMenuProps) {
    const { props } = usePage<SharedPageProps>();
    const { user } = props.auth;
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const navItems = [...navigationItems];

    const authItems = user
        ? [
              { label: 'Profile', href: '/profile', icon: 'User', isPost: false, isLogout: false },
              { label: 'Sign out', href: '/logout', icon: 'LogOut', isPost: true, isLogout: true },
          ]
        : [
              { label: 'Sign in', href: '/login', icon: 'LogIn', isPost: false, isLogout: false },
          ];

    const allItems = [
        ...navItems.map((item) => ({
            ...item,
            isPost: false,
            isLogout: false,
        })),
        ...authItems,
    ];

    return (
        // AnimatePresence lives here — it owns the enter/exit lifecycle, so the
        // component must stay mounted once first opened (see Navbar for how).
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop — its own motion element so pointer-events vanish on exit */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="fixed inset-0 z-60 bg-black/50 backdrop-blur-[3px] xl:hidden dark:bg-black/65"
                        onClick={onClose}
                    />

                    {/* Rail panel */}
                    <motion.div
                        key="rail"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={railSpring}
                        className="fixed inset-y-0 right-0 z-60 flex w-[86%] max-w-sm flex-col overflow-hidden xl:hidden
                            border-l border-slate-200/70 bg-gradient-to-b from-white to-slate-50/98
                            shadow-[-20px_0_60px_rgba(0,0,0,0.1),inset_0_0_0_1px_rgba(255,255,255,0.9)]
                            dark:border-zinc-800 dark:from-[#1c1c22] dark:to-[#08080c]
                            dark:shadow-[-24px_0_80px_rgba(0,0,0,0.85),inset_0_0_0_1px_rgba(255,255,255,0.04)]"
                    >
                        {/* Left-edge gradient glow stripe */}
                        <motion.div
                            aria-hidden
                            initial={{ opacity: 0, scaleY: 0.35 }}
                            animate={{ opacity: 1, scaleY: 1 }}
                            exit={{ opacity: 0, scaleY: 0.35 }}
                            transition={{ delay: 0.12, duration: 0.55, ease: 'easeOut' }}
                            className="pointer-events-none absolute inset-y-0 left-0 w-[3px]"
                            style={{
                                background:
                                    'linear-gradient(to bottom, transparent 0%, #7c3aed 22%, #22d3ee 72%, transparent 100%)',
                                boxShadow:
                                    '0 0 16px rgba(124,58,237,0.5), 0 0 36px rgba(34,211,238,0.18)',
                            }}
                        />

                        {/* Subtle ambient glow from the stripe */}
                        <div
                            aria-hidden
                            className="pointer-events-none absolute inset-y-0 left-0 w-28
                                bg-gradient-to-r from-violet-100/40 to-transparent
                                dark:from-violet-950/30 dark:to-transparent"
                        />

                        {/* Rail header */}
                        <div className="relative flex shrink-0 items-center justify-between pl-7 pr-5 pt-7 pb-4">
                            <Link href="/" onClick={onClose} className="inline-flex items-center">
                                <img
                                    src="/images/logo/opticore.webp"
                                    alt="Opticore Solutions"
                                    decoding="async"
                                    className="block h-9 w-auto dark:hidden"
                                />
                                <img
                                    src="/images/logo/opticore-white.webp"
                                    alt="Opticore Solutions"
                                    decoding="async"
                                    className="hidden h-9 w-auto dark:block"
                                />
                            </Link>

                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ delay: 0.2 }}
                                className="font-[family-name:var(--font-geist-mono)] text-[9px] font-semibold tracking-[0.3em] text-zinc-400 uppercase dark:text-zinc-600"
                            >
                                Navigate
                            </motion.span>
                        </div>

                        {/* Unified item list */}
                        <div className="hide-scrollbar relative flex-1 overflow-y-auto overscroll-contain pl-7 pr-5 pb-2">
                            <div>
                                {allItems.map((item, index) => {
                                    const Icon = item.icon ? IconMap[item.icon] : null;
                                    const active = !item.isLogout && url === item.href;

                                    const itemMotion = {
                                        initial: { opacity: 0, x: 28 },
                                        animate: { opacity: 1, x: 0 },
                                        exit: { opacity: 0, x: 20 },
                                        transition: {
                                            delay: index * 0.055 + 0.1,
                                            type: 'spring' as const,
                                            stiffness: 450,
                                            damping: 30,
                                        },
                                    };

                                    const rowBase =
                                        'group flex w-full items-center gap-3.5 border-b py-4 transition-all duration-200 border-slate-200/70 dark:border-white/[0.05]';

                                    if (item.isLogout) {
                                        return (
                                            <motion.div key="logout" {...itemMotion}>
                                                <Link
                                                    href={item.href}
                                                    method="post"
                                                    as="button"
                                                    onStart={() => setIsLoggingOut(true)}
                                                    onFinish={() => setIsLoggingOut(false)}
                                                    disabled={isLoggingOut}
                                                    onClick={() => {
                                                        window.dispatchEvent(
                                                            new CustomEvent('logout:start'),
                                                        );
                                                        onClose();
                                                    }}
                                                    className={cn(rowBase, 'text-left disabled:opacity-50')}
                                                >
                                                    {isLoggingOut ? (
                                                        <Loader2 className="h-5 w-5 shrink-0 animate-spin text-violet-500 dark:text-violet-400" />
                                                    ) : (
                                                        Icon && (
                                                            <Icon className="h-5 w-5 shrink-0 text-violet-500 dark:text-violet-400" />
                                                        )
                                                    )}
                                                    <span className="flex-1 text-base font-semibold text-zinc-700 dark:text-zinc-400">
                                                        {isLoggingOut ? 'Signing out…' : item.label}
                                                    </span>
                                                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform duration-200 group-hover:translate-x-0.5 dark:text-zinc-700" />
                                                </Link>
                                            </motion.div>
                                        );
                                    }

                                    return (
                                        <motion.div key={item.href} {...itemMotion}>
                                            <Link
                                                href={item.href}
                                                onClick={onClose}
                                                className={cn(rowBase)}
                                            >
                                                {Icon && (
                                                    <Icon
                                                        className={cn(
                                                            'h-5 w-5 shrink-0 transition-colors',
                                                            active
                                                                ? 'text-violet-500 dark:text-violet-400'
                                                                : 'text-zinc-400 dark:text-zinc-600',
                                                        )}
                                                    />
                                                )}
                                                <span
                                                    className={cn(
                                                        'flex-1 text-base font-semibold transition-colors',
                                                        active
                                                            ? 'bg-gradient-to-r from-violet-500 to-cyan-500 bg-clip-text text-transparent dark:from-violet-300 dark:to-cyan-300'
                                                            : 'text-zinc-700 dark:text-zinc-400',
                                                    )}
                                                >
                                                    {item.label}
                                                </span>
                                                <ArrowRight
                                                    className={cn(
                                                        'h-4 w-4 shrink-0 transition-all duration-200 group-hover:translate-x-0.5',
                                                        active
                                                            ? 'text-cyan-400 dark:text-cyan-500'
                                                            : 'text-slate-300 dark:text-zinc-700',
                                                    )}
                                                />
                                            </Link>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Footer spacer */}
                        <div className="shrink-0 pb-8" />
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
