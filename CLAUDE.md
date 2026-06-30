# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Laravel 13 + Inertia v3 + React 19 marketing site and client portal for Opticore Solutions, with an admin CMS, a real-time customer support chat (Reverb broadcasting), an offer/checkout flow with SSLCommerz (incl. Google Pay), and a Gemini-powered chat widget.

## Commands

### Backend (PHP)
- `composer dev` — run dev stack concurrently: `php artisan serve`, queue listener, `pail` logs, and `npm run dev` (Vite).
- `php artisan test --compact` — run the Pest/PHPUnit suite. Filter with `--filter=testName`.
- `composer test` — clears config cache, runs `pint --test`, then the full test suite (used in CI-like checks).
- `composer lint` / `composer lint:check` — Pint formatting (fix / check-only).
- `vendor/bin/pint --dirty --format agent` — format only changed PHP files; run this after any PHP edit before finishing.
- `php artisan test --compact -c phpunit.pgsql.xml` — run tests against the alternate local-environment config (different DB names/`APP_ENV`) instead of the default `phpunit.xml`. GitHub Actions CI uses the default `phpunit.xml`, not this one.

### Frontend (JS/TS)
- `npm run dev` — Vite dev server. `npm run build` / `npm run build:ssr` — production build.
- `npm run lint` / `npm run lint:check` — ESLint (fix / check-only).
- `npm run format` / `npm run format:check` — Prettier.
- `npm run types:check` — TypeScript, no emit.
- `npm run test` — Vitest unit tests (jsdom). `npm run test:e2e` — Playwright specs in `e2e/`.
- `npm run perf:bundle-check` — fails the build if JS bundle size regresses (see `scripts/perf/check-bundle-size.mjs`).
- `php artisan wayfinder:generate` — regenerate typed route/controller helpers in `resources/js/actions` and `resources/js/routes` after changing controllers or `routes/web.php`.

### Combined CI check
- `composer ci:check` — regenerates Wayfinder, then runs `lint:check`, `format:check`, `types:check`, and the test suite. Run this (or the equivalent individual commands) before considering backend+frontend work done.

## Architecture

### Dual-database auth: `web` vs `admin`
There are two completely separate user systems backed by two separate Postgres databases:
- **`User`** (`app/Models/User.php`) — site customers/clients, default `pgsql` connection, `auth:web` guard, soft-deletes.
- **`Admin`** (`app/Models/Admin.php`) — CMS staff, **separate `admin` DB connection** (`config/database.php` `'admin'` connection, env `DB_ADMIN_*`), `auth:admin` guard.

Several routes intentionally accept either guard (`auth:web,admin`) — e.g. offer viewing and chat attachment downloads — because both customers and staff can legitimately hit them.

### Admin permission system
`app/Support/AdminPermissions.php` is the **single source of truth** for grantable CMS sections. Each `key` must simultaneously match:
1. the route-name segment after `admin.` (e.g. `admin.portfolios.index` → `portfolios`),
2. the `key` in `NAV_ITEMS` in `resources/js/components/Layout/AdminLayout.tsx`,
3. the whitelist used by the `admin.permission` middleware (`EnsureAdminHasPermission`).

`Admin::canAccess($key)` returns true for the mother admin (`is_super_admin`) or `full_access` admins, otherwise checks the `permissions` array column. The mother admin (`Admin::motherAdmin()`) is the immutable master account used to gate destructive actions, and is exempt from session invalidation.

`EnsureAdminSessionIsCurrent` (alias `admin.session`) force-logs-out a non-mother admin mid-session if their `securityStamp()` (hash of password + `full_access` + `permissions`) no longer matches what was stamped into the session at login — i.e. if the mother admin changes their access while they're logged in.

Routes under `admin.permission` derive the required key from the route name automatically; routes that don't follow the `admin.<key>.*` convention (e.g. `offer.update`) check `Admin::canAccess()` explicitly inside the controller instead.

