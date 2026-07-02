import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';

// Single place to tune the overlay's opacity — 1 is fully opaque "no
// signal" static; lower it to let a hint of the page underneath bleed
// through.
const CRT_STATIC_OPACITY = 1;

// How much of the total duration the final power-on/off style collapse
// (screen squashes to a bright horizontal line, then expands and fades to
// reveal the page) eats into — the rest is the noise phase.
const TRANSITION_MS = 500;

interface CrtStaticIntroProps {
    durationMs?: number;
    opacity?: number;
    onComplete: () => void;
}

// Full-screen CRT "no signal" static intro, shown for a fixed duration
// before the admin login page reveals itself. Noise is Canvas-driven via
// requestAnimationFrame; scanlines, the rolling-interference band, and the
// closing power-transition are plain CSS since they don't need to change
// per-frame — keeping the JS loop to just the noise buffer is what makes
// 60fps easy to hold.
export default function CrtStaticIntro({
    durationMs = 2000,
    opacity = CRT_STATIC_OPACITY,
    onComplete,
}: CrtStaticIntroProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // Randomised once per mount so the rolling-interference band doesn't
    // sweep at the exact same moment on every page load.
    const [rollDelay] = useState(() => -(Math.random() * 4).toFixed(2));
    const [transitioning, setTransitioning] = useState(false);

    useEffect(() => {
        const reduceMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;

        // Rapid flashing black/white noise can be genuinely uncomfortable
        // for photosensitive users — skip straight to the login page for
        // anyone who has asked the OS to reduce motion.
        if (reduceMotion) {
            onComplete();

            return;
        }

        const staticMs = Math.max(0, durationMs - TRANSITION_MS);
        const transitionTimer = setTimeout(
            () => setTransitioning(true),
            staticMs,
        );
        const completeTimer = setTimeout(onComplete, durationMs);

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d', { alpha: false });

        if (!canvas || !ctx) {
            return () => {
                clearTimeout(transitionTimer);
                clearTimeout(completeTimer);
            };
        }

        // Render at a fraction of the viewport resolution — real analog
        // static reads as fine grain, not per-device-pixel noise, and a
        // small buffer keeps the per-frame randomize + putImageData cheap
        // enough to hold 60fps on a full-viewport canvas.
        const DOWNSCALE = 0.4;
        const width = Math.max(64, Math.round(window.innerWidth * DOWNSCALE));
        const height = Math.max(48, Math.round(window.innerHeight * DOWNSCALE));
        canvas.width = width;
        canvas.height = height;
        ctx.imageSmoothingEnabled = false;

        const imageData = ctx.createImageData(width, height);
        const pixels = imageData.data;
        const pixelCount = width * height;

        let rafId = 0;
        let stopped = false;
        let flashUntil = 0;
        let nextGlitchAt = performance.now() + 300 + Math.random() * 700;

        const draw = (now: number) => {
            if (stopped) {
                return;
            }

            if (now >= nextGlitchAt) {
                flashUntil = now + 50 + Math.random() * 90;
                nextGlitchAt = now + 500 + Math.random() * 900;
            }

            const glitching = now < flashUntil;

            // Slight per-frame brightness flicker, spiking brighter during
            // a glitch flash.
            const flicker = glitching
                ? 1.5 + Math.random() * 0.6
                : 0.82 + Math.random() * 0.36;

            for (let i = 0; i < pixelCount; i++) {
                const shade = Math.min(255, Math.random() * 255 * flicker);
                const offset = i * 4;
                pixels[offset] = shade;
                pixels[offset + 1] = shade;
                pixels[offset + 2] = shade;
                pixels[offset + 3] = 255;
            }

            ctx.putImageData(imageData, 0, 0);

            // Brief horizontal jolt during a glitch flash.
            canvas.style.transform = glitching
                ? `translateX(${((Math.random() - 0.5) * 16).toFixed(1)}px)`
                : 'translateX(0)';

            rafId = requestAnimationFrame(draw);
        };

        rafId = requestAnimationFrame(draw);

        // Stop drawing noise once the closing transition starts — the
        // canvas is about to be squashed to a sliver and faded out, so
        // there's no point still paying for putImageData underneath it.
        const stopDrawTimer = setTimeout(() => {
            stopped = true;
            cancelAnimationFrame(rafId);
        }, staticMs);

        return () => {
            stopped = true;
            cancelAnimationFrame(rafId);
            clearTimeout(stopDrawTimer);
            clearTimeout(transitionTimer);
            clearTimeout(completeTimer);
        };
    }, [durationMs, onComplete]);

    return (
        <div
            className={`fixed inset-0 z-[999] overflow-hidden bg-black ${transitioning ? 'crt-power-transition' : ''}`}
            style={
                {
                    opacity,
                    '--crt-opacity': opacity,
                } as CSSProperties
            }
        >
            <canvas
                ref={canvasRef}
                className="h-full w-full"
                style={{ imageRendering: 'pixelated' }}
            />

            {/* Scanlines, vignette, and the roll band are only meaningful
                at full size — once the power-transition starts squashing
                this container down to a sliver, the vignette's fixed-size
                blur (18vw) would dwarf the collapsed height and paint the
                whole line/dot solid black, hiding it entirely. Drop them
                as soon as the transition begins. */}
            {!transitioning && (
                <>
                    <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                            backgroundImage:
                                'repeating-linear-gradient(to bottom, rgba(0,0,0,0.35) 0px, rgba(0,0,0,0.35) 1px, transparent 1px, transparent 3px)',
                        }}
                    />

                    <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                            boxShadow: 'inset 0 0 18vw 4vw rgba(0,0,0,0.65)',
                        }}
                    />

                    <div
                        className="crt-roll-band pointer-events-none absolute inset-x-0 h-24"
                        style={{ animationDelay: `${rollDelay}s` }}
                    />
                </>
            )}

            <style>{`
                @keyframes crt-roll {
                    0%, 55% { top: -20%; opacity: 0; }
                    58% { opacity: 0.35; }
                    72% { opacity: 0.2; }
                    78%, 100% { top: 120%; opacity: 0; }
                }
                .crt-roll-band {
                    animation: crt-roll 4s linear infinite;
                    background: linear-gradient(
                        to bottom,
                        transparent,
                        rgba(255, 255, 255, 0.5),
                        transparent
                    );
                }

                /* Classic CRT power-off collapse, paced unevenly on purpose
                   — a real tube snaps shut, not glides: fast vertical
                   collapse, a held glowing beat as a full-width line, a
                   fast shrink toward a point, a brighter held glow as that
                   point, then a small overshoot "pop" before it snaps to
                   nothing. Never re-expands, so the login page underneath
                   is revealed once and stays revealed. */
                @keyframes crt-power-transition {
                    0% {
                        transform: scaleY(1) scaleX(1);
                        opacity: var(--crt-opacity);
                        filter: brightness(1) contrast(1) drop-shadow(0 0 0 rgba(255, 255, 255, 0));
                    }
                    14% {
                        transform: scaleY(0.0025) scaleX(1);
                        opacity: var(--crt-opacity);
                        filter: brightness(2.6) contrast(1.8) drop-shadow(0 0 30px rgba(255, 255, 255, 0.95));
                    }
                    34% {
                        transform: scaleY(0.0025) scaleX(1);
                        opacity: var(--crt-opacity);
                        filter: brightness(2.1) contrast(1.6) drop-shadow(0 0 22px rgba(255, 255, 255, 0.8));
                    }
                    56% {
                        transform: scaleY(0.003) scaleX(0.06);
                        opacity: var(--crt-opacity);
                        filter: brightness(3) contrast(1.9) drop-shadow(0 0 42px rgba(255, 255, 255, 1));
                    }
                    72% {
                        transform: scaleY(0.004) scaleX(0.13);
                        opacity: var(--crt-opacity);
                        filter: brightness(4) contrast(2.1) drop-shadow(0 0 60px rgba(255, 255, 255, 1));
                    }
                    88% {
                        transform: scaleY(0.002) scaleX(0.03);
                        opacity: var(--crt-opacity);
                        filter: brightness(3) contrast(1.9) drop-shadow(0 0 30px rgba(255, 255, 255, 1));
                    }
                    100% {
                        transform: scaleY(0.001) scaleX(0);
                        opacity: 0;
                        filter: brightness(3) contrast(1.9) drop-shadow(0 0 0 rgba(255, 255, 255, 0));
                    }
                }
                .crt-power-transition {
                    animation: crt-power-transition ${TRANSITION_MS}ms ease-in-out forwards;
                    transform-origin: center;
                }
            `}</style>
        </div>
    );
}
