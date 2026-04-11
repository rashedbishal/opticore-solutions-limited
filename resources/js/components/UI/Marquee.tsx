import { ClientLogo } from '@/types';
import * as Icons from 'lucide-react';

interface MarqueeProps {
    items: ClientLogo[];
}

export default function Marquee({ items }: MarqueeProps) {
    const repeated = [...items, ...items];

    return (
        <div className="overflow-hidden rounded-full border border-white/10 bg-white/5 py-4">
            <div className="marquee-track flex min-w-max items-center">
                {repeated.map((item, index) => {
                    const LucideIcon = (Icons as any)[item.icon] || Icons.HelpCircle;

                    return (
                        <div
                            key={`${item.name}-${index}`}
                            className="mx-6 flex items-center gap-3 text-sm font-semibold tracking-[0.24em] text-zinc-500 uppercase grayscale transition-all duration-500 hover:scale-110 hover:text-white hover:grayscale-0 sm:mx-10"
                        >
                            <LucideIcon size={18} className="text-zinc-400 transition-colors group-hover:text-cyan-400" />
                            <span>{item.name}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
