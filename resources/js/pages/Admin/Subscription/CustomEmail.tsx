import type { ReactNode } from 'react';
import { Link, useForm, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Send,
    Loader2,
    Paperclip,
    X,
    AlignLeft,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
    index,
    sendCustomEmail,
} from '@/actions/App/Http/Controllers/Admin/SubscriptionController';
import { CmsErrorDialog } from '@/components/Admin/CmsErrorDialog';
import { CmsSuccessDialog } from '@/components/Admin/CmsSuccessDialog';
import AdminLayout from '@/components/Layout/AdminLayout';

interface Props {
    subscriberCount: number;
}

export default function CustomEmail({ subscriberCount }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        to: '',
        cc: '',
        bcc: '',
        subject: '',
        title: '',
        body: '',
        attachments: [] as File[],
    });

    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessages, setErrorMessages] = useState<string[]>([]);
    const attachRef = useRef<HTMLInputElement>(null);
    const isOurRequest = useRef(false);

    useEffect(() => {
        return router.on('networkError', () => {
            if (!isOurRequest.current) {
                return;
            }

            isOurRequest.current = false;
            setErrorMessages([
                'Network connection lost. Please check your internet connection and try again.',
            ]);
        });
    }, []);

    function addAttachments(files: FileList | null) {
        if (!files) {
            return;
        }

        setData('attachments', [...data.attachments, ...Array.from(files)]);
    }

    function removeAttachment(index: number) {
        setData(
            'attachments',
            data.attachments.filter((_, i) => i !== index),
        );
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        isOurRequest.current = true;

        post(sendCustomEmail.url(), {
            forceFormData: true,
            onSuccess: () => {
                isOurRequest.current = false;
                setData({
                    to: '',
                    cc: '',
                    bcc: '',
                    subject: '',
                    title: '',
                    body: '',
                    attachments: [],
                });

                if (attachRef.current) {
                    attachRef.current.value = '';
                }

                setSuccessMessage('Email sent successfully.');
            },
            onError: (errs) => {
                isOurRequest.current = false;
                const msgs = Object.values(errs).filter(Boolean) as string[];
                setErrorMessages(
                    msgs.length
                        ? msgs
                        : ['An unexpected error occurred. Please try again.'],
                );
            },
        });
    }

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <CmsSuccessDialog
                message={successMessage}
                onClose={() => setSuccessMessage('')}
            />
            <CmsErrorDialog
                messages={errorMessages}
                onClose={() => setErrorMessages([])}
            />

            {/* Back */}
            <Link
                href={index.url()}
                className="inline-flex items-center gap-2 font-mono text-xs tracking-[0.15em] text-cyan-400/60 uppercase transition-colors hover:text-cyan-300"
            >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Subscriptions
            </Link>

            {/* Card */}
            <div
                className="relative overflow-hidden rounded-2xl"
                style={{
                    background: 'linear-gradient(148deg, #0b1020, #070d1a)',
                    border: '1px solid rgba(6,182,212,0.2)',
                    boxShadow: '0 0 60px rgba(6,182,212,0.06)',
                }}
            >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent" />

                {/* Header */}
                <div
                    className="px-6 py-4"
                    style={{
                        background:
                            'linear-gradient(90deg, rgba(6,182,212,0.1), rgba(6,182,212,0.03))',
                        borderBottom: '1px solid rgba(6,182,212,0.12)',
                    }}
                >
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1.5">
                            <div
                                className="h-2.5 w-2.5 rounded-full bg-cyan-500"
                                style={{
                                    boxShadow: '0 0 6px rgba(6,182,212,0.7)',
                                }}
                            />
                            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/40" />
                            <div className="h-2.5 w-2.5 rounded-full bg-green-500/25" />
                        </div>
                        <div className="flex items-center gap-2.5">
                            <AlignLeft className="h-4 w-4 text-cyan-400" />
                            <span className="font-mono text-xs tracking-[0.18em] text-cyan-300/80 uppercase">
                                ◈ Custom Email Composer
                            </span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 p-6">
                    {/* Subscriber hint */}
                    {subscriberCount > 0 && (
                        <div className="rounded-lg border border-violet-500/15 bg-violet-500/5 px-4 py-2.5">
                            <p className="text-xs text-violet-300/70">
                                Tip: add subscriber emails to BCC to reach all{' '}
                                <span className="font-semibold text-violet-300">
                                    {subscriberCount}
                                </span>{' '}
                                subscribers.
                            </p>
                        </div>
                    )}

                    <Field label="◈ To" error={errors.to}>
                        <input
                            type="text"
                            value={data.to}
                            onChange={(e) => setData('to', e.target.value)}
                            placeholder="recipient@example.com, another@example.com"
                            className="block w-full rounded-lg border border-white/8 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-white/20 transition-all outline-none focus:border-cyan-500/50 focus:bg-cyan-500/5"
                        />
                    </Field>

                    <Field label="◈ CC" error={errors.cc}>
                        <input
                            type="text"
                            value={data.cc}
                            onChange={(e) => setData('cc', e.target.value)}
                            placeholder="cc@example.com"
                            className="block w-full rounded-lg border border-white/8 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-white/20 transition-all outline-none focus:border-cyan-500/50 focus:bg-cyan-500/5"
                        />
                    </Field>

                    <Field label="◈ BCC" error={errors.bcc}>
                        <input
                            type="text"
                            value={data.bcc}
                            onChange={(e) => setData('bcc', e.target.value)}
                            placeholder="bcc@example.com"
                            className="block w-full rounded-lg border border-white/8 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-white/20 transition-all outline-none focus:border-cyan-500/50 focus:bg-cyan-500/5"
                        />
                    </Field>

                    <Field label="◈ Subject" error={errors.subject}>
                        <input
                            type="text"
                            value={data.subject}
                            onChange={(e) => setData('subject', e.target.value)}
                            placeholder="Email subject line (shown in inbox)"
                            className="block w-full rounded-lg border border-white/8 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-white/20 transition-all outline-none focus:border-cyan-500/50 focus:bg-cyan-500/5"
                        />
                    </Field>

                    <Field label="◈ Email Title" error={errors.title}>
                        <input
                            type="text"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            placeholder="Title displayed inside the email body"
                            className="block w-full rounded-lg border border-white/8 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-white/20 transition-all outline-none focus:border-cyan-500/50 focus:bg-cyan-500/5"
                        />
                    </Field>

                    <Field label="◈ Body" error={errors.body}>
                        <textarea
                            value={data.body}
                            onChange={(e) => setData('body', e.target.value)}
                            rows={8}
                            placeholder="Write your message here..."
                            className="block w-full resize-y rounded-lg border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/20 transition-all outline-none focus:border-cyan-500/50 focus:bg-cyan-500/5"
                        />
                    </Field>

                    {/* Attachments */}
                    <div>
                        <label className="mb-2 block font-mono text-[10px] tracking-[0.22em] text-cyan-400/60 uppercase">
                            ◈ Attachments
                        </label>

                        {data.attachments.length > 0 && (
                            <div className="mb-3 space-y-2">
                                {data.attachments.map((file, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2"
                                    >
                                        <div className="flex min-w-0 items-center gap-2">
                                            <Paperclip className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                                            <span className="truncate text-xs text-zinc-300">
                                                {file.name}
                                            </span>
                                            <span className="shrink-0 text-[10px] text-zinc-600">
                                                ({(file.size / 1024).toFixed(0)}{' '}
                                                KB)
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeAttachment(i)}
                                            className="ml-3 shrink-0 text-zinc-600 transition-colors hover:text-red-400"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => attachRef.current?.click()}
                            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-zinc-400 transition-all hover:border-cyan-500/30 hover:bg-cyan-500/5 hover:text-cyan-300"
                        >
                            <Paperclip className="h-4 w-4" />
                            Add Attachment
                        </button>
                        <input
                            ref={attachRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e) => addAttachments(e.target.files)}
                        />
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end pt-2">
                        <motion.button
                            type="submit"
                            disabled={
                                processing ||
                                !data.to.trim() ||
                                !data.subject.trim() ||
                                !data.title.trim() ||
                                !data.body.trim()
                            }
                            whileHover={
                                processing ? undefined : { scale: 1.02 }
                            }
                            whileTap={processing ? undefined : { scale: 0.98 }}
                            className="relative inline-flex items-center gap-2.5 overflow-hidden rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-600 to-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(6,182,212,0.25),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all hover:from-cyan-500 hover:to-teal-500 hover:shadow-[0_0_32px_rgba(6,182,212,0.45)] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {!processing && (
                                <motion.div
                                    animate={{ x: ['-120%', '220%'] }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        repeatDelay: 1,
                                        ease: 'easeInOut',
                                    }}
                                    className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                />
                            )}
                            <span className="relative flex items-center gap-2">
                                {processing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4" />
                                        Send Email
                                    </>
                                )}
                            </span>
                        </motion.button>
                    </div>
                </form>

                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
            </div>
        </div>
    );
}

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <div>
            <label className="mb-2 block font-mono text-[10px] tracking-[0.22em] text-cyan-400/60 uppercase">
                {label}
            </label>
            {children}
            {error && (
                <p className="mt-2 font-mono text-[10px] tracking-[0.1em] text-red-400">
                    ◈ {error}
                </p>
            )}
        </div>
    );
}

CustomEmail.layout = (page: ReactNode) => (
    <AdminLayout title="Custom Email">{page}</AdminLayout>
);
