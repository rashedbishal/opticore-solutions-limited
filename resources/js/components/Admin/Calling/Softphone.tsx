import type { ActiveCall } from './callApi';
import { Link } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { AnimatePresence, m as motion } from 'framer-motion';
import {
    Loader2,
    Mic,
    MicOff,
    Phone,
    PhoneOff,
    RotateCw,
    Volume2,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import leadRoutes from '@/routes/admin/leads';
import { AnswerSession } from './AnswerSession';
import { callApi, CallError } from './callApi';
import { OutboundSession } from './OutboundSession';
import { Ringtone } from './ringtone';

const RECEIVING_AS: Record<string, string> = {
    assignee: 'Your lead',
    backup_fallback: 'You are a backup receiver',
    manager_fallback: 'Ringing managers',
    none: '',
};

type Session = AnswerSession | OutboundSession;

const ENDED = ['completed', 'missed', 'rejected', 'failed'];

const PHASE_TEXT: Record<string, string> = {
    starting: 'Starting the call…',
    claiming: 'Picking up…',
    answering: 'Answering…',
    connecting: 'Connecting audio…',
    accepting: 'Connecting…',
};

/**
 * The WhatsApp call box, on every CMS admin page for anyone with a lead
 * role. It checks in every 15 s (that's what marks you "online" for calls)
 * and every 5 s when live updates aren't connected; live updates make it
 * react instantly. Ringing calls show Answer / Decline; a live call shows
 * a timer, Mute and Hang up.
 */
export default function Softphone({
    adminId,
    echoReady,
}: {
    adminId: number;
    echoReady: boolean;
}) {
    const [calls, setCalls] = useState<ActiveCall[]>([]);
    const [intervals, setIntervals] = useState({ heartbeat: 15, poll: 5 });
    const [notice, setNotice] = useState<string | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [soundBlocked, setSoundBlocked] = useState(true);
    const [, rerender] = useReducer((n: number) => n + 1, 0);
    // Mirrors `session` for callbacks (timers, live updates).
    const sessionRef = useRef<Session | null>(null);
    const audio = useRef<HTMLAudioElement | null>(null);
    const ringtone = useRef<Ringtone | null>(null);

    const endSession = useCallback((message: string | null) => {
        sessionRef.current?.close();
        sessionRef.current = null;
        setSession(null);

        if (message) {
            setNotice(message);
        }
    }, []);

    const refresh = useCallback(async () => {
        try {
            const data = await callApi.active();
            setCalls(data.calls);
            setIntervals({
                heartbeat: data.heartbeat_seconds,
                poll: data.poll_seconds,
            });

            const current = sessionRef.current;
            const listed = current?.callId
                ? data.calls.find((c) => c.id === current.callId)
                : undefined;

            if (current instanceof OutboundSession && current.callId) {
                if (listed?.status === 'answering') {
                    void current.applyAnswer();
                } else if (!listed && current.phase === 'ringing') {
                    endSession('No answer — the call has ended.');
                }
            }

            // The live call ended on the other side (or by the cleanup).
            if (current && current.phase === 'connected' && !listed) {
                endSession('The call has ended.');
            }
        } catch {
            // Try again on the next tick.
        }
    }, [endSession]);

    const onCallUpdate = useCallback(
        (id: string, status: string) => {
            const current = sessionRef.current;

            if (current?.callId === id) {
                if (
                    current instanceof OutboundSession &&
                    status === 'answering'
                ) {
                    void current.applyAnswer();
                } else if (
                    ENDED.includes(status) &&
                    current.phase !== 'failed'
                ) {
                    endSession(
                        current instanceof OutboundSession &&
                            current.phase !== 'connected'
                            ? 'They didn’t pick up, or declined.'
                            : 'The call has ended.',
                    );
                }
            }

            void refresh();
        },
        [endSession, refresh],
    );

    // Check in now, then on a timer: slower while live updates work.
    useEffect(() => {
        const first = setTimeout(() => void refresh(), 0);
        const every = (echoReady ? intervals.heartbeat : intervals.poll) * 1000;
        const timer = setInterval(() => void refresh(), Math.max(3000, every));

        return () => {
            clearTimeout(first);
            clearInterval(timer);
        };
    }, [refresh, echoReady, intervals.heartbeat, intervals.poll]);

    // Browsers only allow sound after a click on the page.
    useEffect(() => {
        const tone = new Ringtone();
        ringtone.current = tone;
        const unlock = () => tone.unlock();
        document.addEventListener('pointerdown', unlock);
        document.addEventListener('keydown', unlock);

        return () => {
            document.removeEventListener('pointerdown', unlock);
            document.removeEventListener('keydown', unlock);
            tone.stop();
            sessionRef.current?.close();
        };
    }, []);

    const ringing = calls.filter(
        (c) => c.direction === 'inbound' && c.status === 'ringing',
    );
    const shouldRing = ringing.length > 0 && session === null;
    const ringback =
        session instanceof OutboundSession &&
        ['starting', 'ringing'].includes(session.phase);

    useEffect(() => {
        if (shouldRing) {
            ringtone.current?.start();
        } else if (ringback) {
            ringtone.current?.startRingback();
        } else {
            ringtone.current?.stop();
        }
    }, [shouldRing, ringback]);

    // A ticking clock for countdowns and the call timer.
    useEffect(() => {
        if (calls.length === 0 && session === null) {
            return;
        }

        const timer = setInterval(() => {
            setSoundBlocked(ringtone.current?.blocked ?? true);
            rerender();
        }, 1000);

        return () => clearInterval(timer);
    }, [calls.length, session]);

    const startCall = async (leadId: string, leadName: string) => {
        if (sessionRef.current) {
            setNotice('Finish the current call first.');

            return;
        }

        setNotice(null);
        ringtone.current?.unlock();
        let stream: MediaStream;

        try {
            stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
        } catch {
            setNotice(
                'The microphone is blocked. Allow it for this site in your browser, then try again.',
            );

            return;
        }

        const s = new OutboundSession(
            leadId,
            leadName,
            callApi,
            stream,
            audio.current,
            rerender,
        );
        sessionRef.current = s;
        setSession(s);
        await s.start();
        void refresh();
    };

    const startCallRef = useRef(startCall);

    useEffect(() => {
        startCallRef.current = startCall;
    });

    // "Call" buttons on lead pages ask the call box to dial.
    useEffect(() => {
        const onStart = (event: Event) => {
            const { leadId, leadName } = (
                event as CustomEvent<{ leadId: string; leadName: string }>
            ).detail;
            void startCallRef.current(leadId, leadName);
        };

        window.addEventListener('cms:start-call', onStart);

        return () => window.removeEventListener('cms:start-call', onStart);
    }, []);

    const cancelOutgoing = async () => {
        const s = sessionRef.current;

        if (s?.callId) {
            try {
                await callApi.cancel(s.callId);
            } catch {
                // Already ended.
            }
        }

        endSession(null);
        void refresh();
    };

    const answer = async (call: ActiveCall) => {
        setNotice(null);
        ringtone.current?.stop();
        let stream: MediaStream;

        try {
            stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
        } catch {
            setNotice(
                'The microphone is blocked. Allow it for this site in your browser, then press Answer again.',
            );

            return;
        }

        const s = new AnswerSession(
            call.id,
            callApi,
            stream,
            audio.current,
            rerender,
        );
        sessionRef.current = s;
        setSession(s);
        await s.run();
        void refresh();
    };

    const decline = async (call: ActiveCall) => {
        try {
            await callApi.reject(call.id);
        } catch (e) {
            setNotice(
                e instanceof CallError ? e.message : 'Could not decline.',
            );
        }

        void refresh();
    };

    const hangup = async () => {
        const s = sessionRef.current;

        if (!s) {
            return;
        }

        try {
            if (s.callId) {
                await callApi.hangup(s.callId);
            }
        } catch {
            // The call may already have ended; close locally either way.
        }

        endSession(null);
        void refresh();
    };

    const dismissFailed = async () => {
        const s = sessionRef.current;

        if (!s) {
            return;
        }

        // Release a call stuck half-answered so it doesn't stay "yours".
        try {
            if (s.callId) {
                await (s instanceof OutboundSession
                    ? callApi.cancel(s.callId)
                    : callApi.reject(s.callId));
            }
        } catch {
            // Already ended.
        }

        endSession(null);
        void refresh();
    };

    const active = session;
    const activeCall = active
        ? (calls.find((c) => c.id === active.callId) ?? null)
        : null;
    const visible = ringing.length > 0 || active !== null || notice !== null;

    return (
        <>
            {echoReady && (
                <CallListener adminId={adminId} onUpdate={onCallUpdate} />
            )}
            <audio ref={audio} autoPlay className="hidden" />
            <AnimatePresence>
                {visible && (
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 24 }}
                        className="fixed right-4 bottom-4 left-4 z-[150] space-y-2 sm:left-auto sm:w-80"
                    >
                        {notice && (
                            <div className="flex items-start gap-2 rounded-xl border border-white/10 bg-[#0b1024]/95 p-3 text-sm text-zinc-200 shadow-xl backdrop-blur">
                                <span className="flex-1">{notice}</span>
                                <button
                                    type="button"
                                    onClick={() => setNotice(null)}
                                    className="text-zinc-500 hover:text-white"
                                    aria-label="Dismiss"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}

                        {active && (
                            <div className="rounded-2xl border border-emerald-400/30 bg-[#06121a]/95 p-4 shadow-2xl backdrop-blur">
                                {active instanceof OutboundSession &&
                                    active.phase !== 'connected' && (
                                        <p className="font-mono text-[10px] tracking-[0.2em] text-emerald-300 uppercase">
                                            Calling on WhatsApp
                                        </p>
                                    )}
                                <CallerLine
                                    call={activeCall}
                                    fallback={
                                        active instanceof OutboundSession
                                            ? active.leadName
                                            : 'WhatsApp call'
                                    }
                                />
                                {active.phase === 'connected' ? (
                                    <>
                                        <p className="mt-1 font-mono text-2xl text-emerald-300">
                                            {clock(active.connectedAt)}
                                        </p>
                                        {active.reconnecting && (
                                            <p className="text-xs text-amber-300">
                                                Reconnecting…
                                            </p>
                                        )}
                                        {active.audioBlocked && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    void active.enableAudio()
                                                }
                                                className="mt-2 inline-flex items-center gap-1.5 text-xs text-cyan-300 hover:underline"
                                            >
                                                <Volume2 className="h-3.5 w-3.5" />
                                                Tap to hear the caller
                                            </button>
                                        )}
                                        <div className="mt-3 flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    active.setMuted(
                                                        !active.muted,
                                                    )
                                                }
                                                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm ${
                                                    active.muted
                                                        ? 'border-amber-400/40 bg-amber-500/15 text-amber-200'
                                                        : 'border-white/10 text-zinc-200 hover:bg-white/5'
                                                }`}
                                            >
                                                {active.muted ? (
                                                    <MicOff className="h-4 w-4" />
                                                ) : (
                                                    <Mic className="h-4 w-4" />
                                                )}
                                                {active.muted
                                                    ? 'Unmute'
                                                    : 'Mute'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => void hangup()}
                                                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500"
                                            >
                                                <PhoneOff className="h-4 w-4" />
                                                Hang up
                                            </button>
                                        </div>
                                    </>
                                ) : active.phase === 'failed' ? (
                                    <>
                                        <p className="mt-2 text-sm text-red-300">
                                            {active.error?.message ??
                                                'The call could not be answered.'}
                                        </p>
                                        <div className="mt-3 flex gap-2">
                                            {active.error?.retryable && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        void active.retry()
                                                    }
                                                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-200 hover:bg-white/5"
                                                >
                                                    <RotateCw className="h-4 w-4" />
                                                    Try again
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    void dismissFailed()
                                                }
                                                className="flex flex-1 items-center justify-center rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5"
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <p className="mt-2 flex items-center gap-2 text-sm text-zinc-300">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            {active instanceof
                                                OutboundSession &&
                                            active.phase === 'ringing'
                                                ? 'Ringing…'
                                                : (PHASE_TEXT[active.phase] ??
                                                  'Connecting…')}
                                        </p>
                                        {active instanceof OutboundSession && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    void cancelOutgoing()
                                                }
                                                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500"
                                            >
                                                <PhoneOff className="h-4 w-4" />
                                                Cancel
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {!active &&
                            ringing.map((call) => (
                                <motion.div
                                    key={call.id}
                                    initial={{ scale: 0.96 }}
                                    animate={{ scale: [1, 1.015, 1] }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 1.6,
                                    }}
                                    className="rounded-2xl border border-cyan-400/40 bg-[#06121a]/95 p-4 shadow-[0_0_30px_rgba(34,211,238,0.25)] backdrop-blur"
                                >
                                    <p className="flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-cyan-300 uppercase">
                                        <Phone className="h-3.5 w-3.5 animate-pulse" />
                                        Incoming WhatsApp call
                                    </p>
                                    <CallerLine
                                        call={call}
                                        fallback="Unknown caller"
                                    />
                                    <p className="text-xs text-zinc-500">
                                        {[
                                            RECEIVING_AS[call.receiving_as],
                                            call.assignee_name &&
                                                call.receiving_as !==
                                                    'assignee' &&
                                                `lead of ${call.assignee_name}`,
                                            call.expires_in_seconds !== null &&
                                                `${call.expires_in_seconds}s`,
                                        ]
                                            .filter(Boolean)
                                            .join(' · ')}
                                    </p>
                                    {soundBlocked && (
                                        <p className="mt-1 text-[11px] text-amber-300">
                                            Click anywhere on the page to hear
                                            the ring.
                                        </p>
                                    )}
                                    <div className="mt-3 flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => void decline(call)}
                                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500"
                                        >
                                            <PhoneOff className="h-4 w-4" />
                                            Decline
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => void answer(call)}
                                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                                        >
                                            <Phone className="h-4 w-4" />
                                            Answer
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

function CallerLine({
    call,
    fallback,
}: {
    call: ActiveCall | null;
    fallback: string;
}) {
    if (!call) {
        return (
            <p className="mt-1 text-base font-semibold text-white">
                {fallback}
            </p>
        );
    }

    return (
        <div className="mt-1 min-w-0">
            <Link
                href={leadRoutes.show.url(call.lead.id)}
                className="block truncate text-base font-semibold text-white hover:underline"
            >
                {call.lead.name ?? fallback}
            </Link>
            <p className="truncate font-mono text-xs text-zinc-400">
                {[
                    call.lead.identifier,
                    call.lead.phone && `+${call.lead.phone}`,
                ]
                    .filter(Boolean)
                    .join(' · ')}
            </p>
        </div>
    );
}

function CallListener({
    adminId,
    onUpdate,
}: {
    adminId: number;
    onUpdate: (id: string, status: string) => void;
}) {
    useEcho<{ id: string; status: string }>(
        `admin.lead-calls.${adminId}`,
        '.call.updated',
        (event) => onUpdate(event.id, event.status),
        [onUpdate],
    );

    return null;
}

function clock(since: number | null): string {
    if (since === null) {
        return '0:00';
    }

    const seconds = Math.max(0, Math.floor((Date.now() - since) / 1000));

    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
