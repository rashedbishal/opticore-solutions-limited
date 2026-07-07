import type Lenis from '@studio-freight/lenis';
import type { ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { LenisContext } from '@/components/Layout/SmoothScroll';
import { useLenis } from '@/hooks/useLenis';

describe('useLenis', () => {
    it('returns null when used outside a SmoothScroll provider', () => {
        const { result } = renderHook(() => useLenis());

        expect(result.current).toBeNull();
    });

    it('returns the Lenis instance provided by an ancestor provider', () => {
        const fakeLenis = { scrollTo: vi.fn() } as unknown as Lenis;

        const wrapper = ({ children }: { children: ReactNode }) => (
            <LenisContext.Provider value={fakeLenis}>
                {children}
            </LenisContext.Provider>
        );

        const { result } = renderHook(() => useLenis(), { wrapper });

        expect(result.current).toBe(fakeLenis);
    });
});
