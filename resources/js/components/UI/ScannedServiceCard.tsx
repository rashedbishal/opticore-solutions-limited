/**
 * ScannedServiceCard.tsx  (v3 – scanner position fixed)
 *
 * Usage in Index.tsx:
 *   import { ServiceCarousel } from '@/components/UI/ScannedServiceCard';
 *   <ServiceCarousel services={duplicatedServices} />
 */

import type { ServiceItem, PortfolioItem } from '@/types';
import { useEffect, useRef, useCallback } from 'react';
import ServiceCard from './ServiceCard';

// ─── ASCII code-text generator ───────────────────────────────────────────────
function generateCode(cols: number, rows: number): string {
    const snippets = [
        '// compiled preview • scanner demo',
        'const SCAN_WIDTH = 8;',
        'const FADE_ZONE = 35;',
        'function clamp(n,a,b){return Math.max(a,Math.min(b,n));}',
        'function lerp(a,b,t){return a+(b-a)*t;}',
        'const now=()=>performance.now();',
        'class Particle{constructor(x,y,vx,vy){this.x=x;this.y=y;this.vx=vx;this.vy=vy;}}',
        'ctx.globalCompositeOperation="lighter";',
        'const scanner={x:0,width:SCAN_WIDTH,glow:3.5};',
        'requestAnimationFrame(tick);',
        'if(state.intensity>1.2){scanner.glow+=0.01;}',
        'const bounds={w:window.innerWidth,h:300};',
    ];

    for (let i = 0; i < 40; i++) {
        snippets.push(
            `const v${i}=(${(Math.random() * 9 + 1) | 0}+${(Math.random() * 90 + 10) | 0})*0.${(Math.random() * 9 + 1) | 0};`,
        );
    }

    let flow = snippets.join(' ').replace(/\s+/g, ' ').trim();

    while (flow.length < cols * rows + cols) {
        flow += ' ' + snippets[(Math.random() * snippets.length) | 0].replace(/\s+/g, ' ');
    }

    let out = '';

    for (let r = 0; r < rows; r++) {
        let line = flow.slice(r * cols, r * cols + cols);

        if (line.length < cols) {
line = line.padEnd(cols, ' ');
}

        out += line + (r < rows - 1 ? '\n' : '');
    }

    return out;
}

// ─── ParticleScanner ─────────────────────────────────────────────────────────
// All drawing coordinates are in canvas-pixel space.
// canvas.width is always set = canvas.offsetWidth so 1 canvas-px == 1 CSS-px.

interface Particle {
    x: number; y: number;
    vx: number; vy: number;
    alpha: number; radius: number;
    life: number; decay: number;
}

class ParticleScanner {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private w = 0;
    private h = 310;
    private barX = 0;          // in canvas pixels
    private readonly barW = 8;
    scanningActive = false;

    private particles: Record<number, Particle> = {};
    private count = 0;

    private readonly baseI: number; private readonly scanI: number;
    private readonly baseP: number; private readonly scanP: number;
    private readonly baseF = 40;   private readonly scanF = 20;
    private readonly spd = 0.04;

    private curI: number; private curP: number; private curF: number;
    private intensity: number; private maxP: number; private fadeZ: number;
    private glowI = 1;

    private gradCanvas: HTMLCanvasElement;
    private rafId = 0;

    constructor(canvas: HTMLCanvasElement, isMobile = false) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;

        // Adjust density based on device
        this.baseI = isMobile ? 0.02 : 0.08;
        this.scanI = isMobile ? 0.05 : 0.35;
        this.baseP = isMobile ? 100  : 300;
        this.scanP = isMobile ? 200  : 1200;

        this.curI = this.intensity = this.baseI;
        this.curP = this.maxP = this.baseP;
        this.curF = this.fadeZ = this.baseF;

