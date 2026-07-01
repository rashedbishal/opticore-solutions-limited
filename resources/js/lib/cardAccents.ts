// Cycled across `.map()`'d cards (capability grids, value cards, story panels,
// etc.) so each card reads as its own distinct color instead of one repeated
// accent down the whole page. Classes are written as literal strings (not
// template-built) so Tailwind's build-time scanner picks them up — see
// CATEGORY_COLOR_MAP in `categoryVisuals.ts` for the same convention.
export const CARD_ACCENTS = [
    {
        icon: 'text-violet-600 dark:text-violet-400',
        chip: 'bg-violet-500/10 dark:bg-violet-500/15',
        ring: 'border-t-violet-500/60',
        dot: 'bg-violet-500',
    },
    {
        icon: 'text-cyan-600 dark:text-cyan-400',
        chip: 'bg-cyan-500/10 dark:bg-cyan-500/15',
        ring: 'border-t-cyan-500/60',
        dot: 'bg-cyan-500',
    },
    {
        icon: 'text-fuchsia-600 dark:text-fuchsia-400',
        chip: 'bg-fuchsia-500/10 dark:bg-fuchsia-500/15',
        ring: 'border-t-fuchsia-500/60',
        dot: 'bg-fuchsia-500',
    },
    {
        icon: 'text-emerald-600 dark:text-emerald-400',
        chip: 'bg-emerald-500/10 dark:bg-emerald-500/15',
        ring: 'border-t-emerald-500/60',
        dot: 'bg-emerald-500',
    },
    {
        icon: 'text-amber-600 dark:text-amber-400',
        chip: 'bg-amber-500/10 dark:bg-amber-500/15',
        ring: 'border-t-amber-500/60',
        dot: 'bg-amber-500',
    },
    {
        icon: 'text-rose-600 dark:text-rose-400',
        chip: 'bg-rose-500/10 dark:bg-rose-500/15',
        ring: 'border-t-rose-500/60',
        dot: 'bg-rose-500',
    },
] as const;

export function cardAccent(index: number) {
    return CARD_ACCENTS[index % CARD_ACCENTS.length];
}
