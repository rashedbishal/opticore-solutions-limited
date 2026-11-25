import type { FormEvent } from 'react';
import { useForm } from '@inertiajs/react';
import { KeyRound, Trash2, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import {
    INPUT,
    LABEL,
    PRIMARY_BUTTON,
    SECONDARY_BUTTON,
} from '@/components/Admin/Leads/ui';
import files from '@/routes/admin/application-log/files';

type Step = 'warning' | 'first' | 'second';

interface Props {
    fileName: string;
    onClose: () => void;
}

/**
 * Deleting a whole dated log file: a warning, then the mother admin's
 * password, then the password again. The server checks both.
 */
export default function DeleteLogFileDialog({ fileName, onClose }: Props) {
    const [step, setStep] = useState<Step>('warning');
    const form = useForm({
        file: fileName,
        password: '',
        password_again: '',
    });

    // A wrong first password sends the mother admin back to that step.
    const shownStep: Step =
        step === 'second' && form.errors.password ? 'first' : step;

    const next = (event: FormEvent) => {
        event.preventDefault();

        if (shownStep === 'warning') {
            setStep('first');

            return;
        }

        if (shownStep === 'first') {
            form.clearErrors('password');
            setStep('second');

            return;
        }

        form.delete(files.destroy.url(), {
            preserveScroll: true,
            onSuccess: () => onClose(),
            onError: (errors) => {
                if (errors.password) {
                    form.setData('password_again', '');
                    setStep('first');
                }
            },
        });
    };

    const titles: Record<Step, string> = {
        warning: 'Delete log file',
        first: 'Step 1 of 2 · Your password',
        second: 'Step 2 of 2 · Your password again',
    };

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <form
                onSubmit={next}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm overflow-hidden rounded-xl border border-red-500/35 bg-gradient-to-br from-[#0e1225] to-[#090d1b] shadow-2xl"
            >
                <div className="flex items-center gap-2 border-b border-red-500/20 bg-red-500/10 px-4 py-2.5">
                    {shownStep === 'warning' ? (
                        <TriangleAlert className="h-4 w-4 text-red-400" />
                    ) : (
                        <KeyRound className="h-4 w-4 text-red-400" />
                    )}
                    <p className="font-mono text-[10px] tracking-[0.25em] text-red-300/90 uppercase">
                        {titles[shownStep]}
                    </p>
                </div>

                <div className="space-y-4 p-4">
                    {shownStep === 'warning' && (
                        <p className="text-sm text-zinc-300">
                            Delete{' '}
                            <span className="font-mono text-white">
                                {fileName}
                            </span>{' '}
                            for good? The whole file and everything in it will
                            be gone. This can't be undone. You'll be asked for
                            your password twice.
                        </p>
                    )}

                    {shownStep === 'first' && (
                        <div>
                            <label htmlFor="log-password" className={LABEL}>
                                Mother admin password
                            </label>
                            <input
                                id="log-password"
                                type="password"
                                autoComplete="current-password"
                                autoFocus
                                value={form.data.password}
                                onChange={(e) =>
                                    form.setData('password', e.target.value)
                                }
                                className={INPUT}
                            />
                            {form.errors.password && (
                                <p className="mt-1 text-xs text-red-400">
                                    {form.errors.password}
                                </p>
                            )}
                        </div>
                    )}

                    {shownStep === 'second' && (
                        <div>
                            <label
                                htmlFor="log-password-again"
                                className={LABEL}
                            >
                                Enter your password again to confirm
                            </label>
                            <input
                                id="log-password-again"
                                type="password"
                                autoComplete="current-password"
                                autoFocus
                                value={form.data.password_again}
                                onChange={(e) =>
                                    form.setData(
                                        'password_again',
                                        e.target.value,
                                    )
                                }
                                className={INPUT}
                            />
                            {form.errors.password_again && (
                                <p className="mt-1 text-xs text-red-400">
                                    {form.errors.password_again}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            className={SECONDARY_BUTTON}
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={
                                form.processing ||
                                (shownStep === 'first' &&
                                    form.data.password === '') ||
                                (shownStep === 'second' &&
                                    form.data.password_again === '')
                            }
                            className={PRIMARY_BUTTON}
                        >
                            {shownStep === 'second' ? (
                                <>
                                    <Trash2 className="h-4 w-4" /> Delete file
                                </>
                            ) : (
                                'Continue'
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
