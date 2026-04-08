import { Head, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import MagneticButton from '@/components/UI/MagneticButton';
import Modal from '@/components/UI/Modal';
import SectionHeader from '@/components/UI/SectionHeader';
import { culturePerks, jobListings } from '@/lib/site';
import type { CareerFormData } from '@/types';

const initialValues: CareerFormData = {
    name: '',
    email: '',
    phone: '',
    role: '',
    portfolio_url: '',
    message: '',
};

export default function Career() {
    const [open, setOpen] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const form = useForm<CareerFormData>(initialValues);

    const openRole = (role: string) => {
        form.setData('role', role);
        setSubmitted(false);
        setOpen(true);
    };

    const submit = () => {
        form.post('/api/career/apply', {
            preserveScroll: true,
            onSuccess: () => {
                setSubmitted(true);
                form.reset(
                    'name',
                    'email',
                    'phone',
                    'portfolio_url',
                    'message',
                );
            },
        });
    };

    return (
        <>
            <Head>
                <title>Career — Opticore Solutions Ltd.</title>
                <meta
                    name="description"
                    content="Join Opticore Solutions Ltd. and work on premium creative, digital marketing, 3D production, and web projects from anywhere."
                />
                <meta
                    property="og:title"
                    content="Career — Opticore Solutions Ltd."
                />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
            </Head>

            <section className="section-shell pt-32 md:pt-36 lg:pt-40">
                <div className="section-inner">
                    <div className="glass-panel rounded-[2rem] p-8 sm:p-10 lg:p-14">
                        <span className="section-kicker">Career</span>
                        <h1 className="text-4xl font-extrabold text-balance text-white sm:text-5xl md:text-6xl">
                            <span className="gradient-text">Join Our Team</span>
                        </h1>
                        <p className="mt-6 max-w-3xl text-base leading-8 text-zinc-300 sm:text-lg">
                            We are building a lean, high-standard team that
                            cares about craft, momentum, and digital work that
                            actually feels premium.
                        </p>
                    </div>
                </div>
            </section>

            <section className="section-shell pt-0">
                <div className="section-inner">
                    <SectionHeader
                        eyebrow="Culture"
                        title="Why People Like Working Here"
                        description="We keep quality high, communication direct, and the work varied enough to keep top talent engaged."
                    />
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-80px' }}
                        variants={{
                            hidden: {},
                            visible: { transition: { staggerChildren: 0.12 } },
                        }}
                        className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-8"
                    >
                        {culturePerks.map((perk) => (
                            <motion.article
                                key={perk.title}
                                variants={{
                                    hidden: { opacity: 0, y: 60 },
                                    visible: {
                                        opacity: 1,
                                        y: 0,
                                        transition: {
                                            duration: 0.8,
                                            ease: [0.22, 1, 0.36, 1],
                                        },
                                    },
                                }}
                                className="glass-panel rounded-[2rem] p-6"
                            >
                                <h3 className="text-xl font-semibold text-white">
                                    {perk.title}
                                </h3>
                                <p className="mt-3 text-sm leading-7 text-zinc-400">
                                    {perk.description}
                                </p>
                            </motion.article>
                        ))}
                    </motion.div>
                </div>
            </section>

            <section className="section-shell pt-0">
                <div className="section-inner">
                    <SectionHeader
                        eyebrow="Open Roles"
                        title="Remote Opportunities"
                        description="If your work is strong and your standards are high, we want to hear from you."
                    />
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-80px' }}
                        variants={{
                            hidden: {},
                            visible: { transition: { staggerChildren: 0.12 } },
                        }}
                        className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-8"
                    >
                        {jobListings.map((job) => (
                            <motion.article
                                key={job.title}
                                variants={{
                                    hidden: { opacity: 0, scale: 0.85 },
                                    visible: {
                                        opacity: 1,
                                        scale: 1,
                                        transition: {
                                            duration: 0.7,
                                            ease: [0.22, 1, 0.36, 1],
                                        },
                                    },
                                }}
                                className="glass-panel rounded-[2rem] p-6"
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-zinc-300">
                                        {job.location}
                                    </span>
                                    <span className="text-xs font-semibold tracking-[0.24em] text-cyan-300 uppercase">
                                        {job.type}
                                    </span>
                                </div>
                                <h3 className="mt-6 text-2xl font-semibold text-white">
                                    {job.title}
                                </h3>
                                <p className="mt-4 text-sm leading-7 text-zinc-400">
                                    {job.description}
                                </p>
                                <button
                                    type="button"
                                    className="touch-target mt-8 inline-flex items-center rounded-full bg-linear-to-r from-violet-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-white"
                                    aria-label={`Apply for ${job.title}`}
                                    onClick={() => openRole(job.title)}
                                >
                                    Apply Now
                                </button>
                            </motion.article>
                        ))}
                    </motion.div>
                </div>
            </section>

            <Modal
                open={open}
                title={
                    form.data.role ? `Apply for ${form.data.role}` : 'Apply Now'
                }
                onClose={() => setOpen(false)}
            >
                {submitted ? (
                    <div className="flex min-h-[18rem] flex-col items-center justify-center text-center">
                        <CheckCircle2 className="h-16 w-16 text-cyan-300" />
                        <h3 className="mt-6 text-2xl font-semibold text-white">
                            Application received
                        </h3>
                        <p className="mt-3 text-sm leading-7 text-zinc-400">
                            Thanks for applying. Our team will review your
                            submission and follow up if there is a strong fit.
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
                            { key: 'name', label: 'Name', type: 'text' },
                            { key: 'email', label: 'Email', type: 'email' },
                            { key: 'phone', label: 'Phone', type: 'text' },
                            {
                                key: 'portfolio_url',
                                label: 'Portfolio URL',
                                type: 'url',
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
                                            field.key as keyof CareerFormData
                                        ] as string
                                    }
                                    onChange={(event) =>
                                        form.setData(
                                            field.key as keyof CareerFormData,
                                            event.target.value,
                                        )
                                    }
                                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white transition outline-none focus:border-violet-400/50"
                                />
                                {form.errors[
                                    field.key as keyof CareerFormData
                                ] ? (
                                    <p className="mt-2 text-sm text-rose-300">
                                        {
                                            form.errors[
                                                field.key as keyof CareerFormData
                                            ]
                                        }
                                    </p>
                                ) : null}
                            </label>
                        ))}

                        <label className="block">
                            <span className="mb-2 block text-sm font-medium text-zinc-200">
                                Role
                            </span>
                            <input
                                type="text"
                                value={form.data.role}
                                readOnly
                                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                            />
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-sm font-medium text-zinc-200">
                                Message
                            </span>
                            <textarea
                                rows={5}
                                value={form.data.message}
                                onChange={(event) =>
                                    form.setData('message', event.target.value)
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
                            ariaLabel="Submit career application"
                            fullWidth
                            disabled={form.processing}
                        >
                            {form.processing
                                ? 'Submitting...'
                                : 'Submit Application'}
                        </MagneticButton>
                    </form>
                )}
            </Modal>
        </>
    );
}
