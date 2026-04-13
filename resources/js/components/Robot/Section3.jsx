import React from 'react';
import { Cpu, Layers, Zap, Activity } from 'lucide-react';

/**
 * Section 3: Processing Mode
 *
 * High-intensity processing mode.
 * Features:
 * - Layered parallax effects
 * - Energy visualization
 * - Processing metrics
 */
const AnimatedProgressBar = ({ initialValue }) => {
    const [value, setValue] = React.useState(parseInt(initialValue));

    React.useEffect(() => {
        const interval = setInterval(() => {
            const change = Math.floor(Math.random() * 21) - 10; // -10 to +10
            setValue((prev) => {
                const next = prev + change;
                return Math.min(Math.max(next, 70), 100); // Keep between 70% and 100%
            });
        }, 1000 + Math.random() * 2000); // Random interval between 1-3s

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative z-10">
            <div className="text-2xl font-bold text-white">{value}%</div>
            <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all duration-1000 ease-in-out"
                    style={{ width: `${value}%` }}
                />
            </div>
        </div>
    );
};

export default function Section3() {
    const processSteps = [
        { icon: Layers, label: 'Design Development', value: '87%' },
        { icon: Cpu, label: 'Content Creation', value: '94%' },
        { icon: Zap, label: 'Campaign Optimization', value: '92%' },
        { icon: Activity, label: 'Performance Scaling', value: '96%' },
    ];

    return (
        <section
            id="robot-section-3"
            className="section-shell relative flex min-h-screen items-center overflow-hidden"
        >
            <style>{`
        @keyframes waveDrift1 {
          0%   { d: path("M0,55 Q150,20 300,55 T600,55 T900,55 T1200,55"); }
          25%  { d: path("M0,45 Q150,80 300,45 T600,45 T900,45 T1200,45"); }
          50%  { d: path("M0,60 Q150,25 300,60 T600,60 T900,60 T1200,60"); }
          75%  { d: path("M0,40 Q150,75 300,40 T600,40 T900,40 T1200,40"); }
          100% { d: path("M0,55 Q150,20 300,55 T600,55 T900,55 T1200,55"); }
        }
        @keyframes waveDrift2 {
          0%   { d: path("M0,50 Q200,85 400,50 T800,50 T1200,50"); }
          30%  { d: path("M0,65 Q200,30 400,65 T800,65 T1200,65"); }
          60%  { d: path("M0,45 Q200,80 400,45 T800,45 T1200,45"); }
          100% { d: path("M0,50 Q200,85 400,50 T800,50 T1200,50"); }
        }
        @keyframes waveDrift3 {
          0%   { d: path("M0,60 Q100,30 250,60 T500,60 T750,60 T1000,60 T1200,60"); }
          40%  { d: path("M0,40 Q100,70 250,40 T500,40 T750,40 T1000,40 T1200,40"); }
          80%  { d: path("M0,55 Q100,25 250,55 T500,55 T750,55 T1000,55 T1200,55"); }
          100% { d: path("M0,60 Q100,30 250,60 T500,60 T750,60 T1000,60 T1200,60"); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes shimmerMove {
          0%   { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -400; }
        }
        .wave-1 { animation: waveDrift1 8s ease-in-out infinite; }
        .wave-2 { animation: waveDrift2 11s ease-in-out infinite reverse; }
        .wave-3 { animation: waveDrift3 6s ease-in-out infinite; }
        .wave-shimmer { 
          stroke-dasharray: 80 320;
          animation: shimmerMove 3s linear infinite;
        }
        .wave-glow { animation: glowPulse 3s ease-in-out infinite; }
      `}</style>
            {/* Background with animated gradient */}
            <div className="absolute inset-0">
                <div
                    className="absolute inset-0 opacity-30"
                    style={{
                        background:
                            'radial-gradient(circle at 30% 50%, rgba(139, 92, 246, 0.3) 0%, transparent 50%)',
                    }}
                />
                <div
                    className="absolute inset-0 opacity-30"
                    style={{
                        background:
                            'radial-gradient(circle at 70% 50%, rgba(6, 182, 212, 0.3) 0%, transparent 50%)',
                    }}
                />
            </div>

            <div className="section-inner relative z-10">
                {/* Header */}
                <div className="mb-16 text-center">
                    <span className="section-kicker mb-4 inline-flex items-center gap-2">
                        <Cpu className="h-4 w-4" />
                        PHASE 02 : DEVELOPMENT
                    </span>

                    <h2 className="mb-6 text-balance text-3xl font-bold text-white sm:text-4xl md:text-5xl">
                        Creative Development
                        <br />
                        <span className="text-violet-400">& Smart Execution</span>
                    </h2>

                    <p className="mx-auto max-w-2xl text-base text-zinc-400 sm:text-lg">
                        We turn strategy into impactful visuals and campaigns
                        through design, content, and performance-driven
                        execution.
                    </p>
                </div>

                {/* Processing grid */}
                <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                    {processSteps.map((step) => (
                        <div
                            key={step.label}
                            className="glass-panel relative overflow-hidden rounded-2xl border border-violet-500/20 p-6 text-center"
                        >
                            {/* Animated background pulse */}
                            <div className="absolute inset-0 animate-pulse bg-violet-500/5" />

                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-violet-500/20 text-violet-400">
                                <step.icon className="h-7 w-7" />
                            </div>

                            <AnimatedProgressBar initialValue={step.value} />
                            <div className="mt-1 text-sm text-zinc-500">
                                {step.label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Animated wave visualization */}
                <div className="relative mt-16 h-36 w-full overflow-visible">
                    <svg
                        className="absolute inset-0 h-full w-full"
                        preserveAspectRatio="none"
                        viewBox="0 0 1200 100"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <defs>
                            <linearGradient
                                id="waveGrad1"
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="0%"
                            >
                                <stop
                                    offset="0%"
                                    stopColor="rgba(124,58,237,0)"
                                />
                                <stop
                                    offset="30%"
                                    stopColor="rgba(124,58,237,0.8)"
                                />
                                <stop
                                    offset="60%"
                                    stopColor="rgba(6,182,212,0.8)"
                                />
                                <stop
                                    offset="100%"
                                    stopColor="rgba(124,58,237,0)"
                                />
                            </linearGradient>
                            <linearGradient
                                id="waveGrad2"
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="0%"
                            >
                                <stop
                                    offset="0%"
                                    stopColor="rgba(6,182,212,0)"
                                />
                                <stop
                                    offset="40%"
                                    stopColor="rgba(139,92,246,0.5)"
                                />
                                <stop
                                    offset="70%"
                                    stopColor="rgba(34,211,238,0.6)"
                                />
                                <stop
                                    offset="100%"
                                    stopColor="rgba(6,182,212,0)"
                                />
                            </linearGradient>
                            <linearGradient
                                id="waveGrad3"
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="0%"
                            >
                                <stop
                                    offset="0%"
                                    stopColor="rgba(168,85,247,0)"
                                />
                                <stop
                                    offset="50%"
                                    stopColor="rgba(168,85,247,0.9)"
                                />
                                <stop
                                    offset="100%"
                                    stopColor="rgba(168,85,247,0)"
                                />
                            </linearGradient>
                            <filter id="waveBlur">
                                <feGaussianBlur
                                    in="SourceGraphic"
                                    stdDeviation="2"
                                />
                            </filter>
                        </defs>

                        {/* Glow layer (blurred copy behind) */}
                        <path
                            className="wave-1 wave-glow"
                            d="M0,55 Q150,20 300,55 T600,55 T900,55 T1200,55"
                            fill="none"
                            stroke="url(#waveGrad1)"
                            strokeWidth="8"
                            filter="url(#waveBlur)"
                        />
                        <path
                            className="wave-2 wave-glow"
                            d="M0,50 Q200,85 400,50 T800,50 T1200,50"
                            fill="none"
                            stroke="url(#waveGrad2)"
                            strokeWidth="6"
                            filter="url(#waveBlur)"
                        />

                        {/* Crisp main waves */}
                        <path
                            className="wave-1"
                            d="M0,55 Q150,20 300,55 T600,55 T900,55 T1200,55"
                            fill="none"
                            stroke="url(#waveGrad1)"
                            strokeWidth="2"
                        />
                        <path
                            className="wave-2"
                            d="M0,50 Q200,85 400,50 T800,50 T1200,50"
                            fill="none"
                            stroke="url(#waveGrad2)"
                            strokeWidth="1.5"
                            opacity="0.8"
                        />
                        <path
                            className="wave-3"
                            d="M0,60 Q100,30 250,60 T500,60 T750,60 T1000,60 T1200,60"
                            fill="none"
                            stroke="url(#waveGrad3)"
                            strokeWidth="1"
                            opacity="0.6"
                        />

                        {/* Shimmer highlight streaks */}
                        <path
                            className="wave-1 wave-shimmer"
                            d="M0,55 Q150,20 300,55 T600,55 T900,55 T1200,55"
                            fill="none"
                            stroke="rgba(255,255,255,0.7)"
                            strokeWidth="1.5"
                        />
                        <path
                            className="wave-2 wave-shimmer"
                            d="M0,50 Q200,85 400,50 T800,50 T1200,50"
                            fill="none"
                            stroke="rgba(34,211,238,0.6)"
                            strokeWidth="1"
                            style={{ animationDelay: '1.5s' }}
                        />
                    </svg>
                </div>
            </div>

            <div className="absolute right-0 bottom-0 left-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
        </section>
    );
}
