import type { FormEvent, ReactNode } from 'react';
import { Link, router, useForm } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertTriangle,
    Download,
    Eye,
    EyeOff,
    Loader2,
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
    currency_rate: string | null;
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

type ClearAllStep = 'warning' | 'admin' | 'mother';

const inputClasses =
    'block w-full rounded-lg border border-white/8 bg-white/4 px-2.5 py-1.5 text-xs text-white placeholder-white/20 transition-all outline-none focus:border-violet-500/50 focus:bg-violet-500/5';

const labelClasses =
    'mb-0.5 block font-mono text-[10px] tracking-[0.18em] text-violet-400/60 uppercase';

const cancelButtonClasses =
    'relative flex-1 overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300 transition-all before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:-skew-x-12 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-transform before:duration-500 hover:border-violet-500/25 hover:bg-violet-500/[0.08] hover:text-white hover:shadow-[0_0_14px_rgba(124,58,237,0.1)] hover:before:translate-x-full';

const warningButtonClasses =
    'relative flex-1 overflow-hidden rounded-lg border border-amber-500/30 bg-gradient-to-br from-amber-500 to-orange-500 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_0_18px_rgba(245,158,11,0.28),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all hover:border-amber-400/50 hover:from-amber-400 hover:to-orange-400 hover:shadow-[0_0_28px_rgba(245,158,11,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] disabled:cursor-not-allowed disabled:opacity-50';

