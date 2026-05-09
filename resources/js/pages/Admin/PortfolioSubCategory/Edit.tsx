import type { FormEventHandler, ReactNode } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { Film, ImageIcon, Minus, Plus, Trash2, Upload, Loader2 } from 'lucide-react';
import { useState } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';
import adminRoutes from '@/routes/admin';

interface GalleryItem {
    id: number;
    media_path: string | null;
    media_type: 'image' | 'video';
    alt: string | null;
}

interface PlanData {
    price: string;
    delivery: string;
    features: string[];
}

interface Plans {
    basic: PlanData;
    standard: PlanData;
    premium: PlanData;
}

interface SubCategory {
    id: number;
    category_slug: string;
    name: string;
    slug: string;
    description: string | null;
    price: string | null;
    rating: number | null;
    reviews_count: number;
    image_url: string | null;
    sort_order: number;
    plans: Plans;
    faqs: Array<{ question: string; answer: string }>;
    description_points: Array<{ label: string; icon: string }>;
    gallery: GalleryItem[];
}

interface Props {
    subCategory: SubCategory;
    categories: Record<string, string>;
    allowed_icons: string[];
}

const PLAN_TIERS: { id: keyof Plans; label: string; accent: string }[] = [
    { id: 'basic', label: 'Basic', accent: 'text-zinc-400' },
    { id: 'standard', label: 'Standard', accent: 'text-cyan-400' },
    { id: 'premium', label: 'Premium', accent: 'text-violet-400' },
];

