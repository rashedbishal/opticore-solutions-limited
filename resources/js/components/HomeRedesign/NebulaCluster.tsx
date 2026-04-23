import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const items = [
    {
        id: 1,
        src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600',
        x: '10%',
        y: '20%',
        size: '300px',
    },
    {
        id: 2,
        src: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=600',
        x: '60%',
        y: '10%',
        size: '400px',
    },
    {
        id: 3,
        src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=600',
        x: '40%',
        y: '50%',
        size: '350px',
    },
    {
        id: 4,
        src: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=600',
        x: '70%',
        y: '60%',
        size: '280px',
    },
    {
        id: 5,
        src: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=600',
        x: '5%',
        y: '70%',
        size: '320px',
    },
];

interface NebulaItemProps {
    item: (typeof items)[0];
    index: number;
    dx: any;
    dy: any;
}

function NebulaItem({ item, index, dx, dy }: NebulaItemProps) {
    const x = useTransform(dx, [-0.5, 0.5], [index * -50, index * 50]);
    const y = useTransform(dy, [-0.5, 0.5], [index * -30, index * 30]);
    const rotateX = useTransform(dy, [-0.5, 0.5], [15, -15]);
    const rotateY = useTransform(dx, [-0.5, 0.5], [-15, 15]);

    return (
        <motion.div
            style={{
                left: item.x,
                top: item.y,
                width: item.size,
                x,
                y,
                rotateX,
                rotateY,
            }}
            className="preserve-3d border-theme absolute aspect-[4/3] overflow-hidden rounded-3xl border shadow-2xl"
            whileHover={{
                scale: 1.1,
                z: 50,
                borderColor: 'var(--color-accent)',
            }}
        >
            <img
                src={item.src}
                alt=""
                className="h-full w-full object-cover grayscale transition-all duration-500 hover:grayscale-0"
            />
        </motion.div>
    );
}

export default function NebulaCluster() {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springConfig = { damping: 25, stiffness: 150 };
    const dx = useSpring(mouseX, springConfig);
    const dy = useSpring(mouseY, springConfig);

    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;
        mouseX.set(clientX / innerWidth - 0.5);
        mouseY.set(clientY / innerHeight - 0.5);
    };

    return (
        <div
            onMouseMove={handleMouseMove}
            className="relative h-screen w-full cursor-none overflow-hidden bg-background"
        >
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                <h2 className="text-7xl font-black tracking-tighter text-foreground opacity-5 uppercase md:text-9xl">
                    The Nebula
                </h2>
            </div>

            {items.map((item, index) => (
                <NebulaItem
                    key={item.id}
                    item={item}
                    index={index}
                    dx={dx}
                    dy={dy}
                />
            ))}
        </div>
    );
}
