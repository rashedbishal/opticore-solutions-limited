import type { LucideIcon } from 'lucide-react';
import {
    AppWindow,
    BarChart2,
    Box,
    BoxSelect,
    Brush,
    Camera,
    Clapperboard,
    Code2,
    Cpu,
    Film,
    Gem,
    Globe,
    Headphones,
    Laptop,
    Layers,
    Layers3,
    Layout,
    Lightbulb,
    Megaphone,
    Mic,
    Monitor,
    MonitorPlay,
    Package,
    Paintbrush,
    Palette,
    PenLine,
    PenTool,
    Pencil,
    Play,
    Radio,
    Rocket,
    ScanLine,
    Smartphone,
    Sparkles,
    Star,
    Target,
    Terminal,
    TrendingUp,
    Type,
    Video,
    Wand2,
    Zap,
} from 'lucide-react';

/**
 * Lucide icon keys an admin can pick for a category's `icon` field — keep in
 * sync with App\Http\Controllers\Admin\CategoryController::ALLOWED_ICONS.
 * Used by both the service marketing page hero and the Hire Us tabs.
 */
export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
    // Design & creative
    Palette,
    PenTool,
    Paintbrush,
    Brush,
    Pencil,
    PenLine,
    Wand2,
    Type,
    // Video & media
    Clapperboard,
    Video,
    Film,
    MonitorPlay,
    Camera,
    ScanLine,
    Play,
    Mic,
    Headphones,
    Radio,
    // Marketing & growth
    Megaphone,
    Globe,
    Rocket,
    TrendingUp,
    Target,
    BarChart2,
    // Web & digital
    Smartphone,
    Laptop,
    Monitor,
    Layout,
    AppWindow,
    // 3D & structure
    Box,
    Layers,
    Layers3,
    BoxSelect,
    Package,
    // Tech
    Cpu,
    Code2,
    Terminal,
    // General accents
    Gem,
    Zap,
    Star,
    Lightbulb,
};

export const DEFAULT_CATEGORY_ICON: LucideIcon = Sparkles;

export function resolveCategoryIcon(
    icon: string | null | undefined,
): LucideIcon {
    return (icon && CATEGORY_ICON_MAP[icon]) || DEFAULT_CATEGORY_ICON;
}

interface CategoryColorClasses {
    text: string;
    bg: string;
    /** Solid background, used only for admin color-swatch previews. */
    swatch: string;
}

/**
 * Color palette keys an admin can pick for a category's `color` field — keep
 * in sync with App\Http\Controllers\Admin\CategoryController::ALLOWED_COLORS.
 * Classes are written as literal strings (not template-built) so Tailwind's
 * build-time scanner picks them up.
 */
export const CATEGORY_COLOR_MAP: Record<string, CategoryColorClasses> = {
    pink: {
        text: 'text-pink-500',
        bg: 'bg-pink-500/10',
        swatch: 'bg-pink-500',
    },
    violet: {
        text: 'text-violet-500',
        bg: 'bg-violet-500/10',
        swatch: 'bg-violet-500',
    },
    emerald: {
        text: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
        swatch: 'bg-emerald-500',
    },
    orange: {
        text: 'text-orange-500',
        bg: 'bg-orange-500/10',
        swatch: 'bg-orange-500',
    },
    cyan: {
        text: 'text-cyan-500',
        bg: 'bg-cyan-500/10',
        swatch: 'bg-cyan-500',
    },
    blue: {
        text: 'text-blue-500',
        bg: 'bg-blue-500/10',
        swatch: 'bg-blue-500',
    },
    amber: {
        text: 'text-amber-500',
        bg: 'bg-amber-500/10',
        swatch: 'bg-amber-500',
    },
    rose: {
        text: 'text-rose-500',
        bg: 'bg-rose-500/10',
        swatch: 'bg-rose-500',
    },
    teal: {
        text: 'text-teal-500',
        bg: 'bg-teal-500/10',
        swatch: 'bg-teal-500',
    },
    slate: {
        text: 'text-slate-400',
        bg: 'bg-slate-500/10',
        swatch: 'bg-slate-400',
    },
    indigo: {
        text: 'text-indigo-500',
        bg: 'bg-indigo-500/10',
        swatch: 'bg-indigo-500',
    },
    purple: {
        text: 'text-purple-500',
        bg: 'bg-purple-500/10',
        swatch: 'bg-purple-500',
    },
    fuchsia: {
        text: 'text-fuchsia-500',
        bg: 'bg-fuchsia-500/10',
        swatch: 'bg-fuchsia-500',
    },
    red: {
        text: 'text-red-500',
        bg: 'bg-red-500/10',
        swatch: 'bg-red-500',
    },
    green: {
        text: 'text-green-500',
        bg: 'bg-green-500/10',
        swatch: 'bg-green-500',
    },
    sky: {
        text: 'text-sky-500',
        bg: 'bg-sky-500/10',
        swatch: 'bg-sky-500',
    },
    lime: {
        text: 'text-lime-500',
        bg: 'bg-lime-500/10',
        swatch: 'bg-lime-500',
    },
    yellow: {
        text: 'text-yellow-500',
        bg: 'bg-yellow-500/10',
        swatch: 'bg-yellow-500',
    },
};

export const DEFAULT_CATEGORY_COLOR: CategoryColorClasses =
    CATEGORY_COLOR_MAP.slate;

export function resolveCategoryColor(
    color: string | null | undefined,
): CategoryColorClasses {
    return (color && CATEGORY_COLOR_MAP[color]) || DEFAULT_CATEGORY_COLOR;
}
