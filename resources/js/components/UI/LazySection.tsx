import type { ReactNode } from 'react';
import { Suspense, useEffect, useRef, useState } from 'react';

// Mounts + Suspends its children only once the section scrolls near the
// viewport (IntersectionObserver, `rootMargin: 400px`), instead of paying
// for the wrapped chunk's fetch/parse/hydration cost on every page load.
// Pair with `React.lazy(() => import(...))` for the children so the section
// is also its own code-split chunk — wrapping an eagerly-imported component
// in LazySection alone defers *rendering* but not the JS download.
//
// Only wrap sections that are safe to omit from the server-rendered HTML:
// this component always renders its `minHeightClassName` placeholder (not
// the real content) during SSR, since `renderToString` can't wait on a
// suspended `React.lazy` import. Below-the-fold decorative/interactive
// sections are fine; sections carrying content that matters for SEO
// (body text, FAQs, product/service descriptions) should stay eager.
export default function LazySection({
    minHeightClassName = 'min-h-[60vh]',
    children,
}: {
    minHeightClassName?: string;
    children: ReactNode;
}) {
    const [isVisible, setIsVisible] = useState(false);
    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '400px 0px' },
        );

        if (sentinelRef.current) {
            observer.observe(sentinelRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div ref={sentinelRef}>
            {isVisible ? (
                <Suspense
                    fallback={
                        <div
                            className={`flex ${minHeightClassName} items-center justify-center text-sm text-zinc-500`}
                        >
                            Loading section...
                        </div>
                    }
                >
                    {children}
                </Suspense>
            ) : (
                <div className={minHeightClassName} aria-hidden="true" />
            )}
        </div>
    );
}
