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
} from 'lucide-react';
import HandwritingText from '@/components/text-animations/handwriting-text';
import GlowingKicker from '@/components/UI/GlowingKicker';
import GradientOrb from '@/components/UI/GradientOrb';
import MagneticButton from '@/components/UI/MagneticButton';
import { cn } from '@/lib/utils';
import type { ContactFormData } from '@/types';

const socialLinks = [
    { href: 'https://facebook.com', label: 'Facebook', icon: Globe },
    { href: 'https://instagram.com', label: 'Instagram', icon: Camera },
    {
        href: 'https://linkedin.com',
        label: 'LinkedIn',
        icon: BriefcaseBusiness,
    },
    { href: 'https://youtube.com', label: 'YouTube', icon: Play },
];

const contactItems = [
    {
        id: 'phone',
        label: 'Phone Number',
        value: '+88-01896204400',
        subValue: '+1 (575) 303-6925',
        icon: Phone,
        color: 'from-violet-500/20 to-violet-500/5',
        iconColor: 'text-violet-400',
    },
    {
        id: 'email',
        label: 'Email Address',
        value: 'hello@opticoresolutions.com',
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
    const submitted = form.wasSuccessful;

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/api/contact', {
            preserveScroll: true,
            onSuccess: () => form.reset(),
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
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 dot-grid opacity-[0.4]"></div>
            </div>

            <section className="relative min-h-screen pt-32 pb-20 md:pt-40 lg:pt-48 lg:pb-32 overflow-hidden">
                <GradientOrb
                    color="#7C3AED"
                    className="-top-40 -left-40 h-[600px] w-[600px] opacity-[0.1]"
                    speed="slow"
                />
                <GradientOrb
                    color="#06B6D4"
                    className="bottom-0 -right-40 h-[500px] w-[500px] opacity-[0.08]"
                    speed="medium"
                    direction="up"
                />

                <div className="section-inner relative z-10 px-4 sm:px-6 lg:px-8">
                    {/* Header Section */}
                    <div className="max-w-4xl mb-12 lg:mb-20">
                        <GlowingKicker>
                            Get in touch
                        </GlowingKicker>
                        <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-[1.1] tracking-tight text-balance">
                            <HandwritingText
                                text="Always Ready to Help"
                                className="inline-block"
                                delay={0.5}
                                stagger={0.08}
                            />
                        </h1>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

                        {/* Contact Form Container */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="lg:col-span-7"
                        >
                            <div className="h-full bg-white/[0.03] border border-white/10 backdrop-blur-xl rounded-[2rem] p-8 sm:p-8 md:p-12">
                                <div className="flex items-center gap-4 mb-10">
                                    <div className="p-3 bg-violet-500/10 rounded-2xl">
                                        <MessageSquare className="h-6 w-6 text-violet-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-white">Send a Message</h3>
                                        <p className="text-sm text-zinc-400 mt-1">Our team typically responds within 24 hours.</p>
                                    </div>
                                </div>

                                <AnimatePresence mode="wait">
                                    {submitted ? (
                                        <motion.div
                                            key="success"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="flex flex-col items-center justify-center text-center space-y-6 py-12"
                                        >
                                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                <CheckCircle2 className="h-10 w-10" />
                                            </div>
                                            <div className="space-y-2">
                                                <h2 className="text-3xl font-bold text-white">Message Received</h2>
                                                <p className="max-w-sm mx-auto text-zinc-400 leading-relaxed">
                                                    Thank you for reaching out. A specialist will review your inquiry and contact you shortly.
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => form.reset()}
                                                className="text-sm font-semibold text-violet-400 hover:text-violet-300 transition-colors underline underline-offset-4"
                                            >
                                                Send another message
                                            </button>
                                        </motion.div>
                                    ) : (
                                        <form className="space-y-6 md:space-y-8" onSubmit={submit}>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-zinc-300 ml-1">Full Name</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        placeholder="Your name"
                                                        value={form.data.name}
                                                        onChange={(e) => form.setData('name', e.target.value)}
                                                        className={cn(
                                                            "w-full bg-white/[0.03] border-b border-white/10 px-4 py-4 text-white outline-none transition-all duration-300 focus:border-violet-500 focus:bg-white/[0.05]",
                                                            form.errors.name && "border-rose-500"
                                                        )}
                                                    />
                                                    {form.errors.name && <p className="text-xs text-rose-400 ml-1">{form.errors.name}</p>}
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-zinc-300 ml-1">Email Address</label>
                                                    <input
                                                        type="email"
                                                        required
                                                        placeholder="your@email.com"
                                                        value={form.data.email}
                                                        onChange={(e) => form.setData('email', e.target.value)}
                                                        className={cn(
                                                            "w-full bg-white/[0.03] border-b border-white/10 px-4 py-4 text-white outline-none transition-all duration-300 focus:border-violet-500 focus:bg-white/[0.05]",
                                                            form.errors.email && "border-rose-500"
                                                        )}
                                                    />
                                                    {form.errors.email && <p className="text-xs text-rose-400 ml-1">{form.errors.email}</p>}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-zinc-300 ml-1">Phone (Optional)</label>
                                                    <input
                                                        type="tel"
                                                        placeholder="+1 (000) 000-0000"
                                                        value={form.data.phone}
                                                        onChange={(e) => form.setData('phone', e.target.value)}
                                                        className="w-full bg-white/[0.03] border-b border-white/10 px-4 py-4 text-white outline-none transition-all duration-300 focus:border-violet-500 focus:bg-white/[0.05]"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-zinc-300 ml-1">Subject</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        placeholder="How can we help?"
                                                        value={form.data.subject}
                                                        onChange={(e) => form.setData('subject', e.target.value)}
                                                        className={cn(
                                                            "w-full bg-white/[0.03] border-b border-white/10 px-4 py-4 text-white outline-none transition-all duration-300 focus:border-violet-500 focus:bg-white/[0.05]",
                                                            form.errors.subject && "border-rose-500"
                                                        )}
                                                    />
                                                    {form.errors.subject && <p className="text-xs text-rose-400 ml-1">{form.errors.subject}</p>}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-zinc-300 ml-1">Your Message</label>
                                                <textarea
                                                    required
                                                    rows={5}
                                                    placeholder="Tell us about your project or inquiry..."
                                                    value={form.data.message}
                                                    onChange={(e) => form.setData('message', e.target.value)}
                                                    className={cn(
                                                        "w-full resize-none bg-white/[0.03] border-b border-white/10 px-4 py-4 text-white outline-none transition-all duration-300 focus:border-violet-500 focus:bg-white/[0.05]",
                                                        form.errors.message && "border-rose-500"
                                                    )}
                                                />
                                                {form.errors.message && <p className="text-xs text-rose-400 ml-1">{form.errors.message}</p>}
                                            </div>

                                            <div className="pt-4">
                                                <MagneticButton
                                                    type="submit"
                                                    ariaLabel="Submit contact form"
                                                    fullWidth
                                                    disabled={form.processing}
                                                    className="h-16 text-base font-bold"
                                                >
                                                    {form.processing ? 'Sending...' : (
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
                        <div className="lg:col-span-5 space-y-6 md:space-y-8">

                            {/* Contact Details Card */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                                className="bg-white/[0.03] border border-white/10 backdrop-blur-xl rounded-[2rem] p-8 sm:p-8 md:p-10"
                            >
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="p-2.5 bg-cyan-500/10 rounded-xl">
                                        <Info className="h-5 w-5 text-cyan-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white">Contact Details</h3>
                                </div>

                                <div className="space-y-8">
                                    {contactItems.map((item) => (
                                        <div key={item.id} className="group flex items-start gap-5">
                                            <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/5 transition-transform duration-300 group-hover:scale-110", item.iconColor)}>
                                                <item.icon className="h-6 w-6" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{item.label}</p>
                                                <p className="text-lg font-bold text-white mt-1 break-words">{item.value}</p>
                                                {item.subValue && <p className="text-sm text-zinc-400 mt-1">{item.subValue}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-10 pt-8 border-t border-white/5">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2.5 bg-violet-500/10 rounded-xl">
                                            <Share2 className="h-5 w-5 text-violet-400" />
                                        </div>
                                        <h3 className="text-lg font-bold text-white">Social Media</h3>
                                    </div>
                                    <div className="flex flex-wrap gap-4">
                                        {socialLinks.map(({ href, label, icon: Icon }) => (
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
                                        ))}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Location Map Card */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: 0.1 }}
                                className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-2 relative group h-[300px]"
                            >
                                <div className="absolute top-6 left-6 z-20 pointer-events-none">
                                    <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2 flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-rose-500" />
                                        <span className="text-xs font-bold text-white tracking-wide text-balance">Dhaka, Bangladesh</span>
                                    </div>
                                </div>
                                <iframe
                                    title="Opticore Solutions Ltd. location"
                                    src="https://www.google.com/maps?q=Dhaka%2C%20Bangladesh&z=11&output=embed"
                                    className="h-full w-full rounded-[1.75rem] grayscale invert opacity-30 group-hover:grayscale-0 group-hover:invert-0 group-hover:opacity-100 transition-all duration-1000 ease-out"
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
