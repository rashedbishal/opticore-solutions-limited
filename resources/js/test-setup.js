import '@testing-library/jest-dom';

Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
    }),
});

class MockObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
}

globalThis.IntersectionObserver = MockObserver;
globalThis.ResizeObserver = MockObserver;

// jsdom doesn't implement scrollIntoView — chat widgets call it on every
// new message to auto-scroll.
Element.prototype.scrollIntoView = () => {};

// jsdom doesn't implement sendBeacon — chat widgets use it to report
// "went offline" on unmount/navigation.
if (!navigator.sendBeacon) {
    navigator.sendBeacon = () => true;
}
