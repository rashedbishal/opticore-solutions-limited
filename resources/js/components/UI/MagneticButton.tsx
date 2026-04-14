import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import { useEffect } from 'react';
import { useMagneticHover } from '@/hooks/useMagneticHover';
import { cn } from '@/lib/utils';

interface MagneticButtonProps extends PropsWithChildren, ButtonHTMLAttributes<HTMLButtonElement> {
    href?: string;
    fullWidth?: boolean;
    ariaLabel: string;
}

const classes =
    'touch-target inline-flex items-center justify-center whitespace-nowrap rounded-full bg-linear-to-r from-violet-500 to-cyan-400 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_25px_rgba(124,58,237,0.35)] transition-shadow duration-300 hover:shadow-[0_0_25px_rgba(124,58,237,0.5)]';

export default function MagneticButton({
    children,
    href,
    fullWidth = false,
    className,
    ariaLabel,
    ...props
}: MagneticButtonProps) {
    const magnetic = useMagneticHover<HTMLAnchorElement | HTMLButtonElement>();

    // Attach mouse handlers via effect to avoid accessing ref-derived values during render
    useEffect(() => {
        const el = magnetic.ref.current;

        if (!el) {
            return;
        }

        const onMove = (e: MouseEvent) => {
            magnetic.handleMouseMove(e as unknown as React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>);
        };
        const onLeave = () => {
            magnetic.handleMouseLeave();
        };

        el.addEventListener('mousemove', onMove);
        el.addEventListener('mouseleave', onLeave);

        return () => {
            el.removeEventListener('mousemove', onMove);
            el.removeEventListener('mouseleave', onLeave);
        };
    }, [magnetic]);

    const content = (
        <motion.span className="flex relative z-10" style={{ x: magnetic.x, y: magnetic.y }}>
            {children}
        </motion.span>
    );

    if (href) {
        const usesNativeAnchor = Boolean(/^(tel:|mailto:|https?:)/.test(href));

        if (usesNativeAnchor) {
            return (
                <a
                    href={href}
                    aria-label={ariaLabel}
                    className={cn(classes, fullWidth && 'w-full', className)}
                     
                    ref={magnetic.ref as React.RefObject<HTMLAnchorElement>}
                >
                    {content}
                </a>
            );
        }

        return (
            <Link
                href={href}
                aria-label={ariaLabel}
                className={cn(classes, fullWidth && 'w-full', className)}
                // eslint-disable-next-line react-hooks/refs
                ref={magnetic.ref as React.RefObject<HTMLAnchorElement>}
            >
                {content}
            </Link>
        );
    }

    return (
        <button
            type="button"
            aria-label={ariaLabel}
            className={cn(classes, fullWidth && 'w-full', className)}
            // eslint-disable-next-line react-hooks/refs
            ref={magnetic.ref as React.RefObject<HTMLButtonElement>}
            {...props}
        >
            {content}
        </button>
    );
}
