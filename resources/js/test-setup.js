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
