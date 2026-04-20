## Summary

- [ ] Describe what changed and why.

## Performance & Responsiveness Checklist

- [ ] Home page keeps strict targets on mobile profile: LCP <= 2.5s, INP <= 200ms, CLS <= 0.1.
- [ ] Any heavy component/library in this PR is lazy-loaded or viewport-gated.
- [ ] New animations use transform/opacity only (or include clear justification for heavier properties).
- [ ] New images use appropriate loading strategy (`loading="lazy"` for non-hero) with explicit dimensions where possible.
- [ ] Layout verified at 320px, 768px, 1024px, and 1440px widths.
- [ ] No clipped fixed panels; tables have mobile behavior (`overflow-x-auto` or stacked layout).

## Validation

- [ ] `npm run lint:check`
- [ ] `npm run types:check`
- [ ] `npm run build`
- [ ] `npm run perf:bundle-check`
