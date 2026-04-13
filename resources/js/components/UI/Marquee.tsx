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
    items: (string | { name: string; icon?: string })[];
}

export default function Marquee({ items }: MarqueeProps) {
    const normalized = items.map((item) =>
        typeof item === 'string' ? { name: item } : item
    );
    const repeated = [...normalized, ...normalized];

    return (
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 py-2 md:py-4">
            <div className="marquee-track flex min-w-max items-center">
                {repeated.map((item, index) => {
                    const Icon = item.icon ? IconMap[item.icon] : null;
                    return (
                        <div
                            key={`${item.name}-${index}`}
                            className="mx-8 flex flex-col items-center gap-4 text-center grayscale transition-all duration-300 hover:text-white hover:grayscale-0 sm:mx-12"
                        >
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-violet-400 sm:h-20 sm:w-20">
                                {Icon ? (
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
