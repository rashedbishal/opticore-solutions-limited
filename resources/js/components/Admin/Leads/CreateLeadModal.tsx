import type { LeadDetailOptions } from '@/types/leads';
import type { FormEvent } from 'react';
import { useForm } from '@inertiajs/react';
import { AnimatePresence, m as motion } from 'framer-motion';
import { Loader2, X } from 'lucide-react';
import { MoneyInput, TextInput } from '@/components/Admin/Leads/LeadDetail';
import {
    INPUT,
    LABEL,
    PRIMARY_BUTTON,
    SECONDARY_BUTTON,
    SELECT,
} from '@/components/Admin/Leads/ui';
import leadRoutes from '@/routes/admin/leads';

interface Props extends LeadDetailOptions {
    open: boolean;
    onClose: () => void;
    onErrors: (messages: string[]) => void;
    /** Managers may choose the owner; an agent's new lead is always theirs. */
    canAssign: boolean;
}

/**
 * "Add lead" — a lead entered by hand (e.g. someone phoned in).
 */
export default function CreateLeadModal({
    open,
    onClose,
    onErrors,
    canAssign,
    statuses,
    priorities,
    currencies,
    assignableUsers,
}: Props) {
    const blank = () => ({
        name: '',
        phone: '',
        email: '',
        company: '',
        website: '',
        industry: '',
        location: '',
        service_interest: '',
        lead_source: '',
        message: '',
        status_id: statuses[0]?.id ?? '',
        priority: 'medium',
        assigned_to: '',
        estimated_budget: '',
        estimated_budget_currency_id: '',
        deal_value: '',
        deal_value_currency_id: '',
        win_probability: '',
        next_follow_up_at: '',
        meeting_at: '',
    });
    const form = useForm(blank());

    const close = () => {
        form.setData(blank());
        form.clearErrors();
        onClose();
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.transform((data) => ({
            ...data,
            assigned_to:
                data.assigned_to === '' ? null : Number(data.assigned_to),
        }));
        form.post(leadRoutes.store.url(), {
            preserveScroll: true,
            onSuccess: () => close(),
            onError: (errors) =>
                onErrors(Object.values(errors).filter(Boolean)),
        });
    };

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 sm:items-center">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={close}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 20 }}
                        className="relative my-8 w-full max-w-3xl rounded-2xl border border-violet-500/20 bg-[#060c1a] p-5 shadow-2xl sm:p-6"
                    >
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">
                                Add Lead
                            </h2>
                            <button
                                type="button"
                                onClick={close}
                                className="text-zinc-400 transition-colors hover:text-white"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={submit} className="space-y-5">
                            <Section title="Contact">
                                <TextInput
                                    label="Contact person"
                                    required
                                    value={form.data.name}
                                    onChange={(v) => form.setData('name', v)}
                                />
                                <TextInput
                                    label="Phone"
                                    required
                                    value={form.data.phone}
                                    onChange={(v) => form.setData('phone', v)}
                                />
                                <TextInput
                                    label="Email"
                                    type="email"
                                    value={form.data.email}
                                    onChange={(v) => form.setData('email', v)}
                                />
                            </Section>

                            <Section title="Company">
                                <TextInput
                                    label="Company"
                                    value={form.data.company}
                                    onChange={(v) => form.setData('company', v)}
                                />
                                <TextInput
                                    label="Website"
                                    placeholder="https://"
                                    value={form.data.website}
                                    onChange={(v) => form.setData('website', v)}
                                />
                                <TextInput
                                    label="Industry"
                                    value={form.data.industry}
                                    onChange={(v) =>
                                        form.setData('industry', v)
                                    }
                                />
                                <TextInput
                                    label="Location"
                                    value={form.data.location}
                                    onChange={(v) =>
                                        form.setData('location', v)
                                    }
                                />
                            </Section>

                            <Section title="Pipeline">
                                <label className="block">
                                    <span className={LABEL}>Status</span>
                                    <select
                                        className={SELECT}
                                        value={form.data.status_id}
                                        onChange={(e) =>
                                            form.setData(
                                                'status_id',
                                                e.target.value,
                                            )
                                        }
                                    >
                                        {statuses.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="block">
                                    <span className={LABEL}>Priority</span>
                                    <select
                                        className={SELECT}
                                        value={form.data.priority}
                                        onChange={(e) =>
                                            form.setData(
                                                'priority',
                                                e.target.value,
                                            )
                                        }
                                    >
                                        {priorities.map((p) => (
                                            <option
                                                key={p.value}
                                                value={p.value}
                                            >
                                                {p.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                {canAssign && (
                                    <label className="block">
                                        <span className={LABEL}>Assign to</span>
                                        <select
                                            className={SELECT}
                                            value={form.data.assigned_to}
                                            onChange={(e) =>
                                                form.setData(
                                                    'assigned_to',
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            <option value="">Unassigned</option>
                                            {assignableUsers.map((u) => (
                                                <option key={u.id} value={u.id}>
                                                    {u.name}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                )}
                                <TextInput
                                    label="Lead source"
                                    placeholder="e.g. Phone call, Referral"
                                    value={form.data.lead_source}
                                    onChange={(v) =>
                                        form.setData('lead_source', v)
                                    }
                                />
                            </Section>

                            <Section title="Deal">
                                <TextInput
                                    label="Service interested"
                                    value={form.data.service_interest}
                                    onChange={(v) =>
                                        form.setData('service_interest', v)
                                    }
                                />
                                <TextInput
                                    label="Win probability (%)"
                                    type="number"
                                    value={form.data.win_probability}
                                    onChange={(v) =>
                                        form.setData('win_probability', v)
                                    }
                                />
                                <MoneyInput
                                    label="Estimated budget"
                                    amount={form.data.estimated_budget}
                                    currencyId={
                                        form.data.estimated_budget_currency_id
                                    }
                                    currencies={currencies}
                                    onAmount={(v) =>
                                        form.setData('estimated_budget', v)
                                    }
                                    onCurrency={(v) =>
                                        form.setData(
                                            'estimated_budget_currency_id',
                                            v,
                                        )
                                    }
                                />
                                <MoneyInput
                                    label="Deal value"
                                    amount={form.data.deal_value}
                                    currencyId={
                                        form.data.deal_value_currency_id
                                    }
                                    currencies={currencies}
                                    onAmount={(v) =>
                                        form.setData('deal_value', v)
                                    }
                                    onCurrency={(v) =>
                                        form.setData(
                                            'deal_value_currency_id',
                                            v,
                                        )
                                    }
                                />
                                <TextInput
                                    label="Next follow-up"
                                    type="date"
                                    value={form.data.next_follow_up_at}
                                    onChange={(v) =>
                                        form.setData('next_follow_up_at', v)
                                    }
                                />
                                <TextInput
                                    label="Meeting"
                                    type="datetime-local"
                                    value={form.data.meeting_at}
                                    onChange={(v) =>
                                        form.setData('meeting_at', v)
                                    }
                                />
                            </Section>

                            <label className="block">
                                <span className={LABEL}>Message</span>
                                <textarea
                                    rows={3}
                                    maxLength={2000}
                                    className={INPUT}
                                    value={form.data.message}
                                    onChange={(e) =>
                                        form.setData('message', e.target.value)
                                    }
                                />
                            </label>

                            <div className="flex justify-end gap-3 border-t border-violet-500/10 pt-4">
                                <button
                                    type="button"
                                    onClick={close}
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
                                        'Add Lead'
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <fieldset>
            <legend className="mb-3 font-mono text-[10px] font-semibold tracking-[0.2em] text-cyan-400/60 uppercase">
                {title}
            </legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {children}
            </div>
        </fieldset>
    );
}
