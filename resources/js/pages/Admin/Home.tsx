import type { ReactNode } from 'react';
import { Link } from '@inertiajs/react';
import { m as motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import AdminLayout from '@/components/Layout/AdminLayout';

interface HomeProps {
    sections: {
        key: string;
        label: string;
        description: string;
        moduleCount: number;
    }[];
}

export default function Home({ sections }: HomeProps) {
    return (
        <div className="grid gap-6 md:grid-cols-3">
            {sections.map((section, index) => (
                <motion.div
                    key={section.key}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                    className="relative overflow-hidden rounded-xl border border-violet-500/15 bg-[#060c1a]/80 p-6 backdrop-blur-sm"
                >
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
                    <p className="font-mono text-[10px] tracking-[0.2em] text-violet-400/60 uppercase">
                        Section {index + 1}
                    </p>
                    <h2 className="mt-2 text-xl font-bold text-white">
                        {section.label}
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                        {section.description}
                    </p>
                    <div className="mt-6 flex items-center justify-between border-t border-violet-500/10 pt-5">
                        <span className="font-mono text-[10px] tracking-[0.15em] text-slate-500 uppercase">
                            {section.moduleCount}{' '}
                            {section.moduleCount === 1 ? 'module' : 'modules'}
                        </span>
                        <Link
                            href={`/admin/sections/${section.key}`}
                            className="group/link flex items-center gap-1.5 font-mono text-xs tracking-wide text-cyan-400/60 transition-colors hover:text-cyan-300"
                        >
                            Open
                            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/link:translate-x-1" />
                        </Link>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

Home.layout = (page: ReactNode) => (
    <AdminLayout title="Sections" hideSidebar>
        {page}
    </AdminLayout>
);
