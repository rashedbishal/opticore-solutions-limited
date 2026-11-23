/**
 * A synthesized two-tone ring (no audio file). Browsers only allow sound
 * after the person has clicked something on the page, so the first click
 * anywhere "unlocks" it; until then `blocked` is true and the call box asks
 * for a click.
 */
export class Ringtone {
    private ctx: AudioContext | null = null;
    private timer: ReturnType<typeof setInterval> | null = null;
    private custom: HTMLAudioElement | null = null;
    private customUrl: string | null = null;
    blocked = true;

    /** Use the uploaded MP3 (null = the built-in tone). */
    setCustom(url: string | null): void {
        if (url === this.customUrl) {
            return;
        }

        this.custom?.pause();
        this.customUrl = url;
        this.custom = null;

        if (url) {
            this.custom = new Audio(url);
            this.custom.loop = true;
            this.custom.preload = 'auto';
        }
    }

    unlock(): void {
        try {
            this.ctx ??= new AudioContext();
            void this.ctx.resume().then(() => {
                this.blocked = this.ctx?.state !== 'running';
            });
        } catch {
            this.blocked = true;
        }
    }

    start(): void {
        if (this.custom) {
            if (this.custom.paused) {
                this.custom.currentTime = 0;
                this.custom
                    .play()
                    .then(() => (this.blocked = false))
                    .catch(() => (this.blocked = true));
            }

            return;
        }

        if (this.timer !== null) {
            return;
        }

        this.ring();
        this.timer = setInterval(() => this.ring(), 3000);
    }

    /** The "it's ringing on their side" tone while we call someone. */
    startRingback(): void {
        if (this.timer !== null) {
            return;
        }

        this.ringback();
        this.timer = setInterval(() => this.ringback(), 4000);
    }

    private ringback(): void {
        const ctx = this.ctx;

        if (!ctx || ctx.state !== 'running') {
            return;
        }

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 425;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.05, now + 0.03);
        gain.gain.setValueAtTime(0.05, now + 1);
        gain.gain.linearRampToValueAtTime(0, now + 1.05);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.1);
    }

    stop(): void {
        this.custom?.pause();

        if (this.timer !== null) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    private ring(): void {
        const ctx = this.ctx;

        if (!ctx || ctx.state !== 'running') {
            this.blocked = true;

            return;
        }

        this.blocked = false;
        const now = ctx.currentTime;

        for (const [offset, freq] of [
            [0, 440],
            [0, 480],
            [0.45, 440],
            [0.45, 480],
        ] as const) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0, now + offset);
            gain.gain.linearRampToValueAtTime(0.08, now + offset + 0.02);
            gain.gain.setValueAtTime(0.08, now + offset + 0.35);
            gain.gain.linearRampToValueAtTime(0, now + offset + 0.4);
            osc.connect(gain).connect(ctx.destination);
            osc.start(now + offset);
            osc.stop(now + offset + 0.42);
        }
    }
}
