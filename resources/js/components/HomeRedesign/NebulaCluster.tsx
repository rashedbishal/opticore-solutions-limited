import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useRef } from 'react';

const items = [
    { id: 1, src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600', x: '10%', y: '20%', size: '300px' },
    { id: 2, src: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=600', x: '60%', y: '10%', size: '400px' },
    { id: 3, src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=600', x: '40%', y: '50%', size: '350px' },
    { id: 4, src: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=600', x: '70%', y: '60%', size: '280px' },
    { id: 5, src: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=600', x: '5%', y: '70%', size: '320px' },
];

export default function NebulaCluster() {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springConfig = { damping: 25, stiffness: 150 };
    const dx = useSpring(mouseX, springConfig);
    const dy = useSpring(mouseY, springConfig);

    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;
        mouseX.set((clientX / innerWidth) - 0.5);
        mouseY.set((clientY / innerHeight) - 0.5);
    };

    return (
        <div 
            onMouseMove={handleMouseMove}
            className="relative h-screen w-full bg-zinc-950 overflow-hidden cursor-none"
        >
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <h2 className="text-7xl md:text-9xl font-black text-white/10 uppercase tracking-tighter">
                    The Nebula
                </h2>
            </div>

            {items.map((item, index) => {
                const x = useTransform(dx, [-0.5, 0.5], [index * -50, index * 50]);
                const y = useTransform(dy, [-0.5, 0.5], [index * -30, index * 30]);
                const rotateX = useTransform(dy, [-0.5, 0.5], [15, -15]);
                const rotateY = useTransform(dx, [-0.5, 0.5], [-15, 15]);

                return (
                    <motion.div
                        key={item.id}
                        style={{
                            left: item.x,
                            top: item.y,
                            width: item.size,
                            x,
                            y,
                            rotateX,
                            rotateY,
                        }}
                        className="absolute aspect-[4/3] rounded-3xl overflow-hidden border border-white/5 shadow-2xl preserve-3d"
                        whileHover={{ scale: 1.1, z: 50, borderColor: 'rgba(255,255,255,0.2)' }}
                    >
                        <img 
                            src={item.src} 
                            alt="" 
                            className="h-full w-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                        />
                    </motion.div>
                );
            })}
        </div>
    );
}