const dangerButtonClasses =
    'relative flex-1 overflow-hidden rounded-lg border border-red-500/30 bg-gradient-to-br from-red-600 to-rose-500 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_0_18px_rgba(239,68,68,0.28),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all hover:border-red-400/50 hover:from-red-500 hover:to-rose-400 hover:shadow-[0_0_28px_rgba(239,68,68,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] disabled:cursor-not-allowed disabled:opacity-50';

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
    'Currency Rate',
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

    const [clearAllStep, setClearAllStep] = useState<ClearAllStep | null>(null);
    const [showAdminPassword, setShowAdminPassword] = useState(false);
    const [showMotherPassword, setShowMotherPassword] = useState(false);

    const clearAllForm = useForm<{
        admin_password: string;
        mother_password: string;
    }>({
        admin_password: '',
        mother_password: '',
    });

    // If the mother-admin password fails, bounce back to the admin step so
    // the user sees the admin_password error without losing their mother
    // password entry.
    const clearAllDisplayStep: ClearAllStep | null =
        clearAllStep === 'mother' && clearAllForm.errors.admin_password
            ? 'admin'
            : clearAllStep;

    function openClearAllFlow() {
        clearAllForm.reset();
        clearAllForm.clearErrors();
        setShowAdminPassword(false);
        setShowMotherPassword(false);
        setClearAllStep('warning');
    }

    function closeClearAllModal() {
        setClearAllStep(null);
        clearAllForm.reset();
        clearAllForm.clearErrors();
        setShowAdminPassword(false);
        setShowMotherPassword(false);
    }

    function proceedToAdminPassword() {
        setClearAllStep('admin');
    }

    function proceedToMotherPassword(e: FormEvent) {
        e.preventDefault();
        clearAllForm.clearErrors('admin_password');
        setClearAllStep('mother');
    }

    function submitClearAll(e: FormEvent) {
        e.preventDefault();

        clearAllForm.delete(adminRoutes.transactions.clearAll.url(), {
            preserveScroll: true,
            onSuccess: closeClearAllModal,
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
                            <div className="h-5 w-px bg-white/10" />
                            <button
                                type="button"
                                onClick={openClearAllFlow}
                                title="Clear All Transactions & Linked Data"
                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-600/40 bg-red-600/15 px-2.5 py-1.5 text-xs font-semibold text-red-300 transition-colors hover:bg-red-600/25"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">
                                    Clear All Transactions
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
                <table className="w-full" style={{ minWidth: '2550px' }}>
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

                                    {/* Currency Rate */}
                                    <td className="px-6 py-2.5 whitespace-nowrap">
                                        <Cell value={tx.currency_rate} mono />
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
            <AnimatePresence>
                {eraseTarget && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{
                            backdropFilter: 'blur(4px)',
                            background: 'rgba(0,0,0,0.6)',
                        }}
                        onClick={closeEraseModal}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: -16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: -10 }}
                            transition={{
                                type: 'spring',
                                stiffness: 400,
                                damping: 30,
                            }}
                            className="relative w-full max-w-md overflow-hidden rounded-2xl"
                            style={{
                                background:
                                    'linear-gradient(148deg, #0e1225, #090d1b)',
                                border: '1px solid rgba(239,68,68,0.35)',
                                boxShadow:
                                    '0 0 0 1px rgba(239,68,68,0.08), 0 32px 80px rgba(0,0,0,0.85), 0 0 70px rgba(239,68,68,0.14)',
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Top scan accent */}
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/70 to-transparent" />

                            {/* Title bar */}
                            <div
                                className="flex items-center justify-between px-4 py-2.5"
                                style={{
                                    background:
                                        'linear-gradient(90deg, rgba(239,68,68,0.14), rgba(239,68,68,0.05))',
                                    borderBottom:
                                        '1px solid rgba(239,68,68,0.18)',
                                }}
                            >
                                <div className="flex items-center gap-2.5">
                                    {/* Traffic lights */}
                                    <div className="flex gap-1.5">
                                        <div
                                            className="h-2.5 w-2.5 rounded-full bg-red-500"
                                            style={{
                                                boxShadow:
                                                    '0 0 6px rgba(239,68,68,0.7)',
                                            }}
                                        />
                                        <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/40" />
                                        <div className="h-2.5 w-2.5 rounded-full bg-green-500/25" />
                                    </div>
                                    <span className="font-mono text-[9px] tracking-[0.25em] text-red-400/80 uppercase">
                                        ◈ Security Override
                                    </span>
                                </div>
                                <button
                                    onClick={closeEraseModal}
                                    className="flex h-5 w-5 items-center justify-center rounded border border-red-500/30 bg-red-500/10 text-red-400/60 transition-all hover:border-red-400/60 hover:bg-red-500/20 hover:text-red-300"
                                >
                                    <X size={10} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="px-5 py-5">
                                <div className="flex items-start gap-4">
                                    <div
                                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                                        style={{
                                            background: 'rgba(239,68,68,0.1)',
                                            border: '1px solid rgba(239,68,68,0.28)',
                                            boxShadow:
                                                '0 0 20px rgba(239,68,68,0.12)',
                                        }}
                                    >
                                        <motion.div
                                            animate={{ scale: [1, 1.12, 1] }}
                                            transition={{
                                                duration: 1.8,
                                                repeat: Infinity,
                                                ease: 'easeInOut',
                                            }}
                                        >
                                            <AlertTriangle className="h-5 w-5 text-red-400" />
                                        </motion.div>
                                    </div>

                                    <div className="flex-1">
                                        <p className="mb-1 font-mono text-[9px] tracking-[0.22em] text-red-400/70 uppercase">
                                            Irreversible Action
                                        </p>
                                        <h3 className="text-sm font-semibold text-white">
                                            Erase {eraseTarget} Transactions
                                        </h3>
                                        <p className="mt-2 text-xs leading-relaxed text-white/55">
                                            This will permanently delete all{' '}
                                            <span className="font-semibold text-white">
                                                {eraseTarget}
                                            </span>{' '}
                                            transactions and their linked order
                                            records. This cannot be undone.
                                        </p>
                                    </div>
                                </div>

                                <form onSubmit={submitErase} className="mt-5">
                                    <label className="mb-2 block font-mono text-[10px] tracking-[0.22em] text-red-400/70 uppercase">
                                        ◈ Master Cipher Key
                                    </label>
                                    <div className="group relative">
                                        <input
                                            type={
                                                showPassword
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            value={eraseForm.data.password}
                                            onChange={(e) =>
                                                eraseForm.setData(
                                                    'password',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Mother admin password"
                                            autoFocus
                                            className="block w-full rounded-lg border border-white/8 bg-white/4 py-2.5 pr-11 pl-4 text-sm text-white placeholder-white/20 transition-all duration-300 outline-none focus:border-red-500/50 focus:bg-red-500/5"
                                        />
                                        <button
                                            type="button"
                                            tabIndex={-1}
                                            onClick={() =>
                                                setShowPassword((p) => !p)
                                            }
                                            className="absolute top-1/2 right-3 -translate-y-1/2 text-white/25 transition-colors hover:text-red-400"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px w-0 bg-gradient-to-r from-red-500 to-rose-400 transition-all duration-500 group-focus-within:w-full" />
                                    </div>

                                    {eraseForm.errors.password && (
                                        <p className="mt-2 font-mono text-[10px] tracking-[0.1em] text-red-400">
                                            ◈ {eraseForm.errors.password}
                                        </p>
                                    )}

                                    <div className="mt-5 flex gap-3">
                                        <button
                                            type="button"
                                            onClick={closeEraseModal}
                                            className="relative flex-1 overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300 transition-all before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:-skew-x-12 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-transform before:duration-500 hover:border-violet-500/25 hover:bg-violet-500/[0.08] hover:text-white hover:shadow-[0_0_14px_rgba(124,58,237,0.1)] hover:before:translate-x-full"
                                        >
                                            Cancel
                                        </button>
                                        <motion.button
                                            type="submit"
                                            disabled={
                                                eraseForm.processing ||
                                                !eraseForm.data.password
                                            }
                                            whileHover={
                                                eraseForm.processing ||
                                                !eraseForm.data.password
                                                    ? undefined
                                                    : { scale: 1.02 }
                                            }
                                            whileTap={
                                                eraseForm.processing ||
                                                !eraseForm.data.password
                                                    ? undefined
                                                    : { scale: 0.98 }
                                            }
                                            className="relative flex-1 overflow-hidden rounded-lg border border-red-500/30 bg-gradient-to-br from-red-600 to-rose-500 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_0_18px_rgba(239,68,68,0.28),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all hover:border-red-400/50 hover:from-red-500 hover:to-rose-400 hover:shadow-[0_0_28px_rgba(239,68,68,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {!eraseForm.processing && (
                                                <motion.div
                                                    animate={{
                                                        x: ['-120%', '220%'],
                                                    }}
                                                    transition={{
                                                        duration: 2,
                                                        repeat: Infinity,
                                                        repeatDelay: 1,
                                                        ease: 'easeInOut',
                                                    }}
                                                    className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                                />
                                            )}
                                            <span className="relative flex items-center justify-center gap-2">
                                                {eraseForm.processing ? (
                                                    <>
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        Purging...
                                                    </>
                                                ) : (
                                                    `Erase ${eraseTarget} Transactions`
                                                )}
                                            </span>
                                        </motion.button>
                                    </div>
                                </form>
                            </div>

                            {/* Bottom accent */}
                            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-red-500/35 to-transparent" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Clear All Confirmation Modal */}
            <AnimatePresence>
                {clearAllDisplayStep && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{
                            backdropFilter: 'blur(4px)',
                            background: 'rgba(0,0,0,0.6)',
                        }}
                        onClick={closeClearAllModal}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: -16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: -10 }}
                            transition={{
                                type: 'spring',
                                stiffness: 400,
                                damping: 30,
                            }}
                            className="relative w-full max-w-md overflow-hidden rounded-2xl"
                            style={{
                                background:
                                    'linear-gradient(148deg, #0e1225, #090d1b)',
                                border: `1px solid ${clearAllDisplayStep === 'mother' ? 'rgba(239,68,68,0.35)' : 'rgba(245,158,11,0.35)'}`,
                                boxShadow:
                                    clearAllDisplayStep === 'mother'
                                        ? '0 0 0 1px rgba(239,68,68,0.08), 0 32px 80px rgba(0,0,0,0.85), 0 0 70px rgba(239,68,68,0.14)'
                                        : '0 0 0 1px rgba(245,158,11,0.08), 0 32px 80px rgba(0,0,0,0.85), 0 0 70px rgba(245,158,11,0.14)',
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Top scan accent */}
                            <div
                                className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent ${
                                    clearAllDisplayStep === 'mother'
                                        ? 'via-red-500/70'
                                        : 'via-amber-500/70'
                                }`}
                            />

                            {/* Title bar */}
                            <div
                                className="flex items-center justify-between px-4 py-2.5"
                                style={{
                                    background:
                                        clearAllDisplayStep === 'mother'
                                            ? 'linear-gradient(90deg, rgba(239,68,68,0.14), rgba(239,68,68,0.05))'
                                            : 'linear-gradient(90deg, rgba(245,158,11,0.14), rgba(245,158,11,0.05))',
                                    borderBottom: `1px solid ${clearAllDisplayStep === 'mother' ? 'rgba(239,68,68,0.18)' : 'rgba(245,158,11,0.18)'}`,
                                }}
                            >
                                <div className="flex items-center gap-2.5">
                                    {/* Traffic lights */}
                                    <div className="flex gap-1.5">
                                        <div
                                            className={`h-2.5 w-2.5 rounded-full ${clearAllDisplayStep === 'mother' ? 'bg-red-500' : 'bg-amber-500'}`}
                                            style={{
                                                boxShadow:
                                                    clearAllDisplayStep ===
                                                    'mother'
                                                        ? '0 0 6px rgba(239,68,68,0.7)'
                                                        : '0 0 6px rgba(245,158,11,0.7)',
                                            }}
                                        />
                                        <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/40" />
                                        <div className="h-2.5 w-2.5 rounded-full bg-green-500/25" />
                                    </div>
                                    <span
                                        className={`font-mono text-[9px] tracking-[0.25em] uppercase ${clearAllDisplayStep === 'mother' ? 'text-red-400/80' : 'text-amber-400/80'}`}
                                    >
                                        {clearAllDisplayStep === 'warning' &&
                                            '◈ Data Loss Warning'}
                                        {clearAllDisplayStep === 'admin' &&
                                            '◈ Identity Verification'}
                                        {clearAllDisplayStep === 'mother' &&
                                            '◈ Security Override'}
                                    </span>
                                </div>
                                <button
                                    onClick={closeClearAllModal}
                                    className={`flex h-5 w-5 items-center justify-center rounded border transition-all ${
                                        clearAllDisplayStep === 'mother'
                                            ? 'border-red-500/30 bg-red-500/10 text-red-400/60 hover:border-red-400/60 hover:bg-red-500/20 hover:text-red-300'
                                            : 'border-amber-500/30 bg-amber-500/10 text-amber-400/60 hover:border-amber-400/60 hover:bg-amber-500/20 hover:text-amber-300'
                                    }`}
                                >
                                    <X size={10} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="px-5 py-5">
                                {clearAllDisplayStep === 'warning' && (
                                    <>
                                        <div className="flex items-start gap-4">
                                            <div
                                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                                                style={{
                                                    background:
                                                        'rgba(245,158,11,0.1)',
                                                    border: '1px solid rgba(245,158,11,0.28)',
                                                    boxShadow:
                                                        '0 0 20px rgba(245,158,11,0.12)',
                                                }}
                                            >
                                                <motion.div
                                                    animate={{
                                                        scale: [1, 1.12, 1],
                                                    }}
                                                    transition={{
                                                        duration: 1.8,
                                                        repeat: Infinity,
                                                        ease: 'easeInOut',
                                                    }}
                                                >
                                                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                                                </motion.div>
                                            </div>

                                            <div className="flex-1">
                                                <p className="mb-1 font-mono text-[9px] tracking-[0.22em] text-amber-400/70 uppercase">
                                                    Cascading Deletion
                                                </p>
                                                <h3 className="text-sm font-semibold text-white">
                                                    Clear All Transactions
                                                </h3>
                                                <p className="mt-2 text-xs leading-relaxed text-white/55">
                                                    This will permanently delete{' '}
                                                    <span className="font-semibold text-white">
                                                        every transaction
                                                    </span>
                                                    , along with all linked
                                                    orders and tasks/workflows.
                                                    This cannot be undone.
                                                </p>
                                            </div>
                                        </div>

                                        <p className="mt-4 font-mono text-[10px] tracking-[0.15em] text-amber-400/60 uppercase">
                                            ◈ Requires double authentication to
                                            proceed
                                        </p>

                                        <div className="mt-5 flex gap-3">
                                            <button
                                                type="button"
                                                onClick={closeClearAllModal}
                                                className={cancelButtonClasses}
                                            >
                                                Cancel
                                            </button>
                                            <motion.button
                                                type="button"
                                                onClick={proceedToAdminPassword}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className={warningButtonClasses}
                                            >
                                                <motion.div
                                                    animate={{
                                                        x: ['-120%', '220%'],
                                                    }}
                                                    transition={{
                                                        duration: 2,
                                                        repeat: Infinity,
                                                        repeatDelay: 1,
                                                        ease: 'easeInOut',
                                                    }}
                                                    className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                                />
                                                <span className="relative">
                                                    Proceed Anyway
                                                </span>
                                            </motion.button>
                                        </div>
                                    </>
                                )}

                                {clearAllDisplayStep === 'admin' && (
                                    <>
                                        <div className="flex items-start gap-4">
                                            <div
                                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                                                style={{
                                                    background:
                                                        'rgba(245,158,11,0.1)',
                                                    border: '1px solid rgba(245,158,11,0.28)',
                                                    boxShadow:
                                                        '0 0 20px rgba(245,158,11,0.12)',
                                                }}
                                            >
                                                <motion.div
                                                    animate={{
                                                        scale: [1, 1.12, 1],
                                                    }}
                                                    transition={{
                                                        duration: 1.8,
                                                        repeat: Infinity,
                                                        ease: 'easeInOut',
                                                    }}
                                                >
                                                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                                                </motion.div>
                                            </div>

                                            <div className="flex-1">
                                                <p className="mb-1 font-mono text-[9px] tracking-[0.22em] text-amber-400/70 uppercase">
                                                    Layer 1 of 2
                                                </p>
                                                <h3 className="text-sm font-semibold text-white">
                                                    Verify Your Identity
                                                </h3>
                                                <p className="mt-2 text-xs leading-relaxed text-white/55">
                                                    Enter your own admin
                                                    password to continue.
                                                </p>
                                            </div>
                                        </div>

                                        <form
                                            onSubmit={proceedToMotherPassword}
                                            className="mt-5"
                                        >
                                            <label className="mb-2 block font-mono text-[10px] tracking-[0.22em] text-amber-400/70 uppercase">
                                                ◈ Admin Cipher Key
                                            </label>
                                            <div className="group relative">
                                                <input
                                                    type={
                                                        showAdminPassword
                                                            ? 'text'
                                                            : 'password'
                                                    }
                                                    value={
                                                        clearAllForm.data
                                                            .admin_password
                                                    }
                                                    onChange={(e) =>
                                                        clearAllForm.setData(
                                                            'admin_password',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Your admin password"
                                                    autoFocus
                                                    className="block w-full rounded-lg border border-white/8 bg-white/4 py-2.5 pr-11 pl-4 text-sm text-white placeholder-white/20 transition-all duration-300 outline-none focus:border-amber-500/50 focus:bg-amber-500/5"
                                                />
                                                <button
                                                    type="button"
                                                    tabIndex={-1}
                                                    onClick={() =>
                                                        setShowAdminPassword(
                                                            (p) => !p,
                                                        )
                                                    }
                                                    className="absolute top-1/2 right-3 -translate-y-1/2 text-white/25 transition-colors hover:text-amber-400"
                                                >
                                                    {showAdminPassword ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </button>
                                                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px w-0 bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-500 group-focus-within:w-full" />
                                            </div>

                                            {clearAllForm.errors
                                                .admin_password && (
                                                <p className="mt-2 font-mono text-[10px] tracking-[0.1em] text-red-400">
                                                    ◈{' '}
                                                    {
                                                        clearAllForm.errors
                                                            .admin_password
                                                    }
                                                </p>
                                            )}

                                            <div className="mt-5 flex gap-3">
                                                <button
                                                    type="button"
                                                    onClick={closeClearAllModal}
                                                    className={
                                                        cancelButtonClasses
                                                    }
                                                >
                                                    Abort
                                                </button>
                                                <motion.button
                                                    type="submit"
                                                    disabled={
                                                        !clearAllForm.data
                                                            .admin_password
                                                    }
                                                    whileHover={
                                                        !clearAllForm.data
                                                            .admin_password
                                                            ? undefined
                                                            : { scale: 1.02 }
                                                    }
                                                    whileTap={
                                                        !clearAllForm.data
                                                            .admin_password
                                                            ? undefined
                                                            : { scale: 0.98 }
                                                    }
                                                    className={
                                                        warningButtonClasses
                                                    }
                                                >
                                                    <motion.div
                                                        animate={{
                                                            x: [
                                                                '-120%',
                                                                '220%',
                                                            ],
                                                        }}
                                                        transition={{
                                                            duration: 2,
                                                            repeat: Infinity,
                                                            repeatDelay: 1,
                                                            ease: 'easeInOut',
                                                        }}
                                                        className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                                    />
                                                    <span className="relative">
                                                        Continue
                                                    </span>
                                                </motion.button>
                                            </div>
                                        </form>
                                    </>
                                )}

                                {clearAllDisplayStep === 'mother' && (
                                    <>
                                        <div className="flex items-start gap-4">
                                            <div
                                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                                                style={{
                                                    background:
                                                        'rgba(239,68,68,0.1)',
                                                    border: '1px solid rgba(239,68,68,0.28)',
                                                    boxShadow:
                                                        '0 0 20px rgba(239,68,68,0.12)',
                                                }}
                                            >
                                                <motion.div
                                                    animate={{
                                                        scale: [1, 1.12, 1],
                                                    }}
                                                    transition={{
                                                        duration: 1.8,
                                                        repeat: Infinity,
                                                        ease: 'easeInOut',
                                                    }}
                                                >
                                                    <AlertTriangle className="h-5 w-5 text-red-400" />
                                                </motion.div>
                                            </div>

                                            <div className="flex-1">
                                                <p className="mb-1 font-mono text-[9px] tracking-[0.22em] text-red-400/70 uppercase">
                                                    Layer 2 of 2 — Final
                                                </p>
                                                <h3 className="text-sm font-semibold text-white">
                                                    Clear All Transactions
                                                </h3>
                                                <p className="mt-2 text-xs leading-relaxed text-white/55">
                                                    Enter the mother admin
                                                    password to permanently wipe{' '}
                                                    <span className="font-semibold text-white">
                                                        all transactions
                                                    </span>
                                                    , linked orders, and tasks.
                                                </p>
                                            </div>
                                        </div>

                                        <form
                                            onSubmit={submitClearAll}
                                            className="mt-5"
                                        >
                                            <label className="mb-2 block font-mono text-[10px] tracking-[0.22em] text-red-400/70 uppercase">
                                                ◈ Master Cipher Key
                                            </label>
                                            <div className="group relative">
                                                <input
                                                    type={
                                                        showMotherPassword
                                                            ? 'text'
                                                            : 'password'
                                                    }
                                                    value={
                                                        clearAllForm.data
                                                            .mother_password
                                                    }
                                                    onChange={(e) =>
                                                        clearAllForm.setData(
                                                            'mother_password',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Mother admin password"
                                                    autoFocus
                                                    className="block w-full rounded-lg border border-white/8 bg-white/4 py-2.5 pr-11 pl-4 text-sm text-white placeholder-white/20 transition-all duration-300 outline-none focus:border-red-500/50 focus:bg-red-500/5"
                                                />
                                                <button
                                                    type="button"
                                                    tabIndex={-1}
                                                    onClick={() =>
                                                        setShowMotherPassword(
                                                            (p) => !p,
                                                        )
                                                    }
                                                    className="absolute top-1/2 right-3 -translate-y-1/2 text-white/25 transition-colors hover:text-red-400"
                                                >
                                                    {showMotherPassword ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </button>
                                                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px w-0 bg-gradient-to-r from-red-500 to-rose-400 transition-all duration-500 group-focus-within:w-full" />
                                            </div>

                                            {clearAllForm.errors
                                                .mother_password && (
                                                <p className="mt-2 font-mono text-[10px] tracking-[0.1em] text-red-400">
                                                    ◈{' '}
                                                    {
                                                        clearAllForm.errors
                                                            .mother_password
                                                    }
                                                </p>
                                            )}

                                            <div className="mt-5 flex gap-3">
                                                <button
                                                    type="button"
                                                    onClick={closeClearAllModal}
                                                    className={
                                                        cancelButtonClasses
                                                    }
                                                >
                                                    Abort
                                                </button>
                                                <motion.button
                                                    type="submit"
                                                    disabled={
                                                        clearAllForm.processing ||
                                                        !clearAllForm.data
                                                            .mother_password
                                                    }
                                                    whileHover={
                                                        clearAllForm.processing ||
                                                        !clearAllForm.data
                                                            .mother_password
                                                            ? undefined
                                                            : { scale: 1.02 }
                                                    }
                                                    whileTap={
                                                        clearAllForm.processing ||
                                                        !clearAllForm.data
                                                            .mother_password
                                                            ? undefined
                                                            : { scale: 0.98 }
                                                    }
                                                    className={
                                                        dangerButtonClasses
                                                    }
                                                >
                                                    {!clearAllForm.processing && (
                                                        <motion.div
                                                            animate={{
                                                                x: [
                                                                    '-120%',
                                                                    '220%',
                                                                ],
                                                            }}
                                                            transition={{
                                                                duration: 2,
                                                                repeat: Infinity,
                                                                repeatDelay: 1,
                                                                ease: 'easeInOut',
                                                            }}
                                                            className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                                        />
                                                    )}
                                                    <span className="relative flex items-center justify-center gap-2">
                                                        {clearAllForm.processing ? (
                                                            <>
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                Purging...
                                                            </>
                                                        ) : (
                                                            'Clear All Transactions'
                                                        )}
                                                    </span>
                                                </motion.button>
                                            </div>
                                        </form>
                                    </>
                                )}
                            </div>

                            {/* Bottom accent */}
                            <div
                                className={`absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent to-transparent ${
                                    clearAllDisplayStep === 'mother'
                                        ? 'via-red-500/35'
                                        : 'via-amber-500/35'
                                }`}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

TransactionIndex.layout = (page: ReactNode) => (
    <AdminLayout title="Transactions" fullWidth>
        {page}
    </AdminLayout>
);
