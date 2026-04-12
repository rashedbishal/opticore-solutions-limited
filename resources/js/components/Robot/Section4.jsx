import React from 'react';
import { Rocket, CheckCircle2, ArrowRight, Shield } from 'lucide-react';

/**
 * Section 4: Execution Mode
 *
 * Confident, stable execution phase.
 * Features:
 * - Completed tasks visualization
 * - Confidence metrics
 * - Forward momentum
 */
const LOG_LINES = [
    {
        time: '[00:00:01]',
        type: 'START',
        text: 'Project onboarding initiated',
        color: 'text-cyan-400',
    },
    {
        time: '[00:00:03]',
        type: 'PLAN',
        text: 'Strategy finalized',
        suffix: '✓',
        color: 'text-violet-400',
    },
    {
        time: '[00:00:05]',
        type: 'BUILD',
        text: 'Assets in production...',
        color: 'text-cyan-400',
    },
    {
        time: '[00:00:08]',
        type: 'SUCCESS',
        text: 'Campaign launched',
        suffix: '✓',
        color: 'text-green-400',
    },
    {
        isPrompt: true,
        text: '– Ready to scale your brand',
        color: 'text-cyan-400',
    },
];

const TypingLog = () => {
    const [visibleLines, setVisibleLines] = React.useState([]);
    const [currentLineIndex, setCurrentLineIndex] = React.useState(0);
    const [currentCharIndex, setCurrentCharIndex] = React.useState(0);
    const [isWaiting, setIsWaiting] = React.useState(false);
    const [hasStarted, setHasStarted] = React.useState(false);
    const containerRef = React.useRef(null);

    React.useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setHasStarted(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 },
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    React.useEffect(() => {
        if (isWaiting || !hasStarted) return;

        if (currentLineIndex < LOG_LINES.length) {
            const line = LOG_LINES[currentLineIndex];
            const fullTextToType = line.isPrompt
                ? line.text
                : `${line.type} ${line.text}`;

            if (currentCharIndex < fullTextToType.length) {
                const timeout = setTimeout(() => {
                    setCurrentCharIndex((prev) => prev + 1);
                }, 40);
                return () => clearTimeout(timeout);
            } else {
                const timeout = setTimeout(() => {
                    setVisibleLines((prev) => [...prev, line]);
                    setCurrentLineIndex((prev) => prev + 1);
                    setCurrentCharIndex(0);
                }, 600);
                return () => clearTimeout(timeout);
            }
        } else {
            setIsWaiting(true);
            const timeout = setTimeout(() => {
                setVisibleLines([]);
                setCurrentLineIndex(0);
                setCurrentCharIndex(0);
                setIsWaiting(false);
            }, 5000);
            return () => clearTimeout(timeout);
        }
    }, [currentLineIndex, currentCharIndex, isWaiting, hasStarted]);

    const renderTypingContent = (line, index, isCurrent) => {
        if (line.isPrompt) {
            const textToShow = isCurrent
                ? line.text.substring(0, currentCharIndex)
                : line.text;
            return (
                <div key={index} className={`${line.color} flex items-center`}>
                    <span>{textToShow}</span>
                    {isCurrent && <span className="ml-1 animate-pulse">_</span>}
                </div>
            );
        }

        const fullText = `${line.type} ${line.text}`;
        const textToShow = isCurrent
            ? fullText.substring(0, currentCharIndex)
            : fullText;

        const typePart = isCurrent
            ? textToShow.substring(
                  0,
                  Math.min(currentCharIndex, line.type.length),
              )
            : line.type;

        const messagePart = isCurrent
            ? textToShow.substring(line.type.length)
            : ` ${line.text}`;

        return (
            <div
                key={index}
                className="flex items-start gap-4 font-mono text-zinc-500"
            >
                <span className="shrink-0">{line.time}</span>
                <div className="flex flex-wrap items-center">
                    <span
                        className={`${line.color} ${typePart.length > 0 ? 'mr-2' : ''}`}
                    >
                        {typePart}
                    </span>
                    <span>{messagePart.trimStart()}</span>
                    {!isCurrent && line.suffix && (
                        <span className={`${line.color} ml-2`}>
                            {line.suffix}
                        </span>
                    )}
                    {isCurrent && (
                        <span className="ml-1 animate-pulse text-cyan-400">
                            _
                        </span>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div ref={containerRef} className="space-y-2">
            {visibleLines.map((line, i) => renderTypingContent(line, i, false))}
            {currentLineIndex < LOG_LINES.length &&
                renderTypingContent(
                    LOG_LINES[currentLineIndex],
                    currentLineIndex,
                    true,
                )}
        </div>
    );
};

export default function Section4() {
    const completedTasks = [
        { label: 'Strategy Completed', time: '02:34' },
        { label: 'Assets Delivered', time: '04:12' },
        { label: 'Quality Approved', time: '01:58' },
        { label: 'Launch Ready', time: '00:45' },
    ];

    return (
        <section
            id="robot-section-4"
            className="section-shell relative flex min-h-screen items-center overflow-hidden"
        >
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-t from-cyan-950/30 via-black to-black" />

            <div className="section-inner relative z-10 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-20">
                {/* Left side - Robot control panel style */}
                <div className="relative">
                    {/* Terminal-style header */}
                    <div className="mb-6 flex items-center gap-2 rounded-t-lg border border-zinc-800 bg-zinc-900/80 px-4 py-3">
                        <div className="flex gap-2">
                            <div className="h-3 w-3 rounded-full bg-red-500" />
                            <div className="h-3 w-3 rounded-full bg-yellow-500" />
                            <div className="h-3 w-3 rounded-full bg-green-500" />
                        </div>
                        <span className="ml-4 text-xs text-zinc-500">
                            execution.log
                        </span>
                    </div>

                    {/* Terminal content */}
                    <div className="glass-panel rounded-tr-lg rounded-b-lg border border-zinc-800 p-6 font-mono text-sm">
                        <TypingLog />
                    </div>

                    {/* Status indicators */}
                    <div className="mt-8 grid grid-cols-2 gap-4">
                        {completedTasks.map((task) => (
                            <div
                                key={task.label}
                                className="glass-panel flex items-center gap-3 rounded-lg border border-cyan-500/20 p-4"
                            >
                                <CheckCircle2 className="h-5 w-5 text-green-400" />
                                <div>
                                    <div className="text-sm font-medium text-white">
                                        {task.label}
                                    </div>
                                    <div className="text-xs text-zinc-500">
                                        {task.time}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right side - Content */}
                <div className="flex flex-col justify-center">
                    <span className="section-kicker mb-4 inline-flex items-center gap-2">
                        <Rocket className="h-4 w-4" />
                        PHASE 03 : EXECUTION
                    </span>

                    <h2 className="mb-6 text-3xl font-bold text-balance text-white sm:text-4xl md:text-5xl">
                        Launch, Optimize
                        <br />
                        <span className="text-cyan-400">& Grow</span>
                    </h2>

                    <p className="mb-8 text-base leading-relaxed text-zinc-400 sm:text-lg">
                        We execute, monitor, and continuously improve your
                        digital presence to ensure long-term growth and
                        measurable results.
                    </p>

                    {/* Confidence metrics */}
                    <div className="mb-8 grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-white">
                                99.9%
                            </div>
                            <div className="text-xs tracking-wider text-zinc-500 uppercase">
                                Client Satisfaction
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-cyan-400">
                                2.3s
                            </div>
                            <div className="text-xs tracking-wider text-zinc-500 uppercase">
                                Fast Response
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-violet-400">
                                A+
                            </div>
                            <div className="text-xs tracking-wider text-zinc-500 uppercase">
                                Service Quality
                            </div>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="flex flex-wrap gap-4">
                        <button className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-6 py-3 font-semibold text-black transition-all hover:bg-cyan-400">
                            Start Your Project
                            <ArrowRight className="h-4 w-4" />
                        </button>
                        <button className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 font-semibold text-white transition-all hover:bg-white/10">
                            <Shield className="h-4 w-4" />
                            View Portfolio
                        </button>
                    </div>
                </div>
            </div>

            <div className="absolute right-0 bottom-0 left-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
        </section>
    );
}
