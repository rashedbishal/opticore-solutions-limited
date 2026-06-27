import type { SharedPageProps, SiteSettings } from '@/types';
import type { ComponentType, SVGProps } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Mail, MapPin, Phone, Loader2 } from 'lucide-react';
import {
    Fragment,
    lazy,
    Suspense,
    useState,
    useRef,
    useCallback,
    useEffect,
} from 'react';
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

const SubscriptionModal = lazy(
    () => import('@/components/Layout/SubscriptionModal'),
);

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

export default function Footer() {
    const { siteSettings, footerServices, flash } =
        usePage<SharedPageProps>().props;

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
                <div className="section-shell pt-8 pb-6 md:pt-10 md:pb-8 lg:pt-12 lg:pb-10">
                    <div className="section-inner grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-5">
                            <Link
                                href="/"
                                className="inline-flex items-center text-theme"
                            >
                                <img
                                    src="/images/logo/opticore.webp"
                                    alt="Opticore Solutions"
                                    width={180}
                                    height={64}
                                    loading="lazy"
                                    decoding="async"
                                    className="h-16 w-auto shrink-0 object-contain dark:hidden"
                                />
                                <img
                                    src="/images/logo/opticore-white.webp"
                                    alt="Opticore Solutions"
                                    width={180}
                                    height={64}
                                    loading="lazy"
                                    decoding="async"
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
                                    ariaLabel="Call now — Opticore Solutions Ltd."
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
                                {footerServices.map((item) => (
                                    <Link
                                        key={item.slug}
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

            {/* Portaled to <body> — footer has its own z-10 stacking context */}
            {modalVariant && (
                <Suspense fallback={null}>
                    <SubscriptionModal
                        variant={modalVariant}
                        onClose={() => setModalVariant(null)}
                    />
                </Suspense>
            )}
        </>
    );
}
