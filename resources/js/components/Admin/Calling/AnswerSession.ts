import type { CallApi } from './callApi';
import { CallError } from './callApi';

export type Phase =
    | 'claiming'
    | 'answering'
    | 'connecting'
    | 'accepting'
    | 'connected'
    | 'failed'
    | 'closed';

type Stage = 'claim' | 'answer' | 'wait' | 'accept' | 'done';

const isUp = (state: string | undefined) =>
    state === 'connected' || state === 'completed';

/**
 * Answers one WhatsApp call in the browser, in OptiFin's order:
 * claim (get the caller's offer) → answer (Meta pre_accept, microphone
 * still muted) → wait for the audio path to connect → accept (Meta
 * accept) → live. A step that fails with a "try again" error can be
 * retried from where it stopped.
 */
export class AnswerSession {
    readonly kind = 'inbound';
    phase: Phase = 'claiming';
    error: CallError | null = null;
    muted = false;
    audioBlocked = false;
    reconnecting = false;
    connectedAt: number | null = null;

    private stage: Stage = 'claim';
    private pc: RTCPeerConnection | null = null;
    private answerSdp: string | null = null;
    private waiter: {
        resolve: () => void;
        reject: (e: Error) => void;
    } | null = null;
    private closed = false;

    constructor(
        public readonly callId: string,
        private readonly api: CallApi,
        private readonly stream: MediaStream,
        private readonly audioEl: HTMLAudioElement | null,
        private readonly onChange: () => void,
        private readonly connectTimeoutMs = 20000,
    ) {}

    async run(): Promise<void> {
        if (this.closed) {
            return;
        }

        this.error = null;

        try {
            if (this.stage === 'claim') {
                this.setPhase('claiming');
                const claimed = await this.api.claim(this.callId);
                await this.negotiate(claimed.session?.sdp);
                this.stage = 'answer';
            }

            if (this.stage === 'answer') {
                this.setPhase('answering');
                await this.api.answer(this.callId, this.answerSdp ?? '');
                this.stage = 'wait';
            }

            if (this.stage === 'wait') {
                this.setPhase('connecting');
                await this.waitForConnection();
                this.stage = 'accept';
            }

            if (this.stage === 'accept') {
                this.setPhase('accepting');
                await this.api.accept(this.callId);
                this.stage = 'done';
                await this.goLive();
            }
        } catch (error) {
            if (!this.closed) {
                this.fail(error);
            }
        }
    }

    async retry(): Promise<void> {
        if (this.phase === 'failed' && this.error?.retryable) {
            await this.run();
        }
    }

    setMuted(muted: boolean): void {
        this.muted = muted;

        if (this.phase === 'connected') {
            this.stream.getAudioTracks().forEach((t) => (t.enabled = !muted));
        }

        this.onChange();
    }

    async enableAudio(): Promise<void> {
        try {
            await this.audioEl?.play();
            this.audioBlocked = false;
        } catch {
            this.audioBlocked = true;
        }

        this.onChange();
    }

    close(): void {
        if (this.closed) {
            return;
        }

        this.closed = true;
        this.phase = 'closed';
        this.waiter?.reject(new CallError('closed', 'closed'));

        if (this.pc) {
            this.pc.ontrack = null;
            this.pc.onconnectionstatechange = null;
            this.pc.oniceconnectionstatechange = null;

            try {
                this.pc.close();
            } catch {
                // already closed
            }
        }

        this.stream.getTracks().forEach((t) => {
            try {
                t.stop();
            } catch {
                // already stopped
            }
        });

        if (this.audioEl) {
            this.audioEl.pause();
            this.audioEl.srcObject = null;
        }

        this.pc = null;
    }

    private setPhase(phase: Phase): void {
        if (!this.closed) {
            this.phase = phase;
            this.onChange();
        }
    }

    private async negotiate(offer: string | undefined): Promise<void> {
        if (!offer) {
            throw new CallError('no_offer', 'The call could not be answered.');
        }

        const pc = new RTCPeerConnection({ iceServers: [] });
        this.pc = pc;
        pc.ontrack = (event) => {
            const remote = event.streams[0];

            if (remote && this.audioEl) {
                this.audioEl.srcObject = remote;
            }
        };
        pc.onconnectionstatechange = () => this.onPeerState();
        pc.oniceconnectionstatechange = () => this.onPeerState();

        await pc.setRemoteDescription({ type: 'offer', sdp: offer });

        // The microphone stays silent until the call is accepted.
        for (const track of this.stream.getAudioTracks()) {
            track.enabled = false;
            pc.addTrack(track, this.stream);
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        this.answerSdp = answer.sdp ?? null;
    }

    private peerState(): string | undefined {
        return this.pc?.connectionState ?? this.pc?.iceConnectionState;
    }

    private waitForConnection(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (isUp(this.peerState())) {
                resolve();

                return;
            }

            const timer = setTimeout(() => {
                this.waiter = null;
                reject(
                    new CallError(
                        'ice_timeout',
                        'Could not connect the audio in time.',
                    ),
                );
            }, this.connectTimeoutMs);

            this.waiter = {
                resolve: () => {
                    clearTimeout(timer);
                    this.waiter = null;
                    resolve();
                },
                reject: (e) => {
                    clearTimeout(timer);
                    this.waiter = null;
                    reject(e);
                },
            };
        });
    }

    private onPeerState(): void {
        if (this.closed) {
            return;
        }

        const state = this.peerState();

        if (this.waiter) {
            if (isUp(state)) {
                this.waiter.resolve();
            } else if (state === 'failed' || state === 'closed') {
                this.waiter.reject(
                    new CallError(
                        'ice_failed',
                        'The audio connection could not be set up.',
                    ),
                );
            }

            return;
        }

        if (this.phase !== 'connected') {
            return;
        }

        if (state === 'disconnected') {
            this.reconnecting = true;
            this.onChange();
        } else if (isUp(state)) {
            this.reconnecting = false;
            this.onChange();
        } else if (state === 'failed') {
            this.fail(
                new CallError(
                    'connection_lost',
                    'The audio connection was lost.',
                ),
            );
        }
    }

    private async goLive(): Promise<void> {
        this.stream.getAudioTracks().forEach((t) => (t.enabled = !this.muted));
        this.connectedAt = Date.now();
        this.setPhase('connected');

        try {
            await this.audioEl?.play();
        } catch {
            this.audioBlocked = true;
            this.onChange();
        }
    }

    private fail(error: unknown): void {
        this.error =
            error instanceof CallError
                ? error
                : new CallError(
                      'webrtc',
                      'Could not set up the audio connection.',
                  );
        this.setPhase('failed');
    }
}
