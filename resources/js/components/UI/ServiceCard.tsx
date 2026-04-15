import type { ServiceItem, PortfolioItem } from '@/types';
import type { Variants } from 'framer-motion';
import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Box,
    Clapperboard,
    Code2,
    CodeXml,
    Film,
    Globe,
    Layers,
    Megaphone,
    Palette,
    PenTool,
    ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap = {
    Box,
    Clapperboard,
    Code2,
    CodeXml,
    Film,
    Globe,
    Layers,
    Megaphone,
    Palette,
    PenTool,
};

const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.85 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
    },
};

interface ServiceCardProps {
    service: ServiceItem;
    portfolios?: PortfolioItem[];
    className?: string;
}

export default function ServiceCard({
    service,
    portfolios = [],
    className,
}: ServiceCardProps) {
    const Icon = iconMap[service.icon as keyof typeof iconMap] ?? Palette;

    return (
        <motion.div
            variants={scaleIn}
            className={cn(
                'glass-panel group relative flex flex-col overflow-hidden rounded-[2rem] transition-all duration-300 hover:border-violet-400/40 hover:shadow-[0_0_40px_rgba(124,58,237,0.2)]',
                className,
            )}
        >
            <Link href={service.href} className="flex h-full w-full flex-col p-4 outline-none lg:p-5">
                <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-violet-400/70 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="flex flex-col h-full">
                {/* TOP CONTENT */}
                <div>
                    <div className="flex items-start justify-between gap-4">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-violet-300 transition-transform duration-300 group-hover:rotate-[10deg]">
                            <Icon className="h-6 w-6" />
                        </span>

                        <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                            {service.tagline}
                        </span>
                    </div>

                    <h3 className="mt-2.5 text-base font-bold text-white uppercase tracking-tight">
                        {service.name}
                    </h3>

                    <p className="mt-1.5 text-xs leading-5 text-zinc-400 line-clamp-2">
                        {service.description}
                    </p>
                </div>

                {/* Dashboard Image Stack */}
                <div className="relative my-5 flex aspect-[1.4/1] w-full items-center justify-center rounded-xl bg-zinc-950/40 ring-1 ring-white/5 overflow-hidden">
                    {/* Background Tech Pattern */}
                    <div className="absolute inset-0 opacity-10 [mask-image:radial-gradient(circle,black,transparent)]">
                        <svg className="h-full w-full" fill="none">
                            <defs>
                                <pattern
                                    id="grid-pattern"
                                    width="12"
                                    height="12"
                                    patternUnits="userSpaceOnUse"
                                >
                                    <path
                                        d="M 12 0 L 0 0 0 12"
                                        stroke="white"
                                        strokeWidth="0.5"
                                    />
                                </pattern>
                            </defs>
                            <rect
                                width="100%"
                                height="100%"
                                fill="url(#grid-pattern)"
                            />
                        </svg>
                    </div>

                    {portfolios.length > 0 ? (
                        <div className="relative h-full w-full p-4 flex items-center justify-center [perspective:1200px]">
                            {portfolios.slice(0, 3).map((item, idx) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    whileHover={{ y: -10, scale: 1.05 }}
                                    transition={{
                                        delay: idx * 0.1,
                                        duration: 0.5,
                                    }}

                                    className={cn(
                                        'absolute w-[65%] aspect-video rounded-lg overflow-hidden border border-white/10 shadow-2xl transition-all duration-500 group-hover:shadow-violet-500/20',

                                        // DEFAULT (non-hover) spread
                                        idx === 0
                                            ? 'translate-x-[-16%] rotate-[0deg]'
                                            : '',
                                        idx === 1
                                            ? 'translate-y-[6%] rotate-[0deg]'
                                            : '',
                                        idx === 2
                                            ? 'translate-x-[16%] rotate-[0deg]'
                                            : '',

                                        // HOVER (fan out more)
                                        idx === 0
                                            ? 'group-hover:-translate-x-12 group-hover:-rotate-6'
                                            : '',
                                        idx === 1
                                            ? 'group-hover:-translate-y-2'
                                            : '',
                                        idx === 2
                                            ? 'group-hover:translate-x-12 group-hover:rotate-6'
                                            : '',
                                    )}
                                >
                                    <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
                                    <img
                                        src={
                                            item.media_path ??
                                            'https://placehold.co/600x400/111/555'
                                        }
                                        alt={item.alt}
                                        className="h-full w-full object-cover"
                                    />
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center p-6">
                            <div className="relative mb-3 flex h-14 w-14 items-center justify-center">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{
                                        duration: 8,
                                        repeat: Infinity,
                                        ease: 'linear',
                                    }}
                                    className="absolute inset-0 rounded-full border border-dashed border-violet-500/30"
                                />
                                <div className="absolute inset-2 rounded-full border border-violet-500/20" />
                                <Icon className="relative h-6 w-6 text-violet-400/50" />
                            </div>
                            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                                Data Pending
                            </span>
                            <div className="mt-2 h-0.5 w-8 rounded-full bg-violet-500/10" />
                        </div>
                    )}
                </div>

                {/* CTA */}
                <div className="mt-auto inline-flex items-center justify-between">
                    <span className="text-xs font-bold tracking-widest text-cyan-400 uppercase">
                        Explore System
                    </span>
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/5 bg-white/5 text-cyan-400 transition-all duration-300 group-hover:border-cyan-400/50 group-hover:bg-cyan-400/10">
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                </div>
            </div>
            </Link>
        </motion.div>
    );
}
