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
        <div className="relative overflow-hidden bg-background py-40">
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
                                <span className="mb-8 text-sm font-black tracking-[0.3em] text-cyan-500 uppercase">
                                    Client Success
                                </span>
                                <p className="mb-12 text-4xl leading-tight font-black tracking-tighter text-foreground uppercase md:text-6xl">
                                    "{testimonials[index].quote}"
                                </p>
                                <div>
                                    <h4 className="text-2xl font-bold text-foreground">
                                        {testimonials[index].name}
                                    </h4>
                                    <p className="mt-1 text-sm font-medium tracking-widest text-theme-muted uppercase">
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
                                className={`group relative w-full overflow-hidden rounded-[2rem] border border-theme p-8 text-left transition-all duration-500 ${
                                    index === i
                                        ? 'border-cyan-500/30 bg-theme-surface'
                                        : 'hover:bg-theme-surface/50 bg-transparent'
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
                                            className={`text-xl font-bold transition-colors ${index === i ? 'text-foreground' : 'text-theme-muted group-hover:text-foreground'}`}
                                        >
                                            {t.name}
                                        </h4>
                                        <p className="mt-1 text-sm font-medium tracking-widest text-theme-muted uppercase">
                                            {t.role}
                                        </p>
                                    </div>
                                    <div
                                        className={`flex h-12 w-12 items-center justify-center rounded-full border transition-all duration-500 ${
                                            index === i
                                                ? 'border-cyan-500 bg-cyan-500 text-white'
                                                : 'border-theme text-theme-muted'
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
