import type { PortfolioItem } from '@/types';
import { AnimatePresence, m as motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface LightboxProps {
    items: PortfolioItem[];
    activeIndex: number | null;
    onClose: () => void;
}

export default function Lightbox({ items, activeIndex, onClose }: LightboxProps) {
    const touchStartX = useRef<number | null>(null);
    const [index, setIndex] = useState<number | null>(activeIndex);

    useEffect(() => {
        setIndex(activeIndex);
    }, [activeIndex]);

    useEffect(() => {
        if (index === null) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }

            if (event.key === 'ArrowRight') {
                setIndex((current) => ((current ?? 0) + 1) % items.length);
            }

            if (event.key === 'ArrowLeft') {
                setIndex((current) => ((current ?? 0) - 1 + items.length) % items.length);
            }
        };

        window.addEventListener('keydown', onKeyDown);

        return () => {
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [index, items.length, onClose]);

    const currentItem = useMemo(() => {
        if (index === null) {
            return null;
        }

        return items[index];
    }, [index, items]);

    if (!currentItem) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center bg-black/95 p-4"
                onClick={onClose}
            >
                <button
                    type="button"
                    className="touch-target absolute top-4 right-4 inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 text-white"
                    aria-label="Close portfolio lightbox"
                    onClick={onClose}
                >
                    <X className="h-5 w-5" />
                </button>

                <button
                    type="button"
                    className="touch-target absolute left-4 hidden items-center justify-center rounded-full border border-white/10 bg-white/5 text-white md:inline-flex"
                    aria-label="Previous portfolio image"
                    onClick={(event) => {
                        event.stopPropagation();
                        setIndex((current) => ((current ?? 0) - 1 + items.length) % items.length);
                    }}
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>

                <button
                    type="button"
                    className="touch-target absolute right-4 hidden items-center justify-center rounded-full border border-white/10 bg-white/5 text-white md:inline-flex"
                    aria-label="Next portfolio image"
                    onClick={(event) => {
                        event.stopPropagation();
                        setIndex((current) => ((current ?? 0) + 1) % items.length);
                    }}
                >
                    <ChevronRight className="h-5 w-5" />
                </button>

                <motion.div
                    key={currentItem.title}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.35 }}
                    className="glass-panel relative w-full max-w-5xl overflow-hidden rounded-[2rem]"
                    onClick={(event) => event.stopPropagation()}
                    onTouchStart={(event) => {
                        touchStartX.current = event.touches[0]?.clientX ?? null;
                    }}
                    onTouchEnd={(event) => {
                        const touchEndX = event.changedTouches[0]?.clientX ?? null;

                        if (touchStartX.current === null || touchEndX === null) {
                            return;
                        }

                        const difference = touchStartX.current - touchEndX;

                        if (difference > 50) {
                            setIndex((current) => ((current ?? 0) + 1) % items.length);
                        }

                        if (difference < -50) {
                            setIndex((current) => ((current ?? 0) - 1 + items.length) % items.length);
                        }
                    }}
                >
                    <img
                        src={currentItem.image}
                        alt={currentItem.alt}
                        loading="lazy"
                        onError={(e) => {
                            e.currentTarget.src = 'https://placehold.co/600x400/111111/7C3AED?text=Opticore';
                        }}
                        className="aspect-[4/3] w-full object-cover"
                    />
                    <div className="border-t border-white/10 p-6">
                        <p className="text-xs font-semibold tracking-[0.24em] text-cyan-300 uppercase">
                            {currentItem.category}
                        </p>
                        <h3 className="mt-2 text-2xl font-semibold text-white">{currentItem.title}</h3>
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">{currentItem.description}</p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
