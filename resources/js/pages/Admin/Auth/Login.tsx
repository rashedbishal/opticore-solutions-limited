import type { FormEventHandler, ReactNode } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { AnimatePresence, motion, useAnimation } from 'framer-motion';
import {
    AlertTriangle,
    CheckCircle,
    Eye,
    EyeOff,
    Loader2,
    X,
    Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import CmsLoadingOverlay from '@/components/Admin/CmsLoadingOverlay';

function CornerTL({ error }: { error: boolean }) {
    return (
        <div className="pointer-events-none absolute -top-px -left-px h-8 w-8">
            <div
                className={`absolute top-0 left-0 h-8 w-px bg-gradient-to-b transition-all duration-500 ${error ? 'from-red-400' : 'from-violet-400'} to-transparent`}
            />
            <div
                className={`absolute top-0 left-0 h-px w-8 bg-gradient-to-r transition-all duration-500 ${error ? 'from-red-400' : 'from-violet-400'} to-transparent`}
            />
        </div>
    );
}

function CornerTR({ error }: { error: boolean }) {
    return (
        <div className="pointer-events-none absolute -top-px -right-px h-8 w-8">
            <div
                className={`absolute top-0 right-0 h-8 w-px bg-gradient-to-b transition-all duration-500 ${error ? 'from-red-400' : 'from-violet-400'} to-transparent`}
            />
            <div
                className={`absolute top-0 right-0 h-px w-8 bg-gradient-to-l transition-all duration-500 ${error ? 'from-red-400' : 'from-violet-400'} to-transparent`}
            />
        </div>
    );
}

function CornerBL({ error }: { error: boolean }) {
    return (
        <div className="pointer-events-none absolute -bottom-px -left-px h-8 w-8">
            <div
                className={`absolute bottom-0 left-0 h-8 w-px bg-gradient-to-t transition-all duration-500 ${error ? 'from-red-400' : 'from-cyan-400'} to-transparent`}
            />
            <div
                className={`absolute bottom-0 left-0 h-px w-8 bg-gradient-to-r transition-all duration-500 ${error ? 'from-red-400' : 'from-cyan-400'} to-transparent`}
            />
        </div>
    );
}

function CornerBR({ error }: { error: boolean }) {
    return (
        <div className="pointer-events-none absolute -right-px -bottom-px h-8 w-8">
            <div
                className={`absolute right-0 bottom-0 h-8 w-px bg-gradient-to-t transition-all duration-500 ${error ? 'from-red-400' : 'from-cyan-400'} to-transparent`}
            />
            <div
                className={`absolute right-0 bottom-0 h-px w-8 bg-gradient-to-l transition-all duration-500 ${error ? 'from-red-400' : 'from-cyan-400'} to-transparent`}
            />
        </div>
    );
}

function GridBackground() {
    return (
        <>
            <div
                className="absolute inset-0 opacity-[0.07]"
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(139,92,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,1) 1px, transparent 1px)',
                    backgroundSize: '64px 64px',
                }}
            />
            <div
                className="absolute right-0 bottom-0 left-0 h-56 opacity-[0.06]"
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(139,92,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,1) 1px, transparent 1px)',
                    backgroundSize: '80px 80px',
                    transform: 'perspective(500px) rotateX(55deg)',
                    transformOrigin: 'bottom center',
                }}
            />
        </>
    );
}

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    duration: Math.random() * 6 + 4,
    delay: Math.random() * 4,
}));

interface ErrorDialogProps {
    messages: string[];
    onClose: () => void;
}

