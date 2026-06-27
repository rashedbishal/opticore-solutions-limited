import type {LucideIcon} from 'lucide-react';
import {
    Mountain,
    Zap,
    Sparkles,
    Orbit,
    Trees,
    Sun,
    Activity,
    Pyramid
    
} from 'lucide-react';

const IconMap: Record<string, LucideIcon> = {
    Mountain,
    Zap,
    Sparkles,
    Orbit,
    Trees,
    Sun,
    Activity,
    Pyramid,
};

interface MarqueeProps {
    items: (string | { name: string; icon?: string; logo_path?: string | null })[];
}

export default function Marquee({ items }: MarqueeProps) {
    // Fallback if no items
    const effectiveItems = items.length > 0 ? items : [
        { name: 'Opticore', icon: 'Sparkles' },
        { name: 'OSL Premium', icon: 'Sparkles' },
        { name: 'Digital Excellence', icon: 'Sparkles' },
    ];

    const normalized = effectiveItems.map((item) =>
        typeof item === 'string' ? { name: item } : item
    );

    // To prevent gaps on large screens or with very few items, 
    // we ensure the "half" (baseSet) is long enough.
    let baseSet = [...normalized];

    if (normalized.length > 0) {
        while (baseSet.length < 12) {
            baseSet = [...baseSet, ...normalized];
        }
    }

    const repeated = [...baseSet, ...baseSet];

    return (
        <div className="overflow-hidden py-4 md:py-6">
            <div className="marquee-track flex min-w-max items-center hover:[animation-play-state:paused]">
                {repeated.map((item, index) => {
                    const Icon = item.icon ? IconMap[item.icon] : null;

                    return (
                        <div
                            key={`${item.name}-${index}`}
                            className="group mx-6 flex h-10 cursor-pointer items-center justify-center transition-all duration-500 hover:scale-110 sm:mx-10 sm:h-12 md:h-14"
                        >
                            {item.logo_path ? (
                                <img
                                    src={item.logo_path}
                                    alt={item.name}
                                    loading="lazy"
                                    decoding="async"
                                    className="h-full w-auto max-w-[120px] object-contain opacity-50 grayscale transition-all duration-500 group-hover:scale-105 group-hover:opacity-100 group-hover:grayscale-0 group-hover:drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]"
                                />
                            ) : Icon ? (
                                <Icon className="h-full w-auto max-w-[120px] text-zinc-500/60 transition-all duration-500 group-hover:scale-110 group-hover:text-violet-400 group-hover:drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
                            ) : (
                                <Sparkles className="h-full w-auto max-w-[120px] text-zinc-500/60 transition-all duration-500 group-hover:scale-110 group-hover:text-violet-400 group-hover:drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
