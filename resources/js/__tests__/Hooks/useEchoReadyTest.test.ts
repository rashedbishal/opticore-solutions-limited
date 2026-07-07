import { act, renderHook } from '@testing-library/react';
import useEchoReady from '@/hooks/useEchoReady';

describe('useEchoReady', () => {
    afterEach(() => {
        window.__echoConfigured = undefined;
    });

    it('starts as false when echo has not been configured yet', () => {
        const { result } = renderHook(() => useEchoReady());

        expect(result.current).toBe(false);
    });

    it('becomes true immediately if echo was already configured before mount', async () => {
        window.__echoConfigured = true;

        const { result } = renderHook(() => useEchoReady());

        await act(async () => {
            await Promise.resolve();
        });

        expect(result.current).toBe(true);
    });

    it('becomes true when the echo:configured event fires after mount', () => {
        const { result } = renderHook(() => useEchoReady());

        expect(result.current).toBe(false);

        act(() => {
            window.dispatchEvent(new Event('echo:configured'));
        });

        expect(result.current).toBe(true);
    });
});
