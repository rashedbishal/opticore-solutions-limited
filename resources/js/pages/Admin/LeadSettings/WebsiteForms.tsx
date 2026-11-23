import type { FormEvent, ReactNode } from 'react';
import { router, useForm } from '@inertiajs/react';
import { AnimatePresence, m as motion } from 'framer-motion';
import {
    Check,
    Code2,
    Copy,
    Edit,
    KeyRound,
    Loader2,
    Plus,
    Power,
    Trash2,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { CmsDeleteDialog } from '@/components/Admin/CmsDeleteDialog';
import { CmsErrorDialog } from '@/components/Admin/CmsErrorDialog';
import {
    INPUT,
    LABEL,
    PRIMARY_BUTTON,
    SECONDARY_BUTTON,
} from '@/components/Admin/Leads/ui';
import AdminLayout from '@/components/Layout/AdminLayout';
import formRoutes from '@/routes/admin/lead-settings/website-forms';

interface WebsiteFormRow {
    id: string;
    name: string;
    is_active: boolean;
    allowed_domains: string[];
    fields: string[];
    leads_count: number;
}

interface Props {
    forms: WebsiteFormRow[];
    fieldOptions: { value: string; label: string }[];
    submitUrlTemplate: string;
    revealed: { form_id: string; token: string } | null;
}

const KEY_PLACEHOLDER = 'PASTE-THE-FORM-KEY-HERE';

/**
 * Lead Settings → Website Forms: forms for other websites (landing pages).
 * Every submission becomes a lead. The mother admin gets ready-to-paste
 * code; a form's secret key is shown only once.
 */
export default function WebsiteForms({
    forms,
    fieldOptions,
    submitUrlTemplate,
    revealed,
}: Props) {
    const [editing, setEditing] = useState<WebsiteFormRow | null>(null);
    const [creating, setCreating] = useState(false);
    const [codeFor, setCodeFor] = useState<WebsiteFormRow | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<WebsiteFormRow | null>(
        null,
    );
    const [regenerateTarget, setRegenerateTarget] =
        useState<WebsiteFormRow | null>(null);
    const [errors, setErrors] = useState<string[]>([]);
    const [dismissedToken, setDismissedToken] = useState<string | null>(null);

    const revealedForm =
        revealed && revealed.token !== dismissedToken
            ? forms.find((f) => f.id === revealed.form_id)
            : undefined;

    return (
        <div className="relative space-y-6">
            <CmsErrorDialog messages={errors} onClose={() => setErrors([])} />
            <CmsDeleteDialog
                open={deleteTarget !== null}
                message={
                    deleteTarget
                        ? `Delete "${deleteTarget.name}"? Websites using it will stop sending leads. Leads it already brought in are kept.`
                        : undefined
                }
                onConfirm={() => {
                    if (deleteTarget) {
                        router.delete(formRoutes.destroy.url(deleteTarget.id), {
                            preserveScroll: true,
                        });
                    }

                    setDeleteTarget(null);
                }}
                onCancel={() => setDeleteTarget(null)}
            />
            <CmsDeleteDialog
                open={regenerateTarget !== null}
                message={
                    regenerateTarget
                        ? `Make a new key for "${regenerateTarget.name}"? The old key stops working at once, so the code on your website must be replaced with the new code.`
                        : undefined
                }
                onConfirm={() => {
                    if (regenerateTarget) {
                        router.post(
                            formRoutes.regenerate.url(regenerateTarget.id),
                            {},
                            { preserveScroll: true },
                        );
                    }

                    setRegenerateTarget(null);
                }}
                onCancel={() => setRegenerateTarget(null)}
            />

            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        Website Forms
                    </h1>
                    <p className="mt-1 text-sm text-zinc-500">
                        Forms for your other websites and landing pages. Every
                        submission becomes a lead.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setCreating(true)}
                    className={PRIMARY_BUTTON}
                >
                    <Plus className="h-4 w-4" /> New Form
                </button>
            </div>

            {revealedForm && revealed && (
                <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/[0.06] p-4 sm:p-5">
                    <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                            <p className="font-semibold text-emerald-200">
                                Code for &ldquo;{revealedForm.name}&rdquo; is
                                ready
                            </p>
                            <p className="mt-1 text-sm text-emerald-100/70">
                                Copy it now and paste it into your web page. For
                                safety, this code (with its secret key) is shown
                                only this once.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setDismissedToken(revealed.token)}
                            className="text-emerald-200/60 hover:text-emerald-100"
                            aria-label="Hide"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <CodeBlock
                        code={formCode(
                            revealedForm,
                            submitUrlTemplate,
                            revealed.token,
                        )}
                    />
                </div>
            )}

            <div className="space-y-3">
                {forms.length === 0 ? (
                    <p className="rounded-xl border border-violet-500/15 bg-[#060c1a]/80 px-6 py-16 text-center font-mono text-xs tracking-[0.2em] text-violet-400/30 uppercase">
                        No forms yet
                    </p>
                ) : (
                    forms.map((form) => (
                        <div
                            key={form.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-violet-500/15 bg-[#060c1a]/80 p-4"
                        >
                            <div className="min-w-0">
                                <p className="flex items-center gap-2 font-medium text-white">
                                    {form.name}
                                    {!form.is_active && (
                                        <span className="rounded-full border border-zinc-400/30 px-1.5 text-[10px] text-zinc-400">
                                            Off
                                        </span>
                                    )}
                                </p>
                                <p className="mt-0.5 text-xs text-zinc-500">
                                    Asks for: Name
                                    {form.fields.map(
                                        (f) =>
                                            `, ${fieldOptions.find((o) => o.value === f)?.label ?? f}`,
                                    )}
                                    {' · '}
                                    {form.allowed_domains.length > 0
                                        ? `Only from ${form.allowed_domains.join(', ')}`
                                        : 'From any website'}
                                    {' · '}
                                    {form.leads_count}{' '}
                                    {form.leads_count === 1 ? 'lead' : 'leads'}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                <IconButton
                                    title="Get code"
                                    onClick={() => setCodeFor(form)}
                                >
                                    <Code2 className="h-4 w-4" />
                                </IconButton>
                                <IconButton
                                    title="New key"
                                    onClick={() => setRegenerateTarget(form)}
                                >
                                    <KeyRound className="h-4 w-4" />
                                </IconButton>
                                <IconButton
                                    title="Edit"
                                    onClick={() => setEditing(form)}
                                >
                                    <Edit className="h-4 w-4" />
                                </IconButton>
                                <IconButton
                                    title={
                                        form.is_active ? 'Turn off' : 'Turn on'
                                    }
                                    onClick={() =>
                                        router.post(
                                            formRoutes.toggle.url(form.id),
                                            {},
                                            { preserveScroll: true },
                                        )
                                    }
                                >
                                    <Power
                                        className={`h-4 w-4 ${form.is_active ? 'text-emerald-400' : ''}`}
                                    />
                                </IconButton>
                                <IconButton
                                    title="Delete"
                                    danger
                                    onClick={() => setDeleteTarget(form)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </IconButton>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <FormEditor
                key={editing?.id ?? (creating ? 'new' : 'closed')}
                open={creating || editing !== null}
                form={editing}
                fieldOptions={fieldOptions}
                onClose={() => {
                    setCreating(false);
                    setEditing(null);
                }}
                onErrors={setErrors}
            />

            <AnimatePresence>
                {codeFor && (
                    <Modal
                        title={`Code for "${codeFor.name}"`}
                        onClose={() => setCodeFor(null)}
                    >
                        <p className="mb-3 text-sm text-zinc-400">
                            Paste this into your web page. Replace{' '}
                            <code className="rounded bg-white/5 px-1 text-amber-200">
                                {KEY_PLACEHOLDER}
                            </code>{' '}
                            with the form&apos;s key. If you don&apos;t have the
                            key any more, use &ldquo;New key&rdquo; to get
                            complete code again.
                        </p>
                        <CodeBlock
                            code={formCode(
                                codeFor,
                                submitUrlTemplate,
                                KEY_PLACEHOLDER,
                            )}
                        />
                    </Modal>
                )}
            </AnimatePresence>
        </div>
    );
}

/**
 * Ready-to-paste HTML: the form, a hidden spam trap, and a small script
 * that sends it and shows a thank-you message without leaving the page.
 */
function formCode(
    form: WebsiteFormRow,
    urlTemplate: string,
    token: string,
): string {
    const url = urlTemplate.replace('X'.repeat(40), token);
    const id = `opticore-form-${form.id.slice(-6).toLowerCase()}`;
    const inputs = [
        '  <p><label>Name<br><input name="name" required></label></p>',
        form.fields.includes('email')
            ? '  <p><label>Email<br><input type="email" name="email"></label></p>'
            : null,
        form.fields.includes('phone')
            ? '  <p><label>Phone<br><input type="tel" name="phone"></label></p>'
            : null,
        form.fields.includes('message')
            ? '  <p><label>Message<br><textarea name="message" rows="4"></textarea></label></p>'
            : null,
    ].filter(Boolean);

    return `<form id="${id}" action="${url}" method="POST">
  <input type="text" name="_gotcha" style="display:none" tabindex="-1" autocomplete="off">
${inputs.join('\n')}
  <p><button type="submit">Send</button></p>
  <p class="form-status" hidden></p>
</form>
<script>
(function () {
  var form = document.getElementById('${id}');
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var status = form.querySelector('.form-status');
    var button = form.querySelector('button');
    button.disabled = true;
    fetch(form.action, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) })
      .then(function (response) {
        return response.json().catch(function () { return {}; }).then(function (data) { return { ok: response.ok, data: data }; });
      })
      .then(function (result) {
        status.hidden = false;
        if (result.ok) {
          form.reset();
          status.textContent = 'Thank you! We received your message and will be in touch soon.';
        } else {
          status.textContent = (result.data && result.data.message) || 'Something went wrong. Please try again.';
        }
      })
      .catch(function () {
        status.hidden = false;
        status.textContent = 'Something went wrong. Please try again.';
      })
      .finally(function () { button.disabled = false; });
  });
})();
</script>`;
}

function CodeBlock({ code }: { code: string }) {
    const [copied, setCopied] = useState(false);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => {
                    void navigator.clipboard?.writeText(code);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                }}
                className={`${SECONDARY_BUTTON} absolute top-2 right-2 px-2 py-1 text-xs`}
            >
                {copied ? (
                    <Check className="h-3.5 w-3.5" />
                ) : (
                    <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? 'Copied' : 'Copy'}
            </button>
            <pre className="max-h-80 overflow-auto rounded-lg border border-white/8 bg-black/50 p-4 pt-12 font-mono text-[11px] leading-relaxed text-zinc-300">
                {code}
            </pre>
        </div>
    );
}

function IconButton({
    title,
    onClick,
    danger = false,
    children,
}: {
    title: string;
    onClick: () => void;
    danger?: boolean;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            title={title}
            aria-label={title}
            onClick={onClick}
            className={`rounded-lg p-2 transition-colors hover:bg-white/5 ${
                danger
                    ? 'text-red-400/70 hover:text-red-300'
                    : 'text-zinc-400 hover:text-white'
            }`}
        >
            {children}
        </button>
    );
}

function Modal({
    title,
    onClose,
    children,
}: {
    title: string;
    onClose: () => void;
    children: ReactNode;
}) {
    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 sm:items-center">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 20 }}
                className="relative my-8 w-full max-w-2xl rounded-2xl border border-violet-500/20 bg-[#060c1a] p-6 shadow-2xl"
            >
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-zinc-400 hover:text-white"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                {children}
            </motion.div>
        </div>
    );
}

function FormEditor({
    open,
    form,
    fieldOptions,
    onClose,
    onErrors,
}: {
    open: boolean;
    form: WebsiteFormRow | null;
    fieldOptions: Props['fieldOptions'];
    onClose: () => void;
    onErrors: (e: string[]) => void;
}) {
    const data = useForm({
        name: form?.name ?? '',
        is_active: form?.is_active ?? true,
        fields: form?.fields ?? ['email', 'phone', 'message'],
        domains: (form?.allowed_domains ?? []).join('\n'),
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        data.transform((d) => ({
            name: d.name,
            is_active: d.is_active,
            fields: d.fields,
            allowed_domains: d.domains
                .split(/[\n,]/)
                .map((s) => s.trim())
                .filter(Boolean),
        }));

        const options = {
            preserveScroll: true,
            onSuccess: () => onClose(),
            onError: (errs: Record<string, string>) =>
                onErrors(Object.values(errs).filter(Boolean)),
        };

        if (form) {
            data.put(formRoutes.update.url(form.id), options);
        } else {
            data.post(formRoutes.store.url(), options);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <Modal
                    title={form ? `Edit ${form.name}` : 'New Website Form'}
                    onClose={onClose}
                >
                    <form onSubmit={submit} className="space-y-5">
                        <label className="block">
                            <span className={LABEL}>Form name</span>
                            <input
                                className={INPUT}
                                value={data.data.name}
                                onChange={(e) =>
                                    data.setData('name', e.target.value)
                                }
                                placeholder="e.g. Winter Offer landing page"
                            />
                        </label>

                        <div>
                            <span className={LABEL}>Ask for</span>
                            <div className="flex flex-wrap gap-3 text-sm text-zinc-300">
                                <span className="inline-flex items-center gap-2 text-zinc-500">
                                    <input
                                        type="checkbox"
                                        checked
                                        disabled
                                        className="h-4 w-4"
                                    />
                                    Name (always)
                                </span>
                                {fieldOptions.map((option) => (
                                    <label
                                        key={option.value}
                                        className="inline-flex items-center gap-2"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={data.data.fields.includes(
                                                option.value,
                                            )}
                                            onChange={(e) =>
                                                data.setData(
                                                    'fields',
                                                    e.target.checked
                                                        ? [
                                                              ...data.data
                                                                  .fields,
                                                              option.value,
                                                          ]
                                                        : data.data.fields.filter(
                                                              (f) =>
                                                                  f !==
                                                                  option.value,
                                                          ),
                                                )
                                            }
                                            className="h-4 w-4 accent-violet-500"
                                        />
                                        {option.label}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <label className="block">
                            <span className={LABEL}>Allowed websites</span>
                            <textarea
                                rows={3}
                                className={INPUT}
                                value={data.data.domains}
                                onChange={(e) =>
                                    data.setData('domains', e.target.value)
                                }
                                placeholder={
                                    'opticoresolutionsltd.com\noffer.example.com'
                                }
                            />
                            <span className="mt-1 block text-xs text-zinc-500">
                                One per line. Forms sent from any other website
                                are rejected. Leave empty to accept from any
                                website.
                            </span>
                        </label>

                        <label className="flex items-center gap-3 text-sm text-zinc-300">
                            <input
                                type="checkbox"
                                checked={data.data.is_active}
                                onChange={(e) =>
                                    data.setData('is_active', e.target.checked)
                                }
                                className="h-4 w-4 accent-violet-500"
                            />
                            Form is on (accepting submissions)
                        </label>

                        <div className="flex justify-end gap-3 border-t border-violet-500/10 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className={SECONDARY_BUTTON}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={data.processing}
                                className={PRIMARY_BUTTON}
                            >
                                {data.processing ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : form ? (
                                    'Save'
                                ) : (
                                    'Create & get code'
                                )}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </AnimatePresence>
    );
}

WebsiteForms.layout = (page: ReactNode) => (
    <AdminLayout title="Website Forms">{page}</AdminLayout>
);
