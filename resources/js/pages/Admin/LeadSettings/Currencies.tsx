import type { FormEvent, ReactNode } from 'react';
import { router, useForm } from '@inertiajs/react';
import { AnimatePresence, m as motion } from 'framer-motion';
import { Edit, Loader2, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { CmsDeleteDialog } from '@/components/Admin/CmsDeleteDialog';
import { CmsErrorDialog } from '@/components/Admin/CmsErrorDialog';
import AdminLayout from '@/components/Layout/AdminLayout';
import currencyRoutes from '@/routes/admin/lead-settings/currencies';

interface Currency {
    id: string;
    code: string;
    name: string;
}

interface Props {
    currencies: Currency[];
}

const PRIMARY_BUTTON =
    'relative flex items-center gap-2 overflow-hidden rounded-lg border border-violet-400/30 bg-gradient-to-br from-violet-600 via-violet-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_22px_rgba(124,58,237,0.45),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all hover:border-violet-400/50 hover:from-violet-500 hover:via-violet-400 hover:to-cyan-400 disabled:opacity-50';
const SECONDARY_BUTTON =
    'rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-zinc-300 transition-all hover:border-violet-500/25 hover:bg-violet-500/[0.08] hover:text-white';
const LABEL =
    'mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase';
const INPUT =
    'block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-white/20 transition-all outline-none focus:border-violet-500/50 focus:bg-violet-500/5';
const TH =
    'px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase';

export default function LeadCurrenciesIndex({ currencies }: Props) {
    const [editing, setEditing] = useState<Currency | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [errorMessages, setErrorMessages] = useState<string[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<Currency | null>(null);
    const form = useForm({ code: '', name: '' });

    const openCreate = () => {
        form.clearErrors();
        form.setData({ code: '', name: '' });
        setEditing(null);
        setModalOpen(true);
    };

    const openEdit = (currency: Currency) => {
        form.clearErrors();
        form.setData({ code: currency.code, name: currency.name });
        setEditing(currency);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        form.clearErrors();
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: (errors: Record<string, string>) =>
                setErrorMessages(Object.values(errors).filter(Boolean)),
        };

        if (editing) {
            form.put(currencyRoutes.update.url(editing.id), options);
        } else {
            form.post(currencyRoutes.store.url(), options);
        }
    };

    return (
        <div className="relative space-y-6">
            <CmsErrorDialog
                messages={errorMessages}
                onClose={() => setErrorMessages([])}
            />
            <CmsDeleteDialog
                open={deleteTarget !== null}
                message={
                    deleteTarget
                        ? `Delete ${deleteTarget.code} (${deleteTarget.name})? This cannot be undone.`
                        : undefined
                }
                onConfirm={() => {
                    if (deleteTarget) {
                        router.delete(
                            currencyRoutes.destroy.url(deleteTarget.id),
                            {
                                preserveScroll: true,
                            },
                        );
                    }

                    setDeleteTarget(null);
                }}
                onCancel={() => setDeleteTarget(null)}
            />

            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        Lead Currencies
                    </h1>
                    <p className="mt-1 text-sm text-zinc-500">
                        Currencies offered on lead money fields (budget, deal
                        value, source costs).
                    </p>
                </div>
                <button
                    type="button"
                    onClick={openCreate}
                    className={PRIMARY_BUTTON}
                >
                    <Plus className="h-4 w-4" /> Add Currency
                </button>
            </div>

            <div className="relative overflow-x-auto rounded-xl border border-violet-500/15 bg-[#060c1a]/80 backdrop-blur-sm">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b border-violet-500/10 bg-violet-500/5">
                            <th className={TH}>Code</th>
                            <th className={TH}>Name</th>
                            <th className={`${TH} text-right`}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currencies.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={3}
                                    className="px-6 py-16 text-center"
                                >
                                    <p className="font-mono text-xs tracking-[0.2em] text-violet-400/30 uppercase">
                                        No currencies yet
                                    </p>
                                </td>
                            </tr>
                        ) : (
                            currencies.map((currency) => (
                                <tr
                                    key={currency.id}
                                    className="border-b border-white/4 transition-colors last:border-0 hover:bg-violet-500/5"
                                >
                                    <td className="px-6 py-4 font-mono text-sm font-semibold whitespace-nowrap text-white">
                                        {currency.code}
                                    </td>
                                    <td className="px-6 py-4 text-sm whitespace-nowrap text-zinc-300">
                                        {currency.name}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm whitespace-nowrap">
                                        <button
                                            type="button"
                                            onClick={() => openEdit(currency)}
                                            className="mr-4 inline-flex items-center gap-1.5 font-mono text-xs tracking-wide text-cyan-400/70 transition-colors hover:text-cyan-300"
                                        >
                                            <Edit className="h-4 w-4" /> Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setDeleteTarget(currency)
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

            <AnimatePresence>
                {modalOpen && (
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
                            <div className="mb-6 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-white">
                                    {editing ? 'Edit Currency' : 'Add Currency'}
                                </h2>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="text-zinc-400 transition-colors hover:text-white"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={submit} className="space-y-5">
                                <div>
                                    <label
                                        htmlFor="currency-code"
                                        className={LABEL}
                                    >
                                        Code
                                    </label>
                                    <input
                                        id="currency-code"
                                        type="text"
                                        value={form.data.code}
                                        onChange={(e) =>
                                            form.setData(
                                                'code',
                                                e.target.value.toUpperCase(),
                                            )
                                        }
                                        className={`${INPUT} font-mono uppercase`}
                                        placeholder="e.g. EUR"
                                        maxLength={10}
                                        autoComplete="off"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor="currency-name"
                                        className={LABEL}
                                    >
                                        Name
                                    </label>
                                    <input
                                        id="currency-name"
                                        type="text"
                                        value={form.data.name}
                                        onChange={(e) =>
                                            form.setData('name', e.target.value)
                                        }
                                        className={INPUT}
                                        placeholder="e.g. Euro"
                                        autoComplete="off"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 border-t border-violet-500/10 pt-4">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className={SECONDARY_BUTTON}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={form.processing}
                                        className={PRIMARY_BUTTON}
                                    >
                                        {form.processing ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />{' '}
                                                Saving...
                                            </>
                                        ) : (
                                            'Save Currency'
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

LeadCurrenciesIndex.layout = (page: ReactNode) => (
    <AdminLayout title="Lead Currencies">{page}</AdminLayout>
);
