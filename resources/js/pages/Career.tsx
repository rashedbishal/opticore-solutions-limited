import type { CareerFormData, JobListing } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { m as motion } from 'framer-motion';
import {
    Briefcase,
    CheckCircle2,
    FileCheck2,
    Globe,
    Loader2,
    Mail,
    Phone,
    UploadCloud,
    User,
    X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import MagneticButton from '@/components/UI/MagneticButton';
import Modal from '@/components/UI/Modal';
import SectionHeader from '@/components/UI/SectionHeader';
import { culturePerks } from '@/lib/site';

const MAX_RESUME_SIZE = 5 * 1024 * 1024;

const initialValues: CareerFormData = {
    name: '',
    email: '',
    phone: '',
    role: '',
    portfolio_url: '',
    resume: null,
};

const personalFields = [
    {
        key: 'name' as const,
        label: 'Name',
        type: 'text',
        icon: User,
        required: true,
    },
    {
        key: 'phone' as const,
        label: 'Phone',
        type: 'text',
        icon: Phone,
        required: true,
    },
    {
        key: 'email' as const,
        label: 'Email',
        type: 'email',
        icon: Mail,
        required: true,
        full: true,
    },
    {
        key: 'portfolio_url' as const,
        label: 'Portfolio URL',
        type: 'url',
        icon: Globe,
        required: false,
        full: true,
    },
];

function formatFileSize(bytes: number): string {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

interface Props {
    jobListings: JobListing[];
}

export default function Career({ jobListings }: Props) {
    const [open, setOpen] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const form = useForm<CareerFormData>(initialValues);
    const resumeInputRef = useRef<HTMLInputElement>(null);

    const openRole = (role: string) => {
        form.setData('role', role);
        setSubmitted(false);
        setOpen(true);
    };

    const selectResume = (file: File | null) => {
        form.clearErrors('resume');
        form.setData('resume', file);
    };

    const submit = () => {
        form.post('/api/career/apply', {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                setSubmitted(true);
                form.reset('name', 'email', 'phone', 'portfolio_url', 'resume');

                if (resumeInputRef.current) {
                    resumeInputRef.current.value = '';
                }
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
                    form.data.role
                        ? `${submitted ? 'Applied for' : 'Apply for'} ${form.data.role}`
                        : 'Apply Now'
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
                        className="space-y-6"
                        onSubmit={(event) => {
                            event.preventDefault();
                            submit();
                        }}
                    >
                        {/* Role recap */}
                        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-linear-to-r from-violet-500/10 to-cyan-400/10 px-4 py-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-cyan-300">
                                <Briefcase className="h-4 w-4" />
                            </span>
                            <span className="min-w-0">
                                <span className="block text-[11px] font-semibold tracking-[0.2em] text-zinc-400 uppercase">
                                    Applying for
                                </span>
                                <span className="block truncate text-sm font-semibold text-white">
                                    {form.data.role}
                                </span>
                            </span>
                        </div>

                        {/* Personal details */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {personalFields.map((field) => {
                                const Icon = field.icon;
                                const error = form.errors[field.key];

                                return (
                                    <label
                                        key={field.key}
                                        className={`block ${field.full ? 'sm:col-span-2' : ''}`}
                                    >
                                        <span className="mb-2 flex items-center gap-1.5 text-sm font-medium text-zinc-200">
                                            {field.label}
                                            {field.required ? (
                                                <span
                                                    className="text-rose-400"
                                                    aria-hidden="true"
                                                >
                                                    *
                                                </span>
                                            ) : (
                                                <span className="text-xs font-normal text-zinc-500">
                                                    (optional)
                                                </span>
                                            )}
                                        </span>
                                        <div className="relative">
                                            <Icon className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                                            <input
                                                type={field.type}
                                                value={form.data[field.key]}
                                                onChange={(event) =>
                                                    form.setData(
                                                        field.key,
                                                        event.target.value,
                                                    )
                                                }
                                                className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pr-4 pl-11 text-white transition outline-none focus:border-violet-400/50"
                                            />
                                        </div>
                                        {error ? (
                                            <p className="mt-2 text-sm text-rose-300">
                                                {error}
                                            </p>
                                        ) : null}
                                    </label>
                                );
                            })}
                        </div>

                        {/* Resume upload */}
                        <div className="block">
                            <span className="mb-2 flex items-center gap-1.5 text-sm font-medium text-zinc-200">
                                Resume / CV
                                <span
                                    className="text-rose-400"
                                    aria-hidden="true"
                                >
                                    *
                                </span>
                            </span>
                            <label
                                htmlFor="resume-upload"
                                className="flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-4 transition hover:border-violet-400/50"
                            >
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-linear-to-r from-violet-500/20 to-cyan-400/20 text-cyan-300">
                                    {form.data.resume ? (
                                        <FileCheck2 className="h-5 w-5" />
                                    ) : (
                                        <UploadCloud className="h-5 w-5" />
                                    )}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-medium text-white">
                                        {form.data.resume
                                            ? form.data.resume.name
                                            : 'Choose a PDF file to upload'}
                                    </span>
                                    <span className="mt-0.5 block text-xs text-zinc-400">
                                        {form.data.resume
                                            ? formatFileSize(
                                                  form.data.resume.size,
                                              )
                                            : 'PDF only, up to 5MB'}
                                    </span>
                                </span>
                                {form.data.resume ? (
                                    <button
                                        type="button"
                                        aria-label="Remove selected resume"
                                        onClick={(event) => {
                                            event.preventDefault();
                                            event.stopPropagation();
                                            selectResume(null);

                                            if (resumeInputRef.current) {
                                                resumeInputRef.current.value =
                                                    '';
                                            }
                                        }}
                                        className="touch-target shrink-0 rounded-full p-2 text-zinc-500 transition hover:bg-white/10 hover:text-white"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                ) : null}
                            </label>
                            <input
                                id="resume-upload"
                                ref={resumeInputRef}
                                type="file"
                                accept="application/pdf,.pdf"
                                className="sr-only"
                                onChange={(event) => {
                                    const file =
                                        event.target.files?.[0] ?? null;

                                    if (
                                        file &&
                                        file.type !== 'application/pdf'
                                    ) {
                                        form.setError(
                                            'resume',
                                            'The resume must be a PDF file.',
                                        );
                                        form.setData('resume', null);
                                        event.target.value = '';

                                        return;
                                    }

                                    if (file && file.size > MAX_RESUME_SIZE) {
                                        form.setError(
                                            'resume',
                                            'The resume must not be larger than 5MB.',
                                        );
                                        form.setData('resume', null);
                                        event.target.value = '';

                                        return;
                                    }

                                    selectResume(file);
                                }}
                            />
                            {form.errors.resume ? (
                                <p className="mt-2 text-sm text-rose-300">
                                    {form.errors.resume}
                                </p>
                            ) : null}
                        </div>

                        <MagneticButton
                            type="submit"
                            ariaLabel="Submit career application"
                            fullWidth
                            disabled={form.processing}
                        >
                            {form.processing ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Submitting...
                                </span>
                            ) : (
                                'Submit Application'
                            )}
                        </MagneticButton>
                    </form>
                )}
            </Modal>
        </>
    );
}
