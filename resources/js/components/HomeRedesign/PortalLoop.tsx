import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

const items = [
    {
        id: 1,
        src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800',
        title: 'Abstract Design',
    },
    {
        id: 2,
        src: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=800',
        title: '3D Render',
    },
    {
        id: 3,
        src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800',
        title: 'Web Development',
    },
    {
        id: 4,
        src: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=800',
        title: 'Brand Identity',
    },
    {
        id: 5,
        src: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=800',
        title: 'Video Production',
    },
];

interface PortalItemProps {
    item: (typeof items)[0];
    index: number;
    scrollYProgress: any;
}

function PortalItem({ item, index, scrollYProgress }: PortalItemProps) {
    const start = index / items.length;
    const end = (index + 1) / items.length;

    const scale = useTransform(scrollYProgress, [start, end], [0.1, 15]);
    const opacity = useTransform(
        scrollYProgress,
        [start, start + 0.1, end - 0.1, end],
        [0, 1, 1, 0],
    );
    const rotate = useTransform(
        scrollYProgress,
        [start, end],
        [0, index % 2 === 0 ? 10 : -10],
    );

    return (
        <motion.div
            style={{
                scale,
                opacity,
                rotate,
            }}
            className="absolute inset-0 flex items-center justify-center"
        >
            <div className="relative aspect-video w-[60vw] overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
                <img
                    src={item.src}
                    alt={item.title}
                    className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute bottom-8 left-8">
                    <p className="text-2xl font-bold tracking-widest text-white uppercase">
                        {item.title}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}

export default function PortalLoop() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end end'],
    });

    return (
        <div ref={containerRef} className="relative h-[300vh] bg-black">
            <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden">
                <div className="pointer-events-none absolute z-20 text-center">
                    <h2 className="text-6xl font-black tracking-tighter text-white uppercase mix-blend-difference md:text-8xl">
                        Our Universe
                    </h2>
                </div>

                {items.map((item, index) => (
                    <PortalItem
                        key={item.id}
                        item={item}
                        index={index}
                        scrollYProgress={scrollYProgress}
                    />
                ))}
            </div>
        </div>
    );
}
