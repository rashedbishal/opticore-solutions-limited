import { Head, useForm } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import GradientOrb from '@/components/UI/GradientOrb';
import MagneticButton from '@/components/UI/MagneticButton';
import { services } from '@/lib/site';
import type { AppointmentFormData } from '@/types';

const initialValues: AppointmentFormData = {
    name: '',
    email: '',
    phone: '',
    service: '',
    preferred_date: '',
    message: '',
};

export default function RequestAppointment() {
    const [step, setStep] = useState(1);
    const [submitted, setSubmitted] = useState(false);
    const form = useForm<AppointmentFormData>(initialValues);

    const nextStep = () => setStep(2);
    const previousStep = () => setStep(1);

    const submit = () => {
        form.post('/api/appointment', {
            preserveScroll: true,
            onSuccess: () => {
                setSubmitted(true);
                form.reset();
                setStep(1);
            },
        });
    };

    return (
        <>
            <Head>
                <title>Request Appointment — Opticore Solutions Ltd.</title>
                <meta
                    name="description"
                    content="Request an appointment with Opticore Solutions Ltd. and start your next branding, marketing, video, 3D, or web project."
                />
                <meta
                    property="og:title"
                    content="Request Appointment — Opticore Solutions Ltd."
                />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
            </Head>

            <section className="section-shell relative flex min-h-screen items-center pt-28">
                <GradientOrb
                    className="top-16 left-[-5rem] h-72 w-72"
                    color="rgb(124 58 237 / 0.5)"
                    direction="down"
                />
                <GradientOrb
                    className="right-[-4rem] bottom-10 h-64 w-64"
                    color="rgb(6 182 212 / 0.4)"
                    direction="up"
                />

                <div className="section-inner relative z-10">
                    <div className="glass-panel mx-auto w-full max-w-lg rounded-[2rem] p-6 sm:p-8">
                        {submitted ? (
                            <div className="flex min-h-[30rem] flex-col items-center justify-center text-center">
                                <CheckCircle2 className="h-16 w-16 text-cyan-300" />
                                <h1 className="mt-6 text-3xl font-extrabold text-white">
                                    Appointment requested
                                </h1>
                                <p className="mt-4 text-sm leading-7 text-zinc-400">
                                    Your project request is in. We will reach
                                    out soon to confirm details and recommend
                                    the best next step.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="text-center">
                                    <span className="section-kicker">
                                        Request Appointment
                                    </span>
                                    <h1 className="text-3xl font-extrabold text-balance text-white sm:text-4xl">
                                        Let’s Build Something Together
                                    </h1>
                                </div>

                                <div className="mt-8 flex items-center justify-center gap-3">
                                    {[1, 2].map((item) => (
                                        <div
                                            key={item}
                                            className="flex items-center gap-3"
                                        >
                                            <div
                                                className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold ${
                                                    step === item
                                                        ? 'border-violet-400/50 bg-violet-500/15 text-white'
                                                        : 'border-white/10 bg-white/5 text-zinc-500'
                                                }`}
                                            >
                                                0{item}
                                            </div>
                                            {item < 2 ? (
                                                <div className="h-px w-10 bg-white/10" />
                                            ) : null}
                                        </div>
                                    ))}
                                </div>

                                <form
                                    className="mt-8"
                                    onSubmit={(event) => {
                                        event.preventDefault();

                                        if (step === 1) {
                                            nextStep();

                                            return;
                                        }

                                        submit();
                                    }}
                                >
                                    <AnimatePresence mode="wait">
                                        {step === 1 ? (
                                            <motion.div
                                                key="step-1"
                                                initial={{ opacity: 0, x: 40 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -40 }}
                                                transition={{ duration: 0.25 }}
                                                className="space-y-4"
                                            >
                                                {[
                                                    {
                                                        key: 'name',
                                                        label: 'Full Name',
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
                                                ].map((field) => (
                                                    <label
                                                        key={field.key}
                                                        className="block"
                                                    >
                                                        <span className="mb-2 block text-sm font-medium text-zinc-200">
                                                            {field.label}
                                                        </span>
                                                        <input
                                                            type={field.type}
                                                            value={
                                                                form.data[
                                                                    field.key as keyof AppointmentFormData
                                                                ] as string
                                                            }
                                                            onChange={(event) =>
                                                                form.setData(
                                                                    field.key as keyof AppointmentFormData,
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white transition outline-none focus:border-violet-400/50"
                                                        />
                                                        {form.errors[
                                                            field.key as keyof AppointmentFormData
                                                        ] ? (
                                                            <p className="mt-2 text-sm text-rose-300">
                                                                {
                                                                    form.errors[
                                                                        field.key as keyof AppointmentFormData
                                                                    ]
                                                                }
                                                            </p>
                                                        ) : null}
                                                    </label>
                                                ))}
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="step-2"
                                                initial={{ opacity: 0, x: 40 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -40 }}
                                                transition={{ duration: 0.25 }}
                                                className="space-y-4"
                                            >
                                                <label className="block">
                                                    <span className="mb-2 block text-sm font-medium text-zinc-200">
                                                        Service
                                                    </span>
                                                    <select
                                                        value={
                                                            form.data.service
                                                        }
                                                        onChange={(event) =>
                                                            form.setData(
                                                                'service',
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white transition outline-none focus:border-violet-400/50"
                                                    >
                                                        <option
                                                            value=""
                                                            className="bg-surface"
                                                        >
                                                            Select a service
                                                        </option>
                                                        {services.map(
                                                            (service) => (
                                                                <option
                                                                    key={
                                                                        service.key
                                                                    }
                                                                    value={
                                                                        service.name
                                                                    }
                                                                    className="bg-surface"
                                                                >
                                                                    {
                                                                        service.name
                                                                    }
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                    {form.errors.service ? (
                                                        <p className="mt-2 text-sm text-rose-300">
                                                            {
                                                                form.errors
                                                                    .service
                                                            }
                                                        </p>
                                                    ) : null}
                                                </label>

                                                <label className="block">
                                                    <span className="mb-2 block text-sm font-medium text-zinc-200">
                                                        Preferred Date
                                                    </span>
                                                    <input
                                                        type="date"
                                                        value={
                                                            form.data
                                                                .preferred_date
                                                        }
                                                        onChange={(event) =>
                                                            form.setData(
                                                                'preferred_date',
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white transition outline-none focus:border-violet-400/50"
                                                    />
                                                    {form.errors
                                                        .preferred_date ? (
                                                        <p className="mt-2 text-sm text-rose-300">
                                                            {
                                                                form.errors
                                                                    .preferred_date
                                                            }
                                                        </p>
                                                    ) : null}
                                                </label>

                                                <label className="block">
                                                    <span className="mb-2 block text-sm font-medium text-zinc-200">
                                                        Message
                                                    </span>
                                                    <textarea
                                                        rows={5}
                                                        value={
                                                            form.data.message
                                                        }
                                                        onChange={(event) =>
                                                            form.setData(
                                                                'message',
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white transition outline-none focus:border-violet-400/50"
                                                    />
                                                    {form.errors.message ? (
                                                        <p className="mt-2 text-sm text-rose-300">
                                                            {
                                                                form.errors
                                                                    .message
                                                            }
                                                        </p>
                                                    ) : null}
                                                </label>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                        {step === 2 ? (
                                            <button
                                                type="button"
                                                className="touch-target inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white"
                                                aria-label="Go back to previous step"
                                                onClick={previousStep}
                                            >
                                                Back
                                            </button>
                                        ) : null}

                                        <MagneticButton
                                            type="submit"
                                            ariaLabel={
                                                step === 1
                                                    ? 'Go to step two'
                                                    : 'Submit appointment request'
                                            }
                                            fullWidth
                                            disabled={form.processing}
                                        >
                                            {step === 1
                                                ? 'Continue'
                                                : form.processing
                                                  ? 'Submitting...'
                                                  : 'Request Appointment'}
                                        </MagneticButton>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </section>
        </>
    );
}