export default function PortfolioSubCategoryEdit({
    subCategory,
    categories,
    allowed_icons,
}: Props) {
    const { data, setData, post, processing, errors } = useForm({
        _method: 'PUT',
        category_slug: subCategory.category_slug,
        name: subCategory.name,
        slug: subCategory.slug,
        description: subCategory.description || '',
        price: subCategory.price || '',
        rating: subCategory.rating?.toFixed(1) || '5.0',
        reviews_count: subCategory.reviews_count,
        image: null as File | null,
        sort_order: subCategory.sort_order,
        plans: subCategory.plans,
        faqs: subCategory.faqs as Array<{ question: string; answer: string }>,
        description_points: subCategory.description_points as Array<{
            label: string;
            icon: string;
        }>,
    });

    const [fileInputKey, setFileInputKey] = useState(0);

    const {
        data: galleryData,
        setData: setGalleryData,
        post: postGallery,
        processing: galleryProcessing,
        errors: galleryErrors,
        reset: resetGallery,
    } = useForm({
        media: null as File | null,
        caption: '',
    });

    const { delete: destroyMedia, processing: destroyProcessing } = useForm();

    const updatePlanField = (
        tier: keyof Plans,
        field: 'price' | 'delivery',
        value: string,
    ) => {
        setData('plans', {
            ...data.plans,
            [tier]: { ...data.plans[tier], [field]: value },
        });
    };

    const updateFeature = (tier: keyof Plans, index: number, value: string) => {
        const features = [...data.plans[tier].features];
        features[index] = value;
        setData('plans', {
            ...data.plans,
            [tier]: { ...data.plans[tier], features },
        });
    };

    const addFeature = (tier: keyof Plans) => {
        setData('plans', {
            ...data.plans,
            [tier]: {
                ...data.plans[tier],
                features: [...data.plans[tier].features, ''],
            },
        });
    };

    const addFaq = () => {
        setData('faqs', [...data.faqs, { question: '', answer: '' }]);
    };

    const removeFaq = (index: number) => {
        setData(
            'faqs',
            data.faqs.filter((_, i) => i !== index),
        );
    };

    const updateFaq = (
        index: number,
        field: 'question' | 'answer',
        value: string,
    ) => {
        const updated = data.faqs.map((faq, i) =>
            i === index ? { ...faq, [field]: value } : faq,
        );
        setData('faqs', updated);
    };

    const updateDescriptionPoint = (
        index: number,
        field: 'label' | 'icon',
        value: string,
    ) => {
        const updated = data.description_points.map((p, i) =>
            i === index ? { ...p, [field]: value } : p,
        );
        setData('description_points', updated);
    };

    const removeFeature = (tier: keyof Plans, index: number) => {
        const features = data.plans[tier].features.filter(
            (_, i) => i !== index,
        );
        setData('plans', {
            ...data.plans,
            [tier]: { ...data.plans[tier], features },
        });
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const incomplete = data.description_points.some(
            (p) => p.label.trim() === '',
        );

        if (incomplete) {
            alert('All 6 service description points must have a label.');

            return;
        }

        post(adminRoutes.subCategories.update.url(subCategory.slug), {
            forceFormData: true,
        });
    };

    const uploadMedia: FormEventHandler = (e) => {
        e.preventDefault();
        postGallery(
            adminRoutes.subCategories.gallery.store.url(subCategory.slug),
            {
                forceFormData: true,
                onSuccess: () => {
                    resetGallery();
                    setFileInputKey((k) => k + 1);
                },
            },
        );
    };

    const removeMedia = (portfolioId: number) => {
        if (confirm('Remove this item from the gallery?')) {
            destroyMedia(
                adminRoutes.subCategories.gallery.destroy.url({
                    sub_category: subCategory.slug,
                    portfolio: portfolioId,
                }),
            );
        }
    };

    return (
        <div className="max-w-4xl space-y-8">
            <h1 className="text-2xl font-bold text-white">Edit Sub-Category</h1>

            {/* Main details form */}
            <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-6">
                <form onSubmit={submit} className="max-w-2xl space-y-6">
                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300">
                            Parent Category
                        </label>
                        <select
                            value={data.category_slug}
                            onChange={(e) =>
                                setData('category_slug', e.target.value)
                            }
                            className="mt-1 block w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2 text-white focus:border-violet-500 focus:outline-none sm:text-sm"
                            required
                        >
                            {Object.entries(categories).map(([slug, label]) => (
                                <option key={slug} value={slug}>
                                    {label}
                                </option>
                            ))}
                        </select>
                        {errors.category_slug && (
                            <p className="mt-1 text-sm text-red-400">
                                {errors.category_slug}
                            </p>
                        )}
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300">
                            Name
                        </label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="mt-1 block w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2 text-white focus:border-violet-500 focus:outline-none sm:text-sm"
                            required
                        />
                        {errors.name && (
                            <p className="mt-1 text-sm text-red-400">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Slug */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300">
                            Slug
                        </label>
                        <input
                            type="text"
                            value={data.slug}
                            onChange={(e) => setData('slug', e.target.value)}
                            className="mt-1 block w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2 font-mono text-xs text-white focus:border-violet-500 focus:outline-none sm:text-sm"
                            required
                        />
                        {errors.slug && (
                            <p className="mt-1 text-sm text-red-400">
                                {errors.slug}
                            </p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300">
                            Description
                        </label>
                        <textarea
                            value={data.description}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                            rows={3}
                            className="mt-1 block w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2 text-white focus:border-violet-500 focus:outline-none sm:text-sm"
                        />
                        {errors.description && (
                            <p className="mt-1 text-sm text-red-400">
                                {errors.description}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-300">
                            Starting Price
                        </label>
                        <input
                            type="text"
                            value={data.price}
                            onChange={(e) => setData('price', e.target.value)}
                            className="mt-1 block w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2 text-white focus:border-violet-500 focus:outline-none sm:text-sm"
                        />
                        {errors.price && (
                            <p className="mt-1 text-sm text-red-400">
                                {errors.price}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300">
                                Rating
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="5"
                                step="0.1"
                                value={data.rating}
                                onChange={(e) =>
                                    setData('rating', e.target.value)
                                }
                                className="mt-1 block w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2 text-white focus:border-violet-500 focus:outline-none sm:text-sm"
                            />
                            {errors.rating && (
                                <p className="mt-1 text-sm text-red-400">
                                    {errors.rating}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-300">
                                Reviews Count
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={data.reviews_count}
                                onChange={(e) =>
                                    setData(
                                        'reviews_count',
                                        Number.parseInt(e.target.value) || 0,
                                    )
                                }
                                className="mt-1 block w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2 text-white focus:border-violet-500 focus:outline-none sm:text-sm"
                            />
                            {errors.reviews_count && (
                                <p className="mt-1 text-sm text-red-400">
                                    {errors.reviews_count}
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-300">
                            Thumbnail Image
                        </label>
                        {subCategory.image_url && (
                            <img
                                src={subCategory.image_url}
                                alt="Current image"
                                className="mt-2 mb-3 h-24 w-auto rounded-md object-cover"
                            />
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                                setData('image', e.target.files?.[0] ?? null)
                            }
                            className="mt-1 block w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 file:mr-3 file:rounded file:border-0 file:bg-violet-600 file:px-3 file:py-1 file:text-sm file:font-medium file:text-white hover:file:bg-violet-500 focus:outline-none"
                        />
                        {subCategory.image_url && (
                            <p className="mt-1 text-xs text-zinc-500">
                                Leave empty to keep the current image.
                            </p>
                        )}
                        {errors.image && (
                            <p className="mt-1 text-sm text-red-400">
                                {errors.image}
                            </p>
                        )}
                    </div>

                    {/* Sort Order */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300">
                            Sort Order
                        </label>
                        <input
                            type="number"
                            value={data.sort_order}
                            onChange={(e) =>
                                setData(
                                    'sort_order',
                                    Number.parseInt(e.target.value) || 0,
                                )
                            }
                            className="mt-1 block w-64 rounded-md border border-white/10 bg-zinc-800 px-3 py-2 text-white focus:border-violet-500 focus:outline-none sm:text-sm"
                        />
                        {errors.sort_order && (
                            <p className="mt-1 text-sm text-red-400">
                                {errors.sort_order}
                            </p>
                        )}
                    </div>

                    <div className="flex gap-4 border-t border-white/10 pt-4">
                        <button
                            disabled={processing}
                            type="submit"
                            className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" /> Updating...
                                </>
                            ) : (
                                'Update Sub-Category'
                            )}
                        </button>
                        <Link
                            href={adminRoutes.subCategories.index.url()}
                            className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
                        >
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>

            {/* Pricing Plans section */}
            <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-6">
                <div className="mb-5">
                    <h2 className="text-lg font-semibold text-white">
                        Pricing Plans
                    </h2>
                    <p className="mt-0.5 text-sm text-zinc-400">
                        Set price, delivery time, and features for each plan.
                        Leave blank to use the page defaults.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {PLAN_TIERS.map((tier) => (
                        <div
                            key={tier.id}
                            className="rounded-lg border border-white/10 bg-zinc-800/50 p-4"
                        >
                            <p
                                className={`mb-4 text-sm font-bold tracking-widest uppercase ${tier.accent}`}
                            >
                                {tier.label}
                            </p>

                            {/* Price */}
                            <div className="mb-3">
                                <label className="mb-1 block text-xs text-zinc-400">
                                    Price
                                </label>
                                <input
                                    type="text"
                                    value={data.plans[tier.id].price}
                                    onChange={(e) =>
                                        updatePlanField(
                                            tier.id,
                                            'price',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="e.g. $99"
                                    className="block w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
                                />
                            </div>

                            {/* Delivery */}
                            <div className="mb-4">
                                <label className="mb-1 block text-xs text-zinc-400">
                                    Delivery Time
                                </label>
                                <input
                                    type="text"
                                    value={data.plans[tier.id].delivery}
                                    onChange={(e) =>
                                        updatePlanField(
                                            tier.id,
                                            'delivery',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="e.g. 3 Days"
                                    className="block w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
                                />
                            </div>

                            {/* Features */}
                            <div>
                                <label className="mb-2 block text-xs text-zinc-400">
                                    Features
                                </label>
                                <div className="space-y-1.5">
                                    {data.plans[tier.id].features.map(
                                        (feature, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center gap-1.5"
                                            >
                                                <input
                                                    type="text"
                                                    value={feature}
                                                    onChange={(e) =>
                                                        updateFeature(
                                                            tier.id,
                                                            i,
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Feature description"
                                                    className="block w-full rounded-md border border-white/10 bg-zinc-900 px-2.5 py-1.5 text-sm text-white focus:border-violet-500 focus:outline-none"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeFeature(
                                                            tier.id,
                                                            i,
                                                        )
                                                    }
                                                    className="shrink-0 rounded p-1 text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                                                >
                                                    <Minus className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        ),
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => addFeature(tier.id)}
                                    className="mt-2 flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add feature
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <p className="mt-4 text-xs text-zinc-500">
                    Changes are saved when you click "Update Sub-Category"
                    above.
                </p>
            </div>

            {/* Service Description Points section */}
            <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-6">
                <div className="mb-5">
                    <h2 className="text-lg font-semibold text-white">
                        Service Description Points
                    </h2>
                    <p className="mt-0.5 text-sm text-zinc-400">
                        Exactly 6 points shown as icon cards in the Service
                        Description section. All labels are required.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {data.description_points.map((point, index) => (
                        <div
                            key={index}
                            className="rounded-lg border border-white/10 bg-zinc-800/50 p-4"
                        >
                            <p className="mb-3 text-xs font-semibold text-zinc-500">
                                Point {index + 1}
                            </p>

                            <div className="space-y-3">
                                <div>
                                    <label className="mb-1 block text-xs text-zinc-400">
                                        Icon
                                    </label>
                                    <select
                                        value={point.icon}
                                        onChange={(e) =>
                                            updateDescriptionPoint(
                                                index,
                                                'icon',
                                                e.target.value,
                                            )
                                        }
                                        className="block w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
                                    >
                                        {allowed_icons.map((icon) => (
                                            <option key={icon} value={icon}>
                                                {icon}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs text-zinc-400">
                                        Label{' '}
                                        <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={point.label}
                                        onChange={(e) =>
                                            updateDescriptionPoint(
                                                index,
                                                'label',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="e.g. Custom Designs"
                                        className="block w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
                                        required
                                    />
                                    {errors[
                                        `description_points.${index}.label` as keyof typeof errors
                                    ] && (
                                        <p className="mt-1 text-xs text-red-400">
                                            {
                                                errors[
                                                    `description_points.${index}.label` as keyof typeof errors
                                                ]
                                            }
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <p className="mt-4 text-xs text-zinc-500">
                    Changes are saved when you click "Update Sub-Category"
                    above.
                </p>
            </div>

            {/* FAQ section */}
            <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-6">
                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-white">
                            FAQs
                        </h2>
                        <p className="mt-0.5 text-sm text-zinc-400">
                            Questions and answers shown in the FAQ section on
                            the public page.
                        </p>
                    </div>
                    <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-400">
                        {data.faqs.length}{' '}
                        {data.faqs.length === 1 ? 'question' : 'questions'}
                    </span>
                </div>

                <div className="space-y-4">
                    {data.faqs.map((faq, index) => (
                        <div
                            key={index}
                            className="rounded-lg border border-white/10 bg-zinc-800/50 p-4"
                        >
                            <div className="mb-3 flex items-start justify-between gap-3">
                                <span className="mt-0.5 text-xs font-semibold text-zinc-500">
                                    #{index + 1}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => removeFaq(index)}
                                    className="shrink-0 rounded p-1 text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                                    title="Remove FAQ"
                                >
                                    <Minus className="h-3.5 w-3.5" />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="mb-1 block text-xs text-zinc-400">
                                        Question
                                    </label>
                                    <input
                                        type="text"
                                        value={faq.question}
                                        onChange={(e) =>
                                            updateFaq(
                                                index,
                                                'question',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="e.g. How long does it take?"
                                        className="block w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
                                    />
                                    {errors[
                                        `faqs.${index}.question` as keyof typeof errors
                                    ] && (
                                        <p className="mt-1 text-xs text-red-400">
                                            {
                                                errors[
                                                    `faqs.${index}.question` as keyof typeof errors
                                                ]
                                            }
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs text-zinc-400">
                                        Answer
                                    </label>
                                    <textarea
                                        value={faq.answer}
                                        onChange={(e) =>
                                            updateFaq(
                                                index,
                                                'answer',
                                                e.target.value,
                                            )
                                        }
                                        rows={3}
                                        placeholder="Provide a clear, helpful answer…"
                                        className="block w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
                                    />
                                    {errors[
                                        `faqs.${index}.answer` as keyof typeof errors
                                    ] && (
                                        <p className="mt-1 text-xs text-red-400">
                                            {
                                                errors[
                                                    `faqs.${index}.answer` as keyof typeof errors
                                                ]
                                            }
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {data.faqs.length === 0 && (
                        <div className="rounded-lg border border-dashed border-white/10 py-8 text-center">
                            <p className="text-sm text-zinc-500">
                                No FAQs yet. Add your first question below.
                            </p>
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    onClick={addFaq}
                    className="mt-4 flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-800/50 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700/50 hover:text-white"
                >
                    <Plus className="h-4 w-4" />
                    Add FAQ
                </button>

                <p className="mt-4 text-xs text-zinc-500">
                    Changes are saved when you click "Update Sub-Category"
                    above.
                </p>
            </div>

            {/* Gallery section */}
            <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-6">
                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-white">
                            Gallery
                        </h2>
                        <p className="mt-0.5 text-sm text-zinc-400">
                            Images and videos shown in the slideshow on the
                            public page. Newest items appear first.
                        </p>
                    </div>
                    <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-400">
                        {subCategory.gallery.length}{' '}
                        {subCategory.gallery.length === 1 ? 'item' : 'items'}
                    </span>
                </div>

                {/* Existing gallery items */}
                {subCategory.gallery.length > 0 ? (
                    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {subCategory.gallery.map((item) => (
                            <div
                                key={item.id}
                                className="group relative overflow-hidden rounded-lg border border-white/10 bg-zinc-800"
                            >
                                {/* Thumbnail */}
                                <div className="aspect-video w-full overflow-hidden bg-zinc-900">
                                    {item.media_path ? (
                                        item.media_type === 'video' ? (
                                            <video
                                                src={item.media_path}
                                                className="h-full w-full object-cover"
                                                muted
                                                preload="metadata"
                                            />
                                        ) : (
                                            <img
                                                src={item.media_path}
                                                alt={item.alt ?? ''}
                                                className="h-full w-full object-cover"
                                            />
                                        )
                                    ) : (
                                        <div className="flex h-full items-center justify-center">
                                            <ImageIcon className="h-8 w-8 text-zinc-600" />
                                        </div>
                                    )}
                                </div>

                                {/* Type badge */}
                                <div className="absolute top-2 left-2">
                                    {item.media_type === 'video' ? (
                                        <span className="flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
                                            <Film className="h-3 w-3" />
                                            Video
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
                                            <ImageIcon className="h-3 w-3" />
                                            Image
                                        </span>
                                    )}
                                </div>

                                {/* Caption overlay */}
                                {item.alt && (
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 pt-4 pb-1.5">
                                        <p className="truncate text-xs text-white">
                                            {item.alt}
                                        </p>
                                    </div>
                                )}

                                {/* Delete button */}
                                <button
                                    type="button"
                                    onClick={() => removeMedia(item.id)}
                                    disabled={destroyProcessing}
                                    className="absolute top-2 right-2 rounded bg-red-600/80 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500 disabled:opacity-50"
                                    title="Remove from gallery"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="mb-6 rounded-lg border border-dashed border-white/10 py-10 text-center">
                        <ImageIcon className="mx-auto mb-2 h-8 w-8 text-zinc-600" />
                        <p className="text-sm text-zinc-500">
                            No gallery items yet. Upload images or videos below.
                        </p>
                    </div>
                )}

                {/* Upload form */}
                <form
                    onSubmit={uploadMedia}
                    className="border-t border-white/10 pt-5"
                >
                    <p className="mb-3 text-sm font-medium text-zinc-300">
                        Add Media
                    </p>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="flex-1">
                            <label className="mb-1 block text-xs text-zinc-400">
                                File{' '}
                                <span className="text-zinc-500">
                                    (JPG, PNG, WEBP, GIF, MP4, MOV — max 300MB)
                                </span>
                            </label>
                            <input
                                key={fileInputKey}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/x-msvideo,video/webm"
                                onChange={(e) =>
                                    setGalleryData(
                                        'media',
                                        e.target.files?.[0] ?? null,
                                    )
                                }
                                className="block w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 file:mr-3 file:rounded file:border-0 file:bg-violet-600 file:px-3 file:py-1 file:text-sm file:font-medium file:text-white hover:file:bg-violet-500 focus:outline-none"
                                required
                            />
                            {galleryErrors.media && (
                                <p className="mt-1 text-xs text-red-400">
                                    {galleryErrors.media}
                                </p>
                            )}
                        </div>
                        <div className="sm:w-56">
                            <label className="mb-1 block text-xs text-zinc-400">
                                Caption{' '}
                                <span className="text-zinc-500">
                                    (shown in gallery)
                                </span>
                            </label>
                            <input
                                type="text"
                                value={galleryData.caption}
                                onChange={(e) =>
                                    setGalleryData('caption', e.target.value)
                                }
                                placeholder="e.g. Brand Identity — TechFlow"
                                className="block w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
                            />
                            {galleryErrors.caption && (
                                <p className="mt-1 text-xs text-red-400">
                                    {galleryErrors.caption}
                                </p>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={galleryProcessing || !galleryData.media}
                            className="flex shrink-0 items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
                        >
                            {galleryProcessing ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
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
        </div>
    );
}

PortfolioSubCategoryEdit.layout = (page: ReactNode) => (
    <AdminLayout title="Edit Sub-Category">{page}</AdminLayout>
);
