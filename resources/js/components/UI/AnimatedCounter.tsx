import { animate, motion,  useInView } from 'framer-motion';
import type {Variants} from 'framer-motion';
import { useEffect, useRef } from 'react';

interface AnimatedCounterProps {
    value: number;
    suffix: string;
    label: string;
    variants?: Variants;
}

export default function AnimatedCounter({ value, suffix, label, variants }: AnimatedCounterProps) {
    const ref = useRef<HTMLParagraphElement | null>(null);
    const isInView = useInView(ref, { once: true, margin: '-80px' });

    useEffect(() => {
        if (!ref.current || !isInView) {
            return;
        }

        const controls = animate(0, value, {
            duration: 2,
            ease: 'easeOut',
            onUpdate: (latest) => {
                if (ref.current) {
                    ref.current.textContent = `${Math.round(latest)}${suffix}`;
                }
            },
        });

        return () => {
            controls.stop();
        };
    }, [isInView, suffix, value]);

    return (
        <motion.div
            variants={variants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="glass-panel relative rounded-3xl p-8"
        >
            <p ref={ref} className="text-4xl font-extrabold text-white md:text-5xl">
                0{suffix}
            </p>
            <p className="mt-3 text-sm font-medium tracking-[0.2em] text-zinc-400 uppercase">{label}</p>
        </motion.div>
    );
}
