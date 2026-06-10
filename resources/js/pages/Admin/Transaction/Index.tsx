import type { FormEvent, ReactNode } from 'react';
import { Link, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    Download,
    Eye,
    EyeOff,
    Radio,
    Search,
    SlidersHorizontal,
    Trash2,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { downloadInvoice } from '@/actions/App/Http/Controllers/Admin/TransactionController';
import RealtimeTableListener from '@/components/Admin/RealtimeTableListener';
import AdminLayout from '@/components/Layout/AdminLayout';
import useEchoReady from '@/hooks/useEchoReady';
import adminRoutes from '@/routes/admin';

interface Transaction {
    id: number;
    name: string | null;
    email: string | null;
    phone: string | null;
    invoice_number: string | null;
    transaction_id: string;
    val_id: string | null;
    amount: string | null;
    currency: string | null;
    card_type: string | null;
    store_amount: string | null;
    card_no: string | null;
    bank_tran_id: string | null;
    status: string | null;
    tran_date: string | null;
    card_issuer: string | null;
    card_brand: string | null;
    card_issuer_country: string | null;
    currency_type: string | null;
    risk_level: string | null;
    risk_title: string | null;
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
    transaction_id?: string;
    customer?: string;
    invoice_number?: string;
    bank_tran_id?: string;
    card_no?: string;
    card_type?: string;
    card_issuer?: string;
    card_issuer_country?: string;
    currency_type?: string;
    risk_title?: string;
    amount_min?: string;
    amount_max?: string;
    store_amount_min?: string;
    store_amount_max?: string;
}

interface FilterOptions {
    cardTypes: string[];
    cardIssuers: string[];
    cardIssuerCountries: string[];
    currencyTypes: string[];
    riskTitles: string[];
}

interface Props {
    transactions: {
        data: Transaction[];
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

function Cell({
    value,
    mono = false,
}: {
    value: string | null | undefined;
    mono?: boolean;
}) {
    if (!value) {
        return <span className="text-zinc-600">—</span>;
    }

    return (
        <span
            className={
                mono
                    ? 'font-mono text-xs text-zinc-400'
                    : 'text-sm text-zinc-300'
            }
        >
            {value}
        </span>
    );
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
    'Transaction ID',
    'Customer',
    'Invoice',
    'Amount',
    'Status',
    'Card',
    'Bank Tran ID',
    'Store Amt',
    'Card No',
    'Tran Date',
    'Issuer',
    'Country',
    'Currency Type',
    'Risk',
    'Date',
];

const EMPTY_FILTERS: Required<Filters> = {
    status: '',
    date_from: '',
    date_to: '',
    search: '',
    transaction_id: '',
    customer: '',
    invoice_number: '',
    bank_tran_id: '',
    card_no: '',
    card_type: '',
    card_issuer: '',
    card_issuer_country: '',
    currency_type: '',
    risk_title: '',
    amount_min: '',
    amount_max: '',
    store_amount_min: '',
    store_amount_max: '',
};

export default function TransactionIndex({
    transactions,
    filters,
    filterOptions,
}: Props) {
    const echoReady = useEchoReady();

    const [filterForm, setFilterForm] = useState<Required<Filters>>({
        ...EMPTY_FILTERS,
        ...filters,
    });

    const [showAdvanced, setShowAdvanced] = useState(
        Boolean(
            filters.transaction_id ||
            filters.customer ||
            filters.invoice_number ||
            filters.bank_tran_id ||
            filters.card_no ||
            filters.card_type ||
            filters.card_issuer ||
            filters.card_issuer_country ||
            filters.currency_type ||
            filters.risk_title ||
            filters.amount_min ||
            filters.amount_max ||
            filters.store_amount_min ||
            filters.store_amount_max,
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

    const hasPagination =
        transactions.links.filter((l) => l.url !== null).length > 2;
    const hasActiveFilters = Object.values(filters).some((value) =>
        Boolean(value),
    );

    function applyFilters(e: FormEvent) {
        e.preventDefault();

        const params = Object.fromEntries(
            Object.entries(filterForm).filter(([, value]) => value !== ''),
        );

        router.get(adminRoutes.transactions.index.url(), params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }

    function resetFilters() {
        setFilterForm(EMPTY_FILTERS);

        router.get(
            adminRoutes.transactions.index.url(),
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
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

        eraseForm.delete(adminRoutes.transactions.erase.url(), {
            preserveScroll: true,
            onSuccess: closeEraseModal,
        });
    }

    return (
        <div className="space-y-6">
            {echoReady && (
                <RealtimeTableListener
                    channel="admin.transactions"
                    event="TransactionUpdated"
                    only={['transactions']}
                />
            )}
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-white">Transactions</h1>
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
                                <label className={labelClasses}>Invoice</label>
                                <input
                                    type="text"
                                    value={filterForm.invoice_number}
                                    onChange={(e) =>
                                        setFilterForm((f) => ({
                                            ...f,
                                            invoice_number: e.target.value,
                                        }))
                                    }
                                    placeholder="Invoice number"
                                    className={inputClasses}
                                />
                            </div>

                            <div>
                                <label className={labelClasses}>
                                    Bank Tran ID
                                </label>
                                <input
                                    type="text"
                                    value={filterForm.bank_tran_id}
                                    onChange={(e) =>
                                        setFilterForm((f) => ({
                                            ...f,
                                            bank_tran_id: e.target.value,
                                        }))
                                    }
                                    placeholder="Bank tran ID"
                                    className={inputClasses}
                                />
                            </div>

                            <div>
                                <label className={labelClasses}>Card No</label>
                                <input
                                    type="text"
                                    value={filterForm.card_no}
                                    onChange={(e) =>
                                        setFilterForm((f) => ({
                                            ...f,
                                            card_no: e.target.value,
                                        }))
                                    }
                                    placeholder="Card number"
                                    className={inputClasses}
                                />
                            </div>

                            <div>
                                <label className={labelClasses}>
                                    Card Type
                                </label>
                                <select
                                    value={filterForm.card_type}
                                    onChange={(e) =>
                                        setFilterForm((f) => ({
                                            ...f,
                                            card_type: e.target.value,
                                        }))
                                    }
                                    className={`${inputClasses} bg-[#0a1224]`}
                                >
                                    <option value="" className="bg-[#0a1224]">
                                        All Card Types
                                    </option>
                                    {filterOptions.cardTypes.map((option) => (
                                        <option
                                            key={option}
                                            value={option}
                                            className="bg-[#0a1224]"
                                        >
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className={labelClasses}>Issuer</label>
                                <select
                                    value={filterForm.card_issuer}
                                    onChange={(e) =>
                                        setFilterForm((f) => ({
                                            ...f,
                                            card_issuer: e.target.value,
                                        }))
                                    }
                                    className={`${inputClasses} bg-[#0a1224]`}
                                >
                                    <option value="" className="bg-[#0a1224]">
                                        All Issuers
                                    </option>
                                    {filterOptions.cardIssuers.map((option) => (
                                        <option
                                            key={option}
                                            value={option}
                                            className="bg-[#0a1224]"
                                        >
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className={labelClasses}>Country</label>
                                <select
                                    value={filterForm.card_issuer_country}
                                    onChange={(e) =>
                                        setFilterForm((f) => ({
                                            ...f,
                                            card_issuer_country: e.target.value,
                                        }))
                                    }
                                    className={`${inputClasses} bg-[#0a1224]`}
                                >
                                    <option value="" className="bg-[#0a1224]">
                                        All Countries
                                    </option>
                                    {filterOptions.cardIssuerCountries.map(
                                        (option) => (
                                            <option
                                                key={option}
                                                value={option}
                                                className="bg-[#0a1224]"
                                            >
                                                {option}
                                            </option>
                                        ),
                                    )}
                                </select>
                            </div>

                            <div>
                                <label className={labelClasses}>
                                    Currency Type
                                </label>
                                <select
                                    value={filterForm.currency_type}
                                    onChange={(e) =>
                                        setFilterForm((f) => ({
                                            ...f,
                                            currency_type: e.target.value,
                                        }))
                                    }
                                    className={`${inputClasses} bg-[#0a1224]`}
                                >
                                    <option value="" className="bg-[#0a1224]">
                                        All Currency Types
                                    </option>
                                    {filterOptions.currencyTypes.map(
                                        (option) => (
                                            <option
                                                key={option}
                                                value={option}
                                                className="bg-[#0a1224]"
                                            >
                                                {option}
                                            </option>
                                        ),
                                    )}
                                </select>
                            </div>

                            <div>
                                <label className={labelClasses}>Risk</label>
                                <select
                                    value={filterForm.risk_title}
                                    onChange={(e) =>
                                        setFilterForm((f) => ({
                                            ...f,
                                            risk_title: e.target.value,
                                        }))
                                    }
                                    className={`${inputClasses} bg-[#0a1224]`}
                                >
                                    <option value="" className="bg-[#0a1224]">
                                        All Risk Levels
                                    </option>
                                    {filterOptions.riskTitles.map((option) => (
                                        <option
                                            key={option}
                                            value={option}
                                            className="bg-[#0a1224]"
                                        >
                                            {option}
                                        </option>
                                    ))}
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

                            <div>
                                <label className={labelClasses}>
                                    Store Amt Min
                                </label>
                                <input
                                    type="number"
                                    value={filterForm.store_amount_min}
                                    onChange={(e) =>
                                        setFilterForm((f) => ({
                                            ...f,
                                            store_amount_min: e.target.value,
                                        }))
                                    }
                                    placeholder="0"
                                    className={inputClasses}
                                />
                            </div>

                            <div>
                                <label className={labelClasses}>
                                    Store Amt Max
                                </label>
                                <input
                                    type="number"
                                    value={filterForm.store_amount_max}
                                    onChange={(e) =>
                                        setFilterForm((f) => ({
                                            ...f,
                                            store_amount_max: e.target.value,
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
                {transactions.total}{' '}
                {transactions.total === 1 ? 'transaction' : 'transactions'}{' '}
                total
            </p>

            <div className="relative w-full overflow-x-auto rounded-xl border border-violet-500/15 bg-[#060c1a]/80 backdrop-blur-sm">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
                <table className="w-full" style={{ minWidth: '2400px' }}>
                    <thead>
                        <tr className="border-b border-violet-500/10 bg-violet-500/5">
                            {HEADERS.map((h) => (
                                <th
                                    key={h}
                                    className="px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] whitespace-nowrap text-violet-400/60 uppercase"
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={HEADERS.length}
                                    className="px-6 py-12 text-center"
                                >
                                    <p className="font-mono text-xs tracking-[0.2em] text-violet-400/30 uppercase">
                                        No transactions found
                                    </p>
                                </td>
                            </tr>
                        ) : (
                            transactions.data.map((tx) => (
                                <tr
                                    key={tx.id}
                                    className="border-b border-white/4 transition-colors last:border-0 hover:bg-violet-500/5"
                                >
                                    {/* Transaction ID — first, larger font */}
                                    <td className="px-6 py-2.5 whitespace-nowrap">
                                        <span className="font-mono text-sm font-semibold text-cyan-400">
                                            {tx.transaction_id}
                                        </span>
                                    </td>

                                    {/* Customer */}
                                    <td className="px-6 py-2.5 whitespace-nowrap">
                                        <p className="font-medium text-white">
                                            {tx.name ?? '—'}
                                        </p>
                                        <p className="mt-0.5 text-xs text-zinc-500">
                                            {tx.email ?? ''}
                                        </p>
                                    </td>

                                    {/* Invoice — download link */}
                                    <td className="px-6 py-2.5 whitespace-nowrap">
                                        {tx.invoice_number ? (
                                            <a
                                                href={downloadInvoice.url(
                                                    tx.id,
                                                )}
                                                className="inline-flex items-center gap-1.5 font-mono text-xs text-violet-400 transition-colors hover:text-violet-300"
                                                title="Download invoice PDF"
                                            >
                                                <Download className="h-3.5 w-3.5 shrink-0" />
                                                {tx.invoice_number}
                                            </a>
                                        ) : (
                                            <span className="text-zinc-600">
                                                —
                                            </span>
                                        )}
                                    </td>

                                    {/* Amount */}
                                    <td className="px-6 py-2.5 whitespace-nowrap">
                                        {tx.amount != null ? (
                                            <span className="font-semibold text-white">
                                                {tx.currency}{' '}
                                                {Number(
                                                    tx.amount,
                                                ).toLocaleString()}
                                            </span>
                                        ) : (
                                            <span className="text-zinc-600">
                                                —
                                            </span>
                                        )}
                                    </td>

                                    {/* Status */}
                                    <td className="px-6 py-2.5 whitespace-nowrap">
                                        <StatusBadge status={tx.status} />
                                    </td>

                                    {/* Card type / brand */}
                                    <td className="px-6 py-2.5 whitespace-nowrap">
                                        <p className="text-sm text-zinc-300">
                                            {tx.card_type ?? '—'}
                                        </p>
                                        {tx.card_brand && (
                                            <p className="mt-0.5 text-xs text-zinc-500">
                                                {tx.card_brand}
                                            </p>
                                        )}
                                    </td>

                                    {/* Bank Tran ID */}
                                    <td className="px-6 py-2.5 whitespace-nowrap">
                                        <Cell value={tx.bank_tran_id} mono />
                                    </td>

                                    {/* Store Amount */}
                                    <td className="px-6 py-2.5 whitespace-nowrap">
                                        {tx.store_amount != null ? (
                                            <span className="text-sm text-zinc-400">
                                                {Number(
                                                    tx.store_amount,
                                                ).toLocaleString()}
                                            </span>
                                        ) : (
                                            <span className="text-zinc-600">
                                                —
                                            </span>
                                        )}
                                    </td>

                                    {/* Card No */}
                                    <td className="px-6 py-2.5 whitespace-nowrap">
                                        <Cell value={tx.card_no} mono />
                                    </td>

                                    {/* Tran Date */}
                                    <td className="px-6 py-2.5 whitespace-nowrap">
                                        <Cell value={tx.tran_date} />
                                    </td>

                                    {/* Issuer */}
                                    <td className="px-6 py-2.5 whitespace-nowrap">
                                        <Cell value={tx.card_issuer} />
                                    </td>

                                    {/* Country */}
                                    <td className="px-6 py-2.5 whitespace-nowrap">
                                        <Cell value={tx.card_issuer_country} />
                                    </td>

                                    {/* Currency Type */}
                                    <td className="px-6 py-2.5 whitespace-nowrap">
                                        <Cell value={tx.currency_type} mono />
                                    </td>

                                    {/* Risk */}
                                    <td className="px-6 py-2.5 whitespace-nowrap">
                                        {tx.risk_level ? (
                                            <div>
                                                <p className="text-sm text-zinc-300">
                                                    {tx.risk_level}
                                                </p>
                                                {tx.risk_title && (
                                                    <p className="mt-0.5 text-xs text-zinc-500">
                                                        {tx.risk_title}
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-zinc-600">
                                                —
                                            </span>
                                        )}
                                    </td>

                                    {/* Date */}
                                    <td className="px-6 py-2.5 text-sm whitespace-nowrap text-zinc-500">
                                        {formatDate(tx.created_at)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {hasPagination && (
                <div className="flex flex-wrap items-center justify-center gap-1 pt-2">
                    {transactions.links.map((link, i) => {
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
                                    Erase {eraseTarget} Transactions
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
                            transactions and their linked order records. This
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
                                        : `Erase ${eraseTarget} Transactions`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

TransactionIndex.layout = (page: ReactNode) => (
    <AdminLayout title="Transactions" fullWidth>
        {page}
    </AdminLayout>
);
