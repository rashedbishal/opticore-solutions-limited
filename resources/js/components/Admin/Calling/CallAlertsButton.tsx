import type { PushState } from './push';
import { AnimatePresence, m as motion } from 'framer-motion';
import { BellRing, PhoneIncoming } from 'lucide-react';
import { useState } from 'react';
import { callApi } from './callApi';
import { disablePush, enablePush, pushState } from './push';

const TEXT: Record<PushState, string> = {
    unsupported:
        'This browser can’t show call alerts. On iPhone, first add the CMS to your Home Screen (Share → Add to Home Screen) and open it from there.',
    blocked:
        'Notifications are blocked for this site. Allow them in your browser’s site settings, then try again.',
    off: 'Get a notification for incoming WhatsApp calls even when no CMS tab is open.',
    on: 'Incoming WhatsApp calls notify this device even when no CMS tab is open.',
};

/**
 * Top-bar button (lead roles): switch call alerts on or off for this
 * device.
 */
export default function CallAlertsButton() {
    const [open, setOpen] = useState(false);
    const [state, setState] = useState<PushState | null>(null);
    const [keyMissing, setKeyMissing] = useState(false);
    const [busy, setBusy] = useState(false);

    const toggleOpen = async () => {
        const next = !open;
        setOpen(next);

        if (next) {
            setState(await pushState());
        }
    };

    const change = async () => {
        setBusy(true);

        try {
            if (state === 'on') {
                setState(await disablePush());
            } else {
                const { push_public_key: key } = await callApi.active();

                if (!key) {
                    setKeyMissing(true);

                    return;
                }

                setState(await enablePush(key));
            }
        } catch {
            setState(await pushState());
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => void toggleOpen()}
                title="WhatsApp call alerts"
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
            >
                <PhoneIncoming className="h-5 w-5" />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="absolute right-0 z-[120] mt-2 w-72 rounded-xl border border-white/10 bg-[#0b1024] p-4 shadow-2xl"
                    >
                        <p className="flex items-center gap-2 text-sm font-semibold text-white">
                            <BellRing className="h-4 w-4 text-cyan-300" />
                            Call alerts on this device
                        </p>
                        <p className="mt-2 text-xs text-zinc-400">
                            {keyMissing
                                ? 'Call alerts aren’t set up yet. The mother admin turns them on in Lead Settings → General.'
                                : state
                                  ? TEXT[state]
                                  : 'Checking…'}
                        </p>
                        {(state === 'on' || state === 'off') && !keyMissing && (
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => void change()}
                                className={`mt-3 w-full rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50 ${
                                    state === 'on'
                                        ? 'border border-white/10 text-zinc-200 hover:bg-white/5'
                                        : 'bg-emerald-600 text-white hover:bg-emerald-500'
                                }`}
                            >
                                {state === 'on'
                                    ? 'Turn off on this device'
                                    : 'Turn on'}
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
