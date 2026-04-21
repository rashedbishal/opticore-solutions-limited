import type { MotionValue } from 'framer-motion';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

// Ultra-optimized images: low resolution and high compression for maximum speed
const items = [
    { id: 1, src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=50&auto=format', title: 'Neural Core', category: 'AI System' },
    { id: 2, src: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&q=50&auto=format', title: 'Hyper-Grid', category: 'Interface' },
    { id: 3, src: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&q=50&auto=format', title: 'Sentinel', category: 'Security' },
    { id: 4, src: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=50&auto=format', title: 'Deep Space', category: 'Data' },
    { id: 5, src: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=600&q=50&auto=format', title: 'Neon Flux', category: 'VFX' },
    { id: 6, src: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=600&q=50&auto=format', title: 'Quantum', category: 'Dev' },
    { id: 7, src: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=600&q=50&auto=format', title: 'Eon Brand', category: 'Identity' },
    { id: 8, src: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=600&q=50&auto=format', title: 'Sync Mesh', category: 'Cloud' },
];

export default function PortalLoop() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    return (
        <div ref={containerRef} className="relative h-[800vh] bg-black">
            <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
                {/* Background Grid - Extremely light SVG pattern */}
                <div 
                    className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{
                        backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
                        backgroundSize: '40px 40px'
                    }}
                />

                {/* Intro Title */}
                <motion.div 
                    style={{ 
                        opacity: useTransform(scrollYProgress, [0, 0.05], [1, 0]),
                        scale: useTransform(scrollYProgress, [0, 0.05], [1, 0.9])
                    }}
                    className="absolute z-50 text-center pointer-events-none"
                >
                    <span className="text-cyan-400 text-xs font-bold tracking-[0.4em] uppercase mb-2 block">Universe</span>
                    <h2 className="text-white text-5xl md:text-8xl font-black tracking-tighter uppercase">Showcase</h2>
                </motion.div>

                {items.map((item, i) => (
                    <PortalCard 
                        key={item.id} 
                        item={item} 
                        index={i} 
                        total={items.length} 
                        progress={scrollYProgress} 
                    />
                ))}

                {/* Constant Vignette */}
                <div className="absolute inset-0 z-40 bg-[radial-gradient(circle_at_center,transparent_0%,black_90%)] pointer-events-none" />
            </div>
        </div>
    );
}

function PortalItem({
    item,
    index,
    totalItems,
    scrollYProgress,
}: PortalItemProps) {
    const start = Math.min(1, index / totalItems);
    const end = Math.min(1, (index + 2) / totalItems);

    const scale = useTransform(
        scrollYProgress,
        [start, (start + end) / 2, end],
        [0, 1, 7],
    );

    // Clamp fade-in/fade-out keypoints so they never cross each other
    // (violates "Offsets must be monotonically non-decreasing" when range is tight).
    // With 12 items, end - start ≈ 0.167, so fixed offsets like 0.05 and 0.15 overlap.
    const range = end - start;

    // Scale peaks at 45% of its range so the exit zoom has room.
    const mid = start + range * 0.45;

    const scale = useTransform(
        scrollYProgress,
        [start, mid, end],
        [0, 1, 7]
    );

    // Proportional fade points — always monotone regardless of range size.
    const fadeInEnd    = start + range * 0.12;
    const fadeOutStart = end   - range * 0.25;

    const opacity = useTransform(
        scrollYProgress,
        [start, fadeInEnd, fadeOutStart, end],
        [0, 1, 1, 0],
    );

    const rotate = useTransform(
        scrollYProgress,
        [start, end],
        [index % 2 === 0 ? -2 : 2, index % 2 === 0 ? 8 : -8],
    );

    // Each new card sits IN FRONT of the previous one.
    // As card N zooms large, card N+1 grows as a small "portal" in the foreground.
    // Because there is NO explicit willChange/translateZ on individual cards,
    // the browser only creates compositor layers for actively-animating cards —
    // not all 12 at once — preventing the GPU budget exhaustion that caused glitches.
    const zIndex = index + 1;

    return (
        <motion.div
            style={{
                scale,
                opacity,
                rotate,
                zIndex,
                // No explicit willChange/translateZ on individual cards.
                // Framer Motion promotes layers internally during active animation.
                // Forcing 12 permanent GPU layers exhausts compositor budget and
                // causes the Navbar + Hero to glitch.
            }}
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
            <div className="relative aspect-video w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-900 shadow-2xl pointer-events-auto">
                <img 
                    src={item.src} 
                    alt={item.title}
                    className="h-full w-full object-cover opacity-80"
                    loading="lazy"
                    decoding="async"
                />
                
                {/* Card UI */}
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent" />
                
                <div className="absolute bottom-8 left-8 md:bottom-12 md:left-12">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-px w-6 bg-cyan-500" />
                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">{item.category}</span>
                    </div>
                    <h3 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">{item.title}</h3>
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

    const titleScale   = useTransform(scrollYProgress, [0, 0.08], [1, 0.85]);
    const titleOpacity = useTransform(scrollYProgress, [0, 0.10], [1, 0]);

    return (
        <div ref={containerRef} className="relative h-[1200vh] bg-black">
            <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden">
                <div
                    className="pointer-events-none absolute inset-0 z-0 opacity-20"
                    style={{
                        backgroundImage:
                            "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1' fill='%23ffffff44' /%3E%3C/svg%3E\")",
                        backgroundSize: '80px 80px',
                    }}
                />

                <motion.div
                    style={{
                        scale: titleScale,
                        opacity: titleOpacity,
                        willChange: 'transform, opacity',
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

                {/* Vignette */}
                <div className="pointer-events-none absolute inset-0 z-40 bg-[radial-gradient(circle_at_center,transparent_0%,black_85%)] opacity-60" />
            </div>
        </div>
    );
}
