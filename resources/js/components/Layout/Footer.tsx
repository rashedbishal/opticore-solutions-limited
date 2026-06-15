import type { SharedPageProps, SiteSettings } from '@/types';
import type { ComponentType, SVGProps } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Mail, MapPin, Phone } from 'lucide-react';
import { Fragment } from 'react';
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

export default function Footer() {
    const { siteSettings } = usePage<SharedPageProps>().props;

    const socialLinks = SOCIAL_PLATFORMS.filter(({ key }) =>
        Boolean(siteSettings[key]),
    ).map(({ key, label, icon }) => ({
        href: siteSettings[key] as string,
        label,
        icon,
    }));

    return (
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
                            Premium digital agency services spanning strategy,
                            design, motion, production, and high-performance web
                            experiences.
                        </p>
                        {siteSettings.phoneBangladeshLink && (
                            <MagneticButton
                                href={siteSettings.phoneBangladeshLink}
                                ariaLabel="Call Opticore Solutions Ltd. now"
                            >
                                Call now
                            </MagneticButton>
                        )}
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
                            {socialLinks.map(({ href, label, icon: Icon }) => (
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
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex flex-col items-center justify-between gap-6 border-t border-theme pt-6 text-center text-sm text-theme-subtle sm:flex-row sm:text-left">
                    <p>© 2026 Opticore Solutions Ltd. All rights reserved.</p>
                    <p className="max-w-md">
                        Built for brands that want sharper positioning, stronger
                        visuals, and digital experiences with weight.
                    </p>
                </div>
            </div>
        </footer>
    );
}
