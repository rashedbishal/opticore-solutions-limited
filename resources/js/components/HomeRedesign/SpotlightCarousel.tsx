import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const testimonials = [
    {
        id: 1,
        name: 'Elena Gilbert',
        role: 'Product Lead',
        quote: 'The level of detail in their 3D production work was breathtaking. It elevated our entire product launch.',
    },
    {
        id: 2,
        name: 'Damon Salvatore',
        role: 'Creative Director',
        quote: 'Finally, an agency that understands the intersection of high art and commercial performance.',
    },
    {
        id: 3,
        name: 'Stefan Salvatore',
        role: 'Founder',
        quote: "Opticore doesn't just deliver assets; they deliver a competitive advantage. Their work is undeniable.",
    },
];

export default function SpotlightCarousel() {
    const [index, setIndex] = useState(0);

    return (
        <div className="relative overflow-hidden bg-black py-40">
            <div className="mx-auto max-w-7xl px-4">
                <div className="grid grid-cols-1 items-center gap-20 md:grid-cols-2">
                    {/* Active Quote */}
                    <div className="relative h-[400px]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 50 }}
                                transition={{
                                    duration: 0.6,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                                className="absolute inset-0 flex flex-col justify-center"
                            >
                                <span className="mb-8 text-sm font-black tracking-[0.3em] text-cyan-400 uppercase">
                                    Client Success
                                </span>
                                <p className="mb-12 text-4xl leading-tight font-black tracking-tighter text-white uppercase md:text-6xl">
                                    "{testimonials[index].quote}"
                                </p>
                                <div>
                                    <h4 className="text-2xl font-bold text-white">
                                        {testimonials[index].name}
                                    </h4>
                                    <p className="mt-1 text-sm font-medium tracking-widest text-zinc-500 uppercase">
                                        {testimonials[index].role}
                                    </p>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Selector */}
                    <div className="space-y-6">
                        {testimonials.map((t, i) => (
                            <button
                                key={t.id}
                                onClick={() => setIndex(i)}
                                className={`group relative w-full overflow-hidden rounded-[2rem] border p-8 text-left transition-all duration-500 ${
                                    index === i
                                        ? 'border-white/20 bg-white/5'
                                        : 'border-white/5 bg-transparent hover:border-white/10'
                                }`}
                            >
                                {index === i && (
                                    <motion.div
                                        layoutId="spotlight"
                                        className="pointer-events-none absolute inset-0 bg-linear-to-r from-cyan-500/10 to-transparent"
                                    />
                                )}
                                <div className="relative z-10 flex items-center justify-between">
                                    <div>
                                        <h4
                                            className={`text-xl font-bold transition-colors ${index === i ? 'text-white' : 'text-zinc-600 group-hover:text-zinc-400'}`}
                                        >
                                            {t.name}
                                        </h4>
                                        <p className="mt-1 text-sm font-medium tracking-widest text-zinc-500 uppercase">
                                            {t.role}
                                        </p>
                                    </div>
                                    <div
                                        className={`flex h-12 w-12 items-center justify-center rounded-full border transition-all duration-500 ${
                                            index === i
                                                ? 'border-cyan-400 bg-cyan-400 text-black'
                                                : 'border-white/10 text-white'
                                        }`}
                                    >
                                        {i + 1}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
