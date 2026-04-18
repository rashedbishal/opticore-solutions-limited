import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const testimonials = [
    {
        id: 1,
        name: 'Alex Rivera',
        role: 'CEO @ TechFlow',
        quote: 'The visual direction Opticore provided was transformative. Our brand feels decades ahead of the competition.',
        color: 'from-violet-500/20 to-cyan-500/20',
    },
    {
        id: 2,
        name: 'Sarah Chen',
        role: 'Marketing Director',
        quote: 'I have never worked with a team that moves this fast without sacrificing a single ounce of quality.',
        color: 'from-cyan-500/20 to-emerald-500/20',
    },
    {
        id: 3,
        name: 'James Wilson',
        role: 'Founder',
        quote: "They don't just design; they architect experiences. Every pixel feels intentional and aligned with our goals.",
        color: 'from-pink-500/20 to-orange-500/20',
    },
];

export default function LiquidShuffle() {
    const [index, setIndex] = useState(0);

    const next = () => setIndex((prev) => (prev + 1) % testimonials.length);
    const prev = () =>
        setIndex(
            (prev) => (prev - 1 + testimonials.length) % testimonials.length,
        );

    const active = testimonials[index];

    return (
        <div className="relative overflow-hidden bg-black py-32">
            <div className="relative z-10 mx-auto max-w-5xl px-4">
                <div className="flex flex-col items-center text-center">
                    <Quote className="mb-12 h-16 w-16 text-cyan-400 opacity-50" />

                    <div className="relative flex h-[400px] w-full items-center justify-center">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={active.id}
                                initial={{
                                    opacity: 0,
                                    scale: 0.8,
                                    filter: 'blur(20px)',
                                }}
                                animate={{
                                    opacity: 1,
                                    scale: 1,
                                    filter: 'blur(0px)',
                                }}
                                exit={{
                                    opacity: 0,
                                    scale: 1.2,
                                    filter: 'blur(20px)',
                                }}
                                transition={{
                                    duration: 0.8,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                                className="absolute inset-0 flex flex-col items-center justify-center"
                            >
                                <motion.div
                                    className={`absolute inset-0 bg-linear-to-br ${active.color} -z-10 rounded-full blur-[100px]`}
                                    animate={{
                                        scale: [1, 1.2, 1],
                                        rotate: [0, 90, 0],
                                    }}
                                    transition={{
                                        duration: 10,
                                        repeat: Infinity,
                                    }}
                                />

                                <p className="mb-12 text-3xl leading-tight font-bold text-white italic md:text-5xl">
                                    "{active.quote}"
                                </p>

                                <div>
                                    <h4 className="text-xl font-black tracking-widest text-cyan-400 uppercase">
                                        {active.name}
                                    </h4>
                                    <p className="mt-1 text-sm font-bold text-zinc-500 uppercase">
                                        {active.role}
                                    </p>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="mt-12 flex gap-4">
                        <button
                            onClick={prev}
                            className="rounded-full border border-white/10 p-4 text-white transition-colors hover:bg-white/5"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </button>
                        <button
                            onClick={next}
                            className="rounded-full border border-white/10 p-4 text-white transition-colors hover:bg-white/5"
                        >
                            <ChevronRight className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
