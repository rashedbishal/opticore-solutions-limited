"use client";

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

function PortalCard({ item, index, total, progress }: { item: any, index: number, total: number, progress: any }) {
    // Simple, clean range calculation
    const start = index / total;
    const end = (index + 1) / total;
    const span = end - start;
    const entry = start + span * 0.2;
    const exitStart = start + span * 0.8;
    
    // Scale: from 0.4 to 1 (active) to 6 (zoom out)
    const scale = useTransform(progress, [start, start + 0.1, end], [0.5, 1, 6]);
    
    // Opacity: Tight fadeIn/Out to ensure only active cards use resources
    const opacityInputRange = [
        start,
        Math.max(start, entry),
        Math.max(Math.max(start, entry), exitStart),
        Math.max(Math.max(Math.max(start, entry), exitStart), end),
    ];
    const opacity = useTransform(
        progress, 
        opacityInputRange, 
        [0, 1, 1, 0]
    );

    // Subtle rotation for organic feel
    const rotate = useTransform(progress, [start, end], [index % 2 === 0 ? -1 : 1, index % 2 === 0 ? 3 : -3]);

    return (
        <motion.div
            style={{ 
                scale, 
                opacity, 
                rotate,
                zIndex: index + 1,
                willChange: 'transform, opacity'
            }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none p-4"
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
