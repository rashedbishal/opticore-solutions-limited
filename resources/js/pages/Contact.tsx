import type { ContactFormData } from '@/types';
import { Head, useForm as useInertiaForm } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
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
} from 'lucide-react';
import React from 'react';
import HandwritingText from '@/components/text-animations/handwriting-text';
import GlowingKicker from '@/components/UI/GlowingKicker';
import GradientOrb from '@/components/UI/GradientOrb';
import MagneticButton from '@/components/UI/MagneticButton';
import { cn } from '@/lib/utils';
import { bangladeshPhoneNumber } from '@/lib/site';

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

const contactItems = [
    {
        id: 'phone',
        label: 'Phone Number',
        value: bangladeshPhoneNumber,
        subValue: '+1 (575) 303-6925',
        icon: Phone,
        color: 'from-violet-500/20 to-violet-500/5',
        iconColor: 'text-violet-400',
    },
    {
        id: 'email',
        label: 'Email Address',
        value: 'osl@opticoresolutionsltd.com',
        icon: Mail,
        color: 'from-cyan-500/20 to-cyan-500/5',
        iconColor: 'text-cyan-400',
    },
];

const initialValues: ContactFormData = {
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
};

export default function Contact() {
    const form = useInertiaForm<ContactFormData>(initialValues);
    const [submitted, setSubmitted] = React.useState(false);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/api/contact', {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                setSubmitted(true);
            },
        });
    };

    return (
        <>
            <Head>
                <title>Contact — Opticore Solutions Ltd.</title>
                <meta
                    name="description"
                    content="Contact Opticore Solutions Ltd. to discuss graphic design, video editing, digital marketing, 3D production, and web development projects."
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
                        <h1 className="mt-6 text-4xl leading-[1.1] font-extrabold tracking-tight text-balance text-white sm:text-5xl md:text-6xl">
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
                            <div className="h-full rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl sm:p-8 md:p-12">
                                <div className="mb-10 flex items-center gap-4">
                                    <div className="rounded-2xl bg-violet-500/10 p-3">
                                        <MessageSquare className="h-6 w-6 text-violet-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-white">
                                            Send a Message
                                        </h3>
                                        <p className="mt-1 text-sm text-zinc-400">
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
                                            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                                                <CheckCircle2 className="h-10 w-10" />
                                            </div>
                                            <div className="space-y-2">
                                                <h2 className="text-3xl font-bold text-white">
                                                    Message Received
                                                </h2>
                                                <p className="mx-auto max-w-sm leading-relaxed text-zinc-400">
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
                                                className="text-sm font-semibold text-violet-400 underline underline-offset-4 transition-colors hover:text-violet-300"
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
                                                    <label className="ml-1 text-sm font-semibold text-zinc-300">
                                                        Full Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        required
                                                        placeholder="Your name"
                                                        value={form.data.name}
                                                        onChange={(e) =>
                                                            form.setData(
                                                                'name',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className={cn(
                                                            'w-full border-b border-white/10 bg-white/[0.03] px-4 py-4 text-white transition-all duration-300 outline-none focus:border-violet-500 focus:bg-white/[0.05] rounded-xl',
                                                            form.errors.name &&
                                                                'border-rose-500',
                                                        )}
                                                    />
                                                    {form.errors.name && (
                                                        <p className="ml-1 text-xs text-rose-400">
                                                            {form.errors.name}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="ml-1 text-sm font-semibold text-zinc-300">
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
                                                        className={cn(
                                                            'w-full border-b border-white/10 bg-white/[0.03] px-4 py-4 text-white transition-all duration-300 outline-none focus:border-violet-500 focus:bg-white/[0.05] rounded-xl',
                                                            form.errors.email &&
                                                                'border-rose-500',
                                                        )}
                                                    />
                                                    {form.errors.email && (
                                                        <p className="ml-1 text-xs text-rose-400">
                                                            {form.errors.email}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
                                                <div className="space-y-2">
                                                    <label className="ml-1 text-sm font-semibold text-zinc-300">
                                                        Phone (Optional)
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        placeholder="+1 (000) 000-0000"
                                                        value={form.data.phone}
                                                        onChange={(e) =>
                                                            form.setData(
                                                                'phone',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="w-full border-b border-white/10 bg-white/[0.03] px-4 py-4 text-white transition-all duration-300 outline-none focus:border-violet-500 focus:bg-white/[0.05] rounded-xl"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="ml-1 text-sm font-semibold text-zinc-300">
                                                        Subject
                                                    </label>
                                                    <input
                                                        type="text"
                                                        required
                                                        placeholder="How can we help?"
                                                        value={
                                                            form.data.subject
                                                        }
                                                        onChange={(e) =>
                                                            form.setData(
                                                                'subject',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className={cn(
                                                            'w-full border-b border-white/10 bg-white/[0.03] px-4 py-4 text-white transition-all duration-300 outline-none focus:border-violet-500 focus:bg-white/[0.05] rounded-xl',
                                                            form.errors
                                                                .subject &&
                                                                'border-rose-500',
                                                        )}
                                                    />
                                                    {form.errors.subject && (
                                                        <p className="ml-1 text-xs text-rose-400">
                                                            {
                                                                form.errors
                                                                    .subject
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="ml-1 text-sm font-semibold text-zinc-300">
                                                    Your Message
                                                </label>
                                                <textarea
                                                    required
                                                    rows={5}
                                                    placeholder="Tell us about your project or inquiry..."
                                                    value={form.data.message}
                                                    onChange={(e) =>
                                                        form.setData(
                                                            'message',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className={cn(
                                                        'w-full resize-none border-b border-white/10 bg-white/[0.03] px-4 py-4 text-white transition-all duration-300 outline-none focus:border-violet-500 focus:bg-white/[0.05] rounded-xl',
                                                        form.errors.message &&
                                                            'border-rose-500',
                                                    )}
                                                />
                                                {form.errors.message && (
                                                    <p className="ml-1 text-xs text-rose-400">
                                                        {form.errors.message}
                                                    </p>
                                                )}
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
                                                        'Sending...'
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
                                className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl sm:p-8 md:p-10"
                            >
                                <div className="mb-8 flex items-center gap-3">
                                    <div className="rounded-xl bg-cyan-500/10 p-2.5">
                                        <Info className="h-5 w-5 text-cyan-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white">
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
                                                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/5 transition-transform duration-300 group-hover:scale-110',
                                                    item.iconColor,
                                                )}
                                            >
                                                <item.icon className="h-6 w-6" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                                                    {item.label}
                                                </p>
                                                <p className="mt-1 text-lg font-bold break-words text-white">
                                                    {item.value}
                                                </p>
                                                {item.subValue && (
                                                    <p className="mt-1 text-sm text-zinc-400">
                                                        {item.subValue}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-10 border-t border-white/5 pt-8">
                                    <div className="mb-6 flex items-center gap-3">
                                        <div className="rounded-xl bg-violet-500/10 p-2.5">
                                            <Share2 className="h-5 w-5 text-violet-400" />
                                        </div>
                                        <h3 className="text-lg font-bold text-white">
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
                                                    className="group flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-400 transition-all duration-300 hover:scale-105 hover:border-violet-500/50 hover:bg-violet-500/10 hover:text-white"
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
                                className="group relative h-[300px] overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-2"
                            >
                                <div className="pointer-events-none absolute top-6 left-6 z-20">
                                    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/60 px-4 py-2 backdrop-blur-md">
                                        <MapPin className="h-4 w-4 text-rose-500" />
                                        <span className="text-xs font-bold tracking-wide text-balance text-white">
                                            East Monipur, Mirpur, Dhaka
                                        </span>
                                    </div>
                                </div>
                                <iframe
                                    title="Opticore Solutions Ltd. location"
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3650.4890191049462!2d90.36899679999999!3d23.801203700000002!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755c711e66e7703%3A0x6262d3b99b8ae3d4!2sOpticore%20solutions%20Ltd!5e0!3m2!1sen!2sbd!4v1776248482450!5m2!1sen!2sbd"
                                    className="h-full w-full rounded-[1.75rem] opacity-30 grayscale invert transition-all duration-1000 ease-out group-hover:opacity-100 group-hover:grayscale-0 group-hover:invert-0"
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
