import AdminLayout from '@/components/Layout/AdminLayout';
import { Link, useForm } from '@inertiajs/react';
import { Plus, Trash2, Edit, X } from 'lucide-react';
import React, { ReactNode, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface Brand {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
}

interface Props {
    brands: Brand[];
}

export default function BrandIndex({ brands }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

    const {
        data,
        setData,
        post,
        put,
        delete: destroy,
        processing,
        errors,
        reset,
        clearErrors,
    } = useForm({
        name: '',
    });

    const openCreateModal = () => {
        clearErrors();
        reset();
        setEditingBrand(null);
        setIsModalOpen(true);
    };

    const openEditModal = (brand: Brand) => {
        clearErrors();
        setEditingBrand(brand);
        setData('name', brand.name);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
        clearErrors();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingBrand) {
            put(`/admin/brands/${editingBrand.id}`, {
                onSuccess: () => closeModal(),
            });
        } else {
            post(`/admin/brands`, {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this brand?')) {
            destroy(`/admin/brands/${id}`);
        }
    };

    return (
        <div className="relative space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Brands</h1>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
                >
                    <Plus className="h-4 w-4" /> Add Brand
                </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-900/50">
                <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-zinc-800/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-zinc-400">
                                Brand Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-zinc-400">
                                Created At
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-zinc-400">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {brands.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={3}
                                    className="px-6 py-8 text-center text-sm text-zinc-500"
                                >
                                    No brands added yet.
                                </td>
                            </tr>
                        ) : (
                            brands.map((brand) => (
                                <tr
                                    key={brand.id}
                                    className="transition-colors hover:bg-white/5"
                                >
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
                                            className="mr-4 inline-flex items-center gap-1.5 text-blue-400 transition-colors hover:text-blue-300"
                                        >
                                            <Edit className="h-4 w-4" /> Edit
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleDelete(brand.id)
                                            }
                                            className="inline-flex items-center gap-1.5 text-red-400 transition-colors hover:text-red-300"
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
                            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#050B14] p-6 shadow-2xl"
                        >
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

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label
                                        htmlFor="name"
                                        className="mb-1 block text-sm font-medium text-zinc-300"
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
                                        className="w-full rounded-xl border border-white/10 bg-zinc-900/50 px-4 py-3 text-white placeholder-zinc-500 transition-colors focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 disabled:opacity-50"
                                        placeholder="e.g. Velocity Commerce"
                                        autoComplete="off"
                                    />
                                    {errors.name && (
                                        <p className="mt-1 text-sm text-red-500">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="rounded-lg px-4 py-2 text-sm font-semibold text-zinc-300 transition-colors hover:bg-white/5"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cyan-500 disabled:opacity-50"
                                    >
                                        {processing
                                            ? 'Saving...'
                                            : 'Save Brand'}
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
