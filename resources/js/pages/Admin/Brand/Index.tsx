import type { ReactNode } from 'react';
import { Link, useForm, router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Plus,
    Trash2,
    Edit,
    X,
    Upload,
    Image as ImageIcon,
    Loader2,
} from 'lucide-react';
import React, { useState, useRef } from 'react';
import { CmsDeleteDialog } from '@/components/Admin/CmsDeleteDialog';
import { CmsErrorDialog } from '@/components/Admin/CmsErrorDialog';
import AdminLayout from '@/components/Layout/AdminLayout';

interface Brand {
    id: number;
    name: string;
    logo_path: string | null;
    created_at: string;
    updated_at: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    brands: {
        data: Brand[];
        links: PaginationLink[];
    };
}

function decodePaginationLabel(label: string): string {
    return label.replace(/&laquo;/g, '«').replace(/&raquo;/g, '»');
}

export default function BrandIndex({ brands }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [errorMessages, setErrorMessages] = useState<string[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<(() => void) | null>(null);
    const requestDelete = (action: () => void) => setDeleteTarget(() => action);
    const confirmDelete = () => {
        deleteTarget?.();
        setDeleteTarget(null);
    };
    const cancelDelete = () => setDeleteTarget(null);

    const { data, setData, post, processing, reset, clearErrors } = useForm<{
        name: string;
        logo: File | null;
        _method?: string;
    }>({
        name: '',
        logo: null,
    });

    const openCreateModal = () => {
        clearErrors();
        reset();
        setEditingBrand(null);
        setPreviewUrl(null);
        setIsModalOpen(true);
    };

    const openEditModal = (brand: Brand) => {
        clearErrors();
        setEditingBrand(brand);
        setData({
            name: brand.name,
            logo: null,
        });
        setPreviewUrl(brand.logo_path);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
        clearErrors();
        setPreviewUrl(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (file) {
            setData('logo', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingBrand) {
            setData('_method', 'PUT');
            post(`/admin/brands/${editingBrand.id}`, {
                onSuccess: () => closeModal(),
                onError: (errs) =>
                    setErrorMessages(
                        Object.values(errs).filter(Boolean) as string[],
                    ),
            });
        } else {
            post(`/admin/brands`, {
                onSuccess: () => closeModal(),
                onError: (errs) =>
                    setErrorMessages(
                        Object.values(errs).filter(Boolean) as string[],
                    ),
            });
        }
    };

    const handleDelete = (id: number) => {
        requestDelete(() => {
            router.delete(`/admin/brands/${id}`);
        });
    };

    const hasPagination = brands.links.filter((l) => l.url !== null).length > 2;

    return (
        <div className="relative space-y-6">
            <CmsErrorDialog
                messages={errorMessages}
                onClose={() => setErrorMessages([])}
            />
            <CmsDeleteDialog
                open={deleteTarget !== null}
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Brands</h1>
                <button
                    onClick={openCreateModal}
                    className="relative flex items-center gap-2 overflow-hidden rounded-lg border border-violet-400/30 bg-gradient-to-br from-violet-600 via-violet-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_22px_rgba(124,58,237,0.45),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:-skew-x-12 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-transform before:duration-500 hover:border-violet-400/50 hover:from-violet-500 hover:via-violet-400 hover:to-cyan-400 hover:shadow-[0_0_38px_rgba(124,58,237,0.65),inset_0_1px_0_rgba(255,255,255,0.2)] hover:before:translate-x-full"
                >
                    <Plus className="h-4 w-4" /> Add Brand
                </button>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-violet-500/15 bg-[#060c1a]/80 backdrop-blur-sm">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b border-violet-500/10 bg-violet-500/5">
                            <th className="px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase">
                                Logo
                            </th>
                            <th className="px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase">
                                Brand Name
                            </th>
                            <th className="px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase">
                                Created At
                            </th>
                            <th className="px-6 py-3 text-right font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {brands.data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={4}
                                    className="px-6 py-16 text-center"
                                >
                                    <p className="font-mono text-xs tracking-[0.2em] text-violet-400/30 uppercase">
                                        No records found
                                    </p>
                                </td>
                            </tr>
                        ) : (
                            brands.data.map((brand) => (
                                <tr
                                    key={brand.id}
                                    className="border-b border-white/4 transition-colors last:border-0 hover:bg-violet-500/5"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {brand.logo_path ? (
                                            <div className="h-10 w-10 overflow-hidden rounded-lg border border-white/10 bg-black/40 p-1">
                                                <img
                                                    src={brand.logo_path}
                                                    alt={brand.name}
                                                    className="h-full w-full object-contain"
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/5 bg-zinc-800/50 text-zinc-600">
                                                <ImageIcon className="h-5 w-5" />
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-white">
                                        {brand.name}
                                    </td>
                                    <td className="px-6 py-4 text-sm whitespace-nowrap text-zinc-400">
                                        {new Date(
                                            brand.created_at,
                                        ).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm whitespace-nowrap">
                                        <button
                                            onClick={() => openEditModal(brand)}
                                            className="mr-4 inline-flex items-center gap-1.5 font-mono text-xs tracking-wide text-cyan-400/70 transition-colors hover:text-cyan-300"
                                        >
                                            <Edit className="h-4 w-4" /> Edit
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleDelete(brand.id)
                                            }
                                            className="inline-flex items-center gap-1.5 font-mono text-xs tracking-wide text-red-400/60 transition-colors hover:text-red-400"
                                        >
                                            <Trash2 className="h-4 w-4" />{' '}
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {hasPagination && (
                <div className="flex flex-wrap items-center justify-center gap-1 pt-2">
                    {brands.links.map((link, i) => {
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

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={closeModal}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-violet-500/20 bg-[#060c1a] p-6 shadow-2xl"
                        >
                            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
                            <div className="mb-6 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-white">
                                    {editingBrand ? 'Edit Brand' : 'Add Brand'}
                                </h2>
                                <button
                                    onClick={closeModal}
                                    className="text-zinc-400 transition-colors hover:text-white"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <label
                                            htmlFor="name"
                                            className="mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase"
                                        >
                                            Brand Name
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            value={data.name}
                                            onChange={(e) =>
                                                setData('name', e.target.value)
                                            }
                                            className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-white/20 transition-all outline-none focus:border-violet-500/50 focus:bg-violet-500/5"
                                            placeholder="e.g. Velocity Commerce"
                                            autoComplete="off"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase">
                                            Brand Logo
                                        </label>
                                        <div
                                            onClick={() =>
                                                fileInputRef.current?.click()
                                            }
                                            className="group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/10 bg-white/2 p-8 transition-colors hover:border-violet-500/50 hover:bg-violet-500/5"
                                        >
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                            />

                                            {previewUrl ? (
                                                <div className="relative aspect-square w-32 overflow-hidden rounded-lg bg-black/40 p-2">
                                                    <img
                                                        src={previewUrl}
                                                        alt="Preview"
                                                        className="h-full w-full object-contain"
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                                                        <Upload className="h-6 w-6 text-white" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center text-center">
                                                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-zinc-400 group-hover:text-violet-400">
                                                        <Upload className="h-6 w-6" />
                                                    </div>
                                                    <p className="text-sm font-medium text-zinc-300">
                                                        Click to upload logo
                                                    </p>
                                                    <p className="mt-1 text-xs text-zinc-500">
                                                        SVG, PNG, JPG (max. 2MB)
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 border-t border-violet-500/10 pt-4">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-zinc-300 transition-all before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:-skew-x-12 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-transform before:duration-500 hover:border-violet-500/25 hover:bg-violet-500/[0.08] hover:text-white hover:shadow-[0_0_14px_rgba(124,58,237,0.1)] hover:before:translate-x-full"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="relative flex items-center gap-2 overflow-hidden rounded-lg border border-violet-400/30 bg-gradient-to-br from-violet-600 via-violet-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_22px_rgba(124,58,237,0.45),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:-skew-x-12 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-transform before:duration-500 hover:border-violet-400/50 hover:from-violet-500 hover:via-violet-400 hover:to-cyan-400 hover:shadow-[0_0_38px_rgba(124,58,237,0.65),inset_0_1px_0_rgba(255,255,255,0.2)] hover:before:translate-x-full disabled:opacity-50"
                                    >
                                        {processing ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />{' '}
                                                Saving...
                                            </>
                                        ) : (
                                            'Save Brand'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

BrandIndex.layout = (page: ReactNode) => (
    <AdminLayout title="Manage Brands">{page}</AdminLayout>
);
