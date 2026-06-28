import type { SharedPageProps } from '@/types';
import type { PropsWithChildren } from 'react';
import { usePage } from '@inertiajs/react';
import { domAnimation, LazyMotion } from 'framer-motion';
import { lazy, Suspense, useEffect, useState } from 'react';
import Footer from '@/components/Layout/Footer';
import Navbar from '@/components/Layout/Navbar';
import SmoothScroll from '@/components/Layout/SmoothScroll';

const ChatWidget = lazy(() => import('@/components/UI/ChatWidget'));
const SupportWidget = lazy(() => import('@/components/chat/SupportWidget'));

export default function AppLayout({ children }: PropsWithChildren) {
    const { url } = usePage<SharedPageProps>();
    const [openWidget, setOpenWidget] = useState<'ai' | 'support' | null>(null);
    const [widgetsMounted, setWidgetsMounted] = useState(false);

    useEffect(() => {
        // Defer widget mounting until after first user interaction so their
        // Reverb subscriptions and polling don't block the initial render.
        const mount = () => setWidgetsMounted(true);
        window.addEventListener('mousemove', mount, { once: true });
        window.addEventListener('touchstart', mount, {
            once: true,
            passive: true,
        });
        window.addEventListener('keydown', mount, { once: true });
        // Fallback: mount after 4 s even without interaction.
        const t = setTimeout(mount, 4000);

        return () => {
            window.removeEventListener('mousemove', mount);
            window.removeEventListener('touchstart', mount);
            window.removeEventListener('keydown', mount);
            clearTimeout(t);
        };
    }, []);

    useEffect(() => {
        const handler = () => {
            setWidgetsMounted(true);
            setOpenWidget((current) =>
                current === 'support' ? current : 'support',
            );
        };
        window.addEventListener('open-support-chat', handler);

        return () => window.removeEventListener('open-support-chat', handler);
    }, []);

    return (
        <LazyMotion features={domAnimation}>
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

                    <main key={url} className="page-enter relative z-20">
                        {children}
                    </main>

                    <Footer />
                </div>
                {widgetsMounted && (
                    <>
                        <Suspense fallback={null}>
                            <ChatWidget
                                isOpen={openWidget === 'ai'}
                                onOpenChange={(open) =>
                                    setOpenWidget(open ? 'ai' : null)
                                }
                            />
                        </Suspense>
                        <Suspense fallback={null}>
                            <SupportWidget
                                isOpen={openWidget === 'support'}
                                onOpenChange={(open) =>
                                    setOpenWidget(open ? 'support' : null)
                                }
                            />
                        </Suspense>
                    </>
                )}
            </SmoothScroll>
        </LazyMotion>
    );
}
