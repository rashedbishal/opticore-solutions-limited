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

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
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
        <div className="space-y-6 relative">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Brands</h1>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 transition-colors"
                >
                    <Plus className="w-4 h-4" /> Add Brand
                </button>
            </div>

            <div className="rounded-xl border border-white/10 bg-zinc-900/50 overflow-hidden">
                <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-zinc-800/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 tracking-wider">Brand Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 tracking-wider">Created At</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {brands.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-8 text-center text-zinc-500 text-sm">
                                    No brands added yet.
                                </td>
                            </tr>
                        ) : (
                            brands.map((brand) => (
                                <tr key={brand.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">{brand.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                                        {new Date(brand.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <button
                                            onClick={() => openEditModal(brand)}
                                            className="text-blue-400 hover:text-blue-300 mr-4 inline-flex items-center gap-1.5 transition-colors"
                                        >
                                            <Edit className="w-4 h-4" /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(brand.id)}
                                            className="text-red-400 hover:text-red-300 inline-flex items-center gap-1.5 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" /> Delete
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
                            className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#050B14] p-6 shadow-2xl overflow-hidden"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">
                                    {editingBrand ? 'Edit Brand' : 'Add Brand'}
                                </h2>
                                <button
                                    onClick={closeModal}
                                    className="text-zinc-400 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-1">
                                        Brand Name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="w-full rounded-xl border border-white/10 bg-zinc-900/50 px-4 py-3 text-white placeholder-zinc-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 disabled:opacity-50 transition-colors"
                                        placeholder="e.g. Velocity Commerce"
                                        autoComplete="off"
                                    />
                                    {errors.name && (
                                        <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                                    )}
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="rounded-lg px-4 py-2 text-sm font-semibold text-zinc-300 hover:bg-white/5 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-50 transition-colors"
                                    >
                                        {processing ? 'Saving...' : 'Save Brand'}
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

BrandIndex.layout = (page: ReactNode) => <AdminLayout title="Manage Brands">{page}</AdminLayout>;
