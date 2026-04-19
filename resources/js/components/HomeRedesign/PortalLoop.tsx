import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
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
        src: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=1200',
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
        src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200',
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
        src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200',
        title: 'Quantum Web',
        category: 'Full-stack Dev',
    },
    {
        id: 7,
        src: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1200',
        title: 'Eon Branding',
        category: 'Identity',
    },
    {
        id: 8,
        src: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?q=80&w=1200',
        title: 'Sync Mesh',
        category: 'Cloud Solutions',
    },
    {
        id: 9,
        src: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200',
        title: 'Helix Shield',
        category: 'Encryption',
    },
    {
        id: 10,
        src: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=1200',
        title: 'Neon Flux',
        category: 'VFX Production',
    },
    {
        id: 11,
        src: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200',
        title: 'Nexus Node',
        category: 'Infrastructure',
    },
    {
        id: 12,
        src: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200',
        title: 'Deep Space',
        category: 'Data Analytics',
    },
];

export default function PortalLoop() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end end'],
    });

    const smoothScroll = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001,
    });

    // Animate "Our Universe" text based on scroll
    const titleScale = useTransform(smoothScroll, [0, 0.1], [1, 0.8]);
    const titleOpacity = useTransform(smoothScroll, [0, 0.15], [1, 0]);
    const titleBlur = useTransform(smoothScroll, [0, 0.1], ['blur(0px)', 'blur(10px)']);

    return (
        <div ref={containerRef} className="relative h-[1200vh] bg-black">
            <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden">
                {/* Background Stars/Noise depth effect */}
                <div className="absolute inset-0 z-0 opacity-20">
                    <div className="h-full w-full bg-[radial-gradient(circle_at_center,white_1px,transparent_1px)] bg-[length:40px_40px]" />
                </div>

                <motion.div 
                    style={{ 
                        scale: titleScale, 
                        opacity: titleOpacity,
                        filter: titleBlur
                    }}
                    className="pointer-events-none absolute z-50 text-center"
                >
                    <span className="mb-4 block text-sm font-bold tracking-[0.3em] text-cyan-400 uppercase opacity-70">
                        Portfolio Showcase
                    </span>
                    <h2 className="text-6xl font-black tracking-tighter text-white uppercase mix-blend-difference md:text-9xl">
                        Our <br className="md:hidden" /> Universe
                    </h2>
                </motion.div>

                {items.map((item, index) => {
                    const totalItems = items.length;
                    // Start each item a bit later and extend its life for overlap
                    const start = index / totalItems;
                    const end = (index + 1.5) / totalItems; // 1.5 for overlap tunnel effect

                    const scale = useTransform(
                        smoothScroll,
                        [start, (start + end) / 2, end],
                        [0, 1, 15]
                    );

                    const opacity = useTransform(
                        smoothScroll,
                        [start, start + 0.05, end - 0.1, end],
                        [0, 1, 1, 0]
                    );

                    const blur = useTransform(
                        smoothScroll,
                        [start, (start + end) / 2, end],
                        ['blur(10px)', 'blur(0px)', 'blur(20px)']
                    );

                    const rotate = useTransform(
                        smoothScroll,
                        [start, end],
                        [index % 2 === 0 ? -5 : 5, index % 2 === 0 ? 15 : -15]
                    );

                    const zIndex = totalItems - index;

                    return (
                        <motion.div
                            key={item.id}
                            style={{
                                scale,
                                opacity,
                                rotate,
                                filter: blur,
                                zIndex,
                            }}
                            className="absolute inset-0 flex items-center justify-center"
                        >
                            <div className="group relative aspect-video w-[85vw] max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-sm transition-transform duration-500 hover:border-cyan-500/30">
                                <img
                                    src={item.src}
                                    alt={item.title}
                                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-linear-to-t from-black via-black/20 to-transparent" />
                                
                                <div className="absolute bottom-10 left-10 md:bottom-16 md:left-16">
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        className="space-y-2"
                                    >
                                        <span className="inline-block rounded-full bg-cyan-500/20 px-4 py-1 text-xs font-bold tracking-widest text-cyan-400 uppercase backdrop-blur-md">
                                            {item.category}
                                        </span>
                                        <h3 className="text-3xl font-black tracking-tighter text-white uppercase md:text-5xl">
                                            {item.title}
                                        </h3>
                                    </motion.div>
                                </div>

                                {/* Premium Glint Effect */}
                                <div className="pointer-events-none absolute inset-0 bg-linear-to-tr from-transparent via-white/5 to-transparent opacity-0 transition-opacity duration-1000 group-hover:opacity-100" />
                            </div>
                        </motion.div>
                    );
                })}

                {/* Perspective Overlay */}
                <div className="pointer-events-none absolute inset-0 z-40 bg-[radial-gradient(circle_at_center,transparent_0%,black_80%)] opacity-30" />
            </div>
        </div>
    );
}
