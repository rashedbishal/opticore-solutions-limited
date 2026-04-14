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
import type {LucideIcon} from 'lucide-react';

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

    if (baseSet.length > 0) {
        while (baseSet.length < 12) {
            baseSet = [...baseSet, ...normalized];
        }
    }

    const repeated = [...baseSet, ...baseSet];

    return (
        <div className="overflow-hidden py-12 md:py-16">
            <div className="marquee-track flex min-w-max items-center">
                {repeated.map((item, index) => {
                    const Icon = item.icon ? IconMap[item.icon] : null;

                    return (
                        <div
                            key={`${item.name}-${index}`}
                            className="mx-12 flex h-24 items-center justify-center grayscale transition-all duration-300 hover:text-white hover:grayscale-0 sm:mx-20 sm:h-32 md:h-40"
                        >
                            {item.logo_path ? (
                                <img 
                                    src={item.logo_path} 
                                    alt={item.name} 
                                    className="h-full w-auto max-w-[200px] object-contain opacity-60 hover:opacity-100 transition-opacity"
                                />
                            ) : Icon ? (
                                <Icon className="h-full w-auto max-w-[120px] text-zinc-500/60 transition-all group-hover:text-violet-400" />
                            ) : (
                                <Sparkles className="h-full w-auto max-w-[120px] text-zinc-500/60" />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
