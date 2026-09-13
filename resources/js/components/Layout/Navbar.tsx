import type { SharedPageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
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
    Images,
    Briefcase,
    Loader2,
    Menu,
    X,
} from 'lucide-react';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import HoverScramble from '@/components/text-animations/hover-scramble';
import ThemeSwitcher from '@/components/UI/ThemeSwitcher';
import { navigationItems } from '@/lib/site';
import { cn } from '@/lib/utils';

const MobileMenu = lazy(() => import('@/components/Layout/MobileMenu'));

const IconMap: Record<string, any> = {
    PenTool,
    Globe,
    Film,
    Box,
    Code2,
    Mail,
    User,
    Home,
    Images,
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
    // Keep MobileMenu mounted once it first loads so AnimatePresence inside it
    // can play the closing animation before the component disappears.
    const [hasOpenedOnce, setHasOpenedOnce] = useState(false);
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

    // Renders the nav row. `ghost` produces a second, non-visual copy of the
    // row used only to position the mobile close button (see below) — its
    // logo/center-links/auth content is kept in the DOM (so the flex layout
    // measures identically to the real row, keeping the button pixel-aligned)
    // but made invisible and non-interactive, leaving only the button live.
    function renderNavRow(ghost: boolean) {
        return (
            <nav className="mx-auto flex max-w-7xl items-center justify-between transition-all duration-300 md:px-3 2xl:px-4">
                {/* Left Side: Logo */}
                <div
                    className={cn(
                        'flex flex-1 justify-start',
                        ghost && 'invisible',
                    )}
                >
                    <Link
                        href="/"
                        tabIndex={ghost ? -1 : undefined}
                        className={cn(
                            'touch-target inline-flex items-center rounded-full border border-slate-300 bg-slate-100 shadow-[0_3px_10px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.85)] transition-all duration-300 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-[0_3px_10px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]',
                        )}
                        aria-label="Opticore Solutions home"
                    >
                        <img
                            src="/images/logo/opticore.webp"
                            alt="Opticore Solutions"
                            width={135}
                            height={48}
                            decoding="async"
                            fetchPriority="high"
                            className="block h-16 w-auto shrink-0 object-contain md:h-18 lg:h-22 dark:hidden"
                        />
                        <img
                            src="/images/logo/opticore-white.webp"
                            alt="Opticore Solutions"
                            width={135}
                            height={48}
                            decoding="async"
                            fetchPriority="high"
                            className="hidden h-16 w-auto shrink-0 object-contain md:h-18 lg:h-22 dark:block"
                        />
                    </Link>
                </div>

                {/* Center Side: Nav Items */}
                <div
                    className={cn(
                        'hidden flex-none items-center justify-center md:flex md:gap-3 2xl:gap-4',
                        ghost && 'invisible',
                    )}
                >
                    {navItems.map((item) => (
                        <NavLink key={item.href} item={item} url={url} />
                    ))}
                </div>

                {/* Right Side: Auth & Mobile Toggle */}
                <div className="flex flex-1 items-center justify-end gap-3">
                    <div
                        className={cn(
                            'hidden items-center gap-3 md:flex',
                            ghost && 'invisible',
                        )}
                    >
                        <div className="flex h-11 items-center gap-1.5 rounded-full border border-slate-300 bg-slate-100 p-1.5 shadow-[0_3px_10px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.85)] dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-[0_3px_10px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]">
                            <ThemeSwitcher className="[&>svg]:drop-icon dark:[&>svg]:drop-icon h-8 w-8 !border-0 bg-gradient-to-b from-white to-slate-50 shadow-[0_3px_8px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(0,0,0,0.05),inset_0_1px_2px_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.05)] transition-all duration-300 hover:scale-105 hover:shadow-[0_6px_12px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.06),inset_0_0_0_1px_rgba(0,0,0,0.05),inset_0_1px_2px_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.05)] dark:from-zinc-700 dark:to-zinc-800 dark:shadow-[0_4px_6px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] dark:hover:shadow-[0_6px_12px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.2)]" />
                            {user ? (
                                <>
                                    <Link
                                        href="/profile"
                                        tabIndex={ghost ? -1 : undefined}
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
                                        tabIndex={ghost ? -1 : undefined}
                                        onStart={() => setIsLoggingOut(true)}
                                        onFinish={() => setIsLoggingOut(false)}
                                        onClick={() =>
                                            window.dispatchEvent(
                                                new CustomEvent('logout:start'),
                                            )
                                        }
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
                                    tabIndex={ghost ? -1 : undefined}
                                    className="neo-btn-ghost group relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 hover:scale-105"
                                    aria-label="Sign in"
                                >
                                    <LogIn className="drop-icon dark:drop-icon h-4 w-4 text-violet-500 dark:text-violet-400" />
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Mobile Toggle — this is the sole open/close control on
                        mobile; MobileMenu has no close button of its own, so
                        this icon never jumps to a different on-screen
                        position when the drawer opens. The real header stays
                        at its normal z-50 (behind MobileMenu's z-60
                        backdrop/rail) so the logo never appears over the open
                        menu; only the `ghost` copy of this row (rendered
                        separately at z-[70] while open, see below) is the
                        one actually visible/clickable then. */}
                    <button
                        type="button"
                        aria-hidden={ghost ? undefined : open}
                        tabIndex={ghost ? undefined : open ? -1 : undefined}
                        aria-label={
                            open
                                ? 'Close navigation menu'
                                : 'Open navigation menu'
                        }
                        className={cn(
                            'neo-btn-ghost group relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all duration-300 hover:scale-105 md:hidden',
                            !ghost && open && 'invisible',
                        )}
                        onClick={() => {
                            setHasOpenedOnce(true);
                            setOpen((current) => !current);
                        }}
                    >
                        {open ? (
                            <X className="drop-icon dark:drop-icon h-4 w-4 text-zinc-600 dark:text-zinc-300" />
                        ) : (
                            <Menu className="drop-icon dark:drop-icon h-4 w-4 text-zinc-600 dark:text-zinc-300" />
                        )}
                    </button>
                </div>
            </nav>
        );
    }

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
                {renderNavRow(false)}
            </header>

            {/* Ghost copy of the header row, rendered only while the mobile
                menu is open, at z-[70] — above MobileMenu's z-60 backdrop/rail.
                Everything except the toggle button is invisible and
                non-interactive (aria-hidden + pointer-events-none), so only
                the close button is actually visible/clickable above the open
                menu; the real header (and its logo) stays behind it. */}
            {open && (
                <div className="pointer-events-none fixed inset-x-0 top-0 z-[70] px-4 pt-4 sm:px-6 md:px-4 2xl:px-8 [&_button]:pointer-events-auto">
                    {renderNavRow(true)}
                </div>
            )}

            {/* Stays mounted after first open so AnimatePresence inside MobileMenu
                can play exit animations without the tree disappearing mid-flight. */}
            {hasOpenedOnce && (
                <Suspense fallback={null}>
                    <MobileMenu
                        url={url}
                        open={open}
                        onClose={() => setOpen(false)}
                    />
                </Suspense>
            )}
        </>
    );
}
