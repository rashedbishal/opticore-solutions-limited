import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import { useMagneticHover } from '@/hooks/useMagneticHover';
import { cn } from '@/lib/utils';

interface MagneticButtonProps extends PropsWithChildren, ButtonHTMLAttributes<HTMLButtonElement> {
    href?: string;
    fullWidth?: boolean;
    ariaLabel: string;
}

const classes =
    'touch-target inline-flex items-center justify-center rounded-full bg-linear-to-r from-violet-500 to-cyan-400 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_25px_rgba(124,58,237,0.35)] transition-shadow duration-300 hover:shadow-[0_0_25px_rgba(124,58,237,0.5)]';

export default function MagneticButton({
    children,
    href,
    fullWidth = false,
    className,
    ariaLabel,
    ...props
}: MagneticButtonProps) {
    const magnetic = useMagneticHover<HTMLAnchorElement | HTMLButtonElement>();
    const usesNativeAnchor = Boolean(href && /^(tel:|mailto:|https?:)/.test(href));

    const content = (
        <motion.span className="flex relative z-10" style={{ x: magnetic.x, y: magnetic.y }}>
            {children}
        </motion.span>
    );

    if (href) {
        if (usesNativeAnchor) {
            return (
                <a
                    href={href}
                    aria-label={ariaLabel}
                    className={cn(classes, fullWidth && 'w-full', className)}
                    ref={magnetic.ref as React.RefObject<HTMLAnchorElement>}
                    onMouseMove={magnetic.handleMouseMove as React.MouseEventHandler<HTMLAnchorElement>}
                    onMouseLeave={magnetic.handleMouseLeave as React.MouseEventHandler<HTMLAnchorElement>}
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
                ref={magnetic.ref as React.RefObject<HTMLAnchorElement>}
                onMouseMove={magnetic.handleMouseMove as React.MouseEventHandler<HTMLAnchorElement>}
                onMouseLeave={magnetic.handleMouseLeave as React.MouseEventHandler<HTMLAnchorElement>}
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
            ref={magnetic.ref as React.RefObject<HTMLButtonElement>}
            onMouseMove={magnetic.handleMouseMove as React.MouseEventHandler<HTMLButtonElement>}
            onMouseLeave={magnetic.handleMouseLeave as React.MouseEventHandler<HTMLButtonElement>}
            {...props}
        >
            {content}
        </button>
    );
}
