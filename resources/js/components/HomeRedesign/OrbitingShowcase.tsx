import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { User } from 'lucide-react';

const testimonials = [
    { id: 1, name: 'Michael Scott', role: 'Manager', quote: 'They managed to capture the essence of our vision and deliver something that was truly world-class.' },
    { id: 2, name: 'Dwight Schrute', role: 'Assistant Manager', quote: 'The efficiency of their production pipeline is superior to any other agency we have evaluated.' },
    { id: 3, name: 'Pam Beesly', role: 'Art Director', quote: 'Their creative intuition is unmatched. They knew exactly what we needed before we even asked.' },
    { id: 4, name: 'Jim Halpert', role: 'Sales Lead', quote: 'Working with Opticore was the easiest decision we made this year. The results speak for themselves.' },
];

export default function OrbitingShowcase() {
    const [index, setIndex] = useState(0);

    const active = testimonials[index];

    return (
        <div className="bg-zinc-950 py-32 overflow-hidden relative min-h-screen flex items-center justify-center">
            <div className="relative w-full max-w-4xl aspect-square flex items-center justify-center">
                
                {/* Orbiting Circles */}
                <div className="absolute inset-0 border border-white/5 rounded-full scale-100 opacity-20" />
                <div className="absolute inset-0 border border-white/5 rounded-full scale-75 opacity-40" />
                <div className="absolute inset-0 border border-white/5 rounded-full scale-50 opacity-60" />

                {/* Central Content */}
                <div className="relative z-10 text-center px-12 max-w-2xl">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={active.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            <p className="text-2xl md:text-3xl font-medium text-white leading-relaxed">
                                "{active.quote}"
                            </p>
                            <div>
                                <h4 className="text-cyan-400 font-black uppercase tracking-widest">{active.name}</h4>
                                <p className="text-zinc-500 text-sm font-bold uppercase">{active.role}</p>
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
                            className={`absolute w-20 h-20 rounded-full border-2 flex items-center justify-center transition-colors duration-500 overflow-hidden ${
                                isActive ? 'border-cyan-400 bg-cyan-400/10 shadow-[0_0_30px_rgba(34,211,238,0.3)]' : 'border-white/10 bg-zinc-900 grayscale hover:grayscale-0'
                            }`}
                            animate={{
                                x: [x, Math.cos(angle + 0.1) * radius, x],
                                y: [y, Math.sin(angle + 0.1) * radius, y],
                            }}
                            transition={{
                                duration: 10 + i * 2,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                        >
                            <User className={`w-10 h-10 ${isActive ? 'text-cyan-400' : 'text-zinc-600'}`} />
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
