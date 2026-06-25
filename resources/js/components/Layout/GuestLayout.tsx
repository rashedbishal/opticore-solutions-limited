import type { PropsWithChildren } from 'react';
import { Link } from '@inertiajs/react';
import { m as motion } from 'framer-motion';
import GradientOrb from '@/components/UI/GradientOrb';
import { cn } from '@/lib/utils';

interface GuestLayoutProps extends PropsWithChildren {
    maxWidth?: 'md' | 'lg' | 'xl';
}

export default function GuestLayout({
    children,
    maxWidth = 'md',
}: GuestLayoutProps) {
    const maxWidthClasses = {
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
    };

    return (
        <div className="relative flex h-[100dvh] flex-col items-center justify-center overflow-hidden bg-background px-4">
            <GradientOrb
                className="top-[-10%] left-[-10%] h-[600px] w-[600px]"
                color="#06b6d4"
            />
            <GradientOrb
                className="right-[-10%] bottom-[-10%] h-[600px] w-[600px]"
                color="#7c3aed"
            />

            <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.04]">
                <div
                    className="h-full w-full"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 2px 2px, var(--foreground) 1px, transparent 0)',
                        backgroundSize: '40px 40px',
                    }}
                />
            </div>

            <div
                className={cn(
                    'relative z-10 w-full',
                    maxWidthClasses[maxWidth],
                )}
            >
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="glass-panel relative w-full overflow-hidden rounded-[2rem] p-[min(5vh,1.5rem)] shadow-2xl backdrop-blur-3xl sm:rounded-[3rem] sm:p-[min(6vh,2.5rem)] [@media(max-height:400px)]:p-3"
                >
                    <div className="mb-[min(3vh,0.75rem)] flex justify-center [@media(max-height:400px)]:mb-2">
                        <Link href="/">
                            <img
                                src="/images/logo/opticore.webp"
                                alt="Opticore Solutions"
                                decoding="async"
                                className="block h-10 w-auto sm:h-14 dark:hidden [@media(max-height:400px)]:h-6 [@media(max-height:600px)]:h-8"
                            />
                            <img
                                src="/images/logo/opticore-white.webp"
                                alt="Opticore Solutions"
                                decoding="async"
                                className="hidden h-10 w-auto sm:h-14 dark:block [@media(max-height:400px)]:h-6 [@media(max-height:600px)]:h-8"
                            />
                        </Link>
                    </div>
                    {children}
                </motion.div>
            </div>
        </div>
    );
}
