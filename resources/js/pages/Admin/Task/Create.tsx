import type { FormEventHandler, ReactNode } from 'react';
import { Link, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    ChevronLeft,
    Loader2,
    Paperclip,
    Trash2,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { CmsErrorDialog } from '@/components/Admin/CmsErrorDialog';
import AdminLayout from '@/components/Layout/AdminLayout';
import adminRoutes from '@/routes/admin';

interface User {
    id: number;
    name: string;
    email: string;
}

interface SubCategory {
    id: number;
    name: string;
    slug: string;
}

interface Props {
    categories: Record<string, string>;
    subCategoriesByCategory: Record<string, SubCategory[]>;
    users: User[];
}

const MAX_TOTAL_BYTES = 300 * 1024 * 1024;
const ACCEPT_TYPES =
    'image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm,video/mpeg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv';

function formatBytes(bytes: number): string {
    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CreateTask({
    categories,
    subCategoriesByCategory,
    users,
}: Props) {
    const { data, setData, post, processing } = useForm<{
        client_name: string;
        user_id: string | number;
        category: string;
        sub_category_id: string | number;
        task_name: string;
        date: string;
        state: string;
        image: File | null;
        notes: string;
        attachments: File[];
    }>({
        client_name: '',
        user_id: '',
        category: '',
        sub_category_id: '',
        task_name: '',
        date: '',
        state: 'pending',
        image: null,
        notes: '',
        attachments: [],
    });

    const imageInputRef = useRef<HTMLInputElement>(null);
    const attachmentInputRef = useRef<HTMLInputElement>(null);
    const [errorMessages, setErrorMessages] = useState<string[]>([]);
    const [fileSizeError, setFileSizeError] = useState<string | null>(null);

    const totalAttachmentBytes = data.attachments.reduce(
        (s, f) => s + f.size,
        0,
    );

    function handleAttachmentChange(e: React.ChangeEvent<HTMLInputElement>) {
        const incoming = Array.from(e.target.files ?? []);

        if (!incoming.length) {
            return;
        }

        const combined = [...data.attachments, ...incoming];
        const total = combined.reduce((s, f) => s + f.size, 0);

        setFileSizeError(
            total > MAX_TOTAL_BYTES
                ? `Total size (${formatBytes(total)}) exceeds 300 MB.`
                : null,
        );
        setData('attachments', combined);

        if (attachmentInputRef.current) {
            attachmentInputRef.current.value = '';
        }
    }

    function removeAttachment(index: number) {
        const next = data.attachments.filter((_, i) => i !== index);
        const total = next.reduce((s, f) => s + f.size, 0);
        setFileSizeError(
            total > MAX_TOTAL_BYTES
                ? `Total size (${formatBytes(total)}) exceeds 300 MB.`
                : null,
        );
        setData('attachments', next);
    }

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const v: string[] = [];

        if (!data.client_name.trim()) {
            v.push('Client name is required.');
        }

        if (!data.user_id) {
            v.push('Please select a client (user).');
        }

        if (!data.category) {
            v.push('Please select a category.');
        }

        if (!data.task_name.trim()) {
            v.push('Task name is required.');
        }

        if (!data.date) {
            v.push('Date is required.');
        }

        if (fileSizeError) {
            v.push(fileSizeError);
        }

        if (v.length > 0) {
            setErrorMessages(v);

            return;
        }

        post(adminRoutes.tasks.store.url(), {
            forceFormData: true,
            onError: (errs) =>
                setErrorMessages(
                    Object.values(errs).filter(Boolean) as string[],
                ),
        });
    };

    return (
        <div className="space-y-6">
            <CmsErrorDialog
                messages={errorMessages}
                onClose={() => setErrorMessages([])}
            />
            <div className="flex items-center gap-4">
                <Link
                    href={adminRoutes.tasks.index.url()}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/8 bg-white/4 text-slate-400 transition-colors hover:bg-violet-500/10 hover:text-violet-400"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Link>
                <h1 className="text-2xl font-bold text-white">Add Task</h1>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-violet-500/15 bg-[#060c1a]/80 p-6 backdrop-blur-sm">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
                <form onSubmit={submit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div>
                            <label className="mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase">
                                Client Name
                            </label>
                            <input
                                type="text"
                                name="client_name"
                                value={data.client_name}
                                onChange={(e) =>
                                    setData('client_name', e.target.value)
                                }
                                className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-white/20 transition-all outline-none focus:border-violet-500/50 focus:bg-violet-500/5"
                                placeholder="Enter client name"
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase">
                                Client Email (User)
                            </label>
                            <select
                                name="user_id"
                                value={data.user_id}
                                onChange={(e) =>
                                    setData(
                                        'user_id',
                                        parseInt(e.target.value, 10),
                                    )
                                }
                                className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white transition-all outline-none focus:border-violet-500/50 focus:bg-violet-500/5"
                            >
                                <option value="" className="bg-[#060c1a]">
                                    Select a user
                                </option>
                                {users.map((user) => (
                                    <option
                                        key={user.id}
                                        value={user.id}
                                        className="bg-[#060c1a]"
                                    >
                                        {user.name} ({user.email})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase">
                                Category
                            </label>
                            <select
                                name="category"
                                value={data.category}
                                className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white transition-all outline-none focus:border-violet-500/50 focus:bg-violet-500/5"
                                onChange={(e) => {
                                    setData('category', e.target.value);
                                    setData('sub_category_id', '');
                                }}
                            >
                                <option value="" className="bg-[#060c1a]">
                                    Select Category
                                </option>
                                {Object.entries(categories).map(
                                    ([slug, label]) => (
                                        <option
                                            key={slug}
                                            value={slug}
                                            className="bg-[#060c1a]"
                                        >
                                            {label}
                                        </option>
                                    ),
                                )}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase">
                                Sub-Category
                            </label>
                            <select
                                name="sub_category_id"
                                className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white transition-all outline-none focus:border-violet-500/50 focus:bg-violet-500/5 disabled:opacity-50"
                                disabled={!data.category}
                                value={data.sub_category_id}
                                onChange={(e) =>
                                    setData('sub_category_id', e.target.value)
                                }
                            >
                                <option value="" className="bg-[#060c1a]">
                                    Select Sub-Category (Optional)
                                </option>
                                {data.category &&
                                    subCategoriesByCategory[
                                        data.category as string
                                    ]?.map((sub) => (
                                        <option
                                            key={sub.id}
                                            value={sub.id}
                                            className="bg-[#060c1a]"
                                        >
                                            {sub.name}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase">
                                Task Name
                            </label>
                            <input
                                type="text"
                                name="task_name"
                                value={data.task_name}
                                onChange={(e) =>
                                    setData('task_name', e.target.value)
                                }
                                className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-white/20 transition-all outline-none focus:border-violet-500/50 focus:bg-violet-500/5"
                                placeholder="Enter task name"
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase">
                                Date
                            </label>
                            <input
                                type="date"
                                name="date"
                                value={data.date}
                                onChange={(e) =>
                                    setData('date', e.target.value)
                                }
                                onClick={(e) => {
                                    try {
                                        (
                                            e.currentTarget as HTMLInputElement
                                        ).showPicker?.();
                                    } catch {
                                        // Fallback if showPicker is not supported or throws
                                    }
                                }}
                                style={{ colorScheme: 'dark' }}
                                className="block w-full cursor-pointer rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white transition-all outline-none focus:border-violet-500/50 focus:bg-violet-500/5"
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase">
                                State
                            </label>
                            <select
                                name="state"
                                value={data.state}
                                onChange={(e) =>
                                    setData('state', e.target.value as any)
                                }
                                className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white transition-all outline-none focus:border-violet-500/50 focus:bg-violet-500/5"
                            >
                                <option
                                    value="pending"
                                    className="bg-[#060c1a]"
                                >
                                    Pending
                                </option>
                                <option
                                    value="in progress"
                                    className="bg-[#060c1a]"
                                >
                                    In Progress
                                </option>
                                <option
                                    value="delivered"
                                    className="bg-[#060c1a]"
                                >
                                    Delivered
                                </option>
                            </select>
                        </div>
                    </div>

                    {/* Task Image */}
                    <div>
                        <label className="mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase">
                            Task Image{' '}
                            <span className="text-zinc-500 normal-case">
                                (Optional — used as review image)
                            </span>
                        </label>
                        <input
                            ref={imageInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                                setData('image', e.target.files?.[0] ?? null)
                            }
                            className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-slate-300 outline-none file:mr-4 file:rounded file:border-0 file:bg-violet-600 file:px-3 file:py-1 file:text-sm file:font-medium file:text-white hover:file:bg-violet-500"
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label
                            htmlFor="task-notes"
                            className="mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase"
                        >
                            Notes{' '}
                            <span className="text-zinc-500 normal-case">
                                (Optional)
                            </span>
                        </label>
                        <textarea
                            id="task-notes"
                            name="notes"
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            rows={4}
                            maxLength={5000}
                            placeholder="Project details, requirements, references…"
                            className="block w-full resize-y rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-white/20 transition-all outline-none focus:border-violet-500/50 focus:bg-violet-500/5"
                        />
                        {data.notes.length > 0 && (
                            <p className="mt-1 text-right font-mono text-[10px] text-zinc-600">
                                {data.notes.length}/5000
                            </p>
                        )}
                    </div>

                    {/* Attachments */}
                    <div>
                        <label className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase">
                            <Paperclip className="h-3 w-3" />
                            Attachments{' '}
                            <span className="ml-1 font-normal text-zinc-500 normal-case">
                                (Optional — max 300 MB total, up to 10 files)
                            </span>
                        </label>

                        <input
                            ref={attachmentInputRef}
                            type="file"
                            multiple
                            accept={ACCEPT_TYPES}
                            onChange={handleAttachmentChange}
                            className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-slate-300 outline-none file:mr-4 file:rounded file:border-0 file:bg-violet-600 file:px-3 file:py-1 file:text-sm file:font-medium file:text-white hover:file:bg-violet-500"
                        />

                        {fileSizeError && (
                            <p className="mt-2 flex items-center gap-1.5 font-mono text-[10px] text-red-400">
                                <AlertCircle className="h-3 w-3 shrink-0" />
                                {fileSizeError}
                            </p>
                        )}

                        {data.attachments.length > 0 && (
                            <ul className="mt-3 space-y-1.5">
                                {data.attachments.map((file, idx) => (
                                    <li
                                        key={idx}
                                        className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/4 px-4 py-2.5"
                                    >
                                        <Paperclip className="h-3.5 w-3.5 shrink-0 text-violet-400/60" />
                                        <span className="flex-1 truncate text-sm text-zinc-300">
                                            {file.name}
                                        </span>
                                        <span className="shrink-0 font-mono text-xs text-zinc-500">
                                            {formatBytes(file.size)}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeAttachment(idx)
                                            }
                                            className="shrink-0 text-zinc-500 transition-colors hover:text-red-400"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {data.attachments.length > 0 && (
                            <p className="mt-1 text-right font-mono text-[10px] text-zinc-600">
                                Total: {formatBytes(totalAttachmentBytes)} / 300
                                MB
                            </p>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-4 border-t border-violet-500/10 pt-6">
                        <Link
                            href={adminRoutes.tasks.index.url()}
                            className="relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-zinc-300 transition-all before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:-skew-x-12 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-transform before:duration-500 hover:border-violet-500/25 hover:bg-violet-500/[0.08] hover:text-white hover:shadow-[0_0_14px_rgba(124,58,237,0.1)] hover:before:translate-x-full"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={processing || !!fileSizeError}
                            className="relative flex items-center gap-2 overflow-hidden rounded-lg border border-violet-400/30 bg-gradient-to-br from-violet-600 via-violet-500 to-cyan-500 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_0_22px_rgba(124,58,237,0.45),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:-skew-x-12 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-transform before:duration-500 hover:border-violet-400/50 hover:from-violet-500 hover:via-violet-400 hover:to-cyan-400 hover:shadow-[0_0_38px_rgba(124,58,237,0.65),inset_0_1px_0_rgba(255,255,255,0.2)] hover:before:translate-x-full disabled:opacity-50"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />{' '}
                                    Saving...
                                </>
                            ) : (
                                'Save Task'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

CreateTask.layout = (page: ReactNode) => (
    <AdminLayout title="Add Task">{page}</AdminLayout>
);
