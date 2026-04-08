import { Head, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    BriefcaseBusiness,
    Camera,
    CheckCircle2,
    Globe,
    Mail,
    MapPin,
    Phone,
    Play,
} from 'lucide-react';
import { useState } from 'react';
import MagneticButton from '@/components/UI/MagneticButton';
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

const initialValues: ContactFormData = {
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
};

export default function Contact() {
    const [submitted, setSubmitted] = useState(false);
    const form = useForm<ContactFormData>(initialValues);

    const submit = () => {
        form.post('/api/contact', {
            preserveScroll: true,
            onSuccess: () => {
                setSubmitted(true);
                form.reset();
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
                <meta
                    property="og:title"
                    content="Contact — Opticore Solutions Ltd."
                />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
            </Head>

            <section className="section-shell pt-32 md:pt-36 lg:pt-40">
                <div className="section-inner grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
                    <motion.div
                        initial={{ opacity: 0, x: -80 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: '-80px' }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="glass-panel rounded-[2rem] p-8 sm:p-10"
                    >
                        <span className="section-kicker">Contact</span>
                        <h1 className="text-4xl font-extrabold text-balance text-white sm:text-5xl md:text-6xl">
                            Get In Touch
                        </h1>
                        <p className="mt-6 text-base leading-8 text-zinc-300 sm:text-lg">
                            Tell us what you are building, launching,
                            refreshing, or fixing. We will help shape the right
                            next step.
                        </p>

                        <div className="mt-8 space-y-5 text-sm text-zinc-300 sm:text-base">
                            <p className="flex items-start gap-3">
                                <Phone className="mt-1 h-5 w-5 text-violet-300" />
                                <span>
                                    +1 (575) 303-6925
                                    <br />
                                    +88-01896204400
                                </span>
                            </p>
                            <p className="flex items-start gap-3">
                                <Mail className="mt-1 h-5 w-5 text-violet-300" />
                                <span>hello@opticoresolutions.com</span>
                            </p>
                            <p className="flex items-start gap-3">
                                <MapPin className="mt-1 h-5 w-5 text-violet-300" />
                                <span>
                                    Dhaka, Bangladesh with remote project
                                    delivery worldwide.
                                </span>
                            </p>
                        </div>

                        <div className="mt-8 flex flex-wrap gap-3">
                            {socialLinks.map(({ href, label, icon: Icon }) => (
                                <a
                                    key={label}
                                    href={href}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label={label}
                                    className="touch-target inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-200 transition-all duration-300 hover:border-violet-400/50 hover:text-white"
                                >
                                    <Icon className="h-5 w-5" />
                                </a>
                            ))}
                        </div>

                        <div className="mt-8 overflow-hidden rounded-[1.75rem] border border-white/10">
                            <iframe
                                title="Opticore Solutions Ltd. location"
                                src="https://www.google.com/maps?q=Dhaka%2C%20Bangladesh&z=11&output=embed"
                                className="h-48 w-full sm:h-64 lg:h-80"
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 80 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: '-80px' }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="glass-panel rounded-[2rem] p-8 sm:p-10"
                    >
                        {submitted ? (
                            <div className="flex min-h-[28rem] flex-col items-center justify-center text-center">
                                <CheckCircle2 className="h-16 w-16 text-cyan-300" />
                                <h2 className="mt-6 text-2xl font-semibold text-white">
                                    We’ll be in touch soon!
                                </h2>
                                <p className="mt-3 max-w-md text-sm leading-7 text-zinc-400">
                                    Your message is in. We will review it and
                                    reply with the best next step for your
                                    project.
                                </p>
                            </div>
                        ) : (
                            <form
                                className="space-y-4"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    submit();
                                }}
                            >
                                {[
                                    {
                                        key: 'name',
                                        label: 'Name',
                                        type: 'text',
                                    },
                                    {
                                        key: 'email',
                                        label: 'Email',
                                        type: 'email',
                                    },
                                    {
                                        key: 'phone',
                                        label: 'Phone',
                                        type: 'text',
                                    },
                                    {
                                        key: 'subject',
                                        label: 'Subject',
                                        type: 'text',
                                    },
                                ].map((field) => (
                                    <label key={field.key} className="block">
                                        <span className="mb-2 block text-sm font-medium text-zinc-200">
                                            {field.label}
                                        </span>
                                        <input
                                            type={field.type}
                                            value={
                                                form.data[
                                                    field.key as keyof ContactFormData
                                                ] as string
                                            }
                                            onChange={(event) =>
                                                form.setData(
                                                    field.key as keyof ContactFormData,
                                                    event.target.value,
                                                )
                                            }
                                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white transition outline-none focus:border-violet-400/50"
                                        />
                                        {form.errors[
                                            field.key as keyof ContactFormData
                                        ] ? (
                                            <p className="mt-2 text-sm text-rose-300">
                                                {
                                                    form.errors[
                                                        field.key as keyof ContactFormData
                                                    ]
                                                }
                                            </p>
                                        ) : null}
                                    </label>
                                ))}

                                <label className="block">
                                    <span className="mb-2 block text-sm font-medium text-zinc-200">
                                        Message
                                    </span>
                                    <textarea
                                        rows={6}
                                        value={form.data.message}
                                        onChange={(event) =>
                                            form.setData(
                                                'message',
                                                event.target.value,
                                            )
                                        }
                                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white transition outline-none focus:border-violet-400/50"
                                    />
                                    {form.errors.message ? (
                                        <p className="mt-2 text-sm text-rose-300">
                                            {form.errors.message}
                                        </p>
                                    ) : null}
                                </label>

                                <MagneticButton
                                    type="submit"
                                    ariaLabel="Send contact form"
                                    fullWidth
                                    disabled={form.processing}
                                >
                                    {form.processing
                                        ? 'Sending...'
                                        : 'Send Message'}
                                </MagneticButton>
                            </form>
                        )}
                    </motion.div>
                </div>
            </section>
        </>
    );
}
