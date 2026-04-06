import { Link } from '@inertiajs/react';
import { Aperture, BriefcaseBusiness, Camera, Globe, Mail, MapPin, Phone, Play } from 'lucide-react';
import MagneticButton from '@/components/UI/MagneticButton';
import { navigationItems } from '@/lib/site';

const companyLinks = [
    { label: 'About Us', href: '/about-us' },
    { label: 'Career', href: '/career' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms & Conditions', href: '/terms-conditions' },
];

const socialLinks = [
    { href: 'https://facebook.com', label: 'Facebook', icon: Globe },
    { href: 'https://instagram.com', label: 'Instagram', icon: Camera },
    { href: 'https://linkedin.com', label: 'LinkedIn', icon: BriefcaseBusiness },
    { href: 'https://youtube.com', label: 'YouTube', icon: Play },
];

export default function Footer() {
    return (
        <footer className="relative z-10 border-t border-white/10 bg-black/40">
            <div className="h-px w-full bg-linear-to-r from-violet-500 via-cyan-400 to-violet-500" />
            <div className="section-shell pb-8 pt-14 md:pt-18 lg:pt-20">
                <div className="section-inner grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-5">
                        <Link href="/" className="inline-flex items-center gap-3 text-white">
                            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5">
                                <Aperture className="h-6 w-6 text-violet-300" />
                            </span>
                            <span className="text-lg font-semibold">Opticore Solutions Ltd.</span>
                        </Link>
                        <p className="max-w-sm text-sm leading-7 text-zinc-400">
                            Premium digital agency services spanning strategy, design, motion, production, and high-performance web experiences.
                        </p>
                        <MagneticButton
                            href="/request-appointment"
                            ariaLabel="Start a project with Opticore Solutions Ltd."
                        >
                            Start a Project
                        </MagneticButton>
                    </div>

                    <div>
                        <h3 className="mb-5 text-sm font-semibold tracking-[0.24em] text-zinc-300 uppercase">Services</h3>
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
                        <h3 className="mb-5 text-sm font-semibold tracking-[0.24em] text-zinc-300 uppercase">Company</h3>
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

                    <div>
                        <h3 className="mb-5 text-sm font-semibold tracking-[0.24em] text-zinc-300 uppercase">Contact</h3>
                        <div className="space-y-4 text-sm text-zinc-400">
                            <p className="flex items-start gap-3">
                                <Phone className="mt-1 h-4 w-4 text-violet-300" />
                                <span>+1 (575) 303-6925<br />+88-01896204400</span>
                            </p>
                            <p className="flex items-start gap-3">
                                <Mail className="mt-1 h-4 w-4 text-violet-300" />
                                <span>hello@opticoresolutions.com</span>
                            </p>
                            <p className="flex items-start gap-3">
                                <MapPin className="mt-1 h-4 w-4 text-violet-300" />
                                <span>Dhaka, Bangladesh with remote delivery for clients worldwide.</span>
                            </p>
                        </div>
                        <div className="mt-6 flex flex-wrap gap-3">
                            {socialLinks.map(({ href, label, icon: Icon }) => (
                                <a
                                    key={label}
                                    href={href}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label={label}
                                    className="touch-target inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-300 transition-all duration-300 hover:border-violet-400/40 hover:text-white hover:shadow-[0_0_25px_rgba(124,58,237,0.35)]"
                                >
                                    <Icon className="h-4 w-4" />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-center text-sm text-zinc-500 sm:flex-row sm:text-left">
                    <p>© 2026 Opticore Solutions Ltd. All rights reserved.</p>
                    <p>Built for brands that want sharper positioning, stronger visuals, and digital experiences with weight.</p>
                </div>
            </div>
        </footer>
    );
}
