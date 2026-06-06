import { Link, router } from '@inertiajs/react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import {
    Star,
    Trash2,
    ChevronDown,
    ChevronUp,
    ImageIcon,
    MessageSquare,
    ArrowUp,
    ArrowDown,
    User,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { CmsDeleteDialog } from '@/components/Admin/CmsDeleteDialog';
import AdminLayout from '@/components/Layout/AdminLayout';
import adminRoutes from '@/routes/admin';

interface Review {
    id: number;
    task_id: number;
    sub_category_id: number;
    category_slug: string;
    username: string;
    client_type: 'new' | 'repeat';
    rating: number;
    comment: string;
    image_url: string | null;
    price_range: string | null;
    work_duration: string | null;
    sort_order: number;
    created_at: string;
}

interface SubCategoryGroup {
    sub_category_id: number;
    sub_category_name: string;
    reviews: Review[];
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    grouped: Record<string, SubCategoryGroup[]>;
    paginationLinks: PaginationLink[];
}

function decodePaginationLabel(label: string): string {
    return label.replace(/&laquo;/g, '«').replace(/&raquo;/g, '»');
}

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex gap-0.5 text-amber-400">
            {[1, 2, 3, 4, 5].map((s) => (
                <Star
                    key={s}
                    className={`h-3.5 w-3.5 ${s <= rating ? 'fill-current' : 'text-zinc-700'}`}
                />
            ))}
        </div>
    );
}

