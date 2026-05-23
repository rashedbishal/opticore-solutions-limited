import type { FormEventHandler, ReactNode } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Loader2, ShieldCheck, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';

function CornerTL() {
    return (
        <div className="absolute -top-px -left-px h-8 w-8 pointer-events-none">
            <div className="absolute top-0 left-0 h-8 w-px bg-gradient-to-b from-violet-400 to-transparent" />
            <div className="absolute top-0 left-0 h-px w-8 bg-gradient-to-r from-violet-400 to-transparent" />
        </div>
    );
}

function CornerTR() {
    return (
        <div className="absolute -top-px -right-px h-8 w-8 pointer-events-none">
            <div className="absolute top-0 right-0 h-8 w-px bg-gradient-to-b from-violet-400 to-transparent" />
            <div className="absolute top-0 right-0 h-px w-8 bg-gradient-to-l from-violet-400 to-transparent" />
        </div>
    );
}

function CornerBL() {
    return (
        <div className="absolute -bottom-px -left-px h-8 w-8 pointer-events-none">
            <div className="absolute bottom-0 left-0 h-8 w-px bg-gradient-to-t from-cyan-400 to-transparent" />
            <div className="absolute bottom-0 left-0 h-px w-8 bg-gradient-to-r from-cyan-400 to-transparent" />
        </div>
    );
}

function CornerBR() {
    return (
        <div className="absolute -bottom-px -right-px h-8 w-8 pointer-events-none">
            <div className="absolute bottom-0 right-0 h-8 w-px bg-gradient-to-t from-cyan-400 to-transparent" />
            <div className="absolute bottom-0 right-0 h-px w-8 bg-gradient-to-l from-cyan-400 to-transparent" />
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
                className="absolute bottom-0 left-0 right-0 h-56 opacity-[0.06]"
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

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [glitch, setGlitch] = useState(false);

    useEffect(() => {
        const id = setInterval(() => {
            setGlitch(true);
            setTimeout(() => setGlitch(false), 120);
        }, 5000);
        return () => clearInterval(id);
    }, []);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        setScanning(true);
        post('/admin/login', { onFinish: () => setScanning(false) });
    };

    return (
        <>
            <Head title="Secure Access" />

            <div className="relative flex h-[100dvh] items-center justify-center overflow-hidden bg-[#03050d] p-4 text-white">

                {/* Grid */}
                <GridBackground />

                {/* Ambient orbs */}
                <motion.div
                    animate={{ scale: [1, 1.25, 1], opacity: [0.18, 0.3, 0.18] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-violet-700 blur-[140px] pointer-events-none"
                />
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
                    className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-cyan-600 blur-[140px] pointer-events-none"
                />
                <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [0.06, 0.14, 0.06] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-violet-500 blur-[100px] pointer-events-none"
                />

                {/* Floating particles */}
                <div className="absolute inset-0 pointer-events-none">
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

                {/* Card */}
                <motion.div
                    initial={{ opacity: 0, y: 32, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="relative z-10 w-full max-w-md"
                >
                    {/* Outer glow border */}
                    <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-violet-500/40 via-violet-500/10 to-cyan-500/25 pointer-events-none" />

                    {/* Corner accents */}
                    <CornerTL />
                    <CornerTR />
                    <CornerBL />
                    <CornerBR />

                    {/* Card body */}
                    <div className="relative overflow-hidden rounded-2xl bg-[#060c1a]/95 px-6 py-8 backdrop-blur-xl sm:px-8 sm:py-10">

                        {/* Inner top highlight */}
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />

                        {/* Scan line on submit */}
                        <AnimatePresence>
                            {scanning && (
                                <motion.div
                                    key="scan"
                                    initial={{ top: '-4%' }}
                                    animate={{ top: '104%' }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 1.4, ease: 'linear' }}
                                    className="pointer-events-none absolute left-0 right-0 z-20 h-px bg-gradient-to-r from-transparent via-violet-400/90 to-transparent"
                                    style={{ boxShadow: '0 0 12px 2px rgba(139,92,246,0.5)' }}
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
                                    transition={{ duration: 1.4, repeat: Infinity }}
                                    className="h-1.5 w-1.5 rounded-full bg-green-400"
                                />
                                <span className="font-mono text-[10px] tracking-[0.22em] text-green-400 uppercase">
                                    System Online
                                </span>
                            </motion.div>

                            {/* Shield icon */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                                className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center"
                            >
                                <div className="absolute inset-0 rounded-2xl border border-violet-500/30 bg-violet-500/10" />
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
                                    className="absolute inset-2 rounded-xl border border-dashed border-violet-400/20"
                                />
                                <motion.div
                                    animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
                                    transition={{ duration: 2.5, repeat: Infinity }}
                                    className="absolute inset-0 rounded-2xl bg-violet-500/10 blur-sm"
                                />
                                <ShieldCheck className="relative h-7 w-7 text-violet-400" />
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
                                className="text-2xl font-bold tracking-[0.18em] text-white uppercase sm:text-3xl"
                            >
                                Opticore CMS
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
                                        autoComplete="email"
                                        autoFocus
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="admin@opticore.com"
                                        className="w-full rounded-lg border border-white/8 bg-white/4 px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all duration-300 focus:border-violet-500/50 focus:bg-violet-500/5"
                                        style={{
                                            boxShadow: undefined,
                                        }}
                                        onFocus={(e) =>
                                            (e.currentTarget.style.boxShadow =
                                                '0 0 0 1px rgba(139,92,246,0.3), 0 0 20px rgba(139,92,246,0.1)')
                                        }
                                        onBlur={(e) => (e.currentTarget.style.boxShadow = '')}
                                    />
                                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px w-0 bg-gradient-to-r from-violet-500 to-cyan-500 transition-all duration-500 group-focus-within:w-full" />
                                </div>
                                {errors.email && (
                                    <p className="mt-1.5 font-mono text-[10px] text-red-400">
                                        ⚠ {errors.email}
                                    </p>
                                )}
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
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={data.password}
                                        autoComplete="current-password"
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="••••••••••••"
                                        className="w-full rounded-lg border border-white/8 bg-white/4 px-4 py-3 pr-11 text-sm text-white placeholder-white/20 outline-none transition-all duration-300 focus:border-violet-500/50 focus:bg-violet-500/5"
                                        onFocus={(e) =>
                                            (e.currentTarget.style.boxShadow =
                                                '0 0 0 1px rgba(139,92,246,0.3), 0 0 20px rgba(139,92,246,0.1)')
                                        }
                                        onBlur={(e) => (e.currentTarget.style.boxShadow = '')}
                                    />
                                    <button
                                        type="button"
                                        tabIndex={-1}
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 transition-colors hover:text-violet-400"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px w-0 bg-gradient-to-r from-violet-500 to-cyan-500 transition-all duration-500 group-focus-within:w-full" />
                                </div>
                                {errors.password && (
                                    <p className="mt-1.5 font-mono text-[10px] text-red-400">
                                        ⚠ {errors.password}
                                    </p>
                                )}
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
                                    boxShadow: '0 0 30px rgba(124,58,237,0.35)',
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
            </div>
        </>
    );
}

Login.layout = (page: ReactNode) => <>{page}</>;
