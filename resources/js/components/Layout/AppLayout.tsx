import type { SharedPageProps } from '@/types';
import type { PropsWithChildren } from 'react';
import { usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import SupportWidget from '@/components/chat/SupportWidget';
import Footer from '@/components/Layout/Footer';
import Navbar from '@/components/Layout/Navbar';
import SmoothScroll from '@/components/Layout/SmoothScroll';
import ChatWidget from '@/components/UI/ChatWidget';

export default function AppLayout({ children }: PropsWithChildren) {
    const { url } = usePage<SharedPageProps>();
    const [openWidget, setOpenWidget] = useState<'ai' | 'support' | null>(null);

    useEffect(() => {
        const handler = () => {
            setOpenWidget((current) =>
                current === 'support' ? current : 'support',
            );
        };
        window.addEventListener('open-support-chat', handler);

        return () => window.removeEventListener('open-support-chat', handler);
    }, []);

    return (
        <SmoothScroll>
            {/* Global Wrapper restored to original styling to debug render crash */}
            <div className="app-shell bg-grain">
                {/* Background effects */}
                <div className="pointer-events-none absolute inset-0 z-5 overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-[800px] bg-linear-to-b from-violet-500/[0.35] via-cyan-400/[0.18] to-transparent blur-3xl dark:from-violet-500/10 dark:via-cyan-400/5" />
                    <div className="absolute top-[12%] right-[-12rem] h-[700px] w-[700px] bg-radial from-cyan-400/35 to-transparent blur-2xl dark:from-cyan-400/12" />
                    <div className="absolute top-[35%] left-[-10rem] h-[700px] w-[700px] bg-radial from-violet-500/30 to-transparent blur-2xl dark:from-violet-500/12" />
                    <div className="absolute top-[60%] right-[-8rem] h-[600px] w-[600px] bg-radial from-fuchsia-400/30 to-transparent blur-2xl dark:from-fuchsia-500/8" />
                    <div className="absolute right-[20%] bottom-[5%] h-[600px] w-[600px] bg-radial from-cyan-300/25 to-transparent blur-2xl dark:from-fuchsia-500/10" />
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
            <ChatWidget
                isOpen={openWidget === 'ai'}
                onOpenChange={(open) => setOpenWidget(open ? 'ai' : null)}
            />
            <SupportWidget
                isOpen={openWidget === 'support'}
                onOpenChange={(open) => setOpenWidget(open ? 'support' : null)}
            />
        </SmoothScroll>
    );
}
