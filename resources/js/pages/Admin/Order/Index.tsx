import type { FormEvent, ReactNode } from 'react';
import { Link, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    Eye,
    EyeOff,
    Radio,
    Search,
    SlidersHorizontal,
    Trash2,
    X,
} from 'lucide-react';
import { useState } from 'react';
import RealtimeTableListener from '@/components/Admin/RealtimeTableListener';
import AdminLayout from '@/components/Layout/AdminLayout';
import useEchoReady from '@/hooks/useEchoReady';
import adminRoutes from '@/routes/admin';

interface Order {
    id: number;
    name: string | null;
    email: string | null;
    phone: string | null;
    amount: number | null;
    currency: string | null;
    status: string | null;
    transaction_id: string | null;
    category: string | null;
    subcategory_name: string | null;
    address: string | null;
    created_at: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Filters {
    status?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
    customer?: string;
    transaction_id?: string;
    category?: string;
    subcategory_id?: string;
    amount_min?: string;
    amount_max?: string;
}

interface FilterOptions {
    categories: { slug: string; label: string }[];
    subcategories: { id: number; name: string; category_slug: string }[];
}

interface Props {
    orders: {
        data: Order[];
        links: PaginationLink[];
        total: number;
    };
    filters: Filters;
    filterOptions: FilterOptions;
}

const STATUS_OPTIONS = [
    'Pending',
    'Processing',
    'Complete',
    'Failed',
    'Cancelled',
];

type ErasableStatus = 'Pending' | 'Failed';

const inputClasses =
    'block w-full rounded-lg border border-white/8 bg-white/4 px-2.5 py-1.5 text-xs text-white placeholder-white/20 transition-all outline-none focus:border-violet-500/50 focus:bg-violet-500/5';

const labelClasses =
    'mb-0.5 block font-mono text-[10px] tracking-[0.18em] text-violet-400/60 uppercase';

function decodePaginationLabel(label: string): string {
    return label.replace(/&laquo;/g, '«').replace(/&raquo;/g, '»');
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function formatCategory(category: string): string {
    return category
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function StatusBadge({ status }: { status: string | null }) {
    const map: Record<string, string> = {
        Pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        Processing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        Complete: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        Failed: 'bg-red-500/10 text-red-400 border-red-500/20',
        Cancelled: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    };
    const cls =
        map[status ?? ''] ?? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';

    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] tracking-widest uppercase ${cls}`}
        >
            {status ?? '—'}
        </span>
    );
}

const HEADERS = [
    'Customer',
    'Amount',
    'Category',
    'Subcategory',
    'Status',
    'Transaction ID',
    'Date',
];

const EMPTY_FILTERS: Required<Filters> = {
    status: '',
    date_from: '',
    date_to: '',
    search: '',
    customer: '',
    transaction_id: '',
    category: '',
    subcategory_id: '',
    amount_min: '',
    amount_max: '',
};

export default function OrderIndex({ orders, filters, filterOptions }: Props) {
    const echoReady = useEchoReady();

    const [filterForm, setFilterForm] = useState<Required<Filters>>({
        ...EMPTY_FILTERS,
        ...filters,
    });

    const [showAdvanced, setShowAdvanced] = useState(
        Boolean(
            filters.customer ||
            filters.transaction_id ||
            filters.category ||
            filters.subcategory_id ||
            filters.amount_min ||
            filters.amount_max,
        ),
    );

    const [eraseTarget, setEraseTarget] = useState<ErasableStatus | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const eraseForm = useForm<{
        status: ErasableStatus | '';
        password: string;
    }>({
        status: '',
        password: '',
    });

    const hasPagination = orders.links.filter((l) => l.url !== null).length > 2;
    const hasActiveFilters = Object.values(filters).some((value) =>
        Boolean(value),
    );

    function applyFilters(e: FormEvent) {
        e.preventDefault();

        const params = Object.fromEntries(
            Object.entries(filterForm).filter(([, value]) => value !== ''),
        );

        router.get(adminRoutes.orders.index.url(), params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }

    function resetFilters() {
        setFilterForm(EMPTY_FILTERS);

        router.get(
            adminRoutes.orders.index.url(),
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }

    function handleCategoryChange(category: string) {
        setFilterForm((f) => {
            const subcategoryStillValid = filterOptions.subcategories.some(
                (s) =>
                    String(s.id) === f.subcategory_id &&
                    s.category_slug === category,
            );

            return {
                ...f,
                category,
                subcategory_id: subcategoryStillValid ? f.subcategory_id : '',
            };
        });
    }

    function openEraseFlow(status: ErasableStatus) {
        eraseForm.reset();
        eraseForm.clearErrors();
        eraseForm.setData('status', status);
        setShowPassword(false);
        setEraseTarget(status);
    }

    function closeEraseModal() {
        setEraseTarget(null);
        eraseForm.reset();
        eraseForm.clearErrors();
        setShowPassword(false);
    }

    function submitErase(e: FormEvent) {
        e.preventDefault();

        eraseForm.delete(adminRoutes.orders.erase.url(), {
            preserveScroll: true,
            onSuccess: closeEraseModal,
        });
    }

    return (
        <div className="space-y-6">
            {echoReady && (
                <>
                    <RealtimeTableListener
                        channel="admin.orders"
                        event="OrderCreated"
                        only={['orders']}
                    />
                    <RealtimeTableListener
                        channel="admin.orders"
                        event="OrderUpdated"
                        only={['orders']}
                    />
                </>
            )}
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-white">Orders</h1>
                <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-emerald-400/60 uppercase">
                    <Radio className="h-3 w-3 animate-pulse" />
                    Live
                </span>
            </div>

            {/* Filters + Erase Actions */}
            <div className="rounded-xl border border-violet-500/15 bg-[#060c1a]/80 p-3 backdrop-blur-sm sm:p-4">
                <form onSubmit={applyFilters} className="space-y-3">
                    <div className="flex flex-wrap items-end gap-2">
                        <div className="w-28">
                            <label className={labelClasses}>Status</label>
                            <select
                                value={filterForm.status}
                                onChange={(e) =>
                                    setFilterForm((f) => ({
                                        ...f,
                                        status: e.target.value,
                                    }))
                                }
                                className={`${inputClasses} bg-[#0a1224]`}
                            >
                                <option value="" className="bg-[#0a1224]">
                                    All Statuses
                                </option>
                                {STATUS_OPTIONS.map((status) => (
                                    <option
                                        key={status}
                                        value={status}
                                        className="bg-[#0a1224]"
                                    >
                                        {status}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="w-32">
                            <label className={labelClasses}>From</label>
                            <input
                                type="date"
                                value={filterForm.date_from}
                                onChange={(e) =>
                                    setFilterForm((f) => ({
                                        ...f,
                                        date_from: e.target.value,
                                    }))
                                }
                                className={inputClasses}
                            />
                        </div>

                        <div className="w-32">
                            <label className={labelClasses}>To</label>
                            <input
                                type="date"
                                value={filterForm.date_to}
                                onChange={(e) =>
                                    setFilterForm((f) => ({
                                        ...f,
                                        date_to: e.target.value,
                                    }))
                                }
                                className={inputClasses}
                            />
                        </div>

                        <div className="min-w-40 flex-1">
                            <label className={labelClasses}>Search</label>
                            <div className="relative">
                                <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
                                <input
                                    type="text"
                                    value={filterForm.search}
                                    onChange={(e) =>
                                        setFilterForm((f) => ({
                                            ...f,
                                            search: e.target.value,
                                        }))
                                    }
                                    placeholder="Name, email, transaction ID"
                                    className={`${inputClasses} pl-8`}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button
                                type="submit"
                                className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300 transition-colors hover:bg-violet-500/20"
                            >
                                Apply
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowAdvanced((v) => !v)}
                                title={
                                    showAdvanced
                                        ? 'Hide more filters'
                                        : 'Show more filters'
                                }
                                className={`flex items-center justify-center rounded-lg border p-1.5 transition-colors ${
                                    showAdvanced
                                        ? 'border-violet-500/30 bg-violet-500/10 text-violet-300'
                                        : 'border-white/8 bg-white/4 text-zinc-400 hover:bg-white/8 hover:text-white'
                                }`}
                            >
                                <SlidersHorizontal className="h-3.5 w-3.5" />
                            </button>
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    title="Reset filters"
                                    className="flex items-center justify-center rounded-lg border border-white/8 bg-white/4 p-1.5 text-zinc-400 transition-colors hover:bg-white/8 hover:text-white"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => openEraseFlow('Pending')}
                                title="Erase Pending Data"
                                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/20"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">
                                    Erase Pending
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => openEraseFlow('Failed')}
                                title="Erase Failed Data"
                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">
                                    Erase Failed
                                </span>
                            </button>
                        </div>
                    </div>

                    {showAdvanced && (
                        <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                            <div>
                                <label className={labelClasses}>Customer</label>
                                <input
                                    type="text"
                                    value={filterForm.customer}
                                    onChange={(e) =>
                                        setFilterForm((f) => ({
                                            ...f,
                                            customer: e.target.value,
                                        }))
                                    }
                                    placeholder="Name, email, phone"
                                    className={inputClasses}
                                />
                            </div>

                            <div>
                                <label className={labelClasses}>
                                    Transaction ID
                                </label>
                                <input
                                    type="text"
                                    value={filterForm.transaction_id}
                                    onChange={(e) =>
                                        setFilterForm((f) => ({
                                            ...f,
                                            transaction_id: e.target.value,
                                        }))
                                    }
                                    placeholder="Transaction ID"
                                    className={inputClasses}
                                />
                            </div>

                            <div>
                                <label className={labelClasses}>Category</label>
                                <select
                                    value={filterForm.category}
                                    onChange={(e) =>
                                        handleCategoryChange(e.target.value)
                                    }
                                    className={`${inputClasses} bg-[#0a1224]`}
                                >
                                    <option value="" className="bg-[#0a1224]">
                                        All Categories
                                    </option>
                                    {filterOptions.categories.map(
                                        (category) => (
                                            <option
                                                key={category.slug}
                                                value={category.slug}
                                                className="bg-[#0a1224]"
                                            >
                                                {category.label}
                                            </option>
                                        ),
                                    )}
                                </select>
                            </div>

                            <div>
                                <label className={labelClasses}>
                                    Subcategory
                                </label>
                                <select
                                    value={filterForm.subcategory_id}
                                    onChange={(e) =>
                                        setFilterForm((f) => ({
                                            ...f,
                                            subcategory_id: e.target.value,
                                        }))
                                    }
                                    className={`${inputClasses} bg-[#0a1224]`}
                                >
                                    <option value="" className="bg-[#0a1224]">
                                        All Subcategories
                                    </option>
                                    {filterForm.category
                                        ? filterOptions.subcategories
                                              .filter(
                                                  (sub) =>
                                                      sub.category_slug ===
                                                      filterForm.category,
                                              )
                                              .map((sub) => (
                                                  <option
                                                      key={sub.id}
                                                      value={sub.id}
                                                      className="bg-[#0a1224]"
                                                  >
                                                      {sub.name}
                                                  </option>
                                              ))
                                        : filterOptions.categories.map(
                                              (category) => (
                                                  <optgroup
                                                      key={category.slug}
                                                      label={category.label}
                                                      className="bg-[#0a1224]"
                                                  >
                                                      {filterOptions.subcategories
                                                          .filter(
                                                              (sub) =>
                                                                  sub.category_slug ===
                                                                  category.slug,
                                                          )
                                                          .map((sub) => (
                                                              <option
                                                                  key={sub.id}
                                                                  value={sub.id}
                                                                  className="bg-[#0a1224]"
                                                              >
                                                                  {sub.name}
                                                              </option>
                                                          ))}
                                                  </optgroup>
                                              ),
                                          )}
                                </select>
                            </div>

                            <div>
                                <label className={labelClasses}>
                                    Amount Min
                                </label>
                                <input
                                    type="number"
                                    value={filterForm.amount_min}
                                    onChange={(e) =>
                                        setFilterForm((f) => ({
                                            ...f,
                                            amount_min: e.target.value,
                                        }))
                                    }
                                    placeholder="0"
                                    className={inputClasses}
                                />
                            </div>

                            <div>
                                <label className={labelClasses}>
                                    Amount Max
                                </label>
                                <input
                                    type="number"
                                    value={filterForm.amount_max}
                                    onChange={(e) =>
                                        setFilterForm((f) => ({
                                            ...f,
                                            amount_max: e.target.value,
                                        }))
                                    }
                                    placeholder="Any"
                                    className={inputClasses}
                                />
                            </div>
                        </div>
                    )}
                </form>
            </div>

            <p className="text-sm text-zinc-500">
                {orders.total} {orders.total === 1 ? 'order' : 'orders'} total
            </p>

            <div className="relative w-full overflow-x-auto rounded-xl border border-violet-500/15 bg-[#060c1a]/80 backdrop-blur-sm">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
                <table className="w-full" style={{ minWidth: '900px' }}>
                    <thead>
                        <tr className="border-b border-violet-500/10 bg-violet-500/5">
                            {HEADERS.map((h) => (
                                <th
                                    key={h}
                                    className="px-5 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] whitespace-nowrap text-violet-400/60 uppercase"
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {orders.data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={HEADERS.length}
                                    className="px-6 py-12 text-center"
                                >
                                    <p className="font-mono text-xs tracking-[0.2em] text-violet-400/30 uppercase">
                                        No orders found
                                    </p>
                                </td>
                            </tr>
                        ) : (
                            orders.data.map((order) => (
                                <tr
                                    key={order.id}
                                    className="border-b border-white/4 transition-colors last:border-0 hover:bg-violet-500/5"
                                >
                                    {/* Customer */}
                                    <td className="px-5 py-2.5">
                                        <p className="font-medium text-white">
                                            {order.name ?? '—'}
                                        </p>
                                        <p className="mt-0.5 text-xs text-zinc-500">
                                            {order.email ?? ''}
                                        </p>
                                        {order.phone && (
                                            <p className="mt-0.5 text-xs text-zinc-600">
                                                {order.phone}
                                            </p>
                                        )}
                                    </td>

                                    {/* Amount */}
                                    <td className="px-5 py-2.5 whitespace-nowrap">
                                        <span className="font-semibold text-white">
                                            {order.currency}{' '}
                                            {order.amount != null
                                                ? Number(
                                                      order.amount,
                                                  ).toLocaleString()
                                                : '—'}
                                        </span>
                                    </td>

                                    {/* Category */}
                                    <td className="px-5 py-2.5 whitespace-nowrap">
                                        {order.category ? (
                                            <span className="font-mono text-xs text-cyan-400/80">
                                                {formatCategory(order.category)}
                                            </span>
                                        ) : (
                                            <span className="text-zinc-600">
                                                —
                                            </span>
                                        )}
                                    </td>

                                    {/* Subcategory */}
                                    <td className="px-5 py-2.5 whitespace-nowrap">
                                        {order.subcategory_name ? (
                                            <span className="text-sm text-zinc-300">
                                                {order.subcategory_name}
                                            </span>
                                        ) : (
                                            <span className="text-zinc-600">
                                                —
                                            </span>
                                        )}
                                    </td>

                                    {/* Status */}
                                    <td className="px-5 py-2.5 whitespace-nowrap">
                                        <StatusBadge status={order.status} />
                                    </td>

                                    {/* Transaction ID */}
                                    <td className="px-5 py-2.5 whitespace-nowrap">
                                        <span className="font-mono text-sm text-zinc-300">
                                            {order.transaction_id ?? '—'}
                                        </span>
                                    </td>

                                    {/* Date */}
                                    <td className="px-5 py-2.5 text-sm whitespace-nowrap text-zinc-500">
                                        {formatDate(order.created_at)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {hasPagination && (
                <div className="flex flex-wrap items-center justify-center gap-1 pt-2">
                    {orders.links.map((link, i) => {
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

            {/* Erase Confirmation Modal */}
            {eraseTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
                    <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-violet-500/20 bg-[#060c1a] p-6 shadow-2xl">
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

                        <div className="mb-5 flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/15">
                                <AlertTriangle className="h-5 w-5 text-red-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">
                                    Erase {eraseTarget} Orders
                                </h3>
                                <p className="text-xs text-zinc-500">
                                    This action is permanent
                                </p>
                            </div>
                        </div>

                        <p className="mb-4 text-sm text-zinc-300">
                            This will permanently delete all{' '}
                            <span className="font-semibold text-white">
                                {eraseTarget}
                            </span>{' '}
                            orders and their linked transaction records. This
                            cannot be undone. Enter the mother admin password to
                            confirm.
                        </p>

                        <form onSubmit={submitErase}>
                            <div className="relative mb-4">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={eraseForm.data.password}
                                    onChange={(e) =>
                                        eraseForm.setData(
                                            'password',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Mother admin password"
                                    autoFocus
                                    className="block w-full rounded-lg border border-white/8 bg-white/4 py-2.5 pr-10 pl-4 text-sm text-white placeholder-white/20 transition-all outline-none focus:border-red-500/50 focus:bg-red-500/5"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((p) => !p)}
                                    className="absolute top-1/2 right-3 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                                {eraseForm.errors.password && (
                                    <p className="mt-1.5 font-mono text-[10px] text-red-400">
                                        {eraseForm.errors.password}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={closeEraseModal}
                                    className="relative flex-1 overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-zinc-300 transition-all before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:-skew-x-12 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-transform before:duration-500 hover:border-violet-500/25 hover:bg-violet-500/[0.08] hover:text-white hover:shadow-[0_0_14px_rgba(124,58,237,0.1)] hover:before:translate-x-full"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={
                                        eraseForm.processing ||
                                        !eraseForm.data.password
                                    }
                                    className="relative flex-1 overflow-hidden rounded-lg border border-red-500/30 bg-gradient-to-br from-red-600 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_18px_rgba(239,68,68,0.28),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:-skew-x-12 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-transform before:duration-500 hover:border-red-400/50 hover:from-red-500 hover:to-rose-400 hover:shadow-[0_0_28px_rgba(239,68,68,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] hover:before:translate-x-full disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {eraseForm.processing
                                        ? 'Erasing...'
                                        : `Erase ${eraseTarget} Orders`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

OrderIndex.layout = (page: ReactNode) => (
    <AdminLayout title="Orders" fullWidth>
        {page}
    </AdminLayout>
);
