import type { SharedPageProps, User } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { m as motion } from 'framer-motion';
import {
    AlertCircle,
    ArrowRight,
    Clock,
    CreditCard,
    FileText,
    Lock,
    Paperclip,
    RefreshCw,
    Settings,
    Shield,
    Trash2,
    UploadCloud,
    X,
    Zap,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

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

const MAX_TOTAL_BYTES = 300 * 1024 * 1024; // 300 MB
const ACCEPT_TYPES =
    'image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm,video/mpeg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv';

function formatBytes(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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

    // Notes and file upload state
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

        if (totalBytes > MAX_TOTAL_BYTES) {
            setFileSizeError(
                `Total size (${formatBytes(totalBytes)}) exceeds the 300 MB limit.`,
            );
        } else {
            setFileSizeError(null);
        }

        setSelectedFiles(combined);
        // Reset upload state whenever the selection changes
        setUploadToken(null);
        setUploadedFiles([]);
        setUploadError(null);

        // Clear the input so the same file can be re-selected after removal
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
        // Guards against any re-entrant call while a previous attempt's
        // delayed click is still pending — belt-and-suspenders alongside
        // the visible button's `disabled` state below.
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
    }, [
        gpayScriptLoaded,
        gpayConfig,
        bdtRate,
        usdAmount,
        handleGooglePayClick,
    ]);

    const displayPrice =
        currency === 'BDT' && bdtRate !== null
            ? `৳${(usdAmount * bdtRate).toLocaleString('en-BD', { maximumFractionDigits: 0 })}`
            : item.price;

    const hasUnuploadedFiles =
        selectedFiles.length > 0 && !uploadToken && !isUploading;
    const canPay = !fileSizeError && !isUploading && !hasUnuploadedFiles;

    return (
        <>
            <Head title="Checkout — Opticore" />

            <div className="relative min-h-screen pb-24">
                <div className="pointer-events-none absolute top-0 right-0 h-[600px] w-[600px] bg-radial from-cyan-500/5 to-transparent" />
                <div className="pointer-events-none absolute bottom-0 left-0 h-[600px] w-[600px] bg-radial from-violet-600/5 to-transparent" />

                <div className="relative mx-auto max-w-4xl px-4 pt-32">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="mb-10"
                    >
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

                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
                        {/* Left column: payment method + optional brief */}
                        <div className="space-y-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.5,
                                    delay: 0.1,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                            >
                                <div className="neo-panel-elevated p-8">
                                    <h2 className="drop-icon-subtle dark:drop-icon-md mb-6 text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                                        Payment Method
                                    </h2>

                                    {/* SSLCommerz — always selected */}
                                    <div className="flex w-full items-center gap-4 rounded-2xl bg-gradient-to-b from-cyan-50/50 to-white p-5 shadow-[0_0_32px_rgba(34,211,238,0.2),0_8px_24px_rgba(0,0,0,0.1),inset_0_0_0_1px_rgba(34,211,238,0.4),inset_0_2px_4px_rgba(255,255,255,0.8)] dark:from-cyan-950/30 dark:to-zinc-900 dark:shadow-[0_0_32px_rgba(34,211,238,0.15),0_8px_24px_rgba(0,0,0,0.5),inset_0_0_0_1px_rgba(34,211,238,0.4),inset_0_1px_2px_rgba(255,255,255,0.15)]">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] dark:bg-cyan-500/20 dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]">
                                            <CreditCard className="drop-icon-sm h-5 w-5 text-cyan-500" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-zinc-900 dark:text-white">
                                                    SSLCommerz
                                                </span>
                                                <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-cyan-600 dark:bg-cyan-900/50 dark:text-cyan-400">
                                                    Coming Soon
                                                </span>
                                            </div>
                                            <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                                Bangladesh's leading secure
                                                payment gateway
                                            </div>
                                        </div>
                                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-[0_2px_8px_rgba(34,211,238,0.4),inset_0_1px_2px_rgba(255,255,255,0.4)] dark:from-cyan-500 dark:to-cyan-700 dark:shadow-[0_2px_8px_rgba(34,211,238,0.3),inset_0_1px_1px_rgba(255,255,255,0.2)]">
                                            <div className="h-2 w-2 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)]" />
                                        </div>
                                    </div>

                                    {/* SSLCommerz info */}
                                    <div className="mt-5 rounded-2xl border border-zinc-100 bg-zinc-50/80 p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
                                        <div className="mb-3 flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-cyan-500" />
                                            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                                About SSLCommerz
                                            </span>
                                        </div>
                                        <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                                            SSLCommerz is Bangladesh's largest
                                            and most trusted payment gateway,
                                            processing transactions for
                                            thousands of merchants. It supports{' '}
                                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                                                bKash, Nagad, Rocket, Visa,
                                                Mastercard, DBBL Nexus, and 20+
                                                more
                                            </span>{' '}
                                            payment options — all under a
                                            single, PCI-DSS compliant,
                                            SSL-encrypted checkout.
                                        </p>
                                        <div className="mt-4 grid grid-cols-3 gap-2">
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
                                                        label: '20+ Methods',
                                                        icon: CreditCard,
                                                    },
                                                ] as const
                                            ).map(({ label, icon: Icon }) => (
                                                <div
                                                    key={label}
                                                    className="flex flex-col items-center gap-1.5 rounded-xl bg-white p-3 text-center shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05),0_2px_8px_rgba(0,0,0,0.04)] dark:bg-zinc-800 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
                                                >
                                                    <Icon className="h-4 w-4 text-cyan-500" />
                                                    <span className="text-[10px] leading-tight font-semibold text-zinc-600 dark:text-zinc-300">
                                                        {label}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <p className="mt-5 flex items-center gap-2 text-xs text-theme-subtle">
                                        <Lock className="h-3.5 w-3.5" />{' '}
                                        SSLCommerz integration coming soon —
                                        your order will be confirmed shortly.
                                    </p>
                                </div>
                            </motion.div>

                            {/* Project Brief — optional */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.5,
                                    delay: 0.18,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                            >
                                <div className="neo-panel-elevated p-8">
                                    <h2 className="drop-icon-subtle dark:drop-icon-md mb-1.5 text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                                        Project Brief{' '}
                                        <span className="text-sm font-normal text-zinc-400 dark:text-zinc-500">
                                            (optional)
                                        </span>
                                    </h2>
                                    <p className="mb-6 text-xs text-zinc-500 dark:text-zinc-400">
                                        Share any details, references, or files
                                        that will help us understand your
                                        requirements. These are attached to your
                                        workflow after payment.
                                    </p>

                                    {/* Notes */}
                                    <div className="mb-6">
                                        <label
                                            htmlFor="checkout-notes"
                                            className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300"
                                        >
                                            <FileText className="h-3.5 w-3.5 text-cyan-500" />
                                            Notes
                                        </label>
                                        <textarea
                                            id="checkout-notes"
                                            value={notes}
                                            onChange={(e) =>
                                                setNotes(e.target.value)
                                            }
                                            rows={4}
                                            maxLength={5000}
                                            placeholder="Describe your project, desired style, target audience, color preferences, references…"
                                            className="block w-full resize-y rounded-2xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm text-zinc-800 placeholder-zinc-400 transition-all outline-none focus:border-cyan-400 focus:bg-white focus:ring-2 focus:ring-cyan-400/20 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-200 dark:placeholder-zinc-600 dark:focus:border-cyan-600 dark:focus:bg-zinc-900"
                                        />
                                        {notes.length > 0 && (
                                            <p className="mt-1 text-right text-[10px] text-zinc-400">
                                                {notes.length}/5000
                                            </p>
                                        )}
                                    </div>

                                    {/* File upload */}
                                    <div>
                                        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                            <Paperclip className="h-3.5 w-3.5 text-cyan-500" />
                                            Attachments
                                            <span className="ml-auto font-normal text-zinc-400 dark:text-zinc-500">
                                                Max 300 MB total · up to 10
                                                files
                                            </span>
                                        </label>

                                        {/* Drop zone */}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                fileInputRef.current?.click()
                                            }
                                            className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 py-8 text-center transition-colors hover:border-cyan-400/60 hover:bg-cyan-50/30 dark:border-zinc-800 dark:bg-zinc-900/30 dark:hover:border-cyan-700/60 dark:hover:bg-cyan-950/20"
                                        >
                                            <UploadCloud className="h-7 w-7 text-zinc-400 dark:text-zinc-600" />
                                            <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                                                Click to choose files
                                            </span>
                                            <span className="text-xs text-zinc-400 dark:text-zinc-600">
                                                Images, videos, PDFs, Word,
                                                Excel, PowerPoint, text files
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

                                        {/* Size error */}
                                        {fileSizeError && (
                                            <p className="mt-2 flex items-center gap-1.5 text-xs text-red-500">
                                                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                                {fileSizeError}
                                            </p>
                                        )}

                                        {/* File list */}
                                        {selectedFiles.length > 0 && (
                                            <ul className="mt-3 space-y-1.5">
                                                {selectedFiles.map(
                                                    (file, idx) => (
                                                        <li
                                                            key={idx}
                                                            className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/60"
                                                        >
                                                            <Paperclip className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                                                            <span className="flex-1 truncate text-xs text-zinc-700 dark:text-zinc-300">
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
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </button>
                                                            )}
                                                        </li>
                                                    ),
                                                )}
                                            </ul>
                                        )}

                                        {/* Total size summary */}
                                        {selectedFiles.length > 0 && (
                                            <p className="mt-1.5 text-right text-[10px] text-zinc-400">
                                                Total:{' '}
                                                {formatBytes(
                                                    totalSelectedBytes,
                                                )}
                                                {' / 300 MB'}
                                            </p>
                                        )}

                                        {/* Upload / status */}
                                        {selectedFiles.length > 0 &&
                                            !fileSizeError && (
                                                <div className="mt-3">
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
                                                            className="flex items-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-50/60 px-4 py-2 text-xs font-bold text-cyan-600 transition-colors hover:bg-cyan-100/80 disabled:opacity-60 dark:border-cyan-700/40 dark:bg-cyan-950/30 dark:text-cyan-400 dark:hover:bg-cyan-950/60"
                                                        >
                                                            {isUploading ? (
                                                                <>
                                                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                                                    Uploading…
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <UploadCloud className="h-3.5 w-3.5" />
                                                                    Upload files
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

                                        {/* Warn if files selected but not yet uploaded */}
                                        {hasUnuploadedFiles && (
                                            <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                                                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                                Please upload your files before
                                                proceeding to payment.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Order Summary */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.5,
                                delay: 0.2,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            className="space-y-4"
                        >
                            <div className="neo-panel-elevated p-6">
                                <h2 className="drop-icon-subtle dark:drop-icon-md mb-5 text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                                    Order Summary
                                </h2>

                                <div className="space-y-4 border-b border-zinc-200 pb-5 dark:border-zinc-800">
                                    <div>
                                        <div className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase dark:text-zinc-500">
                                            Service
                                        </div>
                                        <div className="drop-icon-sm mt-1 text-sm font-bold text-zinc-900 dark:text-white">
                                            {item.service}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase dark:text-zinc-500">
                                                Plan
                                            </div>
                                            <div className="mt-1 flex items-center gap-1.5 rounded-xl bg-cyan-50/50 px-3 py-1.5 text-sm font-bold text-cyan-600 shadow-[inset_0_1px_1px_rgba(255,255,255,1),inset_0_0_0_1px_rgba(34,211,238,0.2)] dark:bg-cyan-950/30 dark:text-cyan-400 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),inset_0_0_0_1px_rgba(34,211,238,0.2)]">
                                                <Zap className="h-3.5 w-3.5" />
                                                {item.plan}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase dark:text-zinc-500">
                                                Delivery
                                            </div>
                                            <div className="mt-1 flex items-center gap-1.5 rounded-xl bg-zinc-100 px-3 py-1.5 text-sm font-bold text-zinc-600 shadow-[inset_0_1px_1px_rgba(255,255,255,1),inset_0_0_0_1px_rgba(0,0,0,0.05)] dark:bg-zinc-800/50 dark:text-zinc-300 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),inset_0_0_0_1px_rgba(255,255,255,0.05)]">
                                                <Clock className="h-3.5 w-3.5" />
                                                {item.delivery}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Total + currency switcher */}
                                <div className="pt-5">
                                    <div className="mb-3 flex items-center justify-between">
                                        <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
                                            Total
                                        </span>
                                        <div className="flex items-center gap-1 rounded-xl bg-zinc-100 p-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)] dark:bg-zinc-800">
                                            {(['USD', 'BDT'] as Currency[]).map(
                                                (c) => (
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
                                                ),
                                            )}
                                        </div>
                                    </div>

                                    {rateLoading && currency === 'BDT' ? (
                                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                            Fetching rate…
                                        </div>
                                    ) : (
                                        <span className="drop-icon-subtle dark:drop-icon-md text-2xl font-black text-zinc-900 dark:text-white">
                                            {displayPrice}
                                        </span>
                                    )}
                                </div>

                                {/* Visible Pay Now button */}
                                <button
                                    type="button"
                                    onClick={handlePay}
                                    disabled={isProcessing || !canPay}
                                    className="neo-btn-accent group relative mt-6 flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl py-4 text-sm font-black tracking-widest uppercase transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
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

                                {/* Hidden SSLCommerz trigger — attributes required by embed.min.js */}
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

                                {/* Google Pay — only renders once SSLCommerz confirms it's enabled for this store */}
                                {gpayConfig && (
                                    <div className="mt-4">
                                        <div className="mb-3 flex items-center gap-3">
                                            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                                            <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase dark:text-zinc-500">
                                                Or
                                            </span>
                                            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
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
                            </div>

                            <div className="rounded-[2rem] border border-cyan-100/50 bg-gradient-to-b from-cyan-50 to-white p-5 shadow-[0_4px_12px_rgba(34,211,238,0.1),inset_0_0_0_1px_rgba(34,211,238,0.2),inset_0_2px_4px_rgba(255,255,255,0.8)] dark:border-cyan-900/50 dark:from-cyan-950/40 dark:to-zinc-900 dark:shadow-[0_4px_12px_rgba(34,211,238,0.05),inset_0_0_0_1px_rgba(34,211,238,0.2),inset_0_1px_2px_rgba(255,255,255,0.1)]">
                                <h4 className="mb-1.5 flex items-center gap-2 text-sm font-bold text-cyan-600 dark:text-cyan-400">
                                    <Shield className="h-4 w-4 drop-shadow-[0_1px_1px_rgba(34,211,238,0.3)]" />{' '}
                                    Secure Purchase
                                </h4>
                                <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                                    Your payment is held securely and released
                                    only when you're satisfied with the final
                                    delivery.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Missing profile fields modal */}
            {missingFields.length > 0 && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
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
