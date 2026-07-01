import type { FormEventHandler, ReactNode } from 'react';
import { Link, useForm } from '@inertiajs/react';
import {
    ImageIcon,
    Layers,
    Loader2,
    Minus,
    Plus,
    Save,
    Trash2,
    Upload,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { CmsDeleteDialog } from '@/components/Admin/CmsDeleteDialog';
import { CmsErrorDialog } from '@/components/Admin/CmsErrorDialog';
import AdminLayout from '@/components/Layout/AdminLayout';
import { CATEGORY_COLOR_MAP } from '@/lib/categoryVisuals';
import adminRoutes from '@/routes/admin';

const INPUT =
    'block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-white/20 transition-all outline-none focus:border-violet-500/50 focus:bg-violet-500/5';
const LABEL =
    'mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase';

interface TitledItem {
    title: string;
    description: string;
}

interface Heading {
    eyebrow: string;
    title: string;
}

interface Headings {
    capabilities: Heading;
    whyOpticore: Heading;
    process: Heading;
    selectedWork: Heading;
}

interface PortfolioItem {
    id: number;
    title: string;
    category: string;
    description: string | null;
    alt: string;
    image_url: string;
}

interface CategoryData {
    id: number;
    slug: string;
    label: string;
    description: string | null;
    sort_order: number;
    icon: string | null;
    color: string | null;
    meta_title: string | null;
    meta_description: string | null;
    og_title: string | null;
    og_description: string | null;
    long_description: string | null;
    is_active: boolean;
    headings: Headings;
    sub_services: TitledItem[];
    reasons: TitledItem[];
    process: TitledItem[];
    portfolio_items: PortfolioItem[];
    floating_card_enabled: boolean;
    floating_card_title: string | null;
    floating_card_description: string | null;
    floating_card_image_url: string | null;
    floating_card_thumb_url: string | null;
    floating_card_sort_order: number;
}

interface Props {
    category: CategoryData;
    allowed_icons: string[];
    allowed_colors: string[];
}

const HEADING_SECTIONS: { id: keyof Headings; label: string }[] = [
    { id: 'capabilities', label: 'Capabilities' },
    { id: 'whyOpticore', label: 'Why Opticore' },
    { id: 'process', label: 'Process' },
    { id: 'selectedWork', label: 'Selected Work' },
];

export default function CategoryEdit({
    category,
    allowed_icons,
    allowed_colors,
}: Props) {
    const [errorMessages, setErrorMessages] = useState<string[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<(() => void) | null>(null);
    const requestDelete = (action: () => void) => setDeleteTarget(() => action);
    const confirmDelete = () => {
        deleteTarget?.();
        setDeleteTarget(null);
    };
    const cancelDelete = () => setDeleteTarget(null);

    const { data, setData, post, processing } = useForm({
        _method: 'PUT',
        label: category.label,
        description: category.description ?? '',
        sort_order: category.sort_order,
        icon: category.icon ?? allowed_icons[0] ?? '',
        color: category.color ?? allowed_colors[0] ?? '',
        meta_title: category.meta_title ?? '',
        meta_description: category.meta_description ?? '',
        og_title: category.og_title ?? '',
        og_description: category.og_description ?? '',
        long_description: category.long_description ?? '',
        is_active: category.is_active,
        headings: category.headings,
        sub_services: category.sub_services,
        reasons: category.reasons,
        process: category.process,
        floating_card_enabled: category.floating_card_enabled,
        floating_card_title: category.floating_card_title ?? '',
        floating_card_description: category.floating_card_description ?? '',
        floating_card_sort_order: category.floating_card_sort_order,
    });

    const updateHeading = (
        section: keyof Headings,
        field: keyof Heading,
        value: string,
    ) => {
        setData('headings', {
            ...data.headings,
            [section]: { ...data.headings[section], [field]: value },
        });
    };

    const makeListHandlers = (key: 'sub_services' | 'reasons' | 'process') => ({
        add: () => setData(key, [...data[key], { title: '', description: '' }]),
        remove: (index: number) =>
            setData(
                key,
                data[key].filter((_, i) => i !== index),
            ),
        update: (index: number, field: keyof TitledItem, value: string) =>
            setData(
                key,
                data[key].map((item, i) =>
                    i === index ? { ...item, [field]: value } : item,
                ),
            ),
    });

    const subServiceHandlers = makeListHandlers('sub_services');
    const reasonHandlers = makeListHandlers('reasons');
    const processHandlers = makeListHandlers('process');

    const [fileInputKey, setFileInputKey] = useState(0);
    const {
        data: galleryData,
        setData: setGalleryData,
        post: postGallery,
        processing: galleryProcessing,
        reset: resetGallery,
    } = useForm({
        image: null as File | null,
        title: '',
        category: '',
        description: '',
        alt: '',
    });

    const { delete: destroyItem, processing: destroyProcessing } = useForm();

    const [floatingImgKey, setFloatingImgKey] = useState(0);
    const {
        data: floatingImgData,
        setData: setFloatingImgData,
        post: postFloatingImg,
        processing: floatingImgProcessing,
        reset: resetFloatingImg,
    } = useForm({ image: null as File | null, thumb: null as File | null });

    const {
        delete: destroyFloatingImg,
        processing: destroyFloatingImgProcessing,
    } = useForm();

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        if (!data.label.trim()) {
            setErrorMessages(['Category label is required.']);

            return;
        }

        post(adminRoutes.categories.update.url(category.id), {
            onError: (errs) =>
                setErrorMessages(
                    Object.values(errs).filter(Boolean) as string[],
                ),
        });
    };

    const uploadPortfolioItem: FormEventHandler = (e) => {
        e.preventDefault();
        postGallery(adminRoutes.categories.gallery.store.url(category.id), {
            forceFormData: true,
            onSuccess: () => {
                resetGallery();
                setFileInputKey((k) => k + 1);
            },
            onError: (errs) =>
                setErrorMessages(
                    Object.values(errs).filter(Boolean) as string[],
                ),
        });
    };

    const removePortfolioItem = (itemId: number) => {
        requestDelete(() => {
            destroyItem(
                adminRoutes.categories.gallery.destroy.url({
                    category: category.id,
                    item: itemId,
                }),
            );
        });
    };

    const uploadFloatingImages: FormEventHandler = (e) => {
        e.preventDefault();
        postFloatingImg(
            adminRoutes.categories.floatingCardImages.store.url(category.id),
            {
                forceFormData: true,
                onSuccess: () => {
                    resetFloatingImg();
                    setFloatingImgKey((k) => k + 1);
                },
                onError: (errs) =>
                    setErrorMessages(
                        Object.values(errs).filter(Boolean) as string[],
                    ),
            },
        );
    };

    const removeFloatingImages = () => {
        requestDelete(() => {
            destroyFloatingImg(
                adminRoutes.categories.floatingCardImages.destroy.url(
                    category.id,
                ),
            );
        });
    };

    return (
        <div className="mx-auto max-w-4xl space-y-8">
            <CmsErrorDialog
                messages={errorMessages}
                onClose={() => setErrorMessages([])}
            />
            <CmsDeleteDialog
                open={deleteTarget !== null}
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />

            {/* Basic + marketing-page details */}
            <form onSubmit={submit} className="space-y-6">
                <div className="relative overflow-hidden rounded-xl border border-violet-500/15 bg-[#060c1a]/80 p-8 backdrop-blur-sm">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
                    <div className="grid gap-6">
                        <div>
                            <label className={LABEL}>Slug</label>
                            <input
                                type="text"
                                value={category.slug}
                                disabled
                                className={`${INPUT} cursor-not-allowed opacity-60`}
                            />
                            <p className="mt-1.5 text-xs text-zinc-500">
                                The slug cannot be changed after creation — it's
                                referenced by sub-categories, offers, orders,
                                and the public page URL.
                            </p>
                        </div>
                        <div>
                            <label className={LABEL}>Label</label>
                            <input
                                type="text"
                                value={data.label}
                                onChange={(e) =>
                                    setData('label', e.target.value)
                                }
                                placeholder="e.g. Graphic Design"
                                className={INPUT}
                            />
                        </div>
                        <div>
                            <label className={LABEL}>
                                Description{' '}
                                <span className="font-normal text-zinc-500 normal-case">
                                    (used on /hire-us and as the marketing
                                    page's short blurb)
                                </span>
                            </label>
                            <textarea
                                value={data.description}
                                onChange={(e) =>
                                    setData('description', e.target.value)
                                }
                                rows={3}
                                className={INPUT}
                            />
                        </div>
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div>
                                <label className={LABEL}>Sort Order</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={data.sort_order}
                                    onChange={(e) =>
                                        setData(
                                            'sort_order',
                                            Number(e.target.value),
                                        )
                                    }
                                    className={INPUT}
                                />
                            </div>
                            <div className="flex items-center gap-3 pt-7">
                                <input
                                    id="is_active"
                                    type="checkbox"
                                    checked={data.is_active}
                                    onChange={(e) =>
                                        setData('is_active', e.target.checked)
                                    }
                                    className="h-4 w-4 rounded border-white/20 bg-white/5 accent-violet-500"
                                />
                                <label
                                    htmlFor="is_active"
                                    className="text-sm text-zinc-300"
                                >
                                    Publish marketing page at /{category.slug}
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-xl border border-violet-500/15 bg-[#060c1a]/80 p-8 backdrop-blur-sm">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
                    <h2 className="mb-1 text-base font-semibold tracking-wide text-white">
                        SEO
                    </h2>
                    <p className="mb-5 text-sm text-zinc-500">
                        Overrides the default title and description shown in
                        search results and social shares. Leave blank to use the
                        category label / description as fallbacks.
                    </p>
                    <div className="grid gap-6">
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div>
                                <label className={LABEL}>
                                    Meta Title{' '}
                                    <span className="font-normal text-zinc-500 normal-case">
                                        (max 160 chars)
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    maxLength={160}
                                    value={data.meta_title}
                                    onChange={(e) =>
                                        setData('meta_title', e.target.value)
                                    }
                                    placeholder={category.label}
                                    className={INPUT}
                                />
                            </div>
                            <div>
                                <label className={LABEL}>
                                    OG Title{' '}
                                    <span className="font-normal text-zinc-500 normal-case">
                                        (social share title, max 160 chars)
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    maxLength={160}
                                    value={data.og_title}
                                    onChange={(e) =>
                                        setData('og_title', e.target.value)
                                    }
                                    placeholder={`${category.label} — Opticore Solutions Limited`}
                                    className={INPUT}
                                />
                            </div>
                        </div>
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div>
                                <label className={LABEL}>
                                    Meta Description{' '}
                                    <span className="font-normal text-zinc-500 normal-case">
                                        (max 320 chars)
                                    </span>
                                </label>
                                <textarea
                                    maxLength={320}
                                    rows={3}
                                    value={data.meta_description}
                                    onChange={(e) =>
                                        setData(
                                            'meta_description',
                                            e.target.value,
                                        )
                                    }
                                    placeholder={category.description ?? ''}
                                    className={INPUT}
                                />
                            </div>
                            <div>
                                <label className={LABEL}>
                                    OG Description{' '}
                                    <span className="font-normal text-zinc-500 normal-case">
                                        (social share description, max 320
                                        chars)
                                    </span>
                                </label>
                                <textarea
                                    maxLength={320}
                                    rows={3}
                                    value={data.og_description}
                                    onChange={(e) =>
                                        setData(
                                            'og_description',
                                            e.target.value,
                                        )
                                    }
                                    placeholder={category.description ?? ''}
                                    className={INPUT}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-xl border border-violet-500/15 bg-[#060c1a]/80 p-8 backdrop-blur-sm">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
                    <h2 className="mb-5 text-base font-semibold tracking-wide text-white">
                        Marketing Page Content
                    </h2>
                    <div className="grid gap-6">
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div>
                                <label className={LABEL}>
                                    Icon{' '}
                                    <span className="font-normal text-zinc-500 normal-case">
                                        (hero icon + Hire Us tab)
                                    </span>
                                </label>
                                <select
                                    value={data.icon}
                                    onChange={(e) =>
                                        setData('icon', e.target.value)
                                    }
                                    className={INPUT}
                                >
                                    {allowed_icons.map((icon) => (
                                        <option key={icon} value={icon}>
                                            {icon}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={LABEL}>
                                    Color{' '}
                                    <span className="font-normal text-zinc-500 normal-case">
                                        (Hire Us tab accent)
                                    </span>
                                </label>
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`inline-block h-9 w-9 shrink-0 rounded-lg border border-white/10 ${CATEGORY_COLOR_MAP[data.color]?.swatch ?? ''}`}
                                        aria-hidden="true"
                                    />
                                    <select
                                        value={data.color}
                                        onChange={(e) =>
                                            setData('color', e.target.value)
                                        }
                                        className={INPUT}
                                    >
                                        {allowed_colors.map((color) => (
                                            <option key={color} value={color}>
                                                {color}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className={LABEL}>
                                Long Description{' '}
                                <span className="font-normal text-zinc-500 normal-case">
                                    (hero paragraph on the marketing page)
                                </span>
                            </label>
                            <textarea
                                value={data.long_description}
                                onChange={(e) =>
                                    setData('long_description', e.target.value)
                                }
                                rows={4}
                                className={INPUT}
                            />
                        </div>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-xl border border-violet-500/15 bg-[#060c1a]/80 p-8 backdrop-blur-sm">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
                    <div className="mb-5">
                        <h2 className="mb-1 text-base font-semibold tracking-wide text-white">
                            Section Headings
                        </h2>
                        <p className="text-sm text-zinc-400">
                            The eyebrow + title shown above each section on the
                            marketing page.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {HEADING_SECTIONS.map((section) => (
                            <div
                                key={section.id}
                                className="rounded-lg border border-white/8 bg-white/4 p-4"
                            >
                                <p className="mb-3 text-sm font-semibold text-zinc-300">
                                    {section.label}
                                </p>
                                <div className="space-y-3">
                                    <div>
                                        <label className="mb-1 block font-mono text-[10px] tracking-[0.18em] text-violet-400/60 uppercase">
                                            Eyebrow
                                        </label>
                                        <input
                                            type="text"
                                            value={
                                                data.headings[section.id]
                                                    .eyebrow
                                            }
                                            onChange={(e) =>
                                                updateHeading(
                                                    section.id,
                                                    'eyebrow',
                                                    e.target.value,
                                                )
                                            }
                                            className="block w-full rounded-lg border border-white/8 bg-white/4 px-3 py-2 text-sm text-white placeholder-white/20 transition-all outline-none focus:border-violet-500/50 focus:bg-violet-500/5"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block font-mono text-[10px] tracking-[0.18em] text-violet-400/60 uppercase">
                                            Title
                                        </label>
                                        <input
                                            type="text"
                                            value={
                                                data.headings[section.id].title
                                            }
                                            onChange={(e) =>
                                                updateHeading(
                                                    section.id,
                                                    'title',
                                                    e.target.value,
                                                )
                                            }
                                            className="block w-full rounded-lg border border-white/8 bg-white/4 px-3 py-2 text-sm text-white placeholder-white/20 transition-all outline-none focus:border-violet-500/50 focus:bg-violet-500/5"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <p className="mt-4 text-xs text-zinc-500">
                        Changes are saved when you click "Update Category"
                        below.
                    </p>
                </div>

                <TitledListSection
                    title="Capabilities"
                    description="Shown as cards in the 'What's Included' section."
                    items={data.sub_services}
                    onAdd={subServiceHandlers.add}
                    onRemove={subServiceHandlers.remove}
                    onUpdate={subServiceHandlers.update}
                />

                <TitledListSection
                    title="Why Opticore"
                    description="Shown as cards in the 'Our Strategic Advantage' section."
                    items={data.reasons}
                    onAdd={reasonHandlers.add}
                    onRemove={reasonHandlers.remove}
                    onUpdate={reasonHandlers.update}
                />

                <TitledListSection
                    title="Process"
                    description="Shown as numbered steps in the 'Our Delivery Workflow' section."
                    items={data.process}
                    onAdd={processHandlers.add}
                    onRemove={processHandlers.remove}
                    onUpdate={processHandlers.update}
                />

                <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                        disabled={processing}
                        type="submit"
                        className="relative flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-lg border border-violet-400/30 bg-gradient-to-br from-violet-600 via-violet-500 to-cyan-500 py-2.5 text-sm font-semibold text-white shadow-[0_0_22px_rgba(124,58,237,0.45),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:-skew-x-12 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-transform before:duration-500 hover:border-violet-400/50 hover:from-violet-500 hover:via-violet-400 hover:to-cyan-400 hover:shadow-[0_0_38px_rgba(124,58,237,0.65),inset_0_1px_0_rgba(255,255,255,0.2)] hover:before:translate-x-full disabled:opacity-50"
                    >
                        {processing ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />{' '}
                                Updating...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" /> Update Category
                            </>
                        )}
                    </button>
                    <Link
                        href={adminRoutes.categories.index.url()}
                        className="relative flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] py-2.5 text-sm font-medium text-zinc-300 transition-all before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:-skew-x-12 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-transform before:duration-500 hover:border-violet-500/25 hover:bg-violet-500/[0.08] hover:text-white hover:shadow-[0_0_14px_rgba(124,58,237,0.1)] hover:before:translate-x-full"
                    >
                        <X className="h-4 w-4" /> Cancel
                    </Link>
                </div>
            </form>

            {/* Selected Work gallery */}
            <div className="relative overflow-hidden rounded-xl border border-violet-500/15 bg-[#060c1a]/80 p-6 backdrop-blur-sm">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <h2 className="mb-1 text-base font-semibold tracking-wide text-white">
                            Selected Work
                        </h2>
                        <p className="text-sm text-zinc-400">
                            Case-study cards shown on the marketing page.
                        </p>
                    </div>
                    <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 font-mono text-[10px] tracking-wide text-violet-400">
                        {category.portfolio_items.length}{' '}
                        {category.portfolio_items.length === 1
                            ? 'item'
                            : 'items'}
                    </span>
                </div>

                {category.portfolio_items.length > 0 ? (
                    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {category.portfolio_items.map((item) => (
                            <div
                                key={item.id}
                                className="group relative overflow-hidden rounded-lg border border-white/10 bg-zinc-800"
                            >
                                <div className="aspect-[4/3] w-full overflow-hidden bg-zinc-900">
                                    <img
                                        src={item.image_url}
                                        alt={item.alt}
                                        loading="lazy"
                                        decoding="async"
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 pt-6 pb-1.5">
                                    <p className="truncate text-xs font-medium text-white">
                                        {item.title}
                                    </p>
                                    <p className="truncate text-[10px] text-zinc-300">
                                        {item.category}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removePortfolioItem(item.id)}
                                    disabled={destroyProcessing}
                                    className="absolute top-2 right-2 rounded bg-red-600/80 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500 disabled:opacity-50"
                                    title="Remove"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="mb-6 rounded-lg border border-dashed border-white/10 py-10 text-center">
                        <ImageIcon className="mx-auto mb-2 h-8 w-8 text-zinc-600" />
                        <p className="font-mono text-xs tracking-[0.2em] text-violet-400/30 uppercase">
                            No selected work yet
                        </p>
                    </div>
                )}

                <form
                    onSubmit={uploadPortfolioItem}
                    className="space-y-3 border-t border-violet-500/10 pt-5"
                >
                    <p className="mb-1 text-sm font-medium text-zinc-300">
                        Add Work Item
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <input
                            type="text"
                            value={galleryData.title}
                            onChange={(e) =>
                                setGalleryData('title', e.target.value)
                            }
                            placeholder="Title, e.g. Aurelia Launch Film"
                            className="block w-full rounded-lg border border-white/8 bg-white/4 px-3 py-2 text-sm text-white placeholder-white/20 transition-all outline-none focus:border-violet-500/50 focus:bg-violet-500/5"
                        />
                        <input
                            type="text"
                            value={galleryData.category}
                            onChange={(e) =>
                                setGalleryData('category', e.target.value)
                            }
                            placeholder="Category tag, e.g. Brand Video"
                            className="block w-full rounded-lg border border-white/8 bg-white/4 px-3 py-2 text-sm text-white placeholder-white/20 transition-all outline-none focus:border-violet-500/50 focus:bg-violet-500/5"
                        />
                    </div>
                    <textarea
                        value={galleryData.description}
                        onChange={(e) =>
                            setGalleryData('description', e.target.value)
                        }
                        rows={2}
                        placeholder="Description shown under the title"
                        className="block w-full rounded-lg border border-white/8 bg-white/4 px-3 py-2 text-sm text-white placeholder-white/20 transition-all outline-none focus:border-violet-500/50 focus:bg-violet-500/5"
                    />
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="flex-1">
                            <label className="mb-1.5 block font-mono text-[10px] tracking-[0.18em] text-violet-400/60 uppercase">
                                Image{' '}
                                <span className="font-normal text-zinc-500 normal-case">
                                    (max 4MB)
                                </span>
                            </label>
                            <input
                                key={fileInputKey}
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                    setGalleryData(
                                        'image',
                                        e.target.files?.[0] ?? null,
                                    )
                                }
                                className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-zinc-400 outline-none file:mr-3 file:rounded-md file:border-0 file:bg-violet-600/80 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-violet-500"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={
                                galleryProcessing ||
                                !galleryData.image ||
                                !galleryData.title ||
                                !galleryData.category
                            }
                            className="relative flex shrink-0 items-center gap-2 overflow-hidden rounded-lg border border-violet-400/30 bg-gradient-to-br from-violet-600 via-violet-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_22px_rgba(124,58,237,0.45),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:-skew-x-12 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-transform before:duration-500 hover:border-violet-400/50 hover:from-violet-500 hover:via-violet-400 hover:to-cyan-400 hover:shadow-[0_0_38px_rgba(124,58,237,0.65),inset_0_1px_0_rgba(255,255,255,0.2)] hover:before:translate-x-full disabled:opacity-50"
                        >
                            {galleryProcessing ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />{' '}
                                    Uploading…
                                </>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4" /> Upload
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Floating Cards */}
            <div className="relative overflow-hidden rounded-xl border border-violet-500/15 bg-[#060c1a]/80 p-6 backdrop-blur-sm">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
                <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Layers className="h-4 w-4 text-violet-400" />
                        <div>
                            <h2 className="mb-0.5 text-base font-semibold tracking-wide text-white">
                                Floating Cards
                            </h2>
                            <p className="text-sm text-zinc-400">
                                Controls this category's card on the homepage
                                NebulaCluster section.
                            </p>
                        </div>
                    </div>
                    <span
                        className={`rounded-full border px-3 py-1 font-mono text-[10px] tracking-wide ${
                            data.floating_card_enabled
                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                                : 'border-zinc-700 bg-zinc-800/50 text-zinc-500'
                        }`}
                    >
                        {data.floating_card_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                </div>

                {/* Non-image fields go into the main category form */}
                <form onSubmit={submit} className="space-y-4">
                    <input type="hidden" name="_method" value="PUT" />

                    <div className="flex items-center gap-3">
                        <input
                            id="floating_card_enabled"
                            type="checkbox"
                            checked={data.floating_card_enabled}
                            onChange={(e) =>
                                setData(
                                    'floating_card_enabled',
                                    e.target.checked,
                                )
                            }
                            className="h-4 w-4 rounded border-white/20 bg-white/5 accent-violet-500"
                        />
                        <label
                            htmlFor="floating_card_enabled"
                            className="text-sm text-zinc-300"
                        >
                            Show this category as a floating card on the
                            homepage
                        </label>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className={LABEL}>Card Title</label>
                            <input
                                type="text"
                                value={data.floating_card_title}
                                onChange={(e) =>
                                    setData(
                                        'floating_card_title',
                                        e.target.value,
                                    )
                                }
                                placeholder={`e.g. ${category.label} Showcase`}
                                className={INPUT}
                            />
                        </div>
                        <div>
                            <label className={LABEL}>
                                Sort Order{' '}
                                <span className="font-normal text-zinc-500 normal-case">
                                    (position among floating cards)
                                </span>
                            </label>
                            <input
                                type="number"
                                min={0}
                                value={data.floating_card_sort_order}
                                onChange={(e) =>
                                    setData(
                                        'floating_card_sort_order',
                                        Number(e.target.value),
                                    )
                                }
                                className={INPUT}
                            />
                        </div>
                    </div>

                    <div>
                        <label className={LABEL}>Card Description</label>
                        <textarea
                            value={data.floating_card_description}
                            onChange={(e) =>
                                setData(
                                    'floating_card_description',
                                    e.target.value,
                                )
                            }
                            rows={3}
                            placeholder="Short description shown in the modal when the card is clicked."
                            className={INPUT}
                        />
                    </div>

                    <button
                        disabled={processing}
                        type="submit"
                        className="relative flex items-center gap-2 overflow-hidden rounded-lg border border-violet-400/30 bg-gradient-to-br from-violet-600 via-violet-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_22px_rgba(124,58,237,0.45),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:-skew-x-12 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-transform before:duration-500 hover:border-violet-400/50 hover:from-violet-500 hover:via-violet-400 hover:to-cyan-400 hover:shadow-[0_0_38px_rgba(124,58,237,0.65),inset_0_1px_0_rgba(255,255,255,0.2)] hover:before:translate-x-full disabled:opacity-50"
                    >
                        {processing ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />{' '}
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" /> Save Card Settings
                            </>
                        )}
                    </button>
                </form>

                {/* Image upload — separate form because images can't travel with PUT */}
                <div className="mt-6 space-y-4 border-t border-violet-500/10 pt-5">
                    <p className="text-sm font-medium text-zinc-300">
                        Card Images
                    </p>

                    {(category.floating_card_image_url ||
                        category.floating_card_thumb_url) && (
                        <div className="flex items-start gap-4">
                            <div className="space-y-1">
                                <p className="font-mono text-[10px] tracking-[0.18em] text-violet-400/60 uppercase">
                                    Full Image
                                </p>
                                <div className="aspect-[4/3] w-32 overflow-hidden rounded-lg border border-white/10 bg-zinc-900">
                                    <img
                                        src={category.floating_card_image_url!}
                                        alt="Floating card image"
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            </div>
                            {category.floating_card_thumb_url &&
                                category.floating_card_thumb_url !==
                                    category.floating_card_image_url && (
                                    <div className="space-y-1">
                                        <p className="font-mono text-[10px] tracking-[0.18em] text-violet-400/60 uppercase">
                                            Thumbnail
                                        </p>
                                        <div className="aspect-[4/3] w-32 overflow-hidden rounded-lg border border-white/10 bg-zinc-900">
                                            <img
                                                src={
                                                    category.floating_card_thumb_url
                                                }
                                                alt="Floating card thumbnail"
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                    </div>
                                )}
                            <div className="pt-6">
                                <button
                                    type="button"
                                    onClick={removeFloatingImages}
                                    disabled={destroyFloatingImgProcessing}
                                    className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Remove images
                                </button>
                            </div>
                        </div>
                    )}

                    {!category.floating_card_image_url && (
                        <div className="rounded-lg border border-dashed border-white/10 py-8 text-center">
                            <ImageIcon className="mx-auto mb-2 h-8 w-8 text-zinc-600" />
                            <p className="font-mono text-xs tracking-[0.2em] text-violet-400/30 uppercase">
                                No images uploaded yet
                            </p>
                        </div>
                    )}

                    <form
                        onSubmit={uploadFloatingImages}
                        className="space-y-3 border-t border-violet-500/10 pt-4"
                    >
                        <p className="text-xs font-medium text-zinc-400">
                            {category.floating_card_image_url
                                ? 'Replace images'
                                : 'Upload images'}
                        </p>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block font-mono text-[10px] tracking-[0.18em] text-violet-400/60 uppercase">
                                    Full Image{' '}
                                    <span className="font-normal text-zinc-500 normal-case">
                                        (shown in modal — max 4MB)
                                    </span>
                                </label>
                                <input
                                    key={`img-${floatingImgKey}`}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={(e) =>
                                        setFloatingImgData(
                                            'image',
                                            e.target.files?.[0] ?? null,
                                        )
                                    }
                                    className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-zinc-400 outline-none file:mr-3 file:rounded-md file:border-0 file:bg-violet-600/80 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-violet-500"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block font-mono text-[10px] tracking-[0.18em] text-violet-400/60 uppercase">
                                    Thumbnail{' '}
                                    <span className="font-normal text-zinc-500 normal-case">
                                        (card preview — optional, max 2MB)
                                    </span>
                                </label>
                                <input
                                    key={`thumb-${floatingImgKey}`}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={(e) =>
                                        setFloatingImgData(
                                            'thumb',
                                            e.target.files?.[0] ?? null,
                                        )
                                    }
                                    className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-zinc-400 outline-none file:mr-3 file:rounded-md file:border-0 file:bg-violet-600/80 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-violet-500"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-zinc-500">
                            If no thumbnail is uploaded, the full image is used
                            for both.
                        </p>
                        <button
                            type="submit"
                            disabled={
                                floatingImgProcessing || !floatingImgData.image
                            }
                            className="relative flex items-center gap-2 overflow-hidden rounded-lg border border-violet-400/30 bg-gradient-to-br from-violet-600 via-violet-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_22px_rgba(124,58,237,0.45),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:-skew-x-12 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-transform before:duration-500 hover:border-violet-400/50 hover:from-violet-500 hover:via-violet-400 hover:to-cyan-400 hover:shadow-[0_0_38px_rgba(124,58,237,0.65),inset_0_1px_0_rgba(255,255,255,0.2)] hover:before:translate-x-full disabled:opacity-50"
                        >
                            {floatingImgProcessing ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />{' '}
                                    Uploading…
                                </>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4" /> Upload
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

function TitledListSection({
    title,
    description,
    items,
    onAdd,
    onRemove,
    onUpdate,
}: {
    title: string;
    description: string;
    items: TitledItem[];
    onAdd: () => void;
    onRemove: (index: number) => void;
    onUpdate: (index: number, field: keyof TitledItem, value: string) => void;
}) {
    return (
        <div className="relative overflow-hidden rounded-xl border border-violet-500/15 bg-[#060c1a]/80 p-6 backdrop-blur-sm">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
            <div className="mb-5 flex items-center justify-between">
                <div>
                    <h2 className="mb-1 text-base font-semibold tracking-wide text-white">
                        {title}
                    </h2>
                    <p className="text-sm text-zinc-400">{description}</p>
                </div>
                <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 font-mono text-[10px] tracking-wide text-violet-400">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                </span>
            </div>

            <div className="space-y-4">
                {items.map((item, index) => (
                    <div
                        key={index}
                        className="rounded-lg border border-white/8 bg-white/4 p-4"
                    >
                        <div className="mb-3 flex items-start justify-between gap-3">
                            <span className="mt-0.5 font-mono text-[10px] font-semibold tracking-wider text-violet-400/50">
                                #{index + 1}
                            </span>
                            <button
                                type="button"
                                onClick={() => onRemove(index)}
                                className="shrink-0 rounded p-1 text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                                title="Remove"
                            >
                                <Minus className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <input
                                type="text"
                                value={item.title}
                                onChange={(e) =>
                                    onUpdate(index, 'title', e.target.value)
                                }
                                placeholder="Title"
                                className="block w-full rounded-lg border border-white/8 bg-white/4 px-3 py-2 text-sm text-white placeholder-white/20 transition-all outline-none focus:border-violet-500/50 focus:bg-violet-500/5"
                            />
                            <textarea
                                value={item.description}
                                onChange={(e) =>
                                    onUpdate(
                                        index,
                                        'description',
                                        e.target.value,
                                    )
                                }
                                rows={2}
                                placeholder="Description"
                                className="block w-full rounded-lg border border-white/8 bg-white/4 px-3 py-2 text-sm text-white placeholder-white/20 transition-all outline-none focus:border-violet-500/50 focus:bg-violet-500/5"
                            />
                        </div>
                    </div>
                ))}

                {items.length === 0 && (
                    <div className="rounded-lg border border-dashed border-white/10 py-8 text-center">
                        <p className="font-mono text-xs tracking-[0.2em] text-violet-400/30 uppercase">
                            Nothing here yet
                        </p>
                    </div>
                )}
            </div>

            <button
                type="button"
                onClick={onAdd}
                className="relative mt-4 flex items-center gap-2 overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-zinc-300 transition-all before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:-skew-x-12 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-transform before:duration-500 hover:border-violet-500/25 hover:bg-violet-500/[0.08] hover:text-white hover:shadow-[0_0_14px_rgba(124,58,237,0.1)] hover:before:translate-x-full"
            >
                <Plus className="h-4 w-4" />
                Add Item
            </button>

            <p className="mt-4 text-xs text-zinc-500">
                Changes are saved when you click "Update Category" above.
            </p>
        </div>
    );
}

CategoryEdit.layout = (page: ReactNode) => (
    <AdminLayout title="Edit Category">{page}</AdminLayout>
);
