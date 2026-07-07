import type * as FramerMotion from 'framer-motion';
import { act, renderHook } from '@testing-library/react';
import { useMagneticHover } from '@/hooks/useMagneticHover';

// useSpring animates toward its target over real animation frames, so
// asserting on `.get()` right after `.set()` would test framer-motion's
// spring physics rather than this hook's own clamping math. Swap it for a
// synchronous motion-value-like stub so `.get()` reflects the latest `.set()`
// immediately.
vi.mock('framer-motion', async (importOriginal) => {
    const actual = await importOriginal<typeof FramerMotion>();

    return {
        ...actual,
        useSpring: (initial: number) => {
            let value = initial;

            return {
                get: () => value,
                set: (next: number) => {
                    value = next;
                },
                getVelocity: () => 0,
            };
        },
    };
});

class FakeMediaQueryList {
    constructor(public matches: boolean) {}
    addEventListener() {}
    removeEventListener() {}
}

function buildMouseEvent(clientX: number, clientY: number) {
    return {
        clientX,
        clientY,
    } as unknown as React.MouseEvent<HTMLDivElement>;
}

describe('useMagneticHover', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('is disabled when the pointer is not fine (touch devices)', () => {
        vi.stubGlobal(
            'matchMedia',
            vi.fn(
                () =>
                    new FakeMediaQueryList(false) as unknown as MediaQueryList,
            ),
        );

        const { result } = renderHook(() => useMagneticHover<HTMLDivElement>());

        expect(result.current.enabled).toBe(false);
    });

    it('is enabled and updates x/y springs on mouse move when the pointer is fine', () => {
        vi.stubGlobal(
            'matchMedia',
            vi.fn(
                () => new FakeMediaQueryList(true) as unknown as MediaQueryList,
            ),
        );

        const { result } = renderHook(() => useMagneticHover<HTMLDivElement>());

        expect(result.current.enabled).toBe(true);

        const element = document.createElement('div');
        vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
            left: 0,
            top: 0,
            width: 100,
            height: 40,
            right: 100,
            bottom: 40,
            x: 0,
            y: 0,
            toJSON: () => {},
        });
        result.current.ref.current = element;

        act(() => {
            result.current.handleMouseMove(buildMouseEvent(90, 30));
        });

        // relativeX = 90 - 0 - 50 = 40 -> 40 * 0.18 = 7.2 (within +/-15 clamp)
        // relativeY = 30 - 0 - 20 = 10 -> 10 * 0.18 = 1.8 (within +/-8 clamp)
        expect(result.current.x.get()).toBeCloseTo(7.2);
        expect(result.current.y.get()).toBeCloseTo(1.8);

        act(() => {
            result.current.handleMouseLeave();
        });

        expect(result.current.x.get()).toBe(0);
        expect(result.current.y.get()).toBe(0);
    });

    it('clamps large offsets to the max magnetic pull', () => {
        vi.stubGlobal(
            'matchMedia',
            vi.fn(
                () => new FakeMediaQueryList(true) as unknown as MediaQueryList,
            ),
        );

        const { result } = renderHook(() => useMagneticHover<HTMLDivElement>());

        const element = document.createElement('div');
        vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
            left: 0,
            top: 0,
            width: 100,
            height: 40,
            right: 100,
            bottom: 40,
            x: 0,
            y: 0,
            toJSON: () => {},
        });
        result.current.ref.current = element;

        act(() => {
            result.current.handleMouseMove(buildMouseEvent(1000, 500));
        });

        expect(result.current.x.get()).toBe(15);
        expect(result.current.y.get()).toBe(8);
    });
});
