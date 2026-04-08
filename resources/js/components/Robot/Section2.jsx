import React from 'react';
import { Scan, Target, Radar } from 'lucide-react';

/**
 * Section 2: Scanning Mode
 *
 * The robot enters scanning/analysis mode.
 * Features:
 * - Scanner visualization
 * - Data analysis cards
 * - Robot rotates and scans
 */
export default function Section2() {
  const scanFeatures = [
    { icon: Target, label: 'Target Analysis', status: 'Scanning...' },
    { icon: Radar, label: 'Environment Map', status: 'Processing...' },
    { icon: Scan, label: 'Data Collection', status: 'Active' },
  ];

  return (
    <section
      id="robot-section-2"
      className="section-shell relative flex min-h-screen items-center overflow-hidden"
    >
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/20 via-black to-violet-950/20" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      <div className="section-inner relative z-10 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-20">
        {/* Left side - Content */}
        <div className="flex flex-col justify-center">
          <span className="section-kicker mb-4">
            <Scan className="h-4 w-4" />
            Phase 01: Analysis
          </span>

          <h2 className="mb-6 text-balance text-3xl font-bold text-white sm:text-4xl md:text-5xl">
            Deep Scanning
            <br />
            <span className="text-cyan-400">& Analysis</span>
          </h2>

          <p className="mb-8 text-base leading-relaxed text-zinc-400 sm:text-lg">
            Our systems scan your project requirements with precision. Every detail is captured,
            analyzed, and mapped to ensure the perfect execution strategy.
          </p>

          {/* Scan status cards */}
          <div className="space-y-4">
            {scanFeatures.map((feature) => (
              <div
                key={feature.label}
                className="glass-panel flex items-center gap-4 rounded-xl border border-cyan-500/20 p-4"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
                  <feature.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white">{feature.label}</h4>
                  <p className="text-sm text-cyan-400">{feature.status}</p>
                </div>
                <div className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
              </div>
            ))}
          </div>
        </div>

        {/* Right side - Stats visualization */}
        <div className="relative hidden items-center justify-center lg:flex">
          {/* Circular scanner visualization */}
          <div className="relative h-80 w-80">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border border-cyan-500/20" />

            {/* Rotating scan line */}
            <div
              className="absolute inset-0 animate-spin rounded-full"
              style={{
                background: 'conic-gradient(from 0deg, transparent 0deg, rgba(6, 182, 212, 0.3) 60deg, transparent 120deg)',
                animationDuration: '3s',
              }}
            />

            {/* Inner content */}
            <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full border border-violet-500/20 bg-black/50">
              <span className="text-4xl font-bold text-cyan-400">98%</span>
              <span className="mt-2 text-sm text-zinc-500">Accuracy</span>
            </div>
          </div>

          {/* Floating data points */}
          <div className="absolute right-0 top-0 rounded-lg border border-cyan-500/30 bg-black/60 p-3 text-xs text-cyan-400">
            DATA_ACQUIRED
          </div>
          <div className="absolute bottom-20 left-0 rounded-lg border border-violet-500/30 bg-black/60 p-3 text-xs text-violet-400">
            PATTERN_DETECTED
          </div>
        </div>
      </div>

      {/* Bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
    </section>
  );
}
