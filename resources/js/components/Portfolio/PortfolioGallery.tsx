import { Link } from '@inertiajs/react';
import { m as motion, useInView } from 'framer-motion';
import { FolderOpen, Film, ArrowRight } from 'lucide-react';
import { useRef } from 'react';
import { portfolioPreview } from '@/routes';

interface PortfolioItem {
    id: number;
    title: string;
    media_path: string | null;
    media_type: 'image' | 'video';
    alt: string;
}

const PLACEHOLDER = 'https://placehold.co/600x400/111111/7C3AED?text=Opticore';

function MasonryCard({
    item,
    label,
    index,
}: {
    item: PortfolioItem;
    label: string;
    index: number;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, {
        once: true,
        margin: '0px 0px -80px 0px',
    });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 28 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
            transition={{
                duration: 0.55,
                delay: Math.min(index * 0.07, 0.42),
                ease: [0.22, 1, 0.36, 1],
            }}
            className="group neo-panel relative mb-6 w-full break-inside-avoid overflow-hidden shadow-md transition-all duration-500 hover:-translate-y-1 hover:shadow-xl"
            style={{ willChange: 'transform, opacity' }}
        >
            <div className="relative aspect-auto overflow-hidden">
                {item.media_type === 'video' ? (
                    <video
                        src={item.media_path ?? undefined}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        className="w-full transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                    />
                ) : (
                    <img
                        src={item.media_path ?? PLACEHOLDER}
                        alt={item.alt}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                            e.currentTarget.src = PLACEHOLDER;
                        }}
                        className="w-full transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                    />
                )}

                {/* Gradient Overlay */}
                <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent opacity-100 transition-opacity duration-500 sm:opacity-0 sm:group-hover:opacity-100" />

                {/* Content Overlay */}
                <div className="absolute inset-x-0 bottom-0 translate-y-0 transform p-5 opacity-100 transition-all duration-500 sm:translate-y-4 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
                    <p className="text-[10px] font-bold tracking-[0.2em] text-cyan-400 uppercase">
                        {label}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between gap-4">
                        <h3 className="line-clamp-2 text-sm leading-tight font-bold text-white">
                            {item.title}
                        </h3>
                        <Link
                            href={portfolioPreview.url(item.id)}
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-md transition-colors hover:bg-white/20"
                            aria-label={`View ${item.title} full screen`}
                        >
                            {item.media_type === 'video' ? (
                                <>
                                    <Film className="h-3 w-3" /> Watch
                                </>
                            ) : (
                                <>
                                    <ArrowRight className="h-3 w-3" /> View
                                </>
                            )}
                        </Link>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default function PortfolioGallery({
    portfolios,
    label,
    galleryKey,
}: {
    portfolios: PortfolioItem[];
    label: string;
    galleryKey: string;
}) {
    if (portfolios.length === 0) {
        return (
            <div className="neo-panel mt-12 flex min-h-72 flex-col items-center justify-center p-16 text-center">
                <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-theme-surface shadow-[0_6px_0_rgba(0,0,0,0.15),0_12px_24px_rgba(0,0,0,0.1)] ring-1 ring-white/10 dark:bg-white/5 dark:shadow-[0_6px_0_rgba(0,0,0,0.4),0_12px_24px_rgba(0,0,0,0.3)]">
                    <FolderOpen className="h-9 w-9 text-theme-subtle drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
                </div>
                <p className="text-xl font-bold text-theme">Vault is empty</p>
                <p className="mt-2 text-sm font-medium text-theme-muted">
                    No portfolio items in this sub-category yet.
                </p>
            </div>
        );
    }

    return (
        <div
            key={galleryKey}
            className="mt-12 columns-1 gap-6 sm:columns-2 lg:columns-3 xl:columns-4"
        >
            {portfolios.map((item, index) => (
                <MasonryCard
                    key={item.id}
                    item={item}
                    label={label}
                    index={index}
                />
            ))}
        </div>
    );
}
