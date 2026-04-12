import { Link } from '@inertiajs/react';
import {
    BriefcaseBusiness,
    Camera,
    Globe,
    Instagram,
    Linkedin,
    Mail,
    MapPin,
    Music,
    Palette,
    Phone,
    Pin,
    Play,
    Send,
    Twitter,
    Youtube,
} from 'lucide-react';
// Note: If some brand icons are still missing in v1.7.0, we use metaphorical fallbacks:
// Facebook -> Globe, X/Twitter -> Send, etc.
import MagneticButton from '@/components/UI/MagneticButton';
import { CursorSwitcher } from '@/components/UI/CursorSelector';
import { navigationItems } from '@/lib/site';

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
        <footer className="relative z-10 border-t border-white/10 bg-black/40">
            <div className="h-px w-full bg-linear-to-r from-violet-500 via-cyan-400 to-violet-500" />
            <div className="section-shell pt-14 pb-8 md:pt-18 lg:pt-20">
                <div className="section-inner grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-5">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-3 text-white"
                        >
                            <img
                                src="/images/logo/logo.svg"
                                alt="Opticore Solutions Logo"
                                className="h-10 w-10 shrink-0 object-contain"
                            />
                            <span className="text-lg font-semibold">
                                Opticore Solutions Ltd.
                            </span>
                        </Link>
                        <p className="max-w-sm text-sm leading-7 text-zinc-400">
                            Premium digital agency services spanning strategy,
                            design, motion, production, and high-performance web
                            experiences.
                        </p>
                        <MagneticButton
                            href="/request-appointment"
                            ariaLabel="Start a project with Opticore Solutions Ltd."
                        >
                            Start a Project
                        </MagneticButton>
                    </div>

                    <div>
                        <h3 className="mb-5 text-sm font-semibold tracking-[0.24em] text-zinc-300 uppercase">
                            Services
                        </h3>
                        <div className="space-y-3">
                            {navigationItems.slice(0, 5).map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="block text-sm text-zinc-400 transition-colors hover:text-white"
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="mb-5 text-sm font-semibold tracking-[0.24em] text-zinc-300 uppercase">
                            Company
                        </h3>
                        <div className="space-y-3">
                            {companyLinks.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="block text-sm text-zinc-400 transition-colors hover:text-white"
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <h3 className="mb-5 text-sm font-semibold tracking-[0.24em] text-zinc-300 uppercase">
                            Contact
                        </h3>
                        <div className="space-y-6 text-sm text-zinc-400">
                            <div className="space-y-3">
                                <p className="flex items-center gap-3">
                                    <Mail className="h-4 w-4 text-violet-300" />
                                    <a
                                        href="mailto:osl@opticoresolutionsltd.com"
                                        className="transition-colors hover:text-white"
                                    >
                                        osl@opticoresolutionsltd.com
                                    </a>
                                </p>
                                <p className="flex items-start gap-3">
                                    <Phone className="mt-1 h-4 w-4 text-violet-300" />
                                    <span>
                                        +1 (575) 303-6925
                                        <br />
                                        +88-01896204400
                                    </span>
                                </p>
                            </div>

                            <div className="space-y-4 pt-2">
                                <div className="flex items-start gap-3">
                                    <MapPin className="mt-1 h-4 w-4 shrink-0 text-violet-300" />
                                    <div>
                                        <p className="font-bold text-zinc-200">
                                            USA Office
                                        </p>
                                        <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
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
                                            className="mt-1.5 inline-block text-[10px] font-bold tracking-widest text-cyan-400 uppercase transition-colors hover:text-cyan-300"
                                        >
                                            View on Map
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 pt-2">
                                    <MapPin className="mt-1 h-4 w-4 shrink-0 text-violet-300" />
                                    <div>
                                        <p className="font-bold text-zinc-200">
                                            BD Office
                                        </p>
                                        <p className="mt-1 text-[11px] text-zinc-500">
                                            House # 1178, (1st Floor) Apt.- 2E
                                            <br />
                                            East Monipur, Mirpur, Dhaka-1216
                                        </p>
                                        <a
                                            href="https://maps.app.goo.gl/7zvqD4Lemwst7bEQ8"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="mt-1.5 inline-block text-[10px] font-bold tracking-widest text-cyan-400 uppercase transition-colors hover:text-cyan-300"
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
                                    className="group inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 transition-all duration-300 hover:border-violet-500/50 hover:bg-violet-500/10 hover:text-white"
                                >
                                    <Icon className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-center text-sm text-zinc-500 sm:flex-row sm:text-left">
                    <p>© 2026 Opticore Solutions Ltd. All rights reserved.</p>
                    <CursorSwitcher />
                    <p>
                        Built for brands that want sharper positioning, stronger
                        visuals, and digital experiences with weight.
                    </p>
                </div>
            </div>
        </footer>
    );
}
