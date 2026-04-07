import { Link } from '@inertiajs/react';
import { motion  } from 'framer-motion';
import type {Variants} from 'framer-motion';
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
import type { ServiceItem } from '@/types';

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
    className?: string;
}

export default function ServiceCard({ service, className }: ServiceCardProps) {
    const Icon = iconMap[service.icon as keyof typeof iconMap] ?? Palette;

    return (
        <motion.div
            variants={scaleIn}
            className={cn(
                'glass-panel group relative flex flex-col overflow-hidden rounded-[2rem] p-4 lg:p-5 transition-all duration-300 hover:border-violet-400/40 hover:shadow-[0_0_40px_rgba(124,58,237,0.2)]',
                className,
            )}
        >
            <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-violet-400/70 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            {/* ✅ WRAP START */}
            <div className="flex flex-col h-full">

                {/* TOP CONTENT */}
                <div>
                    <div className="flex items-start justify-between gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-violet-300 transition-transform duration-300 group-hover:rotate-[10deg]">
                    <Icon className="h-8 w-8" />
                </span>

                        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400">
                    {service.tagline}
                </span>
                    </div>

                    <h3 className="mt-3 text-lg font-semibold text-white">
                        {service.name}
                    </h3>

                    <p className="mt-1.5 text-sm leading-6 text-zinc-400 line-clamp-2 lg:line-clamp-3">
                        {service.description}
                    </p>
                </div>

                {/* CTA */}
                <Link
                    href={service.href}
                    className="mt-4 lg:mt-auto inline-flex items-center gap-2 text-sm font-semibold text-cyan-300"
                >
                    Explore <ArrowRight className="h-4 w-4" />
                </Link>

            </div>
            {/* ✅ WRAP END */}
        </motion.div>
    );
}
