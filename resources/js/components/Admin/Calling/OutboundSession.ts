import type { CallApi } from './callApi';
import { CallError } from './callApi';

export type OutboundPhase =
    | 'starting'
    | 'ringing'
    | 'connecting'
    | 'connected'
    | 'failed'
    | 'closed';

const isUp = (state: string | undefined) =>
    state === 'connected' || state === 'completed';

/**
 * Calls a lead from the browser, in OptiFin's order: make an offer → the
 * CMS re-checks permission and asks Meta to dial (ringing) → when the lead
 * picks up, fetch their answer → connect the audio → confirm (only real
 * audio counts as "connected").
 */
export class OutboundSession {
    readonly kind = 'outbound';
    phase: OutboundPhase = 'starting';
    callId: string | null = null;
    error: CallError | null = null;
    muted = false;
    audioBlocked = false;
    reconnecting = false;
    connectedAt: number | null = null;

    private pc: RTCPeerConnection | null = null;
    private answering = false;
    private closed = false;
    private waiter: {
        resolve: () => void;
        reject: (e: Error) => void;
    } | null = null;

    constructor(
        public readonly leadId: string,
        public readonly leadName: string,
        private readonly api: CallApi,
        private readonly stream: MediaStream,
        private readonly audioEl: HTMLAudioElement | null,
        private readonly onChange: () => void,
        private readonly connectTimeoutMs = 20000,
    ) {}

    async start(): Promise<void> {
        try {
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

            for (const track of this.stream.getAudioTracks()) {
                track.enabled = false;
                pc.addTrack(track, this.stream);
            }

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            const result = await this.api.call(this.leadId, offer.sdp ?? '');
            this.callId = result.call.id;

            if (['failed', 'completed'].includes(result.call.status)) {
                throw new CallError('cancelled', 'The call was cancelled.');
            }

            this.setPhase('ringing');
        } catch (error) {
            this.fail(error);
        }
    }

    /** Called when the CMS reports the lead picked up. */
    async applyAnswer(): Promise<void> {
        if (
            this.closed ||
            this.answering ||
            this.phase !== 'ringing' ||
            !this.callId
        ) {
            return;
        }

        this.answering = true;
        this.setPhase('connecting');

        try {
            const result = await this.api.outboundAnswer(this.callId);
            const sdp = result.session?.sdp;

            if (!sdp) {
                throw new CallError('no_answer', 'The call could not connect.');
            }

            await this.pc?.setRemoteDescription({ type: 'answer', sdp });
            await this.waitForConnection();
            await this.api.outboundConnected(this.callId);
            this.stream
                .getAudioTracks()
                .forEach((t) => (t.enabled = !this.muted));
            this.connectedAt = Date.now();
            this.setPhase('connected');

            try {
                await this.audioEl?.play();
            } catch {
                this.audioBlocked = true;
                this.onChange();
            }
        } catch (error) {
            this.answering = false;
            this.fail(error);
        }
    }

    async retry(): Promise<void> {
        if (this.phase === 'failed' && this.error?.retryable && this.callId) {
            this.phase = 'ringing';
            await this.applyAnswer();
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

        try {
            this.pc?.close();
        } catch {
            // already closed
        }

        this.stream.getTracks().forEach((t) => t.stop());

        if (this.audioEl) {
            this.audioEl.pause();
            this.audioEl.srcObject = null;
        }

        this.pc = null;
    }

    private setPhase(phase: OutboundPhase): void {
        if (!this.closed) {
            this.phase = phase;
            this.onChange();
        }
    }

    private waitForConnection(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (isUp(this.pc?.connectionState ?? this.pc?.iceConnectionState)) {
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

        const state = this.pc?.connectionState ?? this.pc?.iceConnectionState;

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
        } else if (isUp(state)) {
            this.reconnecting = false;
        } else if (state === 'failed') {
            this.fail(
                new CallError(
                    'connection_lost',
                    'The audio connection was lost.',
                ),
            );

            return;
        }

        this.onChange();
    }

    private fail(error: unknown): void {
        if (this.closed) {
            return;
        }

        this.error =
            error instanceof CallError
                ? error
                : new CallError('webrtc', 'Could not set up the call.');
        this.setPhase('failed');
    }
}

/** Asks the call box (on every page) to call a lead. */
export function startLeadCall(leadId: string, leadName: string): void {
    window.dispatchEvent(
        new CustomEvent('cms:start-call', { detail: { leadId, leadName } }),
    );
}