        this.gradCanvas = document.createElement('canvas');
        this.gradCanvas.width = this.gradCanvas.height = 40;
        const gc = this.gradCanvas.getContext('2d')!;
        const g = gc.createRadialGradient(20, 20, 0, 20, 20, 20);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(0.3, 'rgba(200,180,255,0.8)');
        g.addColorStop(1, 'rgba(139,92,246,0)');
        gc.fillStyle = g;
        gc.beginPath(); gc.arc(20, 20, 20, 0, Math.PI * 2); gc.fill();
    }

    /**
     * Sync canvas resolution to its DOM size and update bar position.
     * barXcss = scanner X in CSS pixels relative to the canvas left edge.
     */
    sync(barXcss: number) {
        const w = this.canvas.offsetWidth;
        const h = this.canvas.offsetHeight;

        if (w > 0) {
 this.canvas.width = w;  this.w = w; 
}

        if (h > 0) {
 this.canvas.height = h; this.h = h; 
}

        this.barX = barXcss;
    }

    private rng(a: number, b: number) {
 return Math.random() * (b - a) + a; 
}

    private mkP(): Particle {
        return {
            x: Math.round(this.barX + (Math.random() - 0.5) * this.barW),
            y: Math.round(Math.random() * this.h),
            vx: 0.2 + Math.random() * 0.8,
            vy: (Math.random() - 0.5) * 0.3,
            alpha: 0.6 + Math.random() * 0.4,
            radius: 3 + Math.random() * 5,
            life: 1,
            decay: 0.002 + Math.random() * 0.004,
        };
    }

    private updateP(p: Particle) {
        p.x += p.vx; p.y += p.vy; p.life -= p.decay;

        if (p.x > this.w + 10 || p.life <= 0) {
Object.assign(p, this.mkP());
}
    }

    private drawP(p: Particle) {
        if (p.life <= 0) {
return;
}

        let fa = 1;

        if (p.y < this.fadeZ) {
fa = p.y / this.fadeZ;
} else if (p.y > this.h - this.fadeZ) {
fa = (this.h - p.y) / this.fadeZ;
}

        this.ctx.globalAlpha = p.alpha * Math.max(0, Math.min(1, fa));
        this.ctx.drawImage(this.gradCanvas,
            p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2);
    }

    private drawBar() {
        const { ctx, w, h, barX: x, barW: lw, fadeZ, glowI: gi } = this;

        const vg = ctx.createLinearGradient(0, 0, 0, h);
        vg.addColorStop(0, 'rgba(255,255,255,0)');
        vg.addColorStop(Math.min(fadeZ / h, 0.49), 'rgba(255,255,255,1)');
        vg.addColorStop(Math.max(1 - fadeZ / h, 0.51), 'rgba(255,255,255,1)');
        vg.addColorStop(1, 'rgba(255,255,255,0)');

        ctx.globalCompositeOperation = 'lighter';

        const fill = (rx: number, ry: number, rw: number, rh: number, r: number) => {
            ctx.beginPath();

            if (ctx.roundRect) {
ctx.roundRect(rx, ry, rw, rh, r);
} else {
ctx.rect(rx, ry, rw, rh);
}

            ctx.fill();
        };

        const cg = ctx.createLinearGradient(x - lw / 2, 0, x + lw / 2, 0);
        cg.addColorStop(0, 'rgba(255,255,255,0)');
        cg.addColorStop(0.5, `rgba(255,255,255,${gi})`);
        cg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalAlpha = 1; ctx.fillStyle = cg;
        fill(x - lw / 2, 0, lw, h, 15);

        const g1 = ctx.createLinearGradient(x - lw * 2, 0, x + lw * 2, 0);
        g1.addColorStop(0, 'rgba(139,92,246,0)');
        g1.addColorStop(0.5, `rgba(196,181,253,${0.8 * gi})`);
        g1.addColorStop(1, 'rgba(139,92,246,0)');
        ctx.globalAlpha = this.scanningActive ? 1 : 0.8; ctx.fillStyle = g1;
        fill(x - lw * 2, 0, lw * 4, h, 25);

        const g2 = ctx.createLinearGradient(x - lw * 4, 0, x + lw * 4, 0);
        g2.addColorStop(0, 'rgba(139,92,246,0)');
        g2.addColorStop(0.5, `rgba(139,92,246,${0.4 * gi})`);
        g2.addColorStop(1, 'rgba(139,92,246,0)');
        ctx.globalAlpha = this.scanningActive ? 0.8 : 0.6; ctx.fillStyle = g2;
        fill(x - lw * 4, 0, lw * 8, h, 35);

        ctx.globalCompositeOperation = 'destination-in';
        ctx.globalAlpha = 1; ctx.fillStyle = vg;
        ctx.fillRect(0, 0, w, h);
    }

    private render() {
        const tI = this.scanningActive ? this.scanI : this.baseI;
        const tP = this.scanningActive ? this.scanP : this.baseP;
        const tF = this.scanningActive ? this.scanF : this.baseF;
        this.curI += (tI - this.curI) * this.spd;
        this.curP += (tP - this.curP) * this.spd;
        this.curF += (tF - this.curF) * this.spd;
        this.intensity = this.curI; this.maxP = this.curP | 0; this.fadeZ = this.curF;
        this.glowI += ((this.scanningActive ? 3.5 : 1) - this.glowI) * this.spd;

        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.clearRect(0, 0, this.w, this.h);
        this.drawBar();

        this.ctx.globalCompositeOperation = 'lighter';

        for (let i = 1; i <= this.count; i++) {
            if (this.particles[i]) {
 this.updateP(this.particles[i]); this.drawP(this.particles[i]); 
}
        }

        const add = () => {
 if (this.count < this.maxP) {
this.particles[++this.count] = this.mkP();
} 
};
        const ir = this.intensity / this.baseI;

        if (Math.random() < this.intensity) {
add();
}

        if (ir > 1.1 && Math.random() < (ir - 1)   * 1.2) {
add();
}

        if (ir > 1.3 && Math.random() < (ir - 1.3) * 1.4) {
add();
}

        if (ir > 1.5 && Math.random() < (ir - 1.5) * 1.8) {
add();
}

        if (ir > 2.0 && Math.random() < (ir - 2)   * 2.0) {
add();
}

        if (this.count > this.maxP + 200) {
            const ex = Math.min(15, this.count - this.maxP);

            for (let i = 0; i < ex; i++) {
delete this.particles[this.count - i];
}

            this.count -= ex;
        }
    }

    animate() {
        this.render();
        this.rafId = requestAnimationFrame(() => this.animate());
    }
    pause() {
        cancelAnimationFrame(this.rafId);
        this.rafId = 0;
    }
    resume() {
        if (!this.rafId) {
            this.animate();
        }
    }
    destroy() {
        cancelAnimationFrame(this.rafId);
        this.particles = {};
        this.count = 0;
    }
}

