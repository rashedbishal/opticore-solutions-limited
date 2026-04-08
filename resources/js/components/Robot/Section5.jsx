import React from 'react';
import { Sparkles, ArrowUpRight, Award, Users } from 'lucide-react';

/**
 * Section 5: Final State
 *
 * Evolved final state - transformation complete.
 * Features:
 * - Completion celebration
 * - Final stats
 * - Call to action
 */
export default function Section5() {
  return (
    <section
      id="robot-section-5"
      className="section-shell relative flex min-h-screen items-center overflow-hidden"
    >
      {/* Animated background */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.4) 0%, transparent 60%)',
          }}
        />
      </div>

      <div className="section-inner relative z-10">
        {/* Center content */}
        <div className="mx-auto max-w-4xl text-center">
          {/* Success badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2">
            <Sparkles className="h-4 w-4 text-violet-400" />
            <span className="text-sm font-medium text-violet-300">Transformation Complete</span>
          </div>

          <h2 className="mb-6 text-balance text-4xl font-bold text-white sm:text-5xl md:text-6xl">
            Your Vision
            <br />
            <span className="gradient-text">Realized</span>
          </h2>

          <p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-zinc-400">
            The journey is complete. Your project has evolved from concept to reality,
            powered by precision engineering and creative excellence.
          </p>

          {/* Achievement stats */}
          <div className="mb-12 grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              { value: '5', label: 'Phases Complete', icon: Award },
              { value: '100%', label: 'Success Rate', icon: Sparkles },
              { value: '24/7', label: 'Support Active', icon: ArrowUpRight },
              { value: '50+', label: 'Projects Delivered', icon: Users },
            ].map((stat) => (
              <div
                key={stat.label}
                className="glass-panel rounded-2xl border border-white/10 p-6 transition-all hover:border-violet-500/30"
              >
                <stat.icon className="mx-auto mb-3 h-6 w-6 text-cyan-400" />
                <div className="text-2xl font-bold text-white md:text-3xl">{stat.value}</div>
                <div className="mt-1 text-xs text-zinc-500 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Final CTA */}
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <button className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 px-8 py-4 font-semibold text-white transition-all hover:opacity-90 hover:shadow-[0_0_40px_rgba(139,92,246,0.4)]">
              Start Your Project
              <ArrowUpRight className="h-5 w-5" />
            </button>
            <button className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-4 font-semibold text-white transition-all hover:bg-white/10">
              View Portfolio
            </button>
          </div>

          {/* Decorative line */}
          <div className="mt-16 flex items-center justify-center gap-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-violet-500" />
            <div className="h-2 w-2 rounded-full bg-violet-500" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-cyan-500" />
          </div>
        </div>
      </div>

      {/* Final border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
    </section>
  );
}
