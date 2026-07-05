import type { ContactFormData, SharedPageProps, SiteSettings } from '@/types';
import type { LucideIcon } from 'lucide-react';
import { Head, useForm as useInertiaForm, usePage } from '@inertiajs/react';
import { m as motion, AnimatePresence } from 'framer-motion';
import {
    BriefcaseBusiness,
    Camera,
    CheckCircle2,
    Globe,
    Mail,
    MapPin,
    Phone,
    Play,
    Send,
    MessageSquare,
    Info,
    Share2,
    Palette,
    Pin,
    Music,
    Loader2,
} from 'lucide-react';
import React from 'react';
import HandwritingText from '@/components/text-animations/handwriting-text';
import GlowingKicker from '@/components/UI/GlowingKicker';
import GradientOrb from '@/components/UI/GradientOrb';
import MagneticButton from '@/components/UI/MagneticButton';
import { cn } from '@/lib/utils';

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
    icon: LucideIcon;
}[] = [
    { key: 'socialFacebook', label: 'Facebook', icon: Globe },
    { key: 'socialX', label: 'X (Twitter)', icon: Send },
    { key: 'socialInstagram', label: 'Instagram', icon: Camera },
    { key: 'socialLinkedin', label: 'LinkedIn', icon: BriefcaseBusiness },
    { key: 'socialYoutube', label: 'YouTube', icon: Play },
    { key: 'socialBehance', label: 'Behance', icon: Palette },
    { key: 'socialPinterest', label: 'Pinterest', icon: Pin },
    { key: 'socialTiktok', label: 'TikTok', icon: Music },
];

const initialValues: ContactFormData = {
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
};

