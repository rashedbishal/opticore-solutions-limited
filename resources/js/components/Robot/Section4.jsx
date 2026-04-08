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
export default function Section4() {
  const completedTasks = [
    { label: 'Strategy Defined', time: '02:34' },
    { label: 'Assets Generated', time: '04:12' },
    { label: 'Quality Verified', time: '01:58' },
    { label: 'Deploy Ready', time: '00:45' },
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
            <span className="ml-4 text-xs text-zinc-500">execution.log</span>
          </div>

          {/* Terminal content */}
          <div className="glass-panel rounded-b-lg rounded-tr-lg border border-zinc-800 p-6 font-mono text-sm">
            <div className="space-y-2">
              <div className="flex gap-4 text-zinc-500">
                <span>[00:00:01]</span>
                <span className="text-cyan-400">EXECUTE</span>
                <span>Initializing deployment sequence...</span>
              </div>
              <div className="flex gap-4 text-zinc-500">
                <span>[00:00:03]</span>
                <span className="text-violet-400">SYSTEM</span>
                <span>Resources allocated ✓</span>
              </div>
              <div className="flex gap-4 text-zinc-500">
                <span>[00:00:05]</span>
                <span className="text-cyan-400">EXECUTE</span>
                <span>Deploying to production...</span>
              </div>
              <div className="flex gap-4 text-zinc-500">
                <span>[00:00:08]</span>
                <span className="text-green-400">SUCCESS</span>
                <span>Deployment complete ✓</span>
              </div>
              <div className="mt-4 flex items-center gap-2 text-cyan-400">
                <span className="animate-pulse">_</span>
                <span>Ready for next command</span>
              </div>
            </div>
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
                  <div className="text-sm font-medium text-white">{task.label}</div>
                  <div className="text-xs text-zinc-500">{task.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right side - Content */}
        <div className="flex flex-col justify-center">
          <span className="section-kicker mb-4 inline-flex items-center gap-2">
            <Rocket className="h-4 w-4" />
            Phase 03: Execution
          </span>

          <h2 className="mb-6 text-balance text-3xl font-bold text-white sm:text-4xl md:text-5xl">
            Precision
            <br />
            <span className="text-cyan-400">Execution</span>
          </h2>

          <p className="mb-8 text-base leading-relaxed text-zinc-400 sm:text-lg">
            Systems locked and loaded. Every component optimized, every detail verified.
            Your project is now executing with maximum efficiency and reliability.
          </p>

          {/* Confidence metrics */}
          <div className="mb-8 grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">99.9%</div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-400">2.3s</div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider">Response</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-violet-400">A+</div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider">Security</div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-wrap gap-4">
            <button className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-6 py-3 font-semibold text-black transition-all hover:bg-cyan-400">
              View Live Project
              <ArrowRight className="h-4 w-4" />
            </button>
            <button className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 font-semibold text-white transition-all hover:bg-white/10">
              <Shield className="h-4 w-4" />
              Security Report
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
    </section>
  );
}
