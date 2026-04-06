import { Link } from '@inertiajs/react';
import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends PropsWithChildren, ButtonHTMLAttributes<HTMLButtonElement> {
    href?: string;
    variant?: 'primary' | 'secondary' | 'ghost';
    fullWidth?: boolean;
    ariaLabel: string;
}

const baseClasses =
    'touch-target inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60';

const variants = {
    primary:
        'bg-linear-to-r from-violet-500 to-cyan-400 text-white shadow-[0_0_25px_rgba(124,58,237,0.35)] hover:shadow-[0_0_25px_rgba(124,58,237,0.5)]',
    secondary: 'border border-white/10 bg-white/5 text-white hover:border-violet-400/40 hover:bg-white/10',
    ghost: 'text-zinc-200 hover:bg-white/5 hover:text-white',
};

export default function Button({
    children,
    href,
    variant = 'primary',
    fullWidth = false,
    className,
    ariaLabel,
    ...props
}: ButtonProps) {
    const classes = cn(baseClasses, variants[variant], fullWidth && 'w-full', className);

    if (href) {
        return (
            <Link href={href} aria-label={ariaLabel} className={classes}>
                {children}
            </Link>
        );
    }

    return (
        <button type="button" aria-label={ariaLabel} className={classes} {...props}>
            {children}
        </button>
    );
}
