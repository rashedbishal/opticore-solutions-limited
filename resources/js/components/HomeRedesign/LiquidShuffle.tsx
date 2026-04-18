import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const testimonials = [
    { id: 1, name: 'Alex Rivera', role: 'CEO @ TechFlow', quote: 'The visual direction Opticore provided was transformative. Our brand feels decades ahead of the competition.', color: 'from-violet-500/20 to-cyan-500/20' },
    { id: 2, name: 'Sarah Chen', role: 'Marketing Director', quote: 'I have never worked with a team that moves this fast without sacrificing a single ounce of quality.', color: 'from-cyan-500/20 to-emerald-500/20' },
    { id: 3, name: 'James Wilson', role: 'Founder', quote: 'They don\'t just design; they architect experiences. Every pixel feels intentional and aligned with our goals.', color: 'from-pink-500/20 to-orange-500/20' },
];

export default function LiquidShuffle() {
    const [index, setIndex] = useState(0);

    const next = () => setIndex((prev) => (prev + 1) % testimonials.length);
    const prev = () => setIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);

    const active = testimonials[index];

    return (
        <div className="bg-black py-32 overflow-hidden relative">
            <div className="max-w-5xl mx-auto px-4 relative z-10">
                <div className="flex flex-col items-center text-center">
                    <Quote className="w-16 h-16 text-cyan-400 mb-12 opacity-50" />
                    
                    <div className="relative h-[400px] w-full flex items-center justify-center">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={active.id}
                                initial={{ opacity: 0, scale: 0.8, filter: 'blur(20px)' }}
                                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, scale: 1.2, filter: 'blur(20px)' }}
                                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                className="absolute inset-0 flex flex-col items-center justify-center"
                            >
                                <motion.div 
                                    className={`absolute inset-0 bg-linear-to-br ${active.color} rounded-full blur-[100px] -z-10`}
                                    animate={{ 
                                        scale: [1, 1.2, 1],
                                        rotate: [0, 90, 0],
                                    }}
                                    transition={{ duration: 10, repeat: Infinity }}
                                />
                                
                                <p className="text-3xl md:text-5xl font-bold text-white leading-tight mb-12 italic">
                                    "{active.quote}"
                                </p>
                                
                                <div>
                                    <h4 className="text-xl font-black text-cyan-400 uppercase tracking-widest">{active.name}</h4>
                                    <p className="text-zinc-500 font-bold mt-1 uppercase text-sm">{active.role}</p>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="flex gap-4 mt-12">
                        <button onClick={prev} className="p-4 rounded-full border border-white/10 text-white hover:bg-white/5 transition-colors">
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button onClick={next} className="p-4 rounded-full border border-white/10 text-white hover:bg-white/5 transition-colors">
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
