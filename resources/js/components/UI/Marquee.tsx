import {
    Mountain,
    Zap,
    Sparkles,
    Orbit,
    Trees,
    Sun,
    Activity,
    Pyramid,
    type LucideIcon,
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
    if (baseSet.length > 0) {
        while (baseSet.length < 12) {
            baseSet = [...baseSet, ...normalized];
        }
    }

    const repeated = [...baseSet, ...baseSet];

    return (
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 py-10 md:py-14">
            <div className="marquee-track flex min-w-max items-center">
                {repeated.map((item, index) => {
                    const Icon = item.icon ? IconMap[item.icon] : null;
                    return (
                        <div
                            key={`${item.name}-${index}`}
                            className="mx-8 flex flex-col items-center gap-4 text-center grayscale transition-all duration-300 hover:text-white hover:grayscale-0 sm:mx-12"
                        >
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-violet-400 sm:h-20 sm:w-20 overflow-hidden">
                                {item.logo_path ? (
                                    <img 
                                        src={item.logo_path} 
                                        alt={item.name} 
                                        className="h-10 w-10 sm:h-12 sm:w-12 object-contain"
                                    />
                                ) : Icon ? (
                                    <Icon className="h-8 w-8 sm:h-10 sm:w-10" />
                                ) : (
                                    <Sparkles className="h-8 w-8 sm:h-10 sm:w-10" />
                                )}
                            </div>
                            <span className="text-xs font-bold tracking-[0.2em] text-zinc-500 uppercase">
                                {item.name}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
