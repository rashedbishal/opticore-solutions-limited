import { Link } from '@inertiajs/react';
import {
    BriefcaseBusiness,
    Camera,
    Globe,
    Mail,
    MapPin,
    Music,
    Palette,
    Phone,
    Pin,
    Play,
    Send,
} from 'lucide-react';
import MagneticButton from '@/components/UI/MagneticButton';
import ThemeSwitcher from '@/components/UI/ThemeSwitcher';
import {
    bangladeshPhoneLink,
    bangladeshPhoneNumber,
    services,
} from '@/lib/site';

const companyLinks = [
    { label: 'About Us', href: '/about-us' },
    { label: 'Message from MD', href: '/message-from-md' },
    { label: 'Career', href: '/career' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Blogs', href: '/blogs' },
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms & Conditions', href: '/terms-conditions' },
];

const socialLinks = [
    {
        href: 'https://www.facebook.com/opticoresolutionsltd',
        label: 'Facebook',
        icon: Globe,
    },
    { href: 'https://x.com/osl_opticore', label: 'X (Twitter)', icon: Send },
    {
        href: 'https://www.instagram.com/opticoresolutionsltd',
        label: 'Instagram',
        icon: Camera,
    },
    {
        href: 'https://www.linkedin.com/in/opticoresolutionsltd',
        label: 'LinkedIn',
        icon: BriefcaseBusiness,
    },
    {
        href: 'https://www.youtube.com/@OpticoreSolutionsLtd',
        label: 'YouTube',
        icon: Play,
    },
    {
        href: 'https://www.behance.net/opticorsolutionsltd#',
        label: 'Behance',
        icon: Palette,
    },
    {
        href: 'https://www.pinterest.com/opticoresolutionsltd',
        label: 'Pinterest',
        icon: Pin,
    },
    {
        href: 'https://www.tiktok.com/@opticoresolutionsltd',
        label: 'TikTok',
        icon: Music,
    },
];

export default function Footer() {
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
                                src="/images/logo/opticore.png"
                                alt="Opticore Solutions"
                                className="h-11 w-auto shrink-0 object-contain"
                            />
                        </Link>
                        <p className="max-w-sm text-sm leading-7 text-theme-muted">
                            Premium digital agency services spanning strategy,
                            design, motion, production, and high-performance web
                            experiences.
                        </p>
                        <MagneticButton
                            href={bangladeshPhoneLink}
                            ariaLabel="Call Opticore Solutions Ltd. now"
                        >
                            Call now
                        </MagneticButton>
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
                                <p className="flex items-center gap-3">
                                    <Mail className="h-4 w-4 text-violet-500 dark:text-violet-300" />
                                    <a
                                        href="mailto:osl@opticoresolutionsltd.com"
                                        className="transition-colors hover:text-theme"
                                    >
                                        osl@opticoresolutionsltd.com
                                    </a>
                                </p>
                                <p className="flex items-start gap-3">
                                    <Phone className="mt-1 h-4 w-4 text-violet-500 dark:text-violet-300" />
                                    <span>
                                        +1 (575) 303-6925
                                        <br />
                                        {bangladeshPhoneNumber}
                                    </span>
                                </p>
                            </div>

                            <div className="space-y-4 pt-2">
                                <div className="flex items-start gap-3">
                                    <MapPin className="mt-1 h-4 w-4 shrink-0 text-violet-500 dark:text-violet-300" />
                                    <div>
                                        <p className="font-bold text-theme">
                                            USA
                                        </p>
                                        <p className="mt-1 text-[13px] leading-relaxed text-theme-subtle">
                                            Opticore Solutions LLC
                                            <br />
                                            1209 Mountain Road PL NE STE N
                                            <br />
                                            Albuquerque, NM 87110
                                        </p>
                                        <a
                                            href="https://maps.app.goo.gl/Ghn2hcVHHid6FQwv6"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="mt-1.5 inline-block text-[12px] font-bold tracking-wider text-cyan-600 uppercase transition-colors hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300"
                                        >
                                            View on Map
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 pt-2">
                                    <MapPin className="mt-1 h-4 w-4 shrink-0 text-violet-500 dark:text-violet-300" />
                                    <div>
                                        <p className="font-bold text-theme">
                                            Bangladesh
                                        </p>
                                        <p className="mt-1 text-[13px] text-theme-subtle">
                                            House # 1178, (1st Floor) Apt.- 2E
                                            <br />
                                            East Monipur, Mirpur, Dhaka-1216
                                        </p>
                                        <a
                                            href="https://maps.app.goo.gl/7zvqD4Lemwst7bEQ8"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="mt-1.5 inline-block text-[12px] font-bold tracking-wider text-cyan-600 uppercase transition-colors hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300"
                                        >
                                            View on Map
                                        </a>
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
                                    className="group inline-flex h-9 w-9 items-center justify-center rounded-xl border border-theme bg-theme-surface text-theme-muted transition-all duration-300 hover:border-violet-500/50 hover:bg-violet-500/10 hover:text-theme"
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
                    <ThemeSwitcher />
                </div>
            </div>
        </footer>
    );
}