export default function Contact() {
    const { siteSettings } = usePage<SharedPageProps>().props;
    const form = useInertiaForm<ContactFormData>(initialValues);
    const [submitted, setSubmitted] = React.useState(false);

    const contactItems = [
        {
            id: 'phone',
            label: 'Phone Number',
            value: siteSettings.phoneBangladesh,
            subValue: siteSettings.phoneUsa,
            icon: Phone,
            color: 'from-violet-500/20 to-violet-500/5',
            iconColor: 'text-violet-400',
        },
        {
            id: 'email',
            label: 'Email Address',
            value: siteSettings.email,
            icon: Mail,
            color: 'from-cyan-500/20 to-cyan-500/5',
            iconColor: 'text-cyan-400',
        },
    ].filter((item) => Boolean(item.value));

    const socialLinks = SOCIAL_PLATFORMS.filter(({ key }) =>
        Boolean(siteSettings[key]),
    ).map(({ key, label, icon }) => ({
        href: siteSettings[key] as string,
        label,
        icon,
    }));

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        form.clearErrors();
        let hasErrors = false;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!form.data.name || form.data.name.trim().length === 0) {
            form.setError('name', 'Name is required.');
            hasErrors = true;
        }

        if (!form.data.email || !emailRegex.test(form.data.email)) {
            form.setError(
                'email',
                'Please enter a valid email address with a domain.',
            );
            hasErrors = true;
        }

        if (form.data.phone) {
            const digitCount = form.data.phone.replace(/\D/g, '').length;

            if (digitCount < 7 || digitCount > 15) {
                form.setError(
                    'phone',
                    'Phone number must be between 7 and 15 digits.',
                );
                hasErrors = true;
            }
        }

        if (!form.data.subject || form.data.subject.trim().length === 0) {
            form.setError('subject', 'Subject is required.');
            hasErrors = true;
        }

        if (!form.data.message || form.data.message.trim().length === 0) {
            form.setError('message', 'Message is required.');
            hasErrors = true;
        }

        if (hasErrors) {
            return;
        }

        form.post('/api/contact', {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                setSubmitted(true);
            },
        });
    };

    const inputCn = (error?: string) =>
        cn(
            'w-full rounded-xl border bg-theme-surface px-4 py-4 text-foreground [box-shadow:var(--neo-shadow-inset)] transition-all duration-300 outline-none placeholder:text-theme-subtle focus:border-violet-500/60 focus:[box-shadow:var(--neo-shadow-inset-focus)]',
            error ? 'border-rose-500' : 'border-theme',
        );

    return (
        <>
            <Head>
                <title>Contact</title>
                <meta
                    name="description"
                    content="Contact Opticore Solutions Limited to discuss graphic design, video editing, digital marketing, 3D production, and web development projects."
                />
            </Head>

            {/* Background elements */}
            <div className="pointer-events-none fixed inset-0 z-0">
                <div className="dot-grid absolute inset-0 opacity-[0.4]"></div>
            </div>

            <section className="relative min-h-screen overflow-hidden pt-32 pb-20 md:pt-40 lg:pt-48 lg:pb-32">
                <GradientOrb
                    color="#7C3AED"
                    className="-top-40 -left-40 h-[600px] w-[600px] opacity-[0.1]"
                    speed="slow"
                />
                <GradientOrb
                    color="#06B6D4"
                    className="-right-40 bottom-0 h-[500px] w-[500px] opacity-[0.08]"
                    speed="medium"
                    direction="up"
                />

                <div className="section-inner relative z-10 px-4 sm:px-6 lg:px-8">
                    {/* Header Section */}
                    <div className="mb-12 max-w-4xl lg:mb-20">
                        <GlowingKicker>Get in touch</GlowingKicker>
                        <h1 className="mt-6 text-4xl leading-[1.1] font-extrabold tracking-tight text-balance text-foreground sm:text-5xl md:text-6xl">
                            <HandwritingText
                                text="Always Ready to Help"
                                className="inline-block"
                                delay={0.5}
                                stagger={0.08}
                            />
                        </h1>
                    </div>
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
                        {/* Contact Form Container */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="lg:col-span-7"
                        >
                            <div className="h-full rounded-[2rem] border border-theme bg-white p-8 [box-shadow:var(--neo-shadow-panel)] sm:p-8 md:p-12 dark:bg-white/[0.04]">
                                <div className="mb-10 flex items-center gap-4">
                                    <div className="rounded-2xl bg-violet-500/10 p-3">
                                        <MessageSquare className="h-6 w-6 text-violet-500 dark:text-violet-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-theme">
                                            Send a Message
                                        </h2>
                                        <p className="mt-1 text-sm text-theme-muted">
                                            Our team typically responds within
                                            24 hours.
                                        </p>
                                    </div>
                                </div>

                                <AnimatePresence mode="wait">
                                    {submitted ? (
                                        <motion.div
                                            key="success"
                                            initial={{
                                                opacity: 0,
                                                scale: 0.95,
                                            }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="flex flex-col items-center justify-center space-y-6 py-12 text-center"
                                        >
                                            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
                                                <CheckCircle2 className="h-10 w-10" />
                                            </div>
                                            <div className="space-y-2">
                                                <h2 className="text-3xl font-bold text-theme">
                                                    Message Received
                                                </h2>
                                                <p className="mx-auto max-w-sm leading-relaxed text-theme-muted">
                                                    Thank you for reaching out.
                                                    A specialist will review
                                                    your inquiry and contact you
                                                    shortly.
                                                </p>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    setSubmitted(false)
                                                }
                                                className="text-sm font-semibold text-violet-600 underline underline-offset-4 transition-colors hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300"
                                            >
                                                Send another message
                                            </button>
                                        </motion.div>
                                    ) : (
                                        <form
                                            className="space-y-6 md:space-y-8"
                                            onSubmit={submit}
                                        >
                                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
                                                <div className="space-y-2">
                                                    <label className="ml-1 text-sm font-semibold text-theme-muted">
                                                        Full Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        required
                                                        placeholder="Your name"
                                                        value={form.data.name}
                                                        maxLength={50}
                                                        onChange={(e) => {
                                                            const val =
                                                                e.target.value.replace(
                                                                    /[^A-Za-z\s-]/g,
                                                                    '',
                                                                );
                                                            form.setData(
                                                                'name',
                                                                val,
                                                            );
                                                        }}
                                                        className={inputCn(
                                                            form.errors.name,
                                                        )}
                                                    />
                                                    {form.errors.name && (
                                                        <p className="ml-1 text-xs text-rose-500">
                                                            {form.errors.name}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="ml-1 text-sm font-semibold text-theme-muted">
                                                        Email Address
                                                    </label>
                                                    <input
                                                        type="email"
                                                        required
                                                        placeholder="your@email.com"
                                                        value={form.data.email}
                                                        onChange={(e) =>
                                                            form.setData(
                                                                'email',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className={inputCn(
                                                            form.errors.email,
                                                        )}
                                                    />
                                                    {form.errors.email && (
                                                        <p className="ml-1 text-xs text-rose-500">
                                                            {form.errors.email}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
                                                <div className="space-y-2">
                                                    <label className="ml-1 text-sm font-semibold text-theme-muted">
                                                        Phone (Optional)
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        placeholder="+10000000000"
                                                        maxLength={16}
                                                        value={form.data.phone}
                                                        onChange={(e) => {
                                                            const val =
                                                                e.target.value
                                                                    .replace(
                                                                        /[^\d+]/g,
                                                                        '',
                                                                    )
                                                                    .replace(
                                                                        /(?!^)\+/g,
                                                                        '',
                                                                    );
                                                            form.setData(
                                                                'phone',
                                                                val,
                                                            );
                                                        }}
                                                        className={inputCn(
                                                            form.errors.phone,
                                                        )}
                                                    />
                                                    {form.errors.phone && (
                                                        <p className="ml-1 text-xs text-rose-500">
                                                            {form.errors.phone}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="ml-1 text-sm font-semibold text-theme-muted">
                                                        Subject
                                                    </label>
                                                    <input
                                                        type="text"
                                                        required
                                                        placeholder="How can we help?"
                                                        value={
                                                            form.data.subject
                                                        }
                                                        maxLength={100}
                                                        onChange={(e) =>
                                                            form.setData(
                                                                'subject',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className={inputCn(
                                                            form.errors.subject,
                                                        )}
                                                    />
                                                    {form.errors.subject && (
                                                        <p className="ml-1 text-xs text-rose-500">
                                                            {
                                                                form.errors
                                                                    .subject
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="ml-1 text-sm font-semibold text-theme-muted">
                                                    Your Message
                                                </label>
                                                <textarea
                                                    required
                                                    rows={5}
                                                    maxLength={1000}
                                                    placeholder="Tell us about your project or inquiry..."
                                                    value={form.data.message}
                                                    onChange={(e) =>
                                                        form.setData(
                                                            'message',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className={cn(
                                                        inputCn(
                                                            form.errors.message,
                                                        ),
                                                        'resize-none',
                                                    )}
                                                />
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        {form.errors
                                                            .message && (
                                                            <p className="mt-1 ml-1 text-xs text-rose-500">
                                                                {
                                                                    form.errors
                                                                        .message
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                    <span className="mt-1 text-xs text-theme-subtle">
                                                        {
                                                            form.data.message
                                                                .length
                                                        }{' '}
                                                        / 1000
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="pt-4">
                                                <MagneticButton
                                                    type="submit"
                                                    ariaLabel="Submit contact form"
                                                    fullWidth
                                                    disabled={form.processing}
                                                    className="h-16 text-base font-bold"
                                                >
                                                    {form.processing ? (
                                                        <span className="flex items-center gap-2">
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                            Sending...
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-2">
                                                            Send Message
                                                            <Send className="h-4 w-4" />
                                                        </span>
                                                    )}
                                                </MagneticButton>
                                            </div>
                                        </form>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>

                        {/* Side Information Column */}
                        <div className="space-y-6 md:space-y-8 lg:col-span-5">
                            {/* Contact Details Card */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                                className="rounded-[2rem] border border-theme bg-white p-8 [box-shadow:var(--neo-shadow-panel)] sm:p-8 md:p-10 dark:bg-white/[0.04]"
                            >
                                <div className="mb-8 flex items-center gap-3">
                                    <div className="rounded-xl bg-cyan-500/10 p-2.5">
                                        <Info className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-theme">
                                        Contact Details
                                    </h3>
                                </div>

                                <div className="space-y-8">
                                    {contactItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className="group flex items-start gap-5"
                                        >
                                            <div
                                                className={cn(
                                                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-theme-surface [box-shadow:var(--neo-shadow-sm)] transition-transform duration-300 group-hover:scale-110',
                                                    item.iconColor,
                                                )}
                                            >
                                                <item.icon className="h-6 w-6" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold tracking-wider text-theme-subtle uppercase">
                                                    {item.label}
                                                </p>
                                                <p className="mt-1 text-lg font-bold break-words text-theme">
                                                    {item.value}
                                                </p>
                                                {item.subValue && (
                                                    <p className="mt-1 text-sm text-theme-muted">
                                                        {item.subValue}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-10 border-t border-theme pt-8">
                                    <div className="mb-6 flex items-center gap-3">
                                        <div className="rounded-xl bg-violet-500/10 p-2.5">
                                            <Share2 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                                        </div>
                                        <h3 className="text-lg font-bold text-theme">
                                            Social Media
                                        </h3>
                                    </div>
                                    <div className="flex flex-wrap gap-4">
                                        {socialLinks.map(
                                            ({ href, label, icon: Icon }) => (
                                                <a
                                                    key={label}
                                                    href={href}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="group flex h-14 w-14 items-center justify-center rounded-2xl border border-theme bg-theme-surface text-theme-muted [box-shadow:var(--neo-shadow-sm)] transition-all duration-300 hover:scale-105 hover:border-violet-500/50 hover:bg-violet-500/10 hover:text-violet-600 dark:hover:text-violet-300"
                                                    aria-label={label}
                                                >
                                                    <Icon className="h-6 w-6 transition-transform duration-500 group-hover:rotate-12" />
                                                </a>
                                            ),
                                        )}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Location Map Card */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: 0.1 }}
                                className="group relative h-[300px] overflow-hidden rounded-[2rem] border border-theme bg-white p-2 [box-shadow:var(--neo-shadow-panel)] dark:bg-white/[0.04]"
                            >
                                <div className="pointer-events-none absolute top-6 left-6 z-20">
                                    <div className="flex items-center gap-2 rounded-xl border border-theme bg-background/80 px-4 py-2 [box-shadow:var(--neo-shadow-sm)] backdrop-blur-md">
                                        <MapPin className="h-4 w-4 text-rose-500" />
                                        <span className="text-xs font-bold tracking-wide text-balance text-foreground">
                                            East Monipur, Mirpur, Dhaka
                                        </span>
                                    </div>
                                </div>
                                <iframe
                                    title="Opticore Solutions Limited location"
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3650.4890191049462!2d90.36899679999999!3d23.801203700000002!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755c711e66e7703%3A0x6262d3b99b8ae3d4!2sOpticore%20solutions%20Ltd!5e0!3m2!1sen!2sbd!4v1776248482450!5m2!1sen!2sbd"
                                    className="h-full w-full rounded-[1.75rem] opacity-40 grayscale transition-all duration-1000 ease-out group-hover:opacity-100 group-hover:grayscale-0 dark:invert dark:group-hover:invert-0"
                                    loading="lazy"
                                />
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
