import type { ReactNode } from 'react';
import { Link, useForm, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowLeft, ImageIcon, Upload, X, Send, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    index,
    sendOfferEmail,
} from '@/actions/App/Http/Controllers/Admin/SubscriptionController';
import { CmsErrorDialog } from '@/components/Admin/CmsErrorDialog';
import { CmsSuccessDialog } from '@/components/Admin/CmsSuccessDialog';
import AdminLayout from '@/components/Layout/AdminLayout';

export default function OfferEmail() {
    const { data, setData, post, processing, errors } = useForm<{
        image: File | null;
    }>({ image: null });

    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessages, setErrorMessages] = useState<string[]>([]);
    const [dragOver, setDragOver] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);
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

    const handleFile = useCallback(
        (file: File) => {
            if (!file.type.startsWith('image/')) {
                return;
            }

            setData('image', file);
            setPreview(URL.createObjectURL(file));
        },
        [setData],
    );

    const onDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files[0];

            if (file) {
                handleFile(file);
            }
        },
        [handleFile],
    );

    function removeImage() {
        setData('image', null);
        setPreview(null);

        if (fileRef.current) {
            fileRef.current.value = '';
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!data.image) {
            setErrorMessages(['Please select an image to upload.']);

            return;
        }

        isOurRequest.current = true;

        post(sendOfferEmail.url(), {
            forceFormData: true,
            onSuccess: () => {
                isOurRequest.current = false;
                removeImage();
                setSuccessMessage(
                    'Broadcast email sent successfully to all subscribers.',
                );
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

            {/* Back link */}
            <Link
                href={index.url()}
                className="inline-flex items-center gap-2 font-mono text-xs tracking-[0.15em] text-violet-400/60 uppercase transition-colors hover:text-violet-300"
            >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Subscriptions
            </Link>

            {/* Card */}
            <div
                className="relative overflow-hidden rounded-2xl"
                style={{
                    background: 'linear-gradient(148deg, #0b1020, #070d1a)',
                    border: '1px solid rgba(124,58,237,0.25)',
                    boxShadow: '0 0 60px rgba(124,58,237,0.08)',
                }}
            >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/60 to-transparent" />

                {/* Header */}
                <div
                    className="px-6 py-4"
                    style={{
                        background:
                            'linear-gradient(90deg, rgba(124,58,237,0.12), rgba(124,58,237,0.04))',
                        borderBottom: '1px solid rgba(124,58,237,0.15)',
                    }}
                >
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1.5">
                            <div
                                className="h-2.5 w-2.5 rounded-full bg-violet-500"
                                style={{
                                    boxShadow: '0 0 6px rgba(124,58,237,0.7)',
                                }}
                            />
                            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/40" />
                            <div className="h-2.5 w-2.5 rounded-full bg-green-500/25" />
                        </div>
                        <div className="flex items-center gap-2.5">
                            <ImageIcon className="h-4 w-4 text-violet-400" />
                            <span className="font-mono text-xs tracking-[0.18em] text-violet-300/80 uppercase">
                                ◈ Offer Broadcast
                            </span>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="space-y-6 p-6">
                    {/* Drop zone */}
                    <div>
                        <label className="mb-3 block font-mono text-[10px] tracking-[0.22em] text-violet-400/60 uppercase">
                            ◈ Offer Image
                        </label>

                        {!preview ? (
                            <div
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setDragOver(true);
                                }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={onDrop}
                                onClick={() => fileRef.current?.click()}
                                className={`relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-14 transition-all duration-300 ${
                                    dragOver
                                        ? 'border-violet-400/60 bg-violet-500/10'
                                        : 'border-violet-500/20 bg-white/[0.02] hover:border-violet-400/40 hover:bg-violet-500/5'
                                }`}
                            >
                                <div
                                    className="flex h-14 w-14 items-center justify-center rounded-xl"
                                    style={{
                                        background: 'rgba(124,58,237,0.1)',
                                        border: '1px solid rgba(124,58,237,0.25)',
                                    }}
                                >
                                    <Upload className="h-6 w-6 text-violet-400" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-medium text-white">
                                        Drop image here or{' '}
                                        <span className="text-violet-400">
                                            browse
                                        </span>
                                    </p>
                                    <p className="mt-1 font-mono text-[10px] tracking-wider text-zinc-600 uppercase">
                                        PNG · JPG · WEBP · max 5 MB
                                    </p>
                                </div>
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];

                                        if (file) {
                                            handleFile(file);
                                        }
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="relative overflow-hidden rounded-xl border border-violet-500/20">
                                <img
                                    src={preview}
                                    alt="Preview"
                                    className="max-h-72 w-full bg-black/40 object-contain"
                                />
                                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-white/10 bg-black/70 px-4 py-2.5 backdrop-blur-sm">
                                    <span className="max-w-xs truncate font-mono text-xs text-zinc-400">
                                        {data.image?.name}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className="ml-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 transition-colors hover:bg-red-500/20"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {errors.image && (
                            <p className="mt-2 font-mono text-[10px] tracking-[0.1em] text-red-400">
                                ◈ {errors.image}
                            </p>
                        )}
                    </div>

                    {/* Info */}
                    <div className="rounded-lg border border-cyan-500/15 bg-cyan-500/5 px-4 py-3">
                        <p className="text-xs leading-relaxed text-cyan-300/70">
                            The email will be sent to the company inbox with all
                            subscribers in BCC. No recipient addresses will be
                            visible to each other.
                        </p>
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end">
                        <motion.button
                            type="submit"
                            disabled={processing || !data.image}
                            whileHover={
                                processing || !data.image
                                    ? undefined
                                    : { scale: 1.02 }
                            }
                            whileTap={
                                processing || !data.image
                                    ? undefined
                                    : { scale: 0.98 }
                            }
                            className="relative inline-flex items-center gap-2.5 overflow-hidden rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(124,58,237,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all hover:from-violet-500 hover:to-indigo-500 hover:shadow-[0_0_32px_rgba(124,58,237,0.5)] disabled:cursor-not-allowed disabled:opacity-40"
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
                                        Send Broadcast Email
                                    </>
                                )}
                            </span>
                        </motion.button>
                    </div>
                </form>

                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
            </div>
        </div>
    );
}

OfferEmail.layout = (page: ReactNode) => (
    <AdminLayout title="Broadcast Email">{page}</AdminLayout>
);
