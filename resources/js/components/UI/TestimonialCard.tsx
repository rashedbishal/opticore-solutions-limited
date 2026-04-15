import type { Testimonial } from '@/types';
import type { Variants } from 'framer-motion';
import { motion } from 'framer-motion';
import {
    Star,
    Mountain,
    Zap,
    Sparkles,
    Orbit,
    Trees,
    Sun,
    Activity,
    Pyramid,
} from 'lucide-react';

const IconMap: Record<string, typeof Star> = {
    Mountain,
    Zap,
    Sparkles,
    Orbit,
    Trees,
    Sun,
    Activity,
    Pyramid,
};

const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.85 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
    },
};

interface TestimonialCardProps {
    testimonial: Testimonial;
}

export default function TestimonialCard({ testimonial }: TestimonialCardProps) {
    const BrandIcon = testimonial.icon ? IconMap[testimonial.icon] : null;

    return (
        <motion.article
            variants={scaleIn}
            className="glass-panel rounded-[2rem] border-l-4 border-l-violet-400 p-6 md:p-7"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-cyan-300">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <Star key={index} className="h-4 w-4 fill-current" />
                    ))}
                </div>
                {BrandIcon && (
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-violet-400">
                        <BrandIcon className="h-5 w-5" />
                    </div>
                )}
            </div>
            <p className="mt-6 text-base leading-8 text-zinc-300">
                “{testimonial.quote}”
            </p>
            <div className="mt-8">
                <p className="text-base font-semibold text-white">
                    {testimonial.name}
                </p>
                <p className="text-sm text-zinc-400">
                    {testimonial.role}, {testimonial.company}
                </p>
            </div>
        </motion.article>
    );
}