### Real-time (Laravel Reverb)
`routes/channels.php` defines private/presence channels for per-user notifications (`App.Models.User.{id}`), customer↔admin conversations (`conversations.{id}`, dual-guard), and admin-only dashboards (`admin.conversations`, `admin.orders`, `admin.transactions`, `admin.tasks` — each gated by the matching `canAccess()` permission key). The `/broadcasting/auth` route promotes the `admin` guard to default when an admin is subscribing, so `Broadcast::auth()` resolves the right user; it's also CSRF-exempt because Pusher.js authorizes via JSON, not a form post. Use the `echo-development` / `echo-react-development` skills when touching any of this.

### Payments: SSLCommerz + Google Pay
- `app/Library/SslCommerz/` wraps the SSLCommerz gateway SDK; `SslCommerzPaymentController` exposes `/pay-via-ajax`, `/success`, `/fail`, `/cancel`, `/ipn` (all under `throttle:payment-callback`, CSRF-exempt since the gateway POSTs directly).
- `GooglePayCheckoutController` + `app/Support/GooglePaySslCommerz.php` implement Google Pay via SSLCommerz's Merchant-Hosted Payment API (`/gpay/config`, `/gpay/charge`).
- `app/Support/PendingOrderResolver.php`, `PaymentReturnToken.php`, and `IdGenerator.php` support the checkout/offer-acceptance → pending-order → transaction pipeline. `InvoicePdfBuilder.php` (with `spatie/laravel-pdf`) generates downloadable/verifiable invoices (`orders/{transaction}/invoice`, signed verify link).

### Offers & customer conversations
Admins build line-itemed `Offer`s (with `OfferMilestone`s) inside a customer conversation thread (`Conversation`/`Message`); the client views/accepts/declines via a signed-token URL (`/offer/{token}`). Accepting an offer feeds the checkout/payment pipeline. `app/Events/` has granular broadcast events for offers, orders, transactions, tasks, and conversations — check for an existing event before adding ad hoc broadcasting.

### Categories CMS doubles as the service marketing pages
`Category` (`app/Models/Category.php`) is the single source of truth for both portfolio categories and the public `/{slug}` service marketing pages (e.g. `/video-editing`, served by `ServiceController::show()`) — there's no separate `Service` model/table; that marketing content (icon, long description, headings, sub-services, reasons, process, plus a `CategoryPortfolioItem` gallery) lives directly on `Category` and is edited from one admin section (`Admin/CategoryController`). `Category::configShape()` (cached 60 min, keyed by slug) replaced the old `config('portfolio.categories')` array and is read by most category-aware code (`HomeController`, `PageController`, `HireUsController`, `PortfolioController`, `Admin/OfferController`, `Admin/PortfolioController`, `Admin/PortfolioSubCategoryController`, `Admin/TaskController`, `Admin/OrderController`, `TaskGenerator`) — go through it rather than querying `Category` directly. `Category::servicePageLinks()` feeds the footer's service links via `HandleInertiaRequests`. `Admin/CategoryController` busts both caches (plus `portfolio.categories.index`, `home.featuredPortfolios`, `hire-us.subcategories`) on every write — update that list if you add another cache derived from category data. Don't confuse `Category` with `PortfolioSubCategory`, a separate model loosely linked only by a `category_slug` string column (no FK); `CategoryPortfolioItem` is the one with a real `category_id` FK to `Category`.

### Two unrelated "chat" systems — don't conflate them
- **`ChatSession`/`ChatMessage`** (`ChatController::handleChat`) is the public Gemini-powered FAQ widget: anonymous, tied to a `chat_session_id` stored in the visitor's server-side session (never trusted from request input, so one browser can't write into another's session), not broadcast over Reverb.
- **`Conversation`/`Message`** (`ConversationController`, `Admin/CustomerConversationController`) is the authenticated customer↔admin support chat described above, broadcast live via Reverb.

### Newsletter subscriptions
`SubscriptionController` (public) exposes double opt-in subscribe/unsubscribe via signed confirmation links emailed to the address (`ConfirmSubscriptionMail`, `ConfirmUnsubscribeMail`) — a `Subscription` record isn't activated/removed until the link is clicked, not on the initial form POST. `Admin/SubscriptionController` lets staff browse subscribers and blast an offer or custom email to the list (`OfferMail`/`CustomMail`). All public subscription routes are throttled (`throttle:5,1`).

