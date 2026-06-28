import type { SharedPageProps, User } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { m as motion } from 'framer-motion';
import {
    AlertCircle,
    ArrowRight,
    CheckCircle2,
    ChevronRight,
    Clock,
    CreditCard,
    FileText,
    Lock,
    Paperclip,
    QrCode,
    RefreshCw,
    Settings,
    Shield,
    Trash2,
    UploadCloud,
    X,
    Zap,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import amexIcon from '@/images/icons/amex.png';
import banglaqrIcon from '@/images/icons/banglaqr.png';
import bkashIcon from '@/images/icons/bkash.png';
import dinersclubIcon from '@/images/icons/dinersclub.png';
import mastercardIcon from '@/images/icons/mastercard.png';
import nagadIcon from '@/images/icons/nagad.png';
import rocketIcon from '@/images/icons/rocket.png';
import surecashIcon from '@/images/icons/surecash.png';
import unionpayIcon from '@/images/icons/unionpay.png';
import upayIcon from '@/images/icons/upay.png';
import visaIcon from '@/images/icons/visa.png';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CheckoutItem {
    service: string;
    plan: string;
    price: string;
    delivery: string;
    category: string;
    subcategory: string;
    subcategory_id: number;
    offer_token?: string;
    milestone_id?: number | null;
}

interface Props {
    item: CheckoutItem;
    sslEmbedScriptUrl: string;
}

type Currency = 'USD' | 'BDT';

interface GooglePayConfig {
    gateway: string;
    gatewayMerchantId: string;
    merchantId: string;
    merchantName: string;
    allowedAuthMethods: string;
    allowedCardNetworks: string;
    environment: 'TEST' | 'PRODUCTION';
}

interface UploadedFile {
    original_name: string;
    mime_type: string;
    size: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const REQUIRED_FIELDS: { key: keyof User; label: string }[] = [
    { key: 'name', label: 'Full Name' },
    { key: 'email', label: 'Email Address' },
    { key: 'phone_number', label: 'Phone Number' },
    { key: 'address', label: 'Address' },
    { key: 'country', label: 'Country' },
];

// How long to keep the "Pay Now" button disabled after the hidden
// SSLCommerz button is clicked. embed.min.js still has its own AJAX
// round-trip to /pay-via-ajax and a popup to open after that click —
// re-enabling the button before that finishes is exactly what let a second
// click queue up a second, fully independent transaction + popup.
const POPUP_OPEN_GRACE_MS = 2500;

const MAX_TOTAL_BYTES = 300 * 1024 * 1024;
const ACCEPT_TYPES =
    'image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm,video/mpeg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv';

// ─── Payment method data ──────────────────────────────────────────────────────

interface PaymentMethod {
    name: string;
    src: string;
}

const CARDS_INTERNATIONAL: PaymentMethod[] = [
    { name: 'Visa', src: visaIcon },
    { name: 'Mastercard', src: mastercardIcon },
    { name: 'Amex', src: amexIcon },
    { name: "Diner's Club", src: dinersclubIcon },
    { name: 'UnionPay', src: unionpayIcon },
];

const MOBILE_BANKING: PaymentMethod[] = [
    { name: 'bKash', src: bkashIcon },
    { name: 'Nagad', src: nagadIcon },
    { name: 'Rocket', src: rocketIcon },
    { name: 'Upay', src: upayIcon },
    { name: 'SureCash', src: surecashIcon },
];

// ─── Method Card ──────────────────────────────────────────────────────────────

function MethodCard({ method }: { method: PaymentMethod }) {
    return (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-zinc-100 bg-white p-3 text-center shadow-[0_2px_10px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,1)] dark:border-zinc-700/60 dark:bg-zinc-800/80 dark:shadow-[0_2px_10px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)] dark:hover:shadow-[0_6px_18px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)]">
            <img
                src={method.src}
                alt={method.name}
                className="h-7 w-auto max-w-[48px] object-contain"
                draggable={false}
            />
            <span className="text-[10px] font-semibold leading-tight text-zinc-500 dark:text-zinc-400">
                {method.name}
            </span>
        </div>
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Section divider inside the right column card ─────────────────────────────

function FlowDivider({ label }: { label: string }) {
    return (
        <div className="flex items-center gap-3 px-6 py-1">
            <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
            <span className="text-[9px] font-bold tracking-[0.18em] text-zinc-400 uppercase dark:text-zinc-600">
                {label}
            </span>
            <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Checkout({ item, sslEmbedScriptUrl }: Props) {
    const { auth } = usePage<SharedPageProps>().props;
    const [currency, setCurrency] = useState<Currency>('USD');
    const [bdtRate, setBdtRate] = useState<number | null>(null);
    const [rateLoading, setRateLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [missingFields, setMissingFields] = useState<string[]>([]);
    const sslBtnRef = useRef<HTMLButtonElement>(null);
    const sslScriptLoaded = useRef(false);

    const [gpayConfig, setGpayConfig] = useState<GooglePayConfig | null>(null);
    const [gpayScriptLoaded, setGpayScriptLoaded] = useState(false);
    const [gpayProcessing, setGpayProcessing] = useState(false);
    const [gpayError, setGpayError] = useState<string | null>(null);
    const gpayContainerRef = useRef<HTMLDivElement>(null);

    const [notes, setNotes] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [fileSizeError, setFileSizeError] = useState<string | null>(null);
    const [uploadToken, setUploadToken] = useState<string | null>(null);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getMissingFields = useCallback(
        () =>
            REQUIRED_FIELDS.filter(({ key }) => !auth.user?.[key]).map(
                ({ label }) => label,
            ),
        [auth.user],
    );

    function getCsrf(): string {
        return (
            document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
                ?.content ?? ''
        );
    }

    const usdAmount = parseFloat(item.price.replace(/[^0-9.]/g, ''));

    useEffect(() => {
        fetch('/checkout/exchange-rate')
            .then((r) => r.json())
            .then((data) => {
                if (data.rate) {
                    setBdtRate(data.rate);
                }
            })
            .catch(() => {})
            .finally(() => setRateLoading(false));
    }, []);

    const totalSelectedBytes = selectedFiles.reduce((s, f) => s + f.size, 0);

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const incoming = Array.from(e.target.files ?? []);

        if (!incoming.length) {
            return;
        }

        const combined = [...selectedFiles, ...incoming];
        const totalBytes = combined.reduce((s, f) => s + f.size, 0);

        setFileSizeError(
            totalBytes > MAX_TOTAL_BYTES
                ? `Total size (${formatBytes(totalBytes)}) exceeds the 300 MB limit.`
                : null,
        );
        setSelectedFiles(combined);
        setUploadToken(null);
        setUploadedFiles([]);
        setUploadError(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }

    function removeFile(index: number) {
        const next = selectedFiles.filter((_, i) => i !== index);

        setSelectedFiles(next);
        setUploadToken(null);
        setUploadedFiles([]);
        setUploadError(null);

        const totalBytes = next.reduce((s, f) => s + f.size, 0);

        setFileSizeError(
            totalBytes > MAX_TOTAL_BYTES
                ? `Total size (${formatBytes(totalBytes)}) exceeds the 300 MB limit.`
                : null,
        );
    }

    async function handleUpload() {
        if (!selectedFiles.length || fileSizeError) {
            return;
        }

        setIsUploading(true);
        setUploadError(null);

        const formData = new FormData();

        selectedFiles.forEach((f) => formData.append('files[]', f));

        try {
            const res = await fetch('/checkout/upload-attachments', {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': getCsrf(),
                },
                body: formData,
            });
            const data = await res.json();

            if (!res.ok) {
                setUploadError(
                    data.message ?? 'Upload failed. Please try again.',
                );
            } else {
                setUploadToken(data.upload_token);
                setUploadedFiles(data.files);
            }
        } catch {
            setUploadError(
                'Upload failed. Please check your connection and try again.',
            );
        } finally {
            setIsUploading(false);
        }
    }

    const handlePay = () => {
        if (isProcessing) {
            return;
        }

        const missing = getMissingFields();

        if (missing.length > 0) {
            setMissingFields(missing);

            return;
        }

        setIsProcessing(true);

        if (sslBtnRef.current) {
            (sslBtnRef.current as any).postdata = {
                currency,
                category_id: item.category,
                subcategory_id: item.subcategory_id,
                service: item.service,
                plan: item.plan,
                delivery: item.delivery,
                subcategory: item.subcategory,
                ...(item.offer_token ? { offer_token: item.offer_token } : {}),
                ...(item.milestone_id
                    ? { milestone_id: item.milestone_id }
                    : {}),
                ...(notes.trim() ? { notes: notes.trim() } : {}),
                ...(uploadToken ? { upload_token: uploadToken } : {}),
            };
        }

        const clickAndRelease = () => {
            sslBtnRef.current?.click();
            setTimeout(() => setIsProcessing(false), POPUP_OPEN_GRACE_MS);
        };

        if (sslScriptLoaded.current) {
            setTimeout(clickAndRelease, 100);
        } else {
            const script = document.createElement('script');

            script.src = `${sslEmbedScriptUrl}?${Math.random().toString(36).substring(7)}`;
            script.onload = () => {
                sslScriptLoaded.current = true;
                setTimeout(clickAndRelease, 300);
            };
            document.body.appendChild(script);
        }
    };

    // Google Pay button config has a 3-requests/day cap on SSLCommerz's end,
    // so the backend caches it — this just asks for whatever's cached/fresh.
    useEffect(() => {
        fetch('/gpay/config')
            .then((r) => r.json())
            .then((data) => {
                if (data.available) {
                    setGpayConfig(data.config);
                }
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (!gpayConfig) {
            return;
        }

        const script = document.createElement('script');

        script.src = 'https://pay.google.com/gp/p/js/pay.js';
        script.async = true;
        script.onload = () => setGpayScriptLoaded(true);
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, [gpayConfig]);

    function submitOtpForm(html: string) {
        const container = document.createElement('div');

        container.style.display = 'none';
        container.innerHTML = html;
        document.body.appendChild(container);
        container.querySelector('form')?.submit();
    }

    const handleGooglePayClick = useCallback(
        (paymentsClient: any, paymentDataRequest: any) => {
            const missing = getMissingFields();

            if (missing.length > 0) {
                setMissingFields(missing);

                return;
            }

            setGpayProcessing(true);
            setGpayError(null);

            paymentsClient
                .loadPaymentData(paymentDataRequest)
                .then((paymentData: any) => {
                    const token =
                        paymentData.paymentMethodData.tokenizationData.token;

                    return fetch('/gpay/charge', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                            'X-CSRF-TOKEN': getCsrf(),
                        },
                        body: JSON.stringify({
                            googlepay_token: token,
                            category_id: item.category,
                            subcategory_id: item.subcategory_id,
                            service: item.service,
                            plan: item.plan,
                            delivery: item.delivery,
                            subcategory: item.subcategory,
                            ...(item.offer_token
                                ? { offer_token: item.offer_token }
                                : {}),
                            ...(item.milestone_id
                                ? { milestone_id: item.milestone_id }
                                : {}),
                            ...(notes.trim() ? { notes: notes.trim() } : {}),
                            ...(uploadToken
                                ? { upload_token: uploadToken }
                                : {}),
                        }),
                    });
                })
                .then((res: Response) => res.json())
                .then((data: any) => {
                    if (data.status === 'success') {
                        if (data.type === 'otp' && data.html) {
                            submitOtpForm(data.html);
                        } else if (data.return_url) {
                            window.location.href = data.return_url;
                        } else {
                            setGpayError(
                                'Payment could not be completed. Please try again.',
                            );
                            setGpayProcessing(false);
                        }
                    } else {
                        setGpayError(
                            data.message ??
                                'Google Pay payment failed. Please try again.',
                        );
                        setGpayProcessing(false);
                    }
                })
                .catch((err: any) => {
                    if (err?.statusCode !== 'CANCELED') {
                        setGpayError(
                            'Something went wrong with Google Pay. Please try again.',
                        );
                    }

                    setGpayProcessing(false);
                });
        },
        [getMissingFields, item, notes, uploadToken],
    );

    useEffect(() => {
        if (
            !gpayScriptLoaded ||
            !gpayConfig ||
            bdtRate === null ||
            !gpayContainerRef.current
        ) {
            return;
        }

        const w = window as any;
        const paymentsClient = new w.google.payments.api.PaymentsClient({
            environment: gpayConfig.environment,
        });
        const paymentDataRequest = {
            apiVersion: 2,
            apiVersionMinor: 0,
            allowedPaymentMethods: [
                {
                    type: 'CARD',
                    parameters: {
                        allowedAuthMethods:
                            gpayConfig.allowedAuthMethods.split(','),
                        allowedCardNetworks:
                            gpayConfig.allowedCardNetworks.split(','),
                    },
                    tokenizationSpecification: {
                        type: 'PAYMENT_GATEWAY',
                        parameters: {
                            gateway: gpayConfig.gateway,
                            gatewayMerchantId: gpayConfig.gatewayMerchantId,
                        },
                    },
                },
            ],
            merchantInfo: {
                merchantId: gpayConfig.merchantId,
                merchantName: gpayConfig.merchantName,
            },
            transactionInfo: {
                totalPriceStatus: 'FINAL',
                totalPrice: (usdAmount * bdtRate).toFixed(2),
                currencyCode: 'BDT',
                countryCode: 'BD',
            },
        };
        const button = paymentsClient.createButton({
            buttonColor: 'black',
            buttonType: 'pay',
            onClick: () =>
                handleGooglePayClick(paymentsClient, paymentDataRequest),
        });
        const container = gpayContainerRef.current;

        container.innerHTML = '';
        container.appendChild(button);
    }, [gpayScriptLoaded, gpayConfig, bdtRate, usdAmount, handleGooglePayClick]);

    const displayPrice =
        currency === 'BDT' && bdtRate !== null
            ? `৳${(usdAmount * bdtRate).toLocaleString('en-BD', { maximumFractionDigits: 0 })}`
            : item.price;

    const hasUnuploadedFiles =
        selectedFiles.length > 0 && !uploadToken && !isUploading;
    const canPay = !fileSizeError && !isUploading && !hasUnuploadedFiles;

    const categoryLabel = item.category
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

    // ── shared 3D card class ──────────────────────────────────────────────────
    const card3d =
        'overflow-hidden rounded-[1.75rem] border border-zinc-200/70 bg-gradient-to-b from-white to-zinc-50/60 shadow-[0_20px_60px_rgba(0,0,0,0.12),0_8px_20px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,1)] dark:border-zinc-700/50 dark:from-zinc-900 dark:to-zinc-950 dark:shadow-[0_20px_60px_rgba(0,0,0,0.55),0_8px_20px_rgba(0,0,0,0.38),0_2px_6px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.07)]';

    return (
        <>
            <Head title="Checkout — Opticore" />

            <div className="relative min-h-screen pb-24">
                <div className="pointer-events-none absolute top-0 right-0 h-[700px] w-[700px] bg-radial from-cyan-500/6 to-transparent" />
                <div className="pointer-events-none absolute bottom-0 left-0 h-[700px] w-[700px] bg-radial from-violet-600/6 to-transparent" />

                <div className="relative mx-auto max-w-6xl px-4 pt-32">
                    {/* ── PAGE HEADER ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="mb-10"
                    >
                        <nav className="mb-5 flex items-center gap-1.5 text-xs text-theme-muted">
                            <Link
                                href="/hire-us"
                                className="transition-colors hover:text-theme"
                            >
                                Hire Us
                            </Link>
                            <ChevronRight className="h-3.5 w-3.5 opacity-40" />
                            <Link
                                href={`/hire-us/${item.category}`}
                                className="transition-colors hover:text-theme"
                            >
                                {categoryLabel}
                            </Link>
                            <ChevronRight className="h-3.5 w-3.5 opacity-40" />
                            <span className="font-semibold text-theme">
                                Checkout
                            </span>
                        </nav>
                        <div className="mb-2 text-xs font-bold tracking-[0.2em] text-cyan-500 uppercase">
                            Secure Checkout
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-theme">
                            Complete Your Order
                        </h1>
                        <p className="mt-2 text-sm text-theme-muted">
                            Logged in as{' '}
                            <span className="font-semibold text-theme">
                                {auth.user?.name}
                            </span>
                        </p>
                    </motion.div>

                    {/*
                        GRID — mobile DOM order determines stacking:
                          1. Order Details  (col 1 / row 1 on desktop)
                          2. Right column   (col 2 / rows 1-2 on desktop, sticky)
                          3. Payment Method (col 1 / row 2 on desktop)
                        This gives mobile order: Order Details → Your Order → Payment Method
                    */}
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_420px] lg:grid-rows-[auto_auto]">

                        {/* ════════════════════════════════════════
                            01  ORDER DETAILS  (col 1, row 1)
                        ════════════════════════════════════════ */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.5,
                                delay: 0.08,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            className="lg:col-start-1 lg:row-start-1"
                        >
                            <div className={card3d}>
                                <div className="flex items-center gap-4 border-b border-zinc-100/80 bg-gradient-to-r from-zinc-50/60 to-transparent px-8 py-5 dark:border-zinc-800/80 dark:from-zinc-800/30">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 text-xs font-black text-white shadow-[0_4px_14px_rgba(34,211,238,0.5),inset_0_1px_2px_rgba(255,255,255,0.4)]">
                                        01
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-theme">
                                            Order Details
                                        </h2>
                                        <p className="text-xs text-theme-muted">
                                            What you're purchasing
                                        </p>
                                    </div>
                                </div>

                                <div className="p-8">
                                    {/* Service identity */}
                                    <div className="mb-6">
                                        <div className="mb-1.5 text-[10px] font-bold tracking-[0.2em] text-cyan-500 uppercase">
                                            {categoryLabel}
                                        </div>
                                        <h3 className="text-2xl font-black tracking-tight text-theme">
                                            {item.service}
                                        </h3>
                                        {item.offer_token && (
                                            <span className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-violet-200/60 bg-violet-50 px-3 py-1 text-xs font-bold text-violet-600 dark:border-violet-800/60 dark:bg-violet-950/40 dark:text-violet-400">
                                                <FileText className="h-3.5 w-3.5" />
                                                Custom Offer
                                            </span>
                                        )}
                                    </div>

                                    {/* Plan + delivery chips */}
                                    <div className="mb-6 flex flex-wrap gap-3">
                                        <div className="flex items-center gap-3 rounded-2xl border border-cyan-200/60 bg-gradient-to-b from-cyan-50 to-cyan-50/40 px-5 py-3 shadow-[0_2px_8px_rgba(34,211,238,0.1),inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-cyan-800/50 dark:from-cyan-950/50 dark:to-cyan-950/20 dark:shadow-[0_2px_8px_rgba(34,211,238,0.08),inset_0_1px_0_rgba(255,255,255,0.04)]">
                                            <Zap className="h-4 w-4 text-cyan-500" />
                                            <div>
                                                <div className="text-[9px] font-bold tracking-widest text-cyan-400 uppercase">
                                                    Plan
                                                </div>
                                                <div className="text-sm font-black text-cyan-700 dark:text-cyan-300">
                                                    {item.plan}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 rounded-2xl border border-zinc-200/60 bg-gradient-to-b from-zinc-50 to-zinc-50/40 px-5 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-zinc-700/50 dark:from-zinc-800/50 dark:to-zinc-800/20 dark:shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.04)]">
                                            <Clock className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                                            <div>
                                                <div className="text-[9px] font-bold tracking-widest text-zinc-400 uppercase">
                                                    Delivery
                                                </div>
                                                <div className="text-sm font-black text-zinc-700 dark:text-zinc-200">
                                                    {item.delivery}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="my-6 border-t border-zinc-100 dark:border-zinc-800" />

                                    {/* What's included */}
                                    <div className="mb-6">
                                        <p className="mb-4 text-[10px] font-bold tracking-widest text-zinc-400 uppercase dark:text-zinc-500">
                                            What's Included
                                        </p>
                                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                                            {[
                                                `Professional delivery within ${item.delivery}`,
                                                `${item.plan} plan features & revision rounds`,
                                                'Source files & full commercial license',
                                                'Dedicated project support throughout',
                                                'Quality-assured final deliverables',
                                                'Satisfaction guarantee on every order',
                                            ].map((text) => (
                                                <div
                                                    key={text}
                                                    className="flex items-start gap-2.5 text-sm text-theme-muted"
                                                >
                                                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-500" />
                                                    {text}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Price row */}
                                    <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-zinc-50 to-zinc-100/50 px-5 py-4 shadow-[inset_0_1px_3px_rgba(0,0,0,0.05),inset_0_0_0_1px_rgba(0,0,0,0.04)] dark:from-zinc-800/50 dark:to-zinc-800/20 dark:shadow-[inset_0_1px_3px_rgba(0,0,0,0.2),inset_0_0_0_1px_rgba(255,255,255,0.03)]">
                                        <span className="text-sm text-theme-muted">
                                            Service Price
                                        </span>
                                        <span className="text-xl font-black text-theme">
                                            {item.price}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* ════════════════════════════════════════
                            RIGHT COLUMN  (col 2, rows 1-2, sticky)
                            DOM order 2 → appears between Order Details
                            and Payment Method on mobile
                        ════════════════════════════════════════ */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.5,
                                delay: 0.22,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            className="space-y-4 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-24 lg:self-start"
                        >
                            {/* ── UNIFIED CHECKOUT CARD ── */}
                            <div className={card3d}>
                                {/* ── A: YOUR ORDER ── */}
                                <div className="p-6 pb-5">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h2 className="text-base font-bold text-theme">
                                            Your Order
                                        </h2>
                                        <span className="rounded-lg bg-cyan-50 px-2.5 py-1 text-[10px] font-bold text-cyan-600 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.25)] dark:bg-cyan-950/40 dark:text-cyan-400">
                                            {item.plan} Plan
                                        </span>
                                    </div>

                                    {/* Service name */}
                                    <div className="mb-4 rounded-xl border border-zinc-100 bg-zinc-50/60 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800/40">
                                        <div className="text-[9px] font-bold tracking-widest text-zinc-400 uppercase dark:text-zinc-500">
                                            Service
                                        </div>
                                        <div className="mt-0.5 text-sm font-bold text-theme">
                                            {item.service}
                                        </div>
                                    </div>

                                    {/* Plan + delivery row */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="flex items-center gap-2 rounded-xl border border-cyan-100/70 bg-cyan-50/50 px-3 py-2.5 dark:border-cyan-900/50 dark:bg-cyan-950/30">
                                            <Zap className="h-3.5 w-3.5 shrink-0 text-cyan-500" />
                                            <div>
                                                <div className="text-[8px] font-bold tracking-widest text-cyan-400 uppercase">
                                                    Plan
                                                </div>
                                                <div className="text-xs font-black text-cyan-700 dark:text-cyan-300">
                                                    {item.plan}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50/60 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-800/40">
                                            <Clock className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                                            <div>
                                                <div className="text-[8px] font-bold tracking-widest text-zinc-400 uppercase">
                                                    Delivery
                                                </div>
                                                <div className="text-xs font-black text-zinc-700 dark:text-zinc-200">
                                                    {item.delivery}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ── B: PROJECT BRIEF ── */}
                                <FlowDivider label="Project Brief · Optional" />

                                <div className="px-6 py-4">
                                    {/* Notes */}
                                    <div className="mb-4">
                                        <label
                                            htmlFor="checkout-notes"
                                            className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-300"
                                        >
                                            <FileText className="h-3.5 w-3.5 text-violet-500" />
                                            Notes & Requirements
                                        </label>
                                        <textarea
                                            id="checkout-notes"
                                            value={notes}
                                            onChange={(e) =>
                                                setNotes(e.target.value)
                                            }
                                            rows={4}
                                            maxLength={5000}
                                            placeholder="Describe your vision, style preferences, references, or any specific requirements…"
                                            className="placeholder-theme-muted block w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50/60 px-3.5 py-3 text-xs text-zinc-800 transition-all outline-none focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-400/15 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-200 dark:focus:border-violet-600 dark:focus:bg-zinc-800"
                                        />
                                        {notes.length > 0 && (
                                            <p className="mt-1 text-right text-[10px] text-zinc-400">
                                                {notes.length} / 5000
                                            </p>
                                        )}
                                    </div>

                                    {/* File upload */}
                                    <div>
                                        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-300">
                                            <Paperclip className="h-3.5 w-3.5 text-violet-500" />
                                            Attachments
                                            <span className="ml-auto font-normal text-zinc-400">
                                                300 MB max
                                            </span>
                                        </label>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                fileInputRef.current?.click()
                                            }
                                            className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50/40 py-6 text-center transition-all hover:border-violet-400/50 hover:bg-violet-50/20 dark:border-zinc-700 dark:bg-zinc-800/20 dark:hover:border-violet-700/50 dark:hover:bg-violet-950/10"
                                        >
                                            <UploadCloud className="h-5 w-5 text-zinc-400 dark:text-zinc-600" />
                                            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                                                Click to browse files
                                            </span>
                                        </button>

                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            multiple
                                            accept={ACCEPT_TYPES}
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />

                                        {fileSizeError && (
                                            <p className="mt-2 flex items-center gap-1.5 text-xs text-red-500">
                                                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                                {fileSizeError}
                                            </p>
                                        )}

                                        {selectedFiles.length > 0 && (
                                            <ul className="mt-2 space-y-1.5">
                                                {selectedFiles.map(
                                                    (file, idx) => (
                                                        <li
                                                            key={idx}
                                                            className="flex items-center gap-2 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50"
                                                        >
                                                            <Paperclip className="h-3 w-3 shrink-0 text-violet-400" />
                                                            <span className="flex-1 truncate text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                                                                {file.name}
                                                            </span>
                                                            <span className="shrink-0 text-[10px] text-zinc-400">
                                                                {formatBytes(
                                                                    file.size,
                                                                )}
                                                            </span>
                                                            {!uploadToken && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        removeFile(
                                                                            idx,
                                                                        )
                                                                    }
                                                                    className="shrink-0 text-zinc-400 transition-colors hover:text-red-500"
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </button>
                                                            )}
                                                        </li>
                                                    ),
                                                )}
                                            </ul>
                                        )}

                                        {selectedFiles.length > 0 && (
                                            <p className="mt-1 text-right text-[10px] text-zinc-400">
                                                {formatBytes(
                                                    totalSelectedBytes,
                                                )}{' '}
                                                / 300 MB
                                            </p>
                                        )}

                                        {selectedFiles.length > 0 &&
                                            !fileSizeError && (
                                                <div className="mt-2">
                                                    {uploadToken ? (
                                                        <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                                            <Shield className="h-3.5 w-3.5" />
                                                            {
                                                                uploadedFiles.length
                                                            }{' '}
                                                            file
                                                            {uploadedFiles.length !==
                                                            1
                                                                ? 's'
                                                                : ''}{' '}
                                                            uploaded and ready
                                                        </p>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={
                                                                handleUpload
                                                            }
                                                            disabled={
                                                                isUploading
                                                            }
                                                            className="flex items-center gap-1.5 rounded-lg border border-violet-300/50 bg-violet-50/70 px-3.5 py-2 text-xs font-bold text-violet-600 transition-colors hover:bg-violet-100/80 disabled:opacity-60 dark:border-violet-700/40 dark:bg-violet-950/30 dark:text-violet-400"
                                                        >
                                                            {isUploading ? (
                                                                <>
                                                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                                                    Uploading…
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <UploadCloud className="h-3.5 w-3.5" />
                                                                    Upload
                                                                    before
                                                                    paying
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                    {uploadError && (
                                                        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-500">
                                                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                                            {uploadError}
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                        {hasUnuploadedFiles && (
                                            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                                                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                                Upload your files before paying.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* ── C: PAYMENT ── */}
                                <FlowDivider label="Complete Payment" />

                                <div className="p-6 pt-4">
                                    {/* Currency + total */}
                                    <div className="mb-4 flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                                Total Due
                                            </p>
                                            {rateLoading &&
                                            currency === 'BDT' ? (
                                                <div className="mt-1 flex items-center gap-2 text-sm text-zinc-400">
                                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                                    Fetching rate…
                                                </div>
                                            ) : (
                                                <div>
                                                    <span className="text-3xl font-black text-theme">
                                                        {displayPrice}
                                                    </span>
                                                    {currency === 'BDT' &&
                                                        bdtRate !== null && (
                                                            <>
                                                                <p className="text-[10px] text-zinc-400">
                                                                    1 USD = ৳
                                                                    {bdtRate.toFixed(
                                                                        2,
                                                                    )}
                                                                </p>
                                                                <p className="mt-1 max-w-[160px] text-[10px] leading-relaxed text-zinc-400/70 dark:text-zinc-500">
                                                                    Indicative
                                                                    rate only.
                                                                    The final
                                                                    amount
                                                                    charged will
                                                                    reflect
                                                                    SSLCommerz's
                                                                    exchange
                                                                    rate at the
                                                                    time of
                                                                    payment.
                                                                </p>
                                                            </>
                                                        )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 rounded-xl bg-zinc-100 p-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] dark:bg-zinc-800">
                                            {(
                                                ['USD', 'BDT'] as Currency[]
                                            ).map((c) => (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    onClick={() =>
                                                        setCurrency(c)
                                                    }
                                                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                                                        currency === c
                                                            ? 'bg-white text-zinc-900 shadow-[0_1px_4px_rgba(0,0,0,0.1)] dark:bg-zinc-700 dark:text-white'
                                                            : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                                                    }`}
                                                >
                                                    {c}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Pay Now */}
                                    <button
                                        type="button"
                                        onClick={handlePay}
                                        disabled={isProcessing || !canPay}
                                        className="neo-btn-accent group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl py-4 text-sm font-black tracking-widest uppercase transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
                                    >
                                        {isProcessing ? (
                                            <span className="drop-icon flex items-center gap-2">
                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                                Opening payment…
                                            </span>
                                        ) : (
                                            <span className="drop-icon flex items-center gap-2">
                                                Pay Now
                                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                            </span>
                                        )}
                                    </button>

                                    {/* Hidden SSLCommerz trigger */}
                                    <button
                                        ref={sslBtnRef}
                                        id="sslczPayBtn"
                                        type="button"
                                        className="hidden"
                                        aria-hidden="true"
                                        {...({
                                            endpoint: '/pay-via-ajax',
                                            order: 'init',
                                        } as Record<string, string>)}
                                    />

                                    {/* Google Pay */}
                                    {gpayConfig && (
                                        <div className="mt-4">
                                            <div className="mb-3 flex items-center gap-3">
                                                <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
                                                <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase dark:text-zinc-600">
                                                    Or pay with
                                                </span>
                                                <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
                                            </div>
                                            <div
                                                ref={gpayContainerRef}
                                                className={
                                                    gpayProcessing || !canPay
                                                        ? 'pointer-events-none opacity-60'
                                                        : ''
                                                }
                                            />
                                            {gpayError && (
                                                <p className="mt-2 flex items-center gap-1.5 text-xs text-red-500">
                                                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                                    {gpayError}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Security note */}
                                    <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 dark:text-zinc-500">
                                        <Lock className="h-3 w-3" />
                                        Payment held securely · released on
                                        delivery
                                    </div>
                                </div>
                            </div>

                            {/* ── GUARANTEE CARD ── */}
                            <div className="rounded-[1.75rem] border border-cyan-100/60 bg-gradient-to-b from-cyan-50 to-white p-5 shadow-[0_8px_24px_rgba(34,211,238,0.08),0_2px_8px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(34,211,238,0.2),inset_0_2px_4px_rgba(255,255,255,0.9)] dark:border-cyan-900/40 dark:from-cyan-950/40 dark:to-zinc-900 dark:shadow-[0_8px_24px_rgba(34,211,238,0.04),0_2px_8px_rgba(0,0,0,0.25),inset_0_0_0_1px_rgba(34,211,238,0.15),inset_0_1px_2px_rgba(255,255,255,0.06)]">
                                <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-cyan-600 dark:text-cyan-400">
                                    <Shield className="h-4 w-4 drop-shadow-[0_1px_2px_rgba(34,211,238,0.4)]" />
                                    Secure Purchase Guarantee
                                </h4>
                                <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                                    Payment is held in escrow and only released
                                    when you approve the final delivery. Full
                                    refund if we can't deliver.
                                </p>
                            </div>

                            {/* ── SUPPORT ── */}
                            <div className="rounded-[1.75rem] border border-zinc-100 bg-zinc-50/60 p-5 shadow-[0_4px_12px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,1)] dark:border-zinc-800 dark:bg-zinc-900/40 dark:shadow-[0_4px_12px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.04)]">
                                <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                                    Questions about your order?
                                </p>
                                <p className="mt-1 text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500">
                                    Our team is available 24/7. Open the chat
                                    widget or reach us via your dashboard.
                                </p>
                            </div>
                        </motion.div>

                        {/* ════════════════════════════════════════
                            02  PAYMENT METHOD  (col 1, row 2)
                            DOM order 3 → appears after Your Order on mobile
                        ════════════════════════════════════════ */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.5,
                                delay: 0.16,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            className="lg:col-start-1 lg:row-start-2"
                        >
                            <div className={card3d}>
                                <div className="flex items-center gap-4 border-b border-zinc-100/80 bg-gradient-to-r from-zinc-50/60 to-transparent px-8 py-5 dark:border-zinc-800/80 dark:from-zinc-800/30">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-xs font-black text-white shadow-[0_4px_14px_rgba(16,185,129,0.5),inset_0_1px_2px_rgba(255,255,255,0.4)]">
                                        02
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-theme">
                                            Payment Method
                                        </h2>
                                        <p className="text-xs text-theme-muted">
                                            All options available via SSLCommerz
                                        </p>
                                    </div>
                                    <div className="ml-auto flex items-center gap-1.5 text-xs text-theme-muted">
                                        <Lock className="h-3.5 w-3.5 text-cyan-500" />
                                        SSL Secured
                                    </div>
                                </div>

                                <div className="p-8">
                                    {/* SSLCommerz selected indicator */}
                                    <div className="mb-7 flex items-center gap-4 rounded-2xl bg-gradient-to-b from-cyan-50/60 to-white p-4 shadow-[0_0_28px_rgba(34,211,238,0.18),0_6px_20px_rgba(0,0,0,0.08),inset_0_0_0_1px_rgba(34,211,238,0.4),inset_0_2px_4px_rgba(255,255,255,0.9)] dark:from-cyan-950/30 dark:to-zinc-900 dark:shadow-[0_0_28px_rgba(34,211,238,0.12),0_6px_20px_rgba(0,0,0,0.45),inset_0_0_0_1px_rgba(34,211,238,0.35),inset_0_1px_2px_rgba(255,255,255,0.1)]">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)] dark:bg-cyan-500/20">
                                            <CreditCard className="h-5 w-5 text-cyan-500" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-bold text-zinc-900 dark:text-white">
                                                SSLCommerz Gateway
                                            </div>
                                            <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                                Bangladesh's most trusted
                                                payment gateway · PCI-DSS
                                                compliant
                                            </div>
                                        </div>
                                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-[0_2px_8px_rgba(34,211,238,0.4),inset_0_1px_2px_rgba(255,255,255,0.4)]">
                                            <div className="h-2 w-2 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)]" />
                                        </div>
                                    </div>

                                    {/* ── CARDS & INTERNATIONAL ── */}
                                    <div className="mb-6">
                                        <div className="mb-3 flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]" />
                                            <p className="text-[10px] font-bold tracking-widest text-blue-500 uppercase">
                                                Cards & International
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                                            {CARDS_INTERNATIONAL.map((m) => (
                                                <MethodCard
                                                    key={m.name}
                                                    method={m}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* ── MOBILE BANKING ── */}
                                    <div className="mb-6">
                                        <div className="mb-3 flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-violet-500 shadow-[0_0_6px_rgba(124,58,237,0.6)]" />
                                            <p className="text-[10px] font-bold tracking-widest text-violet-500 uppercase">
                                                Mobile Banking
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                                            {MOBILE_BANKING.map((m) => (
                                                <MethodCard
                                                    key={m.name}
                                                    method={m}
                                                />
                                            ))}
                                            <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-violet-200 bg-violet-50/40 p-3 text-center dark:border-violet-800/40 dark:bg-violet-950/20">
                                                <span className="text-[11px] font-bold leading-tight text-violet-400 dark:text-violet-500">
                                                    & more
                                                </span>
                                                <span className="text-[9px] leading-tight text-violet-300 dark:text-violet-600">
                                                    via SSLCommerz
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── QR PAYMENTS ── */}
                                    <div className="mb-6">
                                        <div className="mb-3 flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
                                            <p className="text-[10px] font-bold tracking-widest text-amber-500 uppercase">
                                                QR Payments
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                                            <MethodCard
                                                method={{
                                                    name: 'Bangla QR',
                                                    src: banglaqrIcon,
                                                }}
                                            />
                                        </div>

                                        {/* Bangla QR callout */}
                                        <div className="mt-3 rounded-xl border border-amber-100 bg-gradient-to-r from-amber-50/80 to-amber-50/20 p-4 dark:border-amber-900/40 dark:from-amber-950/30 dark:to-transparent">
                                            <div className="flex gap-3">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
                                                    <QrCode className="h-4 w-4 text-amber-500" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                                                        About Bangla QR
                                                    </p>
                                                    <p className="mt-0.5 text-[11px] leading-relaxed text-amber-600/80 dark:text-amber-500/80">
                                                        Bangla QR is Bangladesh
                                                        Bank's national
                                                        interoperable QR
                                                        standard. Scan with any
                                                        participating bank app
                                                        or MFS — no card or
                                                        account number required.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Security trust strip */}
                                    <div className="grid grid-cols-3 gap-2 border-t border-zinc-100 pt-5 dark:border-zinc-800">
                                        {(
                                            [
                                                {
                                                    label: 'SSL Encrypted',
                                                    icon: Lock,
                                                },
                                                {
                                                    label: 'PCI-DSS Compliant',
                                                    icon: Shield,
                                                },
                                                {
                                                    label: '11+ Methods',
                                                    icon: CreditCard,
                                                },
                                            ] as const
                                        ).map(({ label, icon: Icon }) => (
                                            <div
                                                key={label}
                                                className="flex flex-col items-center gap-1.5 rounded-xl bg-white p-3 text-center shadow-[0_2px_8px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,1),inset_0_0_0_1px_rgba(0,0,0,0.04)] dark:bg-zinc-800/60 dark:shadow-[0_2px_8px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.05),inset_0_0_0_1px_rgba(255,255,255,0.04)]"
                                            >
                                                <Icon className="h-4 w-4 text-cyan-500" />
                                                <span className="text-[10px] font-semibold leading-tight text-zinc-500 dark:text-zinc-400">
                                                    {label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* ── MISSING PROFILE FIELDS MODAL ── */}
            {missingFields.length > 0 && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{
                            duration: 0.3,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        className="neo-panel-elevated relative w-full max-w-md rounded-3xl p-8"
                    >
                        <button
                            type="button"
                            onClick={() => setMissingFields([])}
                            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.2)]">
                            <AlertCircle className="h-6 w-6 text-amber-500" />
                        </div>

                        <h3 className="text-lg font-black tracking-tight text-theme">
                            Complete Your Profile First
                        </h3>
                        <p className="mt-2 text-sm text-theme-muted">
                            The following details are required for SSLCommerz to
                            process your payment securely:
                        </p>

                        <ul className="mt-4 space-y-2">
                            {missingFields.map((field) => (
                                <li
                                    key={field}
                                    className="flex items-center gap-2.5 rounded-xl bg-amber-50/60 px-3 py-2 text-sm font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                                >
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                                    {field}
                                </li>
                            ))}
                        </ul>

                        <p className="mt-5 text-xs text-theme-muted">
                            Head to{' '}
                            <span className="font-semibold text-theme">
                                Account Settings
                            </span>{' '}
                            in your profile to fill in the missing information,
                            then return here to complete your payment.
                        </p>

                        <Link
                            href="/profile?tab=settings"
                            className="neo-btn-accent mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-black tracking-widest uppercase transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Settings className="h-4 w-4" />
                            Go to Account Settings
                        </Link>
                    </motion.div>
                </div>
            )}
        </>
    );
}