function ErrorDialog({ messages, onClose }: ErrorDialogProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{
                backdropFilter: 'blur(4px)',
                background: 'rgba(0,0,0,0.55)',
            }}
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.86, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="relative w-full max-w-sm overflow-hidden rounded-xl"
                style={{
                    background: 'linear-gradient(148deg, #0e1225, #090d1b)',
                    border: '1px solid rgba(239,68,68,0.35)',
                    boxShadow:
                        '0 0 0 1px rgba(239,68,68,0.08), 0 32px 80px rgba(0,0,0,0.85), 0 0 70px rgba(239,68,68,0.14)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Top scan accent */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/70 to-transparent" />

                {/* Title bar */}
                <div
                    className="flex items-center justify-between px-4 py-2.5"
                    style={{
                        background:
                            'linear-gradient(90deg, rgba(239,68,68,0.14), rgba(239,68,68,0.05))',
                        borderBottom: '1px solid rgba(239,68,68,0.18)',
                    }}
                >
                    <div className="flex items-center gap-2.5">
                        {/* Traffic lights */}
                        <div className="flex gap-1.5">
                            <div
                                className="h-2.5 w-2.5 rounded-full bg-red-500"
                                style={{
                                    boxShadow: '0 0 6px rgba(239,68,68,0.7)',
                                }}
                            />
                            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/40" />
                            <div className="h-2.5 w-2.5 rounded-full bg-green-500/25" />
                        </div>
                        <span className="font-mono text-[9px] tracking-[0.25em] text-red-400/80 uppercase">
                            ◈ System Alert
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-5 w-5 items-center justify-center rounded border border-red-500/30 bg-red-500/10 text-red-400/60 transition-all hover:border-red-400/60 hover:bg-red-500/20 hover:text-red-300"
                    >
                        <X size={10} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-5">
                    <div className="flex items-start gap-4">
                        {/* Warning icon */}
                        <div
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                            style={{
                                background: 'rgba(239,68,68,0.1)',
                                border: '1px solid rgba(239,68,68,0.28)',
                                boxShadow: '0 0 20px rgba(239,68,68,0.12)',
                            }}
                        >
                            <motion.div
                                animate={{ scale: [1, 1.12, 1] }}
                                transition={{
                                    duration: 1.8,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                            >
                                <AlertTriangle className="h-5 w-5 text-red-400" />
                            </motion.div>
                        </div>

                        <div className="flex-1">
                            <p className="mb-2 font-mono text-[9px] tracking-[0.22em] text-red-400/70 uppercase">
                                Authentication Failed
                            </p>
                            <div className="space-y-1.5">
                                {messages.map((msg, i) => (
                                    <p
                                        key={i}
                                        className="text-sm leading-relaxed text-white/65"
                                    >
                                        {msg}
                                    </p>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div
                    className="flex items-center justify-end px-5 py-3"
                    style={{ borderTop: '1px solid rgba(239,68,68,0.14)' }}
                >
                    <motion.button
                        onClick={onClose}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="relative overflow-hidden rounded-lg px-6 py-2 font-mono text-[10px] tracking-[0.22em] text-red-300 uppercase"
                        style={{
                            background:
                                'linear-gradient(135deg, rgba(239,68,68,0.18), rgba(239,68,68,0.08))',
                            border: '1px solid rgba(239,68,68,0.35)',
                            boxShadow: '0 0 18px rgba(239,68,68,0.1)',
                        }}
                    >
                        {/* Shimmer */}
                        <motion.div
                            animate={{ x: ['-120%', '220%'] }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                repeatDelay: 1,
                                ease: 'easeInOut',
                            }}
                            className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-red-400/15 to-transparent"
                        />
                        <span className="relative">Dismiss</span>
                    </motion.button>
                </div>

                {/* Bottom accent */}
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-red-500/35 to-transparent" />
            </motion.div>
        </motion.div>
    );
}

function SuccessDialog({
    name,
    onProceed,
}: {
    name: string;
    onProceed: () => void;
}) {
    const proceedRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const t = setTimeout(() => proceedRef.current?.focus(), 320);

        return () => clearTimeout(t);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{
                backdropFilter: 'blur(4px)',
                background: 'rgba(0,0,0,0.55)',
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.86, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="relative w-full max-w-sm overflow-hidden rounded-xl"
                style={{
                    background: 'linear-gradient(148deg, #0a1a10, #071210)',
                    border: '1px solid rgba(34,197,94,0.35)',
                    boxShadow:
                        '0 0 0 1px rgba(34,197,94,0.08), 0 32px 80px rgba(0,0,0,0.85), 0 0 70px rgba(34,197,94,0.14)',
                }}
            >
                {/* Top scan accent */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-green-500/70 to-transparent" />

                {/* Title bar */}
                <div
                    className="flex items-center px-4 py-2.5"
                    style={{
                        background:
                            'linear-gradient(90deg, rgba(34,197,94,0.14), rgba(34,197,94,0.05))',
                        borderBottom: '1px solid rgba(34,197,94,0.18)',
                    }}
                >
                    <div className="flex items-center gap-2.5">
                        {/* Traffic lights — green active */}
                        <div className="flex gap-1.5">
                            <div className="h-2.5 w-2.5 rounded-full bg-red-500/25" />
                            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/25" />
                            <div
                                className="h-2.5 w-2.5 rounded-full bg-green-500"
                                style={{
                                    boxShadow: '0 0 6px rgba(34,197,94,0.7)',
                                }}
                            />
                        </div>
                        <span className="font-mono text-[9px] tracking-[0.25em] text-green-400/80 uppercase">
                            ◈ Access Granted
                        </span>
                    </div>
                </div>

                {/* Body */}
                <div className="px-5 py-5">
                    <div className="flex items-start gap-4">
                        {/* Check icon */}
                        <div
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                            style={{
                                background: 'rgba(34,197,94,0.1)',
                                border: '1px solid rgba(34,197,94,0.28)',
                                boxShadow: '0 0 20px rgba(34,197,94,0.12)',
                            }}
                        >
                            <motion.div
                                animate={{ scale: [1, 1.12, 1] }}
                                transition={{
                                    duration: 1.8,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                            >
                                <CheckCircle className="h-5 w-5 text-green-400" />
                            </motion.div>
                        </div>

                        <div className="flex-1 pt-0.5">
                            <p className="text-sm font-semibold text-white">
                                Authentication Successful
                            </p>
                            <p className="mt-1 text-xs text-green-300/70">
                                for{' '}
                                <span className="font-mono font-semibold text-green-300">
                                    {name}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="mx-5 h-px bg-green-500/12" />

                {/* Footer */}
                <div className="flex justify-end px-5 py-3.5">
                    <motion.button
                        ref={proceedRef}
                        type="button"
                        onClick={onProceed}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="relative overflow-hidden rounded-lg px-6 py-2 text-sm font-semibold text-white ring-2 ring-green-500/40 outline-none focus:ring-green-400/70"
                        style={{
                            background:
                                'linear-gradient(135deg, rgba(34,197,94,0.22), rgba(34,197,94,0.1))',
                            border: '1px solid rgba(34,197,94,0.4)',
                            boxShadow: '0 0 18px rgba(34,197,94,0.18)',
                        }}
                    >
                        <motion.span
                            animate={{ x: ['-100%', '180%'] }}
                            transition={{
                                duration: 1.6,
                                repeat: Infinity,
                                ease: 'linear',
                                repeatDelay: 0.8,
                            }}
                            className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-green-400/15 to-transparent"
                        />
                        <span className="relative">Proceed</span>
                    </motion.button>
                </div>

                {/* Bottom accent */}
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-green-500/35 to-transparent" />
            </motion.div>
        </motion.div>
    );
}

export default function Login({ successName }: { successName?: string }) {
    const { data, setData, post, processing } = useForm({
        email: '',
        password: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [glitch, setGlitch] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [showDialog, setShowDialog] = useState(false);
    const [errorMessages, setErrorMessages] = useState<string[]>([]);
    const [signingIn, setSigningIn] = useState(false);

    const shakeControls = useAnimation();

    useEffect(() => {
        const id = setInterval(() => {
            setGlitch(true);
            setTimeout(() => setGlitch(false), 120);
        }, 5000);

        return () => clearInterval(id);
    }, []);

    const closeDialog = () => {
        setShowDialog(false);
        setHasError(false);
    };

    const handleProceed = () => {
        document.body.classList.add('cms-active');
        setSigningIn(true);
        router.visit('/admin', {
            onError: () => {
                setSigningIn(false);
                document.body.classList.remove('cms-active');
            },
        });
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        setScanning(true);
        post('/admin/login', {
            onFinish: () => setScanning(false),
            onError: (errs) => {
                const messages = Object.values(errs).filter(
                    Boolean,
                ) as string[];
                setErrorMessages(messages);
                setHasError(true);
                setShowDialog(true);
                shakeControls.start({
                    x: [0, -13, 13, -10, 10, -6, 6, -3, 3, 0],
                    transition: { duration: 0.55, ease: 'easeInOut' },
                });
            },
        });
    };

    return (
        <>
            <Head title="Secure Access" />

            <AnimatePresence>
                {successName && (
                    <SuccessDialog
                        name={successName}
                        onProceed={handleProceed}
                    />
                )}
            </AnimatePresence>

            {successName && (
                <CmsLoadingOverlay
                    forceVisible={signingIn}
                    forceLabel={`Signing In ${successName}`}
                />
            )}

            <div className="relative flex h-[100dvh] items-center justify-center overflow-hidden bg-[#03050d] p-4 text-white">
                {/* Grid */}
                <GridBackground />

                {/* Ambient orbs */}
                <motion.div
                    animate={{
                        scale: [1, 1.25, 1],
                        opacity: [0.18, 0.3, 0.18],
                    }}
                    transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                    className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-violet-700 blur-[140px]"
                />
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                    transition={{
                        duration: 7,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: 1.5,
                    }}
                    className="pointer-events-none absolute -right-40 -bottom-40 h-[500px] w-[500px] rounded-full bg-cyan-600 blur-[140px]"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.4, 1],
                        opacity: [0.06, 0.14, 0.06],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: 3,
                    }}
                    className="pointer-events-none absolute top-1/2 left-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500 blur-[100px]"
                />

                {/* Floating particles */}
                <div className="pointer-events-none absolute inset-0">
                    {PARTICLES.map((p) => (
                        <motion.div
                            key={p.id}
                            animate={{ y: [0, -20, 0], opacity: [0, 0.6, 0] }}
                            transition={{
                                duration: p.duration,
                                repeat: Infinity,
                                delay: p.delay,
                                ease: 'easeInOut',
                            }}
                            className="absolute rounded-full bg-violet-400"
                            style={{
                                left: `${p.x}%`,
                                top: `${p.y}%`,
                                width: p.size,
                                height: p.size,
                            }}
                        />
                    ))}
                </div>

                {/* Card — outer div handles shake, inner handles entrance */}
                <motion.div
                    animate={shakeControls}
                    className="relative z-10 w-full max-w-md"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 32, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        className="relative"
                    >
                        {/* Outer glow border — red when error */}
                        <div
                            className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-b transition-all duration-500"
                            style={{
                                backgroundImage: hasError
                                    ? 'linear-gradient(to bottom, rgba(239,68,68,0.55), rgba(239,68,68,0.15) 50%, rgba(220,38,38,0.35))'
                                    : 'linear-gradient(to bottom, rgba(139,92,246,0.4), rgba(139,92,246,0.1) 50%, rgba(6,182,212,0.25))',
                            }}
                        />

                        {/* Corner accents */}
                        <CornerTL error={hasError} />
                        <CornerTR error={hasError} />
                        <CornerBL error={hasError} />
                        <CornerBR error={hasError} />

                        {/* Card body */}
                        <div
                            className="relative overflow-hidden rounded-2xl bg-[#060c1a]/95 px-6 py-8 backdrop-blur-xl transition-all duration-500 sm:px-8 sm:py-10"
                            style={{
                                boxShadow: hasError
                                    ? '0 0 60px rgba(239,68,68,0.12), inset 0 0 40px rgba(239,68,68,0.04)'
                                    : undefined,
                            }}
                        >
                            {/* Inner top highlight */}
                            <div
                                className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent transition-all duration-500"
                                style={{
                                    backgroundImage: hasError
                                        ? 'linear-gradient(to right, transparent, rgba(239,68,68,0.5), transparent)'
                                        : 'linear-gradient(to right, transparent, rgba(139,92,246,0.5), transparent)',
                                }}
                            />

                            {/* Scan line on submit */}
                            <AnimatePresence>
                                {scanning && (
                                    <motion.div
                                        key="scan"
                                        initial={{ top: '-4%' }}
                                        animate={{ top: '104%' }}
                                        exit={{ opacity: 0 }}
                                        transition={{
                                            duration: 1.4,
                                            ease: 'linear',
                                        }}
                                        className="pointer-events-none absolute right-0 left-0 z-20 h-px bg-gradient-to-r from-transparent via-violet-400/90 to-transparent"
                                        style={{
                                            boxShadow:
                                                '0 0 12px 2px rgba(139,92,246,0.5)',
                                        }}
                                    />
                                )}
                            </AnimatePresence>

                            {/* Header */}
                            <div className="mb-8 text-center">
                                {/* Status pill */}
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="mb-5 inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1"
                                >
                                    <motion.span
                                        animate={{ opacity: [1, 0.2, 1] }}
                                        transition={{
                                            duration: 1.4,
                                            repeat: Infinity,
                                        }}
                                        className="h-1.5 w-1.5 rounded-full bg-green-400"
                                    />
                                    <span className="font-mono text-[10px] tracking-[0.22em] text-green-400 uppercase">
                                        System Online
                                    </span>
                                </motion.div>

                                {/* Logo */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{
                                        delay: 0.2,
                                        type: 'spring',
                                        stiffness: 200,
                                    }}
                                    className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center"
                                >
                                    <div className="absolute inset-0 rounded-2xl border border-amber-100/30 bg-[#fdf8f0]" />
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{
                                            duration: 16,
                                            repeat: Infinity,
                                            ease: 'linear',
                                        }}
                                        className="absolute inset-2 rounded-xl border border-dashed border-blue-400/60"
                                    />
                                    <motion.div
                                        animate={{
                                            scale: [1, 1.15, 1],
                                            opacity: [0.3, 0.6, 0.3],
                                        }}
                                        transition={{
                                            duration: 2.5,
                                            repeat: Infinity,
                                        }}
                                        className="absolute inset-0 rounded-2xl bg-[#fdf8f0]/20 blur-sm"
                                    />
                                    <img
                                        src="/favicon.ico"
                                        alt="Opticore"
                                        className="relative h-9 w-11 object-contain"
                                    />
                                </motion.div>

                                {/* Title */}
                                <motion.h1
                                    animate={
                                        glitch
                                            ? {
                                                  x: [-3, 3, -2, 2, 0],
                                                  skewX: [-3, 3, 0],
                                                  textShadow: [
                                                      '2px 0 #06b6d4, -2px 0 #7c3aed',
                                                      '-2px 0 #06b6d4, 2px 0 #7c3aed',
                                                      '0 0 transparent',
                                                  ],
                                              }
                                            : {}
                                    }
                                    transition={{ duration: 0.12 }}
                                    className="text-lg font-bold tracking-[0.18em] text-white uppercase sm:text-xl"
                                >
                                    Opticore Solutions Limited
                                </motion.h1>

                                <p className="mt-1.5 font-mono text-[10px] tracking-[0.3em] text-violet-400/60 uppercase">
                                    Neural Access Terminal
                                </p>

                                {/* Divider */}
                                <div className="mt-5 flex items-center gap-3">
                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-violet-500/30" />
                                    <div className="h-1 w-1 rotate-45 bg-violet-500/60" />
                                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-violet-500/30" />
                                </div>
                            </div>

                            {/* Form */}
                            <form onSubmit={submit} className="space-y-5">
                                {/* Email */}
                                <div className="group">
                                    <label
                                        htmlFor="email"
                                        className="mb-2 block font-mono text-[10px] tracking-[0.22em] text-violet-400/70 uppercase"
                                    >
                                        ◈ Access ID
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="email"
                                            type="email"
                                            name="email"
                                            value={data.email}
                                            autoComplete="off"
                                            onChange={(e) =>
                                                setData('email', e.target.value)
                                            }
                                            placeholder="admin@opticore.com"
                                            className="w-full rounded-lg border border-white/8 bg-white/4 px-4 py-3 text-sm text-white placeholder-white/20 transition-all duration-300 outline-none focus:border-violet-500/50 focus:bg-violet-500/5"
                                            onFocus={(e) =>
                                                (e.currentTarget.style.boxShadow =
                                                    '0 0 0 1px rgba(139,92,246,0.3), 0 0 20px rgba(139,92,246,0.1)')
                                            }
                                            onBlur={(e) =>
                                                (e.currentTarget.style.boxShadow =
                                                    '')
                                            }
                                        />
                                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px w-0 bg-gradient-to-r from-violet-500 to-cyan-500 transition-all duration-500 group-focus-within:w-full" />
                                    </div>
                                </div>

                                {/* Password */}
                                <div className="group">
                                    <label
                                        htmlFor="password"
                                        className="mb-2 block font-mono text-[10px] tracking-[0.22em] text-violet-400/70 uppercase"
                                    >
                                        ◈ Cipher Key
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="password"
                                            type={
                                                showPassword
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            name="password"
                                            value={data.password}
                                            autoComplete="current-password"
                                            onChange={(e) =>
                                                setData(
                                                    'password',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="••••••••••••"
                                            className="w-full rounded-lg border border-white/8 bg-white/4 px-4 py-3 pr-11 text-sm text-white placeholder-white/20 transition-all duration-300 outline-none focus:border-violet-500/50 focus:bg-violet-500/5"
                                            onFocus={(e) =>
                                                (e.currentTarget.style.boxShadow =
                                                    '0 0 0 1px rgba(139,92,246,0.3), 0 0 20px rgba(139,92,246,0.1)')
                                            }
                                            onBlur={(e) =>
                                                (e.currentTarget.style.boxShadow =
                                                    '')
                                            }
                                        />
                                        <button
                                            type="button"
                                            tabIndex={-1}
                                            onClick={() =>
                                                setShowPassword((v) => !v)
                                            }
                                            className="absolute top-1/2 right-3 -translate-y-1/2 text-white/25 transition-colors hover:text-violet-400"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px w-0 bg-gradient-to-r from-violet-500 to-cyan-500 transition-all duration-500 group-focus-within:w-full" />
                                    </div>
                                </div>

                                {/* Submit */}
                                <motion.button
                                    type="submit"
                                    disabled={processing}
                                    whileHover={{ scale: 1.015 }}
                                    whileTap={{ scale: 0.985 }}
                                    className="relative mt-2 w-full overflow-hidden rounded-lg py-3 text-sm font-semibold tracking-[0.18em] text-white uppercase disabled:opacity-60"
                                    style={{
                                        background:
                                            'linear-gradient(135deg, #5b21b6 0%, #7c3aed 50%, #0891b2 100%)',
                                        boxShadow:
                                            '0 0 30px rgba(124,58,237,0.35)',
                                    }}
                                >
                                    {/* Shimmer */}
                                    <motion.div
                                        animate={{ x: ['-110%', '210%'] }}
                                        transition={{
                                            duration: 2.2,
                                            repeat: Infinity,
                                            repeatDelay: 1.5,
                                            ease: 'easeInOut',
                                        }}
                                        className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                                    />
                                    <span className="relative flex items-center justify-center gap-2">
                                        {processing ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Authenticating...
                                            </>
                                        ) : (
                                            <>
                                                <Zap className="h-4 w-4" />
                                                Initialize Session
                                            </>
                                        )}
                                    </span>
                                </motion.button>
                            </form>

                            {/* Footer */}
                            <div className="mt-7 flex items-center gap-3">
                                <div className="h-px flex-1 bg-white/5" />
                                <p className="font-mono text-[9px] tracking-[0.18em] text-white/18 uppercase">
                                    Opticore Solutions Ltd.
                                </p>
                                <div className="h-px flex-1 bg-white/5" />
                            </div>

                            {/* Inner bottom highlight */}
                            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
                        </div>
                    </motion.div>
                </motion.div>
            </div>

            {/* Error dialog */}
            <AnimatePresence>
                {showDialog && (
                    <ErrorDialog
                        messages={errorMessages}
                        onClose={closeDialog}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

Login.layout = (page: ReactNode) => <>{page}</>;