### Error pages
`bootstrap/app.php` intercepts HTTP exceptions for status codes `403, 404, 429, 500, 503` and renders them through `resources/js/pages/Error.tsx` via Inertia (instead of Laravel's default error HTML), so the SPA never falls back to a full-page reload. `Error.tsx` opts out of the normal layout since shared layout data may be unavailable when an error fires.

### Security headers & rate limiting
`app/Http/Middleware/SecurityHeaders.php` sets a strict CSP in production only (disabled locally so Vite HMR over plain HTTP still works). It allowlists each third-party origin actually in use (Google Pay, SSLCommerz embedded checkout/3DS redirect, Google Fonts, the Reverb websocket, Google Maps) and computes a `sha256` hash of Inertia's inline `data-page` JSON payload per-response rather than using `'unsafe-inline'`. Named rate limiters live in `app/Providers/AppServiceProvider.php::configureRateLimiters()` (`login`, `admin-login`, `register`, `password-reset`, `payment-callback`) — auth limiters deliberately cap by `email+ip` *and* by account-alone, so an attacker rotating source IPs can't get a fresh allowance against one target.

### Shared Inertia props & SSR exclusions
`HandleInertiaRequests::share()` pushes these props to every page: `name`, `auth.user`, `categories` (`Category::configShape()`), `footerServices` (`Category::servicePageLinks()`), `siteSettings` (`SiteSetting::current()->toPublicArray()`), and a `flash` bag with keys `success`, `error`, `invoice`, `payment_success`, `payment_error`, `checkout_url`, `subscription`. Use these exact key names when reading flash from the frontend.

SSR is disabled for `admin/*`, `dashboard`, `profile`, `checkout`, `checkout/*`, `gpay/*`, `offer/*`, and `orders/*` via `HandleInertiaRequests::$withoutSsr`. If a page in those paths appears to hydrate differently from public pages, that's why.

### SiteSetting singleton
`SiteSetting` (`app/Models/SiteSetting.php`) is a single-row table for contact info, addresses, and social links. Always access it via `SiteSetting::current()` (cached indefinitely via `Cache::rememberForever`). `SiteSetting::forgetCache()` invalidates it. Edited from the admin `configuration` section. The `toPublicArray()` shape is what gets injected into shared Inertia props for the footer and contact page — don't read the model attributes directly on the frontend. `Admin/ConfigurationController` already calls `forgetCache()` on write — follow that pattern.

### Post-payment task provisioning
`TaskGenerator::createFromTransaction(Transaction $transaction)` is called after a successful SSLCommerz payment to auto-create a `Task` record for the order (keyed by `transaction_id`, idempotent). It looks up the `User` by email from the transaction, derives the category from `Category::configShape()`, and sends `TaskStatusMail`. If you modify the `Transaction` → `Task` pipeline, verify idempotency (it guards on existing `task.transaction_id`). `CheckoutMetadata` stores buyer notes and file attachment paths (keyed by `upload_token` / `transaction_id`) from the checkout form; read it inside `PendingOrderResolver` when building the pending order.

### Blog system
`Blog` (`app/Models/Blog.php`) is a standalone CMS model for editorial posts. `BlogController` serves the public listing (`/blogs`) and single-post (`/blogs/{slug}`) pages, both cached for 60 minutes (`blog.index`, `blog.show.{slug}`). `Admin/BlogController` manages CRUD from the CMS. Blog posts are not linked to `Category` at the model level — the listing page passes category labels from `Category::configShape()` purely for frontend filtering. If you add any cache derived from blog data, bust it inside `Admin/BlogController`.

### Other CMS-managed content models
These simpler models are managed through the admin CMS and are largely independent of the core business logic:
- `Portfolio` / `PortfolioSubCategory` — `Admin/PortfolioController` / `Admin/PortfolioSubCategoryController`. See Known open bug below for the SubCategory update issue.
- `Brand`, `Testimonial`, `ClientReview`, `Faq` — each has a corresponding `Admin/*Controller`; content is surfaced on public pages via shared or per-page props.

### Frontend structure
- Pages: `resources/js/pages` (Inertia `Inertia::render()` targets), split into `Admin`, `Auth`, `Blogs`, `Dashboard`, `HireUs`, `Home`, `Offer`, `Portfolio`, `Services`.
- `resources/js/actions` and `resources/js/routes` are **Wayfinder-generated** — don't hand-edit; run `php artisan wayfinder:generate` instead.
- `resources/js/components/UI` holds shared/shadcn-derived primitives (see `components.json`); check there before adding a new component.
- Heavy/animated homepage sections are `React.lazy()`-loaded with `<Suspense>` to keep initial bundle small — follow this pattern for similarly heavy new sections (see `PERFORMANCE.md`).
- **React Compiler** (`babel-plugin-react-compiler`) is enabled globally in `vite.config.ts`. Do **not** add manual `useMemo`, `useCallback`, or `React.memo` — the compiler handles all memoization automatically.

### Redis dependency
`SESSION_DRIVER`, `CACHE_STORE`, and `QUEUE_CONNECTION` all point to Redis. The dev stack (`composer dev`) won't behave correctly without a running Redis instance. The contact form (`ContactController::store`) dispatches `ProcessContactMessage` to the queue — this mail is never sent synchronously.

### Vite bundle chunking
`vite.config.ts` defines `manualChunks` that split vendor libraries into named chunks: `vendor-react` (react/react-dom/scheduler), `vendor-framer` (framer-motion), `vendor-three` (three.js/@react-three), `vendor-anim-misc` (gsap/animejs/lenis), `vendor-charts` (recharts), `vendor-radix` (radix-ui). When adding a new heavy library, add it to `manualChunks` and verify with `npm run perf:bundle-check` — the script fails the build on bundle size regression.

### Mother admin recovery
`php artisan admin:reset-mother-admin-credentials` — interactive "break glass" command that creates or resets the mother admin account and enforces the one-mother-admin invariant. Use it when the mother admin is locked out. Only one `is_super_admin` account is expected to exist; the command offers to demote any others.

### Career & job applications
`JobListing` (has `is_active`, `sort_order`) drives the public career page (`/careers`). `CareerController::apply()` uploads résumés to the `local` disk under `resumes/` — intentionally not publicly accessible. `Admin/JobApplicationController` provides staff download access to résumés; `Admin/JobListingController` manages the listings. Both require the `job-listings` / `job-applications` permission keys respectively.

### Other CMS-managed homepage content
`Brand` (logo marquee), `Testimonial`, `Faq`, and `ClientReview` are each managed by a corresponding `Admin/*Controller`. `Brand` and `Testimonial` are Redis-cached by `HomeController` (`home.brands`, `home.testimonials`, 60 min) and their admin controllers bust those keys on every write. `Faq` and `ClientReview` are queried fresh (no cache layer).

### Known open bug
`PortfolioSubCategoryController::update` throws `Undefined array key "slug"` when the payload omits the slug field (slug is auto-generated on create but not on update). Work around by always including slug in update payloads. See `docs/qa-bugs.md` for details.

### Testing conventions
- Pest tests live in `tests/Feature` (mirrors `Admin/`, `Auth/`, `Console/`, `Support/` areas) and `tests/Unit`. There's heavy coverage of authorization edge cases — see `tests/Feature/Admin/AdminAuthorizationTest.php`, `AuthorizationGapsTest.php`, `BroadcastChannelAuthorizationTest.php`, and `AdminSessionInvalidationTest.php` as the reference pattern when adding any new permission-gated route or channel.
- Two PHPUnit configs exist: `phpunit.xml` (default — this is what GitHub Actions CI runs, DB names `opticoresolutions_test`/`opticoresolutions_admin_test`) and `phpunit.pgsql.xml` (alternate local config, `APP_ENV=testing_pgsql`, different DB names `opticore_test`/`opticore_admin_test`). Both use Postgres for both the default and `admin` connections — there is no SQLite-in-memory shortcut here.
- Playwright e2e specs live in `e2e/` (numbered, e.g. `01-admin-login.spec.ts`) with shared helpers in `e2e/utils/`.
- E2E tests require `APP_URL`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` env vars set locally. Admin journeys gracefully skip when these are missing. Contact form journey (`e2e/` Journey 6) is rate-limited at 5/min — don't run it in rapid succession.
