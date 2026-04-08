import { usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import type { PropsWithChildren } from 'react';
import Footer from '@/components/Layout/Footer';
import Navbar from '@/components/Layout/Navbar';
import SmoothScroll from '@/components/Layout/SmoothScroll';
import CursorSelector, { useCursorPreference } from '@/components/UI/CursorSelector';
import type { SharedPageProps } from '@/types';

export default function AppLayout({ children }: PropsWithChildren) {
    const { url } = usePage<SharedPageProps>();
    const { cursorType } = useCursorPreference();

    return (
        <SmoothScroll>
            <div className="app-shell" data-cursor={cursorType}>
                <CursorSelector cursorType={cursorType} />
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-[480px] bg-linear-to-b from-violet-500/10 via-cyan-400/5 to-transparent blur-3xl" />
                    <div className="absolute top-[18%] right-[-10rem] h-72 w-72 rounded-full bg-cyan-400/12 blur-[130px]" />
                    <div className="absolute top-[40%] left-[-8rem] h-72 w-72 rounded-full bg-violet-500/12 blur-[130px]" />
                    <div className="absolute right-[15%] bottom-[10%] h-64 w-64 rounded-full bg-fuchsia-500/10 blur-[140px]" />
                </div>
                <Navbar />
                <AnimatePresence mode="wait">
                    <motion.main
                        key={url}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="relative z-10"
                    >
                        {children}
                    </motion.main>
                </AnimatePresence>
                <Footer />
            </div>
        </SmoothScroll>
    );
}
