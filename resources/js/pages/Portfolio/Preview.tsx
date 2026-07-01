import type { ReactNode } from 'react';
import { Head, router } from '@inertiajs/react';
import { domAnimation, LazyMotion, m as motion } from 'framer-motion';
import { ArrowLeft, X } from 'lucide-react';

interface PortfolioItem {
    id: number;
    title: string;
    category_slug: string;
    subcategory_slug?: string;
    media_path: string | null;
    media_type: 'image' | 'video';
    alt: string;
}

interface Props {
    item: PortfolioItem;
}

const PLACEHOLDER = 'https://placehold.co/1200x800/111111/7C3AED?text=Opticore';

function goBack(item: PortfolioItem) {
    if (window.history.length > 1) {
        window.history.back();
    } else if (item.subcategory_slug) {
        router.visit(
            `/portfolio/${item.category_slug}/${item.subcategory_slug}`,
        );
    } else {
        router.visit(`/portfolio/${item.category_slug}`);
    }
}

export default function PortfolioPreview({ item }: Props) {
    const categoryLabel = (item.subcategory_slug || item.category_slug)
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

    return (
        <LazyMotion features={domAnimation}>
            <Head>
                <title>{item.title}</title>
                <meta name="description" content={item.alt || item.title} />
            </Head>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="fixed inset-0 z-50 flex flex-col bg-black"
            >
                {/* Top bar */}
                <div className="flex items-center justify-between px-5 py-4 sm:px-8">
                    <button
                        type="button"
                        onClick={() => goBack(item)}
                        aria-label="Go back to portfolio"
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </button>

                    <div className="flex flex-col items-end gap-0.5 text-right">
                        <h1 className="text-sm font-semibold text-white sm:text-base">
                            {item.title}
                        </h1>
                        <p className="text-xs font-medium tracking-widest text-cyan-400 uppercase">
                            {categoryLabel}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => goBack(item)}
                        aria-label="Close preview"
                        className="touch-target inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Media area */}
                <div className="flex flex-1 items-center justify-center overflow-hidden px-4 pb-6 sm:px-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                            duration: 0.5,
                            delay: 0.1,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        className="relative flex items-center justify-center"
                        style={{ maxWidth: '90vw', maxHeight: '90vh' }}
                    >
                        {item.media_type === 'video' ? (
                            <video
                                src={item.media_path ?? undefined}
                                controls
                                autoPlay
                                muted
                                loop
                                playsInline
                                className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
                            />
                        ) : (
                            <img
                                src={item.media_path ?? PLACEHOLDER}
                                alt={item.alt}
                                decoding="async"
                                onError={(e) => {
                                    e.currentTarget.src = PLACEHOLDER;
                                }}
                                className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
                            />
                        )}
                    </motion.div>
                </div>
            </motion.div>
        </LazyMotion>
    );
}

// Bypass global AppLayout (no Navbar, no AI widget)
PortfolioPreview.layout = (page: ReactNode) => <>{page}</>;
