import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';
import { useRef } from 'react';

const items = [
    {
        id: 1,
        src: '/images/portfolio/ai-interface.png',
        title: 'Neural Core AI',
        category: 'Artificial Intelligence',
    },
    {
        id: 2,
        src: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=1200&auto=format',
        title: 'Hyper-Grid UI',
        category: 'Interface Design',
    },
    {
        id: 3,
        src: '/images/portfolio/cyber-security.png',
        title: 'Sentinel Defense',
        category: 'Cybersecurity',
    },
    {
        id: 4,
        src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format',
        title: 'Abstract Flow',
        category: '3D Art',
    },
    {
        id: 5,
        src: '/images/portfolio/abstract-sculpture.png',
        title: 'Glass Prism',
        category: 'Motion Production',
    },
    {
        id: 6,
        src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&auto=format',
        title: 'Quantum Web',
        category: 'Full-stack Dev',
    },
    {
        id: 7,
        src: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1200&auto=format',
        title: 'Eon Branding',
        category: 'Identity',
    },
    {
        id: 8,
        src: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?q=80&w=1200&auto=format',
        title: 'Sync Mesh',
        category: 'Cloud Solutions',
    },
    {
        id: 9,
        src: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format',
        title: 'Helix Shield',
        category: 'Encryption',
    },
    {
        id: 10,
        src: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=1200&auto=format',
        title: 'Neon Flux',
        category: 'VFX Production',
    },
    {
        id: 11,
        src: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format',
        title: 'Nexus Node',
        category: 'Infrastructure',
    },
    {
        id: 12,
        src: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format',
        title: 'Deep Space',
        category: 'Data Analytics',
    },
];

interface PortalItemProps {
    item: typeof items[0];
    index: number;
    totalItems: number;
    scrollYProgress: MotionValue<number>;
}

function PortalItem({ item, index, totalItems, scrollYProgress }: PortalItemProps) {
    const start = Math.min(1, index / totalItems);
    const end = Math.min(1, (index + 2) / totalItems);

    const scale = useTransform(
        scrollYProgress,
        [start, (start + end) / 2, end],
        [0, 1, 7]
    );

    // Clamp fade-in/fade-out keypoints so they never cross each other
    // (violates "Offsets must be monotonically non-decreasing" when range is tight).
    // With 12 items, end - start ≈ 0.167, so fixed offsets like 0.05 and 0.15 overlap.
    const range = end - start;
    const fadeInEnd = start + Math.min(0.05, range * 0.3);
    const fadeOutStart = end - Math.min(0.15, range * 0.3);

    const opacity = useTransform(
        scrollYProgress,
        [start, fadeInEnd, fadeOutStart, end],
        [0, 1, 1, 0]
    );

    const rotate = useTransform(
        scrollYProgress,
        [start, end],
        [index % 2 === 0 ? -2 : 2, index % 2 === 0 ? 8 : -8]
    );

    // Higher index = higher zIndex so each new card renders ON TOP of the previous.
    // This lets card N+1 grow visibly as a "portal" in the center of card N,
    // rather than being hidden beneath the zooming card N.
    const zIndex = index + 1;

    return (
        <motion.div
            style={{
                scale,
                opacity,
                rotate,
                zIndex,
                translateZ: 0,
                x: 0,
                y: 0,
                willChange: 'transform, opacity',
            }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
            <div className="group pointer-events-auto relative aspect-video w-[85vw] max-w-5xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-black shadow-[0_0_80px_rgba(0,0,0,0.8)] transition-colors duration-500 hover:border-cyan-500/20">
                <img
                    src={item.src}
                    alt={item.title}
                    className="h-full w-full object-cover opacity-90 transition-opacity duration-700 group-hover:opacity-100"
                    loading="lazy"
                    decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                
                <div className="absolute bottom-10 left-10 md:bottom-16 md:left-16">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <span className="h-px w-8 bg-cyan-500/50" />
                            <span className="text-xs font-bold tracking-[0.2em] text-cyan-400 uppercase">
                                {item.category}
                            </span>
                        </div>
                        <h3 className="text-4xl font-black tracking-tighter text-white uppercase md:text-6xl">
                            {item.title}
                        </h3>
                    </div>
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

    const titleScale = useTransform(scrollYProgress, [0, 0.1], [1, 0.85]);
    const titleOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);

    return (
        <div ref={containerRef} className="relative h-[1200vh] bg-black">
            <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden">
                <div 
                    className="pointer-events-none absolute inset-0 z-0 opacity-20"
                    style={{ 
                        backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ccircle cx=\'2\' cy=\'2\' r=\'1\' fill=\'%23ffffff44\' /%3E%3C/svg%3E")',
                        backgroundSize: '80px 80px'
                    }}
                />

                <motion.div 
                    style={{ 
                        scale: titleScale, 
                        opacity: titleOpacity,
                        willChange: 'transform, opacity'
                    }}
                    className="pointer-events-none absolute z-50 text-center"
                >
                    <span className="mb-4 block text-sm font-bold tracking-[0.3em] text-cyan-400 uppercase opacity-70">
                        Portfolio Showcase
                    </span>
                    <h2 className="text-6xl font-black tracking-tighter text-white uppercase md:text-9xl">
                        Our <br className="md:hidden" /> Universe
                    </h2>
                </motion.div>

                {items.map((item, index) => (
                    <PortalItem 
                        key={item.id} 
                        item={item} 
                        index={index} 
                        totalItems={items.length} 
                        scrollYProgress={scrollYProgress} 
                    />
                ))}

                <div className="pointer-events-none absolute inset-0 z-40 bg-[radial-gradient(circle_at_center,transparent_0%,black_85%)] opacity-60" />
            </div>
        </div>
    );
}
