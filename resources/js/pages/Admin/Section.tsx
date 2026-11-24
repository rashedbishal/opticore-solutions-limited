import type { AdminSection } from '@/types';
import type { ReactNode } from 'react';
import { Link } from '@inertiajs/react';
import { ArrowRight, Clock } from 'lucide-react';
import AdminLayout from '@/components/Layout/AdminLayout';

interface SectionProps {
    section: AdminSection;
}

const tileClassName =
    'group flex items-center justify-between rounded-xl border border-violet-500/15 bg-[#060c1a]/80 px-5 py-4 transition-colors hover:border-violet-500/40';

export default function Section({ section }: SectionProps) {
    return (
        <div>
            <h1 className="text-2xl font-bold text-white">{section.label}</h1>
            <p className="mt-1 mb-6 text-sm text-slate-400">
                {section.description}
            </p>

            <p className="mb-3 font-mono text-[10px] tracking-[0.2em] text-violet-400/60 uppercase">
                Modules
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {section.modules.map((module) =>
                    module.external ? (
                        <a
                            key={module.key}
                            href={module.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={tileClassName}
                        >
                            <span className="text-sm font-medium text-white">
                                {module.label}
                            </span>
                            <ArrowRight className="h-4 w-4 text-cyan-400/60 transition-transform group-hover:translate-x-1" />
                        </a>
                    ) : (
                        <Link
                            key={module.key}
                            href={module.href}
                            className={tileClassName}
                        >
                            <span className="text-sm font-medium text-white">
                                {module.label}
                            </span>
                            <ArrowRight className="h-4 w-4 text-cyan-400/60 transition-transform group-hover:translate-x-1" />
                        </Link>
                    ),
                )}
                {section.modules.length === 0 && (
                    <p className="text-sm text-slate-500">
                        No modules granted in this section yet.
                    </p>
                )}
            </div>

            <p className="mt-10 mb-3 font-mono text-[10px] tracking-[0.2em] text-slate-500 uppercase">
                Planned, not built yet
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {section.planned.map((module) => (
                    <div
                        key={module.code}
                        aria-disabled="true"
                        className="flex cursor-not-allowed items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-5 py-4 opacity-50"
                    >
                        <span className="text-sm text-slate-400">
                            {module.label}
                        </span>
                        <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-wide text-slate-500">
                            <Clock className="h-3 w-3" />
                            {module.code}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

Section.layout = (page: ReactNode) => (
    <AdminLayout title="Section">{page}</AdminLayout>
);
