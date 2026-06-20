import type { SharedPageProps, SiteSettings } from '@/types';
import type { ComponentType, SVGProps } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Mail, MapPin, Phone, CheckCircle, Loader2 } from 'lucide-react';
import { Fragment, useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    check,
    subscribe,
    unsubscribe,
} from '@/actions/App/Http/Controllers/SubscriptionController';
import MagneticButton from '@/components/UI/MagneticButton';
import {
    FacebookIcon,
    XIcon,
    InstagramIcon,
    LinkedInIcon,
    YouTubeIcon,
    BehanceIcon,
    PinterestIcon,
    TikTokIcon,
} from '@/components/UI/SocialIcons';
import { services } from '@/lib/site';

const companyLinks = [
    { label: 'About Us', href: '/about-us' },
    { label: 'Message from MD', href: '/message-from-md' },
    { label: 'Career', href: '/career' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Blogs', href: '/blogs' },
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms & Conditions', href: '/terms-conditions' },
];

const SOCIAL_PLATFORMS: {
    key: keyof Pick<
        SiteSettings,
        | 'socialFacebook'
        | 'socialX'
        | 'socialInstagram'
        | 'socialLinkedin'
        | 'socialYoutube'
        | 'socialBehance'
        | 'socialPinterest'
        | 'socialTiktok'
    >;
    label: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
}[] = [
    { key: 'socialFacebook', label: 'Facebook', icon: FacebookIcon },
    { key: 'socialX', label: 'X (Twitter)', icon: XIcon },
    { key: 'socialInstagram', label: 'Instagram', icon: InstagramIcon },
    { key: 'socialLinkedin', label: 'LinkedIn', icon: LinkedInIcon },
    { key: 'socialYoutube', label: 'YouTube', icon: YouTubeIcon },
    { key: 'socialBehance', label: 'Behance', icon: BehanceIcon },
    { key: 'socialPinterest', label: 'Pinterest', icon: PinterestIcon },
    { key: 'socialTiktok', label: 'TikTok', icon: TikTokIcon },
];

function renderMultiline(text: string | null) {
    if (!text) {
        return null;
    }

    return text.split('\n').map((line, index) => (
        <Fragment key={index}>
            {index > 0 && <br />}
            {line}
        </Fragment>
    ));
}

type SubscriptionModalVariant =
    | 'pending-subscribe'
    | 'pending-unsubscribe'
    | 'subscribed'
    | 'unsubscribed';

const SUBSCRIPTION_MODAL_COPY: Record<
    SubscriptionModalVariant,
    { eyebrow: string; title: string; body: string }
> = {
    'pending-subscribe': {
        eyebrow: 'Confirmation Sent',
        title: 'Check your inbox',
        body: "We've emailed a confirmation link — click it to start receiving updates & exclusive offers.",
    },
    'pending-unsubscribe': {
        eyebrow: 'Confirmation Sent',
        title: 'Check your inbox',
        body: "We've emailed a confirmation link — click it to confirm you'd like to stop receiving updates.",
    },
    subscribed: {
        eyebrow: 'Subscription Confirmed',
        title: "You're subscribed!",
        body: "You'll receive exclusive offers and updates from Opticore Solutions.",
    },
    unsubscribed: {
        eyebrow: 'Unsubscribed',
        title: "You've been unsubscribed",
        body: "You won't receive any more newsletter emails from us. Changed your mind? You can resubscribe anytime.",
    },
};

export default function Footer() {
    const { siteSettings, flash } = usePage<SharedPageProps>().props;

    const socialLinks = SOCIAL_PLATFORMS.filter(({ key }) =>
        Boolean(siteSettings[key]),
    ).map(({ key, label, icon }) => ({
        href: siteSettings[key] as string,
        label,
        icon,
    }));

    const [email, setEmail] = useState('');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [checking, setChecking] = useState(false);
    const [loading, setLoading] = useState(false);
    const [modalVariant, setModalVariant] =
        useState<SubscriptionModalVariant | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (
            flash?.subscription === 'subscribed' ||
            flash?.subscription === 'unsubscribed'
        ) {
            setModalVariant(flash.subscription);
        }
    }, [flash?.subscription]);

    const checkEmail = useCallback(async (value: string) => {
        if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            setIsSubscribed(false);

            return;
        }

        setChecking(true);

        try {
            const res = await fetch(check.url({ query: { email: value } }));
            const data = await res.json();
            setIsSubscribed(Boolean(data.subscribed));
        } catch {
            setIsSubscribed(false);
        } finally {
            setChecking(false);
        }
    }, []);

    function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.target.value;
        setEmail(value);

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => checkEmail(value), 500);
    }

    function getCsrf(): string {
        return (
            document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
                ?.content ?? ''
        );
    }

    async function handleAction() {
        if (!email || loading) {
            return;
        }

        setLoading(true);
        const headers = {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': getCsrf(),
        };

        try {
            if (isSubscribed) {
                const res = await fetch(unsubscribe.url(), {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ email }),
                });

                if (res.ok) {
                    setModalVariant('pending-unsubscribe');
                    setEmail('');
                }
            } else {
                const res = await fetch(subscribe.url(), {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ email }),
                });

                if (res.ok) {
                    setModalVariant('pending-subscribe');
                    setEmail('');
                }
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <footer className="relative z-10 border-t border-theme bg-theme-surface">
                <div className="h-px w-full bg-linear-to-r from-violet-500 via-cyan-400 to-violet-500" />
                <div className="section-shell pt-14 pb-32 md:pt-18 md:pb-36 lg:pt-20 lg:pb-40">
                    <div className="section-inner grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-5">
                            <Link
                                href="/"
                                className="inline-flex items-center text-theme"
                            >
                                <img
                                    src="/images/logo/opticore.webp"
                                    alt="Opticore Solutions"
                                    className="h-16 w-auto shrink-0 object-contain dark:hidden"
                                />
                                <img
                                    src="/images/logo/opticore-white.webp"
                                    alt="Opticore Solutions"
                                    className="hidden h-16 w-auto shrink-0 object-contain dark:block"
                                />
                            </Link>
                            <p className="max-w-sm text-sm leading-7 text-theme-muted">
                                Premium digital agency services spanning
                                strategy, design, motion, production, and
                                high-performance web experiences.
                            </p>
                            {siteSettings.phoneBangladeshLink && (
                                <MagneticButton
                                    href={siteSettings.phoneBangladeshLink}
                                    ariaLabel="Call Opticore Solutions Ltd. now"
                                >
                                    Call now
                                </MagneticButton>
                            )}

                            {/* Newsletter subscription */}
                            <div className="pt-1">
                                <p className="mb-2 text-[11px] font-semibold tracking-wider text-theme-muted uppercase">
                                    Newsletter
                                </p>
                                <p className="mb-3 text-xs leading-relaxed text-theme-subtle">
                                    Subscribe for updates &amp; exclusive
                                    offers.
                                </p>
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={handleEmailChange}
                                        placeholder="your@email.com"
                                        className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder-white/25 transition-all outline-none focus:border-violet-500/40 focus:bg-violet-500/5"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAction}
                                        disabled={loading || checking || !email}
                                        className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                                            isSubscribed
                                                ? 'border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                                                : 'border border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20'
                                        }`}
                                    >
                                        {loading || checking ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : isSubscribed ? (
                                            'Unsubscribe'
                                        ) : (
                                            'Subscribe'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="mb-5 text-sm font-semibold tracking-wider text-theme-muted uppercase">
                                Services
                            </h3>
                            <div className="space-y-3">
                                {services.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className="block text-sm text-theme-muted transition-colors hover:text-theme"
                                    >
                                        {item.name}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="mb-5 text-sm font-semibold tracking-wider text-theme-muted uppercase">
                                Company
                            </h3>
                            <div className="space-y-3">
                                {companyLinks.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className="block text-sm text-theme-muted transition-colors hover:text-theme"
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="lg:col-span-1">
                            <h3 className="mb-5 text-sm font-semibold tracking-wider text-theme-muted uppercase">
                                Contact
                            </h3>
                            <div className="space-y-6 text-sm text-theme-muted">
                                <div className="space-y-3">
                                    {siteSettings.email && (
                                        <p className="flex items-center gap-3">
                                            <Mail className="h-4 w-4 text-violet-500 dark:text-violet-300" />
                                            <a
                                                href={`mailto:${siteSettings.email}`}
                                                className="transition-colors hover:text-theme"
                                            >
                                                {siteSettings.email}
                                            </a>
                                        </p>
                                    )}
                                    {(siteSettings.phoneUsa ||
                                        siteSettings.phoneBangladesh) && (
                                        <p className="flex items-start gap-3">
                                            <Phone className="mt-1 h-4 w-4 text-violet-500 dark:text-violet-300" />
                                            <span>
                                                {siteSettings.phoneUsa}
                                                {siteSettings.phoneUsa &&
                                                    siteSettings.phoneBangladesh && (
                                                        <br />
                                                    )}
                                                {siteSettings.phoneBangladesh}
                                            </span>
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-4 pt-2">
                                    <div className="flex items-start gap-3">
                                        <MapPin className="mt-1 h-4 w-4 shrink-0 text-violet-500 dark:text-violet-300" />
                                        <div>
                                            <p className="font-bold text-theme">
                                                USA
                                            </p>
                                            <p className="mt-1 text-[13px] leading-relaxed text-theme-subtle">
                                                {renderMultiline(
                                                    siteSettings.addressUsa,
                                                )}
                                            </p>
                                            {siteSettings.addressUsaMapUrl && (
                                                <a
                                                    href={
                                                        siteSettings.addressUsaMapUrl
                                                    }
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="mt-1.5 inline-block text-[12px] font-bold tracking-wider text-cyan-600 uppercase transition-colors hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300"
                                                >
                                                    View on Map
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 pt-2">
                                        <MapPin className="mt-1 h-4 w-4 shrink-0 text-violet-500 dark:text-violet-300" />
                                        <div>
                                            <p className="font-bold text-theme">
                                                Bangladesh
                                            </p>
                                            <p className="mt-1 text-[13px] text-theme-subtle">
                                                {renderMultiline(
                                                    siteSettings.addressBangladesh,
                                                )}
                                            </p>
                                            {siteSettings.addressBangladeshMapUrl && (
                                                <a
                                                    href={
                                                        siteSettings.addressBangladeshMapUrl
                                                    }
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="mt-1.5 inline-block text-[12px] font-bold tracking-wider text-cyan-600 uppercase transition-colors hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300"
                                                >
                                                    View on Map
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex flex-wrap gap-2.5">
                                {socialLinks.map(
                                    ({ href, label, icon: Icon }) => (
                                        <a
                                            key={label}
                                            href={href}
                                            target="_blank"
                                            rel="noreferrer"
                                            aria-label={label}
                                            className="neo-btn-ghost group relative inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition-all duration-300 hover:-translate-y-1 hover:text-violet-600 dark:text-zinc-400 dark:hover:text-violet-400"
                                        >
                                            <Icon className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                                        </a>
                                    ),
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 flex flex-col items-center justify-between gap-6 border-t border-theme pt-6 text-center text-sm text-theme-subtle sm:flex-row sm:text-left">
                        <p>
                            © 2026 Opticore Solutions Ltd. All rights reserved.
                        </p>
                        <p className="max-w-md">
                            Built for brands that want sharper positioning,
                            stronger visuals, and digital experiences with
                            weight.
                        </p>
                    </div>
                </div>
            </footer>

            {/* Portaled to <body> — <footer> has its own z-10 stacking context
            (see AppLayout's <motion.main className="z-20">), which would
            otherwise cap this modal below the page's main content no
            matter how high its own z-index goes. */}
            {typeof document !== 'undefined' &&
                createPortal(
                    <AnimatePresence>
                        {modalVariant && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.18 }}
                                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                                style={{
                                    backdropFilter: 'blur(6px)',
                                    background: 'rgba(0,0,0,0.65)',
                                }}
                                onClick={() => setModalVariant(null)}
                            >
                                <motion.div
                                    initial={{
                                        opacity: 0,
                                        scale: 0.88,
                                        y: -20,
                                    }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: -12 }}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 380,
                                        damping: 28,
                                    }}
                                    className="relative w-full max-w-sm overflow-hidden rounded-2xl text-center"
                                    style={{
                                        background:
                                            'linear-gradient(148deg, #0e1225, #090d1b)',
                                        border: '1px solid rgba(124,58,237,0.35)',
                                        boxShadow:
                                            '0 0 0 1px rgba(124,58,237,0.08), 0 32px 80px rgba(0,0,0,0.85), 0 0 70px rgba(124,58,237,0.2)',
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/70 to-transparent" />

                                    <div className="px-6 py-8">
                                        <motion.div
                                            animate={{ scale: [1, 1.1, 1] }}
                                            transition={{
                                                duration: 1.6,
                                                repeat: Infinity,
                                                ease: 'easeInOut',
                                            }}
                                            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
                                            style={{
                                                background:
                                                    'rgba(124,58,237,0.12)',
                                                border: '1px solid rgba(124,58,237,0.35)',
                                                boxShadow:
                                                    '0 0 28px rgba(124,58,237,0.25)',
                                            }}
                                        >
                                            {modalVariant.startsWith(
                                                'pending',
                                            ) ? (
                                                <Mail className="h-7 w-7 text-violet-400" />
                                            ) : (
                                                <CheckCircle className="h-7 w-7 text-violet-400" />
                                            )}
                                        </motion.div>

                                        <p className="mb-1 font-mono text-[9px] tracking-[0.28em] text-violet-400/60 uppercase">
                                            ◈{' '}
                                            {
                                                SUBSCRIPTION_MODAL_COPY[
                                                    modalVariant
                                                ].eyebrow
                                            }
                                        </p>
                                        <h3 className="text-base font-semibold text-white">
                                            {
                                                SUBSCRIPTION_MODAL_COPY[
                                                    modalVariant
                                                ].title
                                            }
                                        </h3>
                                        <p className="mt-2 text-xs leading-relaxed text-white/50">
                                            {
                                                SUBSCRIPTION_MODAL_COPY[
                                                    modalVariant
                                                ].body
                                            }
                                        </p>

                                        <motion.button
                                            onClick={() =>
                                                setModalVariant(null)
                                            }
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                            className="relative mt-6 inline-flex w-full items-center justify-center overflow-hidden rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_18px_rgba(124,58,237,0.3)] transition-all hover:from-violet-500 hover:to-indigo-500"
                                        >
                                            <motion.div
                                                animate={{
                                                    x: ['-120%', '220%'],
                                                }}
                                                transition={{
                                                    duration: 2,
                                                    repeat: Infinity,
                                                    repeatDelay: 1,
                                                    ease: 'easeInOut',
                                                }}
                                                className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                            />
                                            <span className="relative">
                                                Got it
                                            </span>
                                        </motion.button>
                                    </div>

                                    <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-violet-500/35 to-transparent" />
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body,
                )}
        </>
    );
}