function ReviewCard({
    review,
    onDelete,
    onMoveUp,
    onMoveDown,
    isFirst,
    isLast,
}: {
    review: Review;
    onDelete: (id: number) => void;
    onMoveUp: (id: number) => void;
    onMoveDown: (id: number) => void;
    isFirst: boolean;
    isLast: boolean;
}) {
    const [lightboxOpen, setLightboxOpen] = useState(false);

    return (
        <>
            <motion.div
                layout
                layoutId={`review-${review.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{
                    layout: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
                }}
                className="flex items-start gap-4 rounded-xl border border-violet-500/12 bg-[#060c1a]/60 p-4"
            >
                {/* Sort controls */}
                <div className="flex shrink-0 flex-col gap-1">
                    <motion.button
                        type="button"
                        disabled={isFirst}
                        onClick={() => onMoveUp(review.id)}
                        title="Move up"
                        whileTap={{ scale: 0.85 }}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-slate-400 transition-colors hover:bg-violet-500/15 hover:text-violet-400 disabled:cursor-not-allowed disabled:opacity-25"
                    >
                        <ArrowUp className="h-3.5 w-3.5" />
                    </motion.button>
                    <motion.button
                        type="button"
                        disabled={isLast}
                        onClick={() => onMoveDown(review.id)}
                        title="Move down"
                        whileTap={{ scale: 0.85 }}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-slate-400 transition-colors hover:bg-violet-500/15 hover:text-violet-400 disabled:cursor-not-allowed disabled:opacity-25"
                    >
                        <ArrowDown className="h-3.5 w-3.5" />
                    </motion.button>
                </div>

                {/* Avatar */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-400">
                    <User className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-white">
                            {review.username}
                        </span>
                        {review.client_type === 'repeat' && (
                            <span className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2 py-0.5 font-mono text-[9px] tracking-widest text-cyan-400 uppercase">
                                Repeat Client
                            </span>
                        )}
                        <StarRating rating={review.rating} />
                        <span className="text-xs text-slate-500">
                            {review.created_at}
                        </span>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-300 italic">
                        "{review.comment}"
                    </p>
                    <div className="flex flex-wrap gap-4 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                        {review.price_range && (
                            <span>Price: {review.price_range}</span>
                        )}
                        {review.work_duration && (
                            <span>Duration: {review.work_duration}</span>
                        )}
                        <span>Task #{review.task_id}</span>
                    </div>
                </div>

                {/* Image thumbnail */}
                {review.image_url && (
                    <button
                        type="button"
                        onClick={() => setLightboxOpen(true)}
                        className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 transition-all hover:border-cyan-500/40"
                    >
                        <img
                            src={review.image_url}
                            alt="Work proof"
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                            <ImageIcon className="h-4 w-4 text-white" />
                        </div>
                    </button>
                )}

                {/* Delete */}
                <button
                    type="button"
                    onClick={() => onDelete(review.id)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-400 transition-colors hover:bg-red-500/20"
                    title="Delete review"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </motion.div>

            {/* Image lightbox */}
            <AnimatePresence>
                {lightboxOpen && review.image_url && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
                        onClick={() => setLightboxOpen(false)}
                    >
                        <motion.img
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            src={review.image_url}
                            alt="Work proof"
                            className="max-h-[85vh] max-w-4xl rounded-2xl object-contain shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

function ClientReviewIndex({ grouped: serverGrouped, paginationLinks }: Props) {
    const [grouped, setGrouped] = useState(serverGrouped);
    const [deleteTarget, setDeleteTarget] = useState<(() => void) | null>(null);
    const requestDeleteReview = (action: () => void) =>
        setDeleteTarget(() => action);
    const confirmDelete = () => {
        deleteTarget?.();
        setDeleteTarget(null);
    };
    const cancelDelete = () => setDeleteTarget(null);

    // Keep in sync when Inertia refreshes props (e.g. after delete).
    useEffect(() => {
        setGrouped(serverGrouped);
    }, [serverGrouped]);

    const handleMove = (
        catSlug: string,
        subCategoryId: number,
        reviewId: number,
        direction: 'up' | 'down',
    ) => {
        const catGroups = grouped[catSlug];
        const subGroup = catGroups?.find(
            (sg) => sg.sub_category_id === subCategoryId,
        );

        if (!subGroup) {
            return;
        }

        const reviews = [...subGroup.reviews];
        const idx = reviews.findIndex((r) => r.id === reviewId);
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;

        if (swapIdx < 0 || swapIdx >= reviews.length) {
            return;
        }

        // Swap positions.
        [reviews[idx], reviews[swapIdx]] = [reviews[swapIdx], reviews[idx]];

        // Update local state immediately — triggers layout animation.
        setGrouped((prev) => ({
            ...prev,
            [catSlug]: prev[catSlug].map((sg) =>
                sg.sub_category_id === subCategoryId ? { ...sg, reviews } : sg,
            ),
        }));

        // Persist new order to the server.
        const order = reviews.map((r, i) => ({ id: r.id, sort_order: i }));
        // Use `only: ['flash']` so Inertia doesn't refresh `grouped` props after the
        // server responds — the local state is already optimistically updated and we
        // don't want the `useEffect(setGrouped)` to interrupt the layout animation.
        router.post(
            adminRoutes.clientReviews.reorder.url(),
            { order },
            {
                preserveScroll: true,
                only: ['flash'],
            },
        );
    };

    const handleDelete = (
        catSlug: string,
        subCategoryId: number,
        reviewId: number,
    ) => {
        requestDeleteReview(() => {
            setGrouped((prev) => ({
                ...prev,
                [catSlug]: prev[catSlug].map((sg) =>
                    sg.sub_category_id === subCategoryId
                        ? {
                              ...sg,
                              reviews: sg.reviews.filter(
                                  (r) => r.id !== reviewId,
                              ),
                          }
                        : sg,
                ),
            }));

            router.delete(adminRoutes.clientReviews.destroy.url(reviewId), {
                preserveScroll: true,
            });
        });
    };

    const categoryKeys = Object.keys(grouped);

    return (
        <AdminLayout title="Review Control">
            <CmsDeleteDialog
                open={deleteTarget !== null}
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />
            <div className="space-y-6">
                <p className="text-sm text-zinc-400">
                    Manage, sort, and delete client reviews per service. Order
                    changes are reflected immediately on the public pages.
                </p>

                {categoryKeys.length === 0 ? (
                    <div className="relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border border-violet-500/15 bg-[#060c1a]/80 py-20 text-center backdrop-blur-sm">
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
                        <Star className="h-10 w-10 text-violet-400/20" />
                        <p className="font-semibold text-zinc-400">
                            No reviews yet
                        </p>
                        <p className="text-sm text-zinc-500">
                            Reviews appear here once clients submit them after
                            task delivery.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {categoryKeys.map((catSlug) => (
                            <CategorySection
                                key={catSlug}
                                categorySlug={catSlug}
                                subCategoryGroups={grouped[catSlug]}
                                onMove={(subId, reviewId, dir) =>
                                    handleMove(catSlug, subId, reviewId, dir)
                                }
                                onDelete={(subId, reviewId) =>
                                    handleDelete(catSlug, subId, reviewId)
                                }
                            />
                        ))}
                    </div>
                )}
                {paginationLinks.filter((l) => l.url !== null).length > 2 && (
                    <div className="flex flex-wrap items-center justify-center gap-1 pt-2">
                        {paginationLinks.map((link, i) => {
                            const label = decodePaginationLabel(link.label);

                            if (!link.url) {
                                return (
                                    <span
                                        key={i}
                                        className="flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm text-zinc-600"
                                    >
                                        {label}
                                    </span>
                                );
                            }

                            return (
                                <Link
                                    key={i}
                                    href={link.url}
                                    className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors ${
                                        link.active
                                            ? 'border border-violet-500/30 bg-violet-500/10 text-violet-300'
                                            : 'border border-white/8 bg-white/4 text-zinc-400 hover:bg-white/8'
                                    }`}
                                >
                                    {label}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

ClientReviewIndex.layout = (page: React.ReactNode) => page;

export default ClientReviewIndex;

function CategorySection({
    categorySlug,
    subCategoryGroups,
    onMove,
    onDelete,
}: {
    categorySlug: string;
    subCategoryGroups: SubCategoryGroup[];
    onMove: (
        subCategoryId: number,
        reviewId: number,
        direction: 'up' | 'down',
    ) => void;
    onDelete: (subCategoryId: number, reviewId: number) => void;
}) {
    const [expanded, setExpanded] = useState(true);

    const label = categorySlug
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    const totalReviews = subCategoryGroups.reduce(
        (n, g) => n + g.reviews.length,
        0,
    );

    return (
        <div className="overflow-hidden rounded-xl border border-violet-500/15 bg-[#060c1a]/80 backdrop-blur-sm">
            {/* Category header */}
            <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="flex w-full items-center justify-between px-6 py-4 transition-colors hover:bg-violet-500/5"
            >
                <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold tracking-[0.2em] text-violet-300 uppercase">
                        {label}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-slate-400">
                        {totalReviews} review{totalReviews !== 1 ? 's' : ''}
                    </span>
                </div>
                {expanded ? (
                    <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
            </button>

            <AnimatePresence initial={false}>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="space-y-6 border-t border-violet-500/10 p-6">
                            {subCategoryGroups.map((group) => (
                                <div
                                    key={group.sub_category_id}
                                    className="space-y-3"
                                >
                                    <div className="flex items-center gap-2">
                                        <MessageSquare className="h-4 w-4 text-slate-500" />
                                        <h3 className="text-sm font-semibold text-slate-300">
                                            {group.sub_category_name}
                                        </h3>
                                        <span className="text-xs text-slate-500">
                                            ({group.reviews.length})
                                        </span>
                                    </div>

                                    <LayoutGroup
                                        id={`sub-${group.sub_category_id}`}
                                    >
                                        <AnimatePresence mode="popLayout">
                                            {group.reviews.map(
                                                (review, idx) => (
                                                    <ReviewCard
                                                        key={review.id}
                                                        review={review}
                                                        isFirst={idx === 0}
                                                        isLast={
                                                            idx ===
                                                            group.reviews
                                                                .length -
                                                                1
                                                        }
                                                        onMoveUp={(id) =>
                                                            onMove(
                                                                group.sub_category_id,
                                                                id,
                                                                'up',
                                                            )
                                                        }
                                                        onMoveDown={(id) =>
                                                            onMove(
                                                                group.sub_category_id,
                                                                id,
                                                                'down',
                                                            )
                                                        }
                                                        onDelete={(id) =>
                                                            onDelete(
                                                                group.sub_category_id,
                                                                id,
                                                            )
                                                        }
                                                    />
                                                ),
                                            )}
                                        </AnimatePresence>
                                    </LayoutGroup>

                                    {group.reviews.length === 0 && (
                                        <p className="py-4 text-center font-mono text-xs tracking-[0.2em] text-violet-400/30 uppercase">
                                            No reviews in this sub-category.
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

ClientReviewIndex.layout = (page: any) => page;
