import { motion, AnimatePresence } from 'framer-motion';
import { User } from 'lucide-react';
import { useState } from 'react';

const testimonials = [
    {
        id: 1,
        name: 'Michael Scott',
        role: 'Manager',
        quote: 'They managed to capture the essence of our vision and deliver something that was truly world-class.',
    },
    {
        id: 2,
        name: 'Dwight Schrute',
        role: 'Assistant Manager',
        quote: 'The efficiency of their production pipeline is superior to any other agency we have evaluated.',
    },
    {
        id: 3,
        name: 'Pam Beesly',
        role: 'Art Director',
        quote: 'Their creative intuition is unmatched. They knew exactly what we needed before we even asked.',
    },
    {
        id: 4,
        name: 'Jim Halpert',
        role: 'Sales Lead',
        quote: 'Working with Opticore was the easiest decision we made this year. The results speak for themselves.',
    },
];

export default function OrbitingShowcase() {
    const [index, setIndex] = useState(0);

    const active = testimonials[index];

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background py-32">
            <div className="relative flex aspect-square w-full max-w-4xl items-center justify-center">
                {/* Orbiting Circles */}
                <div className="absolute inset-0 scale-100 rounded-full border border-theme opacity-20" />
                <div className="absolute inset-0 scale-75 rounded-full border border-theme opacity-40" />
                <div className="absolute inset-0 scale-50 rounded-full border border-theme opacity-60" />

                {/* Central Content */}
                <div className="relative z-10 max-w-2xl px-12 text-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={active.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            <p className="text-2xl leading-relaxed font-medium text-foreground md:text-3xl">
                                "{active.quote}"
                            </p>
                            <div>
                                <h4 className="font-black tracking-widest text-cyan-500 uppercase">
                                    {active.name}
                                </h4>
                                <p className="text-sm font-bold text-theme-muted uppercase">
                                    {active.role}
                                </p>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Orbiting Avatars */}
                {testimonials.map((t, i) => {
                    const angle = (i / testimonials.length) * (2 * Math.PI);
                    const radius = 350; // pixels
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;

                    const isActive = index === i;

                    return (
                        <motion.button
                            key={t.id}
                            onClick={() => setIndex(i)}
                            className={`absolute flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 transition-colors duration-500 ${
                                isActive
                                    ? 'border-cyan-400 bg-cyan-400/10 shadow-[0_0_30px_rgba(34,211,238,0.3)]'
                                    : 'border-theme bg-theme-surface grayscale hover:grayscale-0'
                            }`}
                            animate={{
                                x: [x, Math.cos(angle + 0.1) * radius, x],
                                y: [y, Math.sin(angle + 0.1) * radius, y],
                            }}
                            transition={{
                                duration: 10 + i * 2,
                                repeat: Infinity,
                                ease: 'linear',
                                times: [0, 0.5, 1],
                            }}
                        >
                            <User
                                className={`h-10 w-10 ${isActive ? 'text-cyan-500' : 'text-theme-text-subtle'}`}
                            />
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
