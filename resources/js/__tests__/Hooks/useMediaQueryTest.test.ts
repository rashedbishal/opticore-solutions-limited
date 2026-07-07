import { act, renderHook } from '@testing-library/react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

class FakeMediaQueryList {
    matches: boolean;
    private listeners = new Set<() => void>();

    constructor(matches: boolean) {
        this.matches = matches;
    }

    addEventListener(_event: 'change', callback: () => void) {
        this.listeners.add(callback);
    }

    removeEventListener(_event: 'change', callback: () => void) {
        this.listeners.delete(callback);
    }

    setMatches(matches: boolean) {
        this.matches = matches;
        this.listeners.forEach((listener) => listener());
    }
}

describe('useMediaQuery', () => {
    let mediaQueryList: FakeMediaQueryList;

    beforeEach(() => {
        mediaQueryList = new FakeMediaQueryList(false);
        vi.stubGlobal(
            'matchMedia',
            vi.fn(() => mediaQueryList as unknown as MediaQueryList),
        );
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('returns the current match state', () => {
        mediaQueryList.setMatches(true);

        const { result } = renderHook(() => useMediaQuery('(pointer: fine)'));

        expect(result.current).toBe(true);
    });

    it('updates when the media query match state changes', () => {
        const { result } = renderHook(() => useMediaQuery('(pointer: fine)'));

        expect(result.current).toBe(false);

        act(() => {
            mediaQueryList.setMatches(true);
        });

        expect(result.current).toBe(true);
    });
});
