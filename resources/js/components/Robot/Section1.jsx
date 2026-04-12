import React from 'react';

/**
 * Section 1: Hero - Initialization
 *
 * The first section where the robot initializes.
 * Features:
 * - Large hero text
 * - Introduction messaging
 * - Sets up the robot's entrance
 */
export default function Section1() {
    return (
        <section
            id="robot-section-1"
            className="section-shell relative flex min-h-screen items-center justify-center overflow-hidden"
        >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-violet-950/20 via-black to-black" />

            {/* Content container */}
            <div className="section-inner relative z-10 text-center">
                {/* Section kicker */}
                <span className="section-kicker mb-6 inline-flex items-center gap-2">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
                    System Initializing
                </span>

                {/* Main headline */}
                <h2 className="mb-6 text-4xl font-extrabold text-balance text-white sm:text-5xl md:text-6xl lg:text-7xl">
                    Meet Your
                    <br />
                    <span className="gradient-text">Digital Partner</span>
                </h2>

                {/* Description */}
                <p className="mx-auto max-w-2xl text-lg leading-relaxed text-zinc-400">
                    Our AI-powered systems are activating. Scroll to begin the
                    initialization sequence and discover how we transform ideas
                    into digital reality.
                </p>

                {/* Scroll indicator */}
                <div className="mt-12 flex flex-col items-center gap-2">
                    <span className="text-xs font-medium tracking-widest text-zinc-500 uppercase">
                        Begin Sequence
                    </span>
                    <div className="h-12 w-6 rounded-full border-2 border-zinc-700 p-1">
                        <div className="h-3 w-full animate-bounce rounded-full bg-cyan-400" />
                    </div>
                </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute right-0 bottom-0 left-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
        </section>
    );
}
