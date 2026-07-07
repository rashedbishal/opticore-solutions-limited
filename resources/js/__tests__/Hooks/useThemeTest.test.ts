import { act, renderHook } from '@testing-library/react';
import { useTheme } from '@/hooks/useTheme';

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
}

describe('useTheme', () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.classList.remove('dark');
        vi.stubGlobal(
            'matchMedia',
            vi.fn(
                () =>
                    new FakeMediaQueryList(false) as unknown as MediaQueryList,
            ),
        );
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        localStorage.clear();
        document.documentElement.classList.remove('dark');
    });

    it('defaults to light when there is no stored preference or OS dark mode', () => {
        const { result } = renderHook(() => useTheme());

        expect(result.current.theme).toBe('light');
        expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('resolves to the stored preference over the OS setting', () => {
        localStorage.setItem('preferred-theme', 'dark');

        const { result } = renderHook(() => useTheme());

        expect(result.current.theme).toBe('dark');
        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('toggle() flips the theme, persists it, and updates the <html> class', () => {
        const { result } = renderHook(() => useTheme());

        expect(result.current.theme).toBe('light');

        act(() => {
            result.current.toggle();
        });

        expect(result.current.theme).toBe('dark');
        expect(localStorage.getItem('preferred-theme')).toBe('dark');
        expect(document.documentElement.classList.contains('dark')).toBe(true);

        act(() => {
            result.current.toggle();
        });

        expect(result.current.theme).toBe('light');
        expect(localStorage.getItem('preferred-theme')).toBe('light');
        expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('flips mounted to true after mount', async () => {
        const { result } = renderHook(() => useTheme());

        expect(result.current.mounted).toBe(false);

        await act(async () => {
            await Promise.resolve();
        });

        expect(result.current.mounted).toBe(true);
    });
});
