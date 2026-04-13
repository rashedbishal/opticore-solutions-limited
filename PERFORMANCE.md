# Performance Optimization Log

This document summarizes the steps taken to optimize the application's overall performance.

## Backend Improvements (Laravel)

### 1. Database Caching (`Cache::remember()`)
Database queries on the dashboard and main pages have been wrapped in Redis-based caching to limit the number of times identical database hits are executed.
- `HomeController.php`: Cached `Brand::` and `Portfolio::` fetches.
- `BlogController.php`: Cached index and individual `slug` requests. Short TTL (60 mins) used to preserve memory and automatically invalidate.
- `PortfolioController.php`: Cached configuration extraction and dynamic sub-category aggregate queries.

### 2. Resolving N+1 Query Issues
- `PortfolioController.php (preview)`: The single portfolio item lookup was lacking eager loading for the `subCategory`. The relationship fetch was moved from a lazy evaluation into a proper `$portfolio->loadMissing('subCategory')` to ensure fewer hits to the DB and optimal performance.

### 3. Background Job Queues
- **Heavy Operation Splitting**: Synchronous tasks like sending email notifications from a submitted contact form drastically increase the time to first byte for a response.
- Created `App\Jobs\ProcessContactMessage` and dispatched it immediately upon form submission (`ContactController::store`). The queue worker processes the notification asynchronously, resulting in an instant snappy return for the client-side user.

### 4. Setting Up Redis
- Changed `SESSION_DRIVER`, `CACHE_STORE`, and `QUEUE_CONNECTION` within `.env.example` to point to `redis`. Redis inherently stores memory differently than SQLite or MySQL, reducing disk I/O significantly.

---

## Frontend Improvements (React & Vite)

### 1. Zero-Cost Lazy Loading JavaScript Chunks (`React.lazy`)
- High-compute, rich animation sections (e.g. `Section2`, `Section3`, `Section4`, `Section5` within the Homepage) have been wrapped using `React.lazy()` alongside `<Suspense>`.
- **Reason:** Directly importing heavy 3D or layout modules causes Vite to bundle them perfectly in the `Index.tsx` entry block—delaying First Contentful Paint. Lazy loading signals Vite to code-split these sub-trees automatically. They will only parse, evaluate, and inject when scrolled into view.

### 2. Image Loading Checks
- Portfolio cards dynamically query standard assets and apply implicit deferred-loading when parsed offscreen. Verify any manually written `<img />` tags have `loading="lazy"` attached to keep bandwidth usage minimal down the page.

---

## Remaining Suggestions for the Next Level

To further level up performance scaling for high load:

1. **Deploy Model Observers**: Instead of a strict time-based approach for the Cache (`now()->addMinutes(60)`), consider using `Cache::rememberForever()` linked to Laravel Eloquent Observers. In the Observer, wipe the specific cache tag upon any Model event trigger (`created`, `updated`, `deleted`).
2. **Cloudflare & CDN integration**: Hooking up the production environment to Cloudflare or a dedicated CDN for offloading the `public/storage/` media files.
3. **Automate WebP**: Automatically convert images uploaded via the CMS payload into the `.webp` array format. Modern browsers render `.webp` faster, with nearly 40-70% less baseline size footprint compared to original `.jpeg` files.