// ─── Constants ───────────────────────────────────────────────────────────────
const CARD_W    = 280;
const CARD_H    = 340;
const CARD_GAP  = 20;
const FONT_SIZE = 10;
const LINE_H    = 12;
const CHAR_W    = 6;
const CODE_COLS = Math.floor(CARD_W / CHAR_W);
const CODE_ROWS = Math.floor(CARD_H / LINE_H);
const CANVAS_H  = 380;

// ─── Public export ────────────────────────────────────────────────────────────
export function ServiceCarousel({ 
    services, 
    featuredPortfolios 
}: { 
    services: ServiceItem[],
    featuredPortfolios: Record<string, PortfolioItem[]>
}) {
    // We now always return the scanned carousel for that premium feel
    return (
        <ScannedCarousel 
            services={services} 
            featuredPortfolios={featuredPortfolios} 
        />
    );
}

// ── Scanned Carousel ─────────────────────────────────────────────────────────
function ScannedCarousel({ 
    services, 
    featuredPortfolios 
}: { 
    services: ServiceItem[], 
    featuredPortfolios: Record<string, PortfolioItem[]>
}) {
    const doubled = [...services, ...services];

    const rootRef    = useRef<HTMLDivElement>(null);
    const trackRef   = useRef<HTMLDivElement>(null);
    const canvasRef  = useRef<HTMLCanvasElement>(null);
    const scannerRef = useRef<ParticleScanner | null>(null);
    const asciiRefs  = useRef<(HTMLPreElement | null)[]>([]);
    const initialCodes = useRef(doubled.map(() => generateCode(CODE_COLS, CODE_ROWS)));

    const state = useRef({
        pos: 0, vel: 220, dir: -1 as 1 | -1,
        running: true, dragging: false,
        lastX: 0, mouseVel: 0, lastT: 0,
        trackW: (CARD_W + CARD_GAP) * doubled.length,
        animId: 0, clipId: 0,
        frame: 0,
    });

    // bar X in CANVAS pixels = rootRef.offsetWidth / 2
    // (canvas left edge == root left edge, so same coordinate system)
    const getBarX = useCallback(() => {
        const w = rootRef.current?.offsetWidth ?? window.innerWidth;
        const isMobile = w < 1024;

        return isMobile ? w * 0.75 : w / 2;
    }, []);

    // scanner X in ABSOLUTE page coords (for getBoundingClientRect)
    const getScanPageX = useCallback(() => {
        if (!rootRef.current) {
            return window.innerWidth / 2;
        }

        const r = rootRef.current.getBoundingClientRect();
        const isMobile = r.width < 1024;

        return isMobile ? r.left + r.width * 0.75 : r.left + r.width / 2;
    }, []);

    // ── clip loop ─────────────────────────────────────────────────────────────
    const updateClip = useCallback(function tick() {
        if (!trackRef.current) {
            return;
        }

        // Optimization: only update clipPath every other frame to save CPU
        state.current.frame++;

        if (state.current.frame % 2 !== 0) {
            state.current.clipId = requestAnimationFrame(tick);

            return;
        }

        const scanX = getScanPageX();
        const hw = 4;
        const scanL = scanX - hw;
        const scanR = scanX + hw;
        let anyScanning = false;

        trackRef.current.querySelectorAll<HTMLElement>('.ssc-wrapper').forEach((w) => {
            const rect   = w.getBoundingClientRect();
            const cw     = rect.width;
            const normal = w.querySelector<HTMLElement>('.ssc-normal');
            const ascii  = w.querySelector<HTMLElement>('.ssc-ascii');

            if (!normal || !ascii) {
                return;
            }

            if (rect.left < scanR && rect.right > scanL && cw > 0) {
                anyScanning = true;
                const intL = Math.max(scanL - rect.left, 0);
                const intR = Math.min(scanR - rect.left, cw);
                normal.style.clipPath = `inset(0 ${((cw - intL) / cw * 100).toFixed(2)}% 0 0)`;
                ascii.style.clipPath  = `inset(0 0 0 ${(intR / cw * 100).toFixed(2)}%)`;

                if (!w.dataset.flashed && intL > 2) {
                    w.dataset.flashed = '1';
                    const fx = document.createElement('div');
                    fx.className = 'ssc-flash';
                    w.appendChild(fx);
                    setTimeout(() => fx.remove(), 600);
                }
            } else if (rect.right <= scanL) {
                // fully left of scanner → show normal card
                normal.style.clipPath = 'inset(0 0% 0 0)';
                ascii.style.clipPath  = 'inset(0 0 0 100%)';
                delete w.dataset.flashed;
            } else {
                // fully right of scanner → show ASCII
                normal.style.clipPath = 'inset(0 100% 0 0)';
                ascii.style.clipPath  = 'inset(0 0 0 0%)';
                delete w.dataset.flashed;
            }
        });

        if (scannerRef.current) {
            scannerRef.current.scanningActive = anyScanning;
        }

        state.current.clipId = requestAnimationFrame(tick);
    }, [getScanPageX]);

    // ── scroll loop ───────────────────────────────────────────────────────────
    const animateTrack = useCallback(function frame() {
        const s = state.current;
        const now = performance.now();
        const dt = Math.min((now - s.lastT) / 1000, 0.05);
        s.lastT = now;

        if (s.running && !s.dragging) {
            s.vel = Math.max(150, s.vel * 0.995);
            s.pos += s.vel * s.dir * dt;
            const rootW = rootRef.current?.offsetWidth ?? window.innerWidth;

            if (s.pos < -s.trackW) {
                s.pos = rootW;
            } else if (s.pos > rootW) {
                s.pos = -s.trackW;
            }

            if (trackRef.current) {
                trackRef.current.style.transform = `translate3d(${s.pos}px, -50%, 0)`;
            }
        }

        s.animId = requestAnimationFrame(frame);
    }, []);

    // ── drag ──────────────────────────────────────────────────────────────────
    const startDrag = useCallback((clientX: number) => {
        const s = state.current;
        s.dragging = true; s.running = false; s.lastX = clientX; s.mouseVel = 0;

        if (trackRef.current) {
            const m = new DOMMatrix(window.getComputedStyle(trackRef.current).transform);
            s.pos = m.m41;
        }

        document.body.style.cursor = 'grabbing';
    }, []);

    const onDrag = useCallback((clientX: number) => {
        const s = state.current;

        if (!s.dragging) {
            return;
        }

        const dx = clientX - s.lastX;
        s.pos += dx; s.mouseVel = dx * 60; s.lastX = clientX;

        if (trackRef.current) {
            trackRef.current.style.transform = `translate3d(${s.pos}px, -50%, 0)`;
        }
    }, []);

    const endDrag = useCallback(() => {
        const s = state.current;

        if (!s.dragging) {
            return;
        }

        s.dragging = false;
        s.vel = Math.abs(s.mouseVel) > 30 ? Math.abs(s.mouseVel) : 80;
        s.dir = (s.mouseVel >= 0 ? -1 : 1) as 1 | -1;
        s.running = true;
        document.body.style.cursor = '';
    }, []);

    // ── init ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        const s = state.current;
        s.trackW = (CARD_W + CARD_GAP) * doubled.length;
        s.pos    = rootRef.current?.offsetWidth ?? window.innerWidth;
        s.lastT  = performance.now();

        if (canvasRef.current && rootRef.current) {
            const cv = canvasRef.current;
            // Explicit CSS size first so offsetWidth/Height are readable
            cv.style.width  = rootRef.current.offsetWidth + 'px';
            cv.style.height = CANVAS_H + 'px';
            const isMobile = window.innerWidth < 1024;
            const ps = new ParticleScanner(cv, isMobile);
            ps.sync(getBarX());   // barX = center of root container in canvas coords
            scannerRef.current = ps;
            ps.animate();
        }

        animateTrack();
        updateClip();

        const asciiTimer = setInterval(() => {
            const scanX = getScanPageX();
            const hw = 100; // Only update cards near the scanner

            asciiRefs.current.forEach((el) => {
                if (!el) {
                    return;
                }

                const rect = el.getBoundingClientRect();
                const isNearScanner =
                    rect.left < scanX + hw && rect.right > scanX - hw;

                if (isNearScanner && Math.random() < 0.2) {
                    el.textContent = generateCode(CODE_COLS, CODE_ROWS);
                }
            });
        }, 400);

        const onResize = () => {
            s.trackW = (CARD_W + CARD_GAP) * doubled.length;

            if (canvasRef.current && rootRef.current && scannerRef.current) {
                canvasRef.current.style.width = rootRef.current.offsetWidth + 'px';
                scannerRef.current.sync(getBarX());
            }
        };
        window.addEventListener('resize', onResize);

        const mm = (e: MouseEvent)  => onDrag(e.clientX);
        const tm = (e: TouchEvent) => {
            if (state.current.dragging) {
                e.preventDefault();
                onDrag(e.touches[0].clientX);
            }
        };
        document.addEventListener('mousemove', mm);
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchmove', tm, { passive: false });
        document.addEventListener('touchend', endDrag);

        // ── Pause all loops when tab is hidden or component scrolls off-screen ──
        const pause = () => {
            cancelAnimationFrame(s.animId); s.animId = 0;
            cancelAnimationFrame(s.clipId); s.clipId = 0;
            scannerRef.current?.pause();
        };
        const resume = () => {
            if (!s.animId) {
                s.lastT = performance.now();
                animateTrack();
            }

            if (!s.clipId) {
                updateClip();
            }

            scannerRef.current?.resume();
        };
        const onVisibility = () =>
            document.visibilityState === 'hidden' ? pause() : resume();
        document.addEventListener('visibilitychange', onVisibility);

        const intersectObs = new IntersectionObserver(
            ([entry]) => (entry.isIntersecting ? resume() : pause()),
            { threshold: 0.01 },
        );

        if (rootRef.current) {
            intersectObs.observe(rootRef.current);
        }

        return () => {
            cancelAnimationFrame(s.animId);
            cancelAnimationFrame(s.clipId);
            clearInterval(asciiTimer);
            window.removeEventListener('resize', onResize);
            document.removeEventListener('mousemove', mm);
            document.removeEventListener('mouseup', endDrag);
            document.removeEventListener('touchmove', tm);
            document.removeEventListener('touchend', endDrag);
            document.removeEventListener('visibilitychange', onVisibility);
            intersectObs.disconnect();
            scannerRef.current?.destroy();
        };
    }, [
        animateTrack,
        updateClip,
        onDrag,
        endDrag,
        getBarX,
        getScanPageX,
        doubled.length,
    ]);

    return (
        <>
            <style>{`
                .ssc-flash {
                    position:absolute; inset:0;
                    background:linear-gradient(90deg,transparent,rgba(0,255,255,.35),transparent);
                    animation:sscFlash .6s ease-out forwards;
                    pointer-events:none; z-index:10; border-radius:inherit;
                }
                @keyframes sscFlash {
                    0%  { transform:translateX(-100%); opacity:0; }
                    40% { opacity:1; }
                    100%{ transform:translateX(100%);  opacity:0; }
                }
                @keyframes sscGlitch {
                    0%  { opacity:1;    }
                    48% { opacity:.82;  }
                    50% { opacity:1;    }
                    98% { opacity:.88;  }
                    100%{ opacity:1;    }
                }
                .ssc-ascii-pre { animation:sscGlitch .12s infinite linear alternate-reverse; }
            `}</style>

            <div
                ref={rootRef}
                style={{ position:'relative', width:'100%', height:CARD_H+40, overflow:'hidden' }}
            >
                {/* Canvas — left:0 aligns its coordinate origin with rootRef's left edge */}
                <canvas
                    ref={canvasRef}
                    style={{
                        position:'absolute', top:'50%', left:0,
                        transform:'translateY(-50%)',
                        zIndex:15, pointerEvents:'none',
                    }}
                />

                {/* Card track */}
                <div
                    ref={trackRef}
                    onMouseDown={(e) => startDrag(e.clientX)}
                    onTouchStart={(e) => {
                        startDrag(e.touches[0].clientX); 
                    }}
                    onWheel={(e) => {
                        e.preventDefault(); state.current.pos += e.deltaY > 0 ? 20 : -20; 
                    }}
                    style={{
                        display:'flex', alignItems:'center', gap:CARD_GAP,
                        position:'absolute', top:'50%', left:0,
                        transform:'translateX(0) translateY(-50%)',
                        cursor:'grab', userSelect:'none', willChange:'transform', zIndex:5,
                    }}
                >
                    {doubled.map((service, i) => (
                        <div
                            key={`${service.key}-${i}`}
                            className="ssc-wrapper"
                            style={{
                                position:'relative', width:CARD_W, height:CARD_H,
                                flexShrink:0, borderRadius:'1.5rem', overflow:'hidden',
                                willChange: 'transform, clip-path',
                            }}
                        >
                            {/* Normal card — revealed to the LEFT of the scanner */}
                            <div
                                className="ssc-normal"
                                style={{
                                    position:'absolute', inset:0, zIndex:2,
                                    clipPath:'inset(0 100% 0 0)',
                                    borderRadius:'inherit', overflow:'hidden',
                                }}
                            >
                                <ServiceCard 
                                    service={service} 
                                    portfolios={featuredPortfolios[service.key]}
                                    className="h-full w-full rounded-[1.5rem]" 
                                />
                            </div>

                            {/* ASCII card — shown to the RIGHT of the scanner */}
                            <div
                                className="ssc-ascii"
                                style={{
                                    position:'absolute', inset:0, zIndex:1,
                                    clipPath:'inset(0 0 0 100%)',
                                    borderRadius:'inherit', overflow:'hidden',
                                    background:'#0a0a0f',
                                }}
                            >
                                <pre
                                    ref={(el) => {
                                        asciiRefs.current[i] = el; 
                                    }}
                                    className="ssc-ascii-pre"
                                    style={{
                                        position:'absolute', inset:0, margin:0, padding:4,
                                        color:'rgba(180,160,255,.55)',
                                        fontFamily:"'Courier New',monospace",
                                        fontSize:FONT_SIZE, lineHeight:`${LINE_H}px`,
                                        whiteSpace:'pre', overflow:'hidden',
                                        WebkitMaskImage:'linear-gradient(to right,rgba(0,0,0,1) 0%,rgba(0,0,0,.85) 40%,rgba(0,0,0,.5) 70%,rgba(0,0,0,.2) 100%)',
                                        maskImage:       'linear-gradient(to right,rgba(0,0,0,1) 0%,rgba(0,0,0,.85) 40%,rgba(0,0,0,.5) 70%,rgba(0,0,0,.2) 100%)',
                                    }}
                                >
                                    {initialCodes.current[i]}
                                </pre>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

export default ServiceCarousel;