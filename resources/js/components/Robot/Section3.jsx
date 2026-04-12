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
        const interval = setInterval(
            () => {
                const change = Math.floor(Math.random() * 21) - 10; // -10 to +10
                setValue((prev) => {
                    const next = prev + change;
                    return Math.min(Math.max(next, 70), 100); // Keep between 70% and 100%
                });
            },
            1000 + Math.random() * 2000,
        ); // Random interval between 1-3s

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
        @keyframes waveMove {
          0% { transform: translateX(0); }
          50% { transform: translateX(-20px); }
          100% { transform: translateX(0); }
        }
        .animate-wave {
          animation: waveMove 4s ease-in-out infinite;
        }
        .animate-wave-slow {
          animation: waveMove 6s ease-in-out infinite reverse;
        }
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

                    <h2 className="mb-6 text-3xl font-bold text-balance text-white sm:text-4xl md:text-5xl">
                        Creative Development
                        <br />
                        <span className="text-violet-400">
                            & Smart Execution
                        </span>
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

                {/* Energy wave visualization */}
                <div className="relative mt-16 hidden h-24 md:block">
                    <svg
                        className="absolute inset-0 h-full w-full"
                        preserveAspectRatio="none"
                        viewBox="0 0 1200 100"
                    >
                        <defs>
                            <linearGradient
                                id="waveGradient"
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="0%"
                            >
                                <stop
                                    offset="0%"
                                    stopColor="rgba(139, 92, 246, 0.5)"
                                />
                                <stop
                                    offset="50%"
                                    stopColor="rgba(6, 182, 212, 0.5)"
                                />
                                <stop
                                    offset="100%"
                                    stopColor="rgba(139, 92, 246, 0.5)"
                                />
                            </linearGradient>
                        </defs>
                        <path
                            className="animate-wave"
                            d="M0,50 Q300,10 600,50 T1200,50"
                            fill="none"
                            stroke="url(#waveGradient)"
                            strokeWidth="2"
                        />
                        <path
                            className="animate-wave-slow"
                            d="M0,50 Q300,90 600,50 T1200,50"
                            fill="none"
                            stroke="url(#waveGradient)"
                            strokeWidth="2"
                            opacity="0.5"
                        />
                    </svg>
                </div>
            </div>

            <div className="absolute right-0 bottom-0 left-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
        </section>
    );
}
