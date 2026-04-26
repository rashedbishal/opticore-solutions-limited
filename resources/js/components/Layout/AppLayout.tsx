import type { SharedPageProps } from '@/types';
import type { PropsWithChildren } from 'react';
import { usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import SupportWidget from '@/components/chat/SupportWidget';
import Footer from '@/components/Layout/Footer';
import Navbar from '@/components/Layout/Navbar';
import SmoothScroll from '@/components/Layout/SmoothScroll';
import ChatWidget from '@/components/UI/ChatWidget';
export default function AppLayout({ children }: PropsWithChildren) {
    const { url } = usePage<SharedPageProps>();

    return (
        <SmoothScroll>
            {/* Global Wrapper restored to original styling to debug render crash */}
            <div className="app-shell bg-grain">
                {/* Background effects with refined light-mode presence */}
                <div className="pointer-events-none absolute inset-0 z-5 overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-[640px] bg-linear-to-b from-violet-500/[0.12] via-cyan-400/[0.08] to-transparent blur-3xl dark:from-violet-500/10 dark:via-cyan-400/5" />
                    <div className="absolute top-[18%] right-[-10rem] h-80 w-80 rounded-full bg-cyan-400/[0.15] blur-[130px] dark:bg-cyan-400/12" />
                    <div className="absolute top-[40%] left-[-8rem] h-80 w-80 rounded-full bg-violet-500/[0.15] blur-[140px] dark:bg-violet-500/12" />
                    <div className="absolute right-[15%] bottom-[10%] h-72 w-72 rounded-full bg-fuchsia-500/[0.12] blur-[140px] dark:bg-fuchsia-500/10" />
                </div>

                <Navbar />

                <AnimatePresence mode="wait">
                    <motion.main
                        key={url}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="relative z-20"
                    >
                        {children}
                    </motion.main>
                </AnimatePresence>

                <Footer />
            </div>
            <ChatWidget />
            <SupportWidget />
        </SmoothScroll>
    );
}
