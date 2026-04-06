interface MarqueeProps {
    items: string[];
}

export default function Marquee({ items }: MarqueeProps) {
    const repeated = [...items, ...items];

    return (
        <div className="overflow-hidden rounded-full border border-white/10 bg-white/5 py-4">
            <div className="marquee-track flex min-w-max items-center">
                {repeated.map((item, index) => (
                    <div
                        key={`${item}-${index}`}
                        className="mx-6 flex h-8 items-center text-sm font-semibold tracking-[0.24em] text-zinc-500 grayscale transition-all duration-300 hover:text-white hover:grayscale-0 sm:mx-10 sm:h-10"
                    >
                        {item}
                    </div>
                ))}
            </div>
        </div>
    );
}
