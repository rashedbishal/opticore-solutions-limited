import type { PropsWithChildren } from 'react';
import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import CursorSelector, {
    useCursorPreference,
} from '@/components/UI/CursorSelector';
import GradientOrb from '@/components/UI/GradientOrb';
import { cn } from '@/lib/utils';

interface GuestLayoutProps extends PropsWithChildren {
    maxWidth?: 'md' | 'lg' | 'xl';
}

export default function GuestLayout({
    children,
    maxWidth = 'md',
}: GuestLayoutProps) {
    const { cursorType } = useCursorPreference();
    const maxWidthClasses = {
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
    };

    return (
        <div
            className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-24 sm:pt-0"
            data-cursor={cursorType}
        >
            <CursorSelector cursorType={cursorType} />
            {/* Background Decor */}
            <GradientOrb
                className="top-[-10%] left-[-10%] h-[600px] w-[600px] blur-[120px]"
                color="#06b6d4"
            />
            <GradientOrb
                className="right-[-10%] bottom-[-10%] h-[600px] w-[600px] blur-[120px]"
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
                <div className="relative mb-8 flex justify-center">
                    <Link href="/">
                        <img
                            src="/images/logo/opticore.webp"
                            alt="Opticore Solutions"
                            className="block h-20 w-auto dark:hidden"
                        />
                        <img
                            src="/images/logo/opticore-white.webp"
                            alt="Opticore Solutions"
                            className="hidden h-20 w-auto dark:block"
                        />
                    </Link>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="glass-panel relative w-full overflow-hidden rounded-[3rem] p-8 shadow-2xl backdrop-blur-3xl sm:p-12"
                >
                    {children}
                </motion.div>
            </div>
        </div>
    );
}
