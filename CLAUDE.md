# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Laravel 13 + Inertia v3 + React 19 marketing site and client portal for Opticore Solutions, with an admin CMS, a real-time customer support chat (Reverb broadcasting), an offer/checkout flow with SSLCommerz (incl. Google Pay), and a Gemini-powered chat widget.

## Commands

### Backend (PHP)
- `composer dev` — run dev stack concurrently: `php artisan serve`, `php artisan horizon` (queue worker + dashboard at `/horizon`, mother-admin-only — requires `QUEUE_CONNECTION=redis`), `pail` logs, `npm run dev` (Vite), and `php artisan schedule:work` (ticks the task scheduler every minute — required for any `withSchedule()` entry in `bootstrap/app.php`, e.g. `WarmCache`, `PruneOrphanedCheckoutUploads`, `AutoDeclineMealSelections`, to actually fire locally). `deploy.sh` itself doesn't provision a scheduler runner — on the VPS this is a `* * * * * cd /var/www/opticore/current && php8.3 artisan schedule:run` crontab entry for the `rashed` user (set up manually, outside this repo; not something `deploy.sh` manages or restarts, since it always points at the `current` symlink and needs no per-deploy changes).
- `php artisan test --compact` — run the Pest/PHPUnit suite. Filter with `--filter=testName`.
- `composer test` — clears config cache, runs `pint --test`, then the full test suite (used in CI-like checks).
- `composer lint` / `composer lint:check` — Pint formatting (fix / check-only).
- `vendor/bin/pint --dirty --format agent` — format only changed PHP files; run this after any PHP edit before finishing.
- `composer analyse` (`vendor/bin/phpstan analyse --no-progress`) — Larastan static analysis, config in `phpstan.neon` (level 5, paths `app`/`bootstrap`/`config`/`database`/`routes`, pre-existing findings suppressed via `phpstan-baseline.neon`). Level 5 is deliberate — see the comment in `phpstan.neon` before raising it.
- `composer audit` — Composer dependency vulnerability scan; blocking in CI.
- `php artisan test --compact -c phpunit.pgsql.xml` — run tests against the alternate local-environment config (different DB names/`APP_ENV`) instead of the default `phpunit.xml`. GitHub Actions CI uses the default `phpunit.xml`, not this one.
- `BROADCAST_CONNECTION` defaults to `log` in `.env.example`; `composer dev` does not start Reverb. To exercise real-time chat/notifications locally, set `BROADCAST_CONNECTION=reverb`, fill in the `REVERB_*`/`VITE_REVERB_*` vars, and run `php artisan reverb:start` alongside the dev stack.

### Frontend (JS/TS)
- `npm run dev` — Vite dev server. `npm run build` / `npm run build:ssr` — production build.
- `npm run lint` / `npm run lint:check` — ESLint (fix / check-only).
- `npm run format` / `npm run format:check` — Prettier.
- `npm run types:check` — TypeScript, no emit.
- `npm run test` — Vitest unit tests (jsdom). `npm run test:e2e` — Playwright specs in `e2e/`.
- `npm run perf:bundle-check` — fails the build if JS bundle size regresses (see `scripts/perf/check-bundle-size.mjs`).
- `php artisan wayfinder:generate` — regenerate typed route/controller helpers in `resources/js/actions` and `resources/js/routes` after changing controllers or `routes/web.php`.

### Load testing (k6)
`load-testing/` (see its `README.md`) has k6 scripts run manually/out-of-band, not part of `composer ci:check` or GitHub Actions CI: `checkout-browse.js`, `order-creation.js`, and `callback-race.js` (specifically exercises the SSLCommerz `success()`/`ipn()` race described below), with shared auth helpers in `load-testing/lib/auth.js`.

### Combined CI check
- `composer ci:check` — regenerates Wayfinder, then runs `lint:check`, `format:check`, `types:check`, `analyse` (Larastan), and the test suite. Run this (or the equivalent individual commands) before considering backend+frontend work done.
- GitHub Actions CI (`ci.yml`) additionally runs `npm run build:ssr`, `npm run perf:bundle-check`, `composer audit` (blocking), and `npm audit --audit-level=high` (advisory, `continue-on-error` — the dependency tree has real unresolved moderate/high findings not yet triaged) — make sure the blocking ones pass locally before pushing to `main`.

## Architecture

### Dual-database auth: `web` vs `admin`
There are two completely separate user systems backed by two separate Postgres databases:
- **`User`** (`app/Models/User.php`) — site customers/clients, default `pgsql` connection, `auth:web` guard, soft-deletes.
- **`Admin`** (`app/Models/Admin.php`) — CMS staff, **separate `admin` DB connection** (`config/database.php` `'admin'` connection, env `DB_ADMIN_*`), `auth:admin` guard.

Several routes intentionally accept either guard (`auth:web,admin`) — e.g. offer viewing and chat attachment downloads — because both customers and staff can legitimately hit them.

### Social login (Laravel Socialite)
`Auth/SocialController` (`GET /auth/{provider}/redirect` and `/auth/{provider}/callback`, both `guest`-only) supports `google` and `facebook` against a hard-coded allowlist in `supportedProviders()`. On callback it links to `User` (`web` guard) by provider-specific column first (`google_id`/`facebook_id`), then falls back to a lowercased email match; new users get an unusable random password (`Hash::make(Str::random(24))`) and are auto-verified. **Account-takeover guard**: if the email-match fallback finds an account with an *unverified* email, the login is rejected outright rather than silently linking the social identity — an attacker could otherwise pre-register an unverified account with a victim's email and hijack it via social login. Soft-deleted users (self-deleted via `ProfileController::deleteAccount`, which mangles the live `email` column) are restored on a successful match, including their `original_email`.

### Meal Management CMS (third, fully isolated database)
An internal office lunch program under `/admin/meal-management`, backed by its own **`meal` DB connection** (`config/database.php` `'meal'` connection, env `DB_MEAL_*`) — deliberately unrelated to either the `pgsql` (client) or `admin` database, so `MealSetting`/`MealItem`/`MealHoliday`/`MealCancellation`/`MealSelection` never join against `User`/`Admin`/business tables.
- Gated by the `meal-management` key in `AdminPermissions` (same three-places-must-match rule as every other admin section). The mother admin oversees but never selects — `MealScheduleService::eligibleAdmins()` explicitly excludes `is_super_admin` and requires `canAccess('meal-management')`.
- `MealScheduleService` is the single source of truth for "is selection open right now" (weekly holiday day, ad hoc `MealCancellation`, the daily accept/decline window) — reused by `MealManagementController` (building UI props), the `select()` mutation's server-side guard, and the scheduled sweep, so the three can't drift out of sync. `MealClock` centralizes the timezone. Don't reimplement the window check elsewhere.
- `AutoDeclineMealSelections` (console command, registered in `bootstrap/app.php`'s `withSchedule()`) auto-declines anyone who hasn't responded once the window closes — see the `composer dev` note above for running the scheduler locally.
- Selection changes broadcast on the `admin.meal-management` private channel (`routes/channels.php`, gated the same as the permission check) via `MealSelectionUpdated`, so the mother admin's roster table (`Admin/MealManagement/Overview.tsx`) updates live using the existing `RealtimeTableListener` pattern (same one used by admin Orders/Transactions/Tasks tables) — no page reload.
- An admin whose *only* granted permission is `meal-management` is kept out of the regular dashboard entirely: `Admin::isMealManagementOnly()` server-side and the mirrored check in `AdminLayout.tsx` redirect them straight into `Admin/MealManagement/SelfService.tsx` instead.
- `Admin/MealReportController` exports a monthly Excel report (PhpSpreadsheet) of selections; the mother admin can password-gate override any admin's selection via `MealManagementController`.

### Admin permission system
`app/Support/AdminPermissions.php` is the **single source of truth** for grantable CMS sections. Each `key` must simultaneously match:
1. the route-name segment after `admin.` (e.g. `admin.portfolios.index` → `portfolios`),
2. the `key` in `NAV_ITEMS` in `resources/js/components/Layout/AdminLayout.tsx`,
3. the whitelist used by the `admin.permission` middleware (`EnsureAdminHasPermission`).

`Admin::canAccess($key)` returns true for the mother admin (`is_super_admin`) or `full_access` admins, otherwise checks the `permissions` array column. The mother admin (`Admin::motherAdmin()`) is the immutable master account used to gate destructive actions, and is exempt from session invalidation.

`EnsureAdminSessionIsCurrent` (alias `admin.session`) force-logs-out a non-mother admin mid-session if their `securityStamp()` (hash of password + `full_access` + `permissions`) no longer matches what was stamped into the session at login — i.e. if the mother admin changes their access while they're logged in.

Routes under `admin.permission` derive the required key from the route name automatically; routes that don't follow the `admin.<key>.*` convention (e.g. `offer.update`) check `Admin::canAccess()` explicitly inside the controller instead.

### Real-time (Laravel Reverb)
`routes/channels.php` defines private/presence channels for per-user notifications (`App.Models.User.{id}`), customer↔admin conversations (`conversations.{id}`, dual-guard), and admin-only dashboards (`admin.conversations`, `admin.orders`, `admin.transactions`, `admin.tasks`, `admin.meal-management` — each gated by the matching `canAccess()` permission key). The `/broadcasting/auth` route promotes the `admin` guard to default when an admin is subscribing, so `Broadcast::auth()` resolves the right user; it's also CSRF-exempt because Pusher.js authorizes via JSON, not a form post. Use the `echo-development` / `echo-react-development` skills when touching any of this.

### Payments: SSLCommerz + Google Pay
- `app/Library/SslCommerz/` wraps the SSLCommerz gateway SDK; `SslCommerzPaymentController` exposes `/pay-via-ajax`, `/success`, `/fail`, `/cancel`, `/ipn` (all under `throttle:payment-callback`, CSRF-exempt since the gateway POSTs directly).
- `GooglePayCheckoutController` + `app/Support/GooglePaySslCommerz.php` implement Google Pay via SSLCommerz's Merchant-Hosted Payment API (`/gpay/config`, `/gpay/charge`).
- `app/Support/PendingOrderResolver.php`, `PaymentReturnToken.php`, and `IdGenerator.php` support the checkout/offer-acceptance → pending-order → transaction pipeline. `InvoicePdfBuilder.php` (with `spatie/laravel-pdf`) generates downloadable/verifiable invoices (`orders/{transaction}/invoice`, signed verify link) and embeds an `endroid/qr-code` PNG (data URI, encoding the `Crypt::encryptString`-token `orders.invoice.verify` URL) directly in the PDF so a scan re-verifies authenticity independent of the app that printed it.

### `success()`/`ipn()` race hardening
SSLCommerz calls back to this app through two independent channels for the same transaction: the customer's browser is redirected to `/success`, and SSLCommerz's servers POST to `/ipn` (webhook) — both fire within milliseconds of each other, and the IPN webhook typically reaches the server before the browser redirect completes. Both handlers used to read the order's `Pending` status and both would proceed, double-sending the invoice email and double-provisioning the workflow task.
- `SslCommerzPaymentController::claimOrderForProcessing()` makes the `Pending` → `Processing` transition a single atomic conditional `UPDATE ... WHERE status = 'Pending'`; only the caller whose UPDATE actually affects a row proceeds to process the payment. The other caller treats the transaction as already-processed (`alreadyProcessedSuccessRedirect()` for `success()`, an `ALREADY PROCESSED` 200 response for `ipn()`) rather than repeating side effects.
- Because either handler can now win the claim (not just `success()` as before), **`ipn()` must dispatch the same events as `success()`** — `PaymentReceived` and `TransactionUpdated` in addition to `OrderUpdated` — or the admin transactions table's live refresh and payment slide notification silently stop working whenever the IPN webhook wins the race (which is most of the time in practice). If you add another event/side-effect to one handler's Processing-transition branch, add it to the other's too.
- Invoice PDF rendering (headless Chrome via Browsershot) and sending the invoice email used to run inline in both `success()` and `ipn()`, blocking the browser redirect and the gateway's webhook response on a multi-second render. That work now runs in the queued `SendPaymentInvoiceEmail` job. Since a transaction's data is immutable once `invoice_number` is set, `InvoicePdfBuilder::cachedContent()` renders the PDF once and caches the bytes to disk instead of re-rendering on every view/download — reused by the queued job, `ProfileController`'s download/verify routes, and the admin transaction download route.
- The exchange-rate lookup in `payViaAjax()` (`exchange_rate_usd_bdt`, cached 6h) casts the API's `conversion_rate` to `(float)` explicitly before multiplying — `exchangerate-api.com` encodes it as a JSON string, and relying on PHP's numeric-string coercion there previously crashed BDT checkouts.

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
`app/Http/Middleware/SecurityHeaders.php` sets a strict CSP in production only (disabled locally so Vite HMR over plain HTTP still works). It allowlists each third-party origin actually in use (Google Pay, SSLCommerz embedded checkout/3DS redirect, Google Fonts, the Reverb websocket, Google Maps) and computes a `sha256` hash of Inertia's inline `data-page` JSON payload per-response rather than using `'unsafe-inline'`. The CSP's `report-uri` posts violations to `CspReportController::store` (`POST /csp-report`, throttled `throttle:30,1`). Named rate limiters live in `app/Providers/AppServiceProvider.php::configureRateLimiters()` (`login`, `admin-login`, `register`, `password-reset`, `payment-callback`) — auth limiters deliberately cap by `email+ip` *and* by account-alone, so an attacker rotating source IPs can't get a fresh allowance against one target.

### Password hashing policy
`config/hashing.php` deliberately supports **argon2id only** — bcrypt is fully disabled (its options block is explicitly blanked, not omitted, since Laravel would otherwise silently re-merge the framework's bcrypt defaults) and `'verify' => true` rejects any non-argon2id hash outright rather than accepting it. This is enforceable only because `php artisan auth:force-password-reset` (`app/Console/Commands/ForcePasswordReset.php`) was run once to invalidate every existing `User`/`Admin` password hash — users recover via the normal forgot-password email flow, but admins have no self-service reset and must go through `admin:reset-mother-admin-credentials` if the mother admin's own password is invalidated. The shared password complexity policy (`Password::defaults()` in `AppServiceProvider`, min 8 + letters + numbers + mixed case + symbols in production) is set in one place — update it there, not at individual call sites.

### Shared Inertia props & SSR exclusions
`HandleInertiaRequests::share()` pushes these props to every page: `name`, `auth.user`, `categories` (`Category::configShape()`), `footerServices` (`Category::servicePageLinks()`), `siteSettings` (`SiteSetting::current()->toPublicArray()`), and a `flash` bag with keys `success`, `error`, `invoice`, `payment_success`, `payment_error`, `checkout_url`, `subscription`. Use these exact key names when reading flash from the frontend.

SSR is disabled for `admin/*`, `dashboard`, `profile`, `checkout`, `checkout/*`, `gpay/*`, `offer/*`, and `orders/*` via `HandleInertiaRequests::$withoutSsr`. If a page in those paths appears to hydrate differently from public pages, that's why.

### SiteSetting singleton
`SiteSetting` (`app/Models/SiteSetting.php`) is a single-row table for contact info, addresses, and social links. Always access it via `SiteSetting::current()` (cached indefinitely via `Cache::rememberForever`). `SiteSetting::forgetCache()` invalidates it. Edited from the admin `configuration` section. The `toPublicArray()` shape is what gets injected into shared Inertia props for the footer and contact page — don't read the model attributes directly on the frontend. `Admin/ConfigurationController` already calls `forgetCache()` on write — follow that pattern.

### Database backup download
`Admin/ConfigurationController::downloadBackup()` (`GET admin/configuration/backup`, `configuration` permission — same access level as the rest of that section, not mother-admin-only) streams a zip of plain-SQL `pg_dump` dumps of all three Postgres databases (client/`pgsql`, `admin`, `meal`) via `DatabaseBackupService` (`app/Support/`). It shells out to the `pg_dump` binary per connection (not a hand-rolled table export, so schema changes need zero changes here), passes the password via `PGPASSWORD` env rather than argv (argv is visible to other processes via `ps aux`), and always deletes the raw per-database `.sql` files in a `finally` block regardless of success/failure — only the assembled zip survives, and the controller deletes that too after streaming it. Plain SQL format (not `-Fc`), so restoring a dump needs nothing beyond `psql -d dbname < file.sql`.

### Post-payment task provisioning
`TaskGenerator::createFromTransaction(Transaction $transaction)` is called after a successful SSLCommerz payment to auto-create a `Task` record for the order (keyed by `transaction_id`, idempotent). It looks up the `User` by email from the transaction, derives the category from `Category::configShape()`, and sends `TaskStatusMail`. If you modify the `Transaction` → `Task` pipeline, verify idempotency (it guards on existing `task.transaction_id`). `CheckoutMetadata` stores buyer notes and file attachment paths (keyed by `upload_token` / `transaction_id`) from the checkout form; read it inside `PendingOrderResolver` when building the pending order.

### Blog system
`Blog` (`app/Models/Blog.php`) is a standalone CMS model for editorial posts. `Blog` stores `category` as a plain string (no FK to `Category`). `BlogController` serves the public listing (`/blogs`) and single-post (`/blogs/{slug}`) pages, both cached for 60 minutes (`blog.index`, `blog.show.{slug}`). `Admin/BlogController` manages CRUD from the CMS and busts `blog.index` on every write and `blog.show.{slug}` on update/delete — follow this dual-forget pattern if you add any new blog-derived cache. Blog posts are not linked to `Category` at the model level — the listing page passes category labels from `Category::configShape()` purely for frontend filtering.

### Dynamic sitemap
`SitemapController::index()` builds `/sitemap.xml` from static pages, `Category::configShape()` slugs (service + portfolio category pages), `PortfolioSubCategory` rows, and `Blog` posts, cached 60 min under the `sitemap.xml` key. `Admin/CategoryController`, `Admin/PortfolioSubCategoryController`, and `Admin/BlogController` all call `Cache::forget('sitemap.xml')` on writes — add the same call if a new model contributes URLs to the sitemap.

### Other CMS-managed content models
These simpler models are managed through the admin CMS and are largely independent of the core business logic:
- `Portfolio` / `PortfolioSubCategory` — `Admin/PortfolioController` / `Admin/PortfolioSubCategoryController`. The update method auto-generates slug from `name` when the payload omits it.
- `Brand`, `Testimonial`, `ClientReview`, `Faq` — each has a corresponding `Admin/*Controller`; content is surfaced on public pages via shared or per-page props.

### Frontend structure
- Pages: `resources/js/pages` (Inertia `Inertia::render()` targets), split into `Admin`, `Auth`, `Blogs`, `Dashboard`, `HireUs`, `Home`, `Offer`, `Portfolio`, `Services`.
- `resources/js/actions` and `resources/js/routes` are **Wayfinder-generated** — don't hand-edit; run `php artisan wayfinder:generate` instead.
- `resources/js/components/UI` holds shared/shadcn-derived primitives (see `components.json`); check there before adding a new component.
- Heavy/animated homepage sections are `React.lazy()`-loaded with `<Suspense>` to keep initial bundle small — follow this pattern for similarly heavy new sections (see `PERFORMANCE.md`).
- **React Compiler** (`babel-plugin-react-compiler`) is enabled globally in `vite.config.ts`. Do **not** add manual `useMemo`, `useCallback`, or `React.memo` — the compiler handles all memoization automatically.

### Light/dark theme conventions — the `glass-panel` + hardcoded-white pitfall
`app.css` defines semantic, theme-aware tokens/utilities: `text-theme` / `text-theme-muted` / `text-theme-subtle` (text), `bg-theme-surface` / `bg-theme-surface-hover` (subtle fills), `border-theme` (borders), and `neo-panel` / `neo-panel-elevated` (solid, own-color card surfaces with light/dark gradients baked in via `--card-surface`/`--card-gradient`). `.glass-panel`, by contrast, is a translucent tint (`--theme-surface`, ~3% black in light mode) meant to sit over a colorful/dark backdrop — pairing it with hardcoded `text-white` / `text-zinc-300` / `text-zinc-400` (as `ServicePageTemplate.tsx` did before it was fixed for the `/video-editing`-style service pages) renders near-invisible white-on-near-white text in light mode. When auditing a page/component for light-theme readability: replace hardcoded `text-white`/`text-zinc-*` with the `text-theme*` tokens, swap `glass-panel` for `neo-panel`/`neo-panel-elevated` on card/panel surfaces that need to visually pop (not just tint), and swap ad hoc `border-white/10 bg-white/5` chrome for `border-theme bg-theme-surface`. For "each card its own color" treatment, cycle a small literal accent-class array (text/chip/border variants per Tailwind color, written as literal strings so the JIT scanner picks them up — see `CATEGORY_COLOR_MAP` in `lib/categoryVisuals.ts` or `CARD_ACCENTS` in `components/Services/ServicePageTemplate.tsx`) across `.map()` items by index, rather than one repeated accent color down the whole page. Other components still using the `glass-panel` + white-text combo that may need the same pass if a light-theme bug is reported: `UI/ServiceCard.tsx`, `UI/Lightbox.tsx`, `UI/TestimonialCard.tsx`, `chat/SupportWidget.tsx`, `Layout/GuestLayout.tsx`, `Blogs/BlogCard.tsx`, `pages/About.tsx`, `pages/FAQ.tsx`, `pages/PrivacyPolicy.tsx`, `pages/Blogs/Show.tsx`, `pages/TermsConditions.tsx`, `pages/Dashboard/Index.tsx` — verify each individually rather than assuming they're broken, some may already handle it correctly.

### Redis dependency
`SESSION_DRIVER`, `CACHE_STORE`, and `QUEUE_CONNECTION` all point to Redis. The dev stack (`composer dev`) won't behave correctly without a running Redis instance. The contact form (`ContactController::store`) dispatches `ProcessContactMessage` to the queue — this mail is never sent synchronously. If the `redis` PHP extension isn't available in a given environment, `REDIS_CLIENT=predis` (pure-PHP, `predis/predis`) is a drop-in fallback — no code changes needed, just the env var and the Composer package.

### Observability stack: Sentry, Pulse, Health, Horizon
Four separate tools, each addressing a different gap, all installed via `composer require`:
- **Sentry** (`sentry/sentry-laravel`) — exception/performance reporting, wired into `bootstrap/app.php`'s `withExceptions()` via `Integration::handles($exceptions)`, alongside (not replacing) the existing Inertia error-page `respond()` callback.
- **Pulse** (`/pulse`) — request timings, slow queries, exceptions, per-user activity over the last ~7 days (self-trimming, no cron needed — see `Pulse::ingest()`'s 1-in-1000 lottery).
- **Health** (`/health`) — point-in-time pass/fail checks (DB connections incl. `admin`/`meal`, cache, disk space, debug mode, config caching, and a scheduler heartbeat — see below). Complements Sentry/Pulse by catching silent failures that never throw an exception.
- **Horizon** (`/horizon`) — Redis queue dashboard/worker manager, replacing plain `queue:work`/`queue:listen`. Requires `QUEUE_CONNECTION=redis` to do anything at all; inert otherwise.

All four dashboards are gated to the mother admin only (not delegable via `AdminPermissions`, and — for Pulse/Health/Horizon — deliberately excluding `full_access` admins too, unlike every other admin nav item). Two non-obvious gotchas hit while wiring this up, worth knowing before touching any of it:
- **Gate closures need a `$user = null` parameter, even if unused.** `Illuminate\Auth\Access\Gate::raw()` resolves "the current user" from the *default* (`web`) guard before invoking any ability closure — and since admins authenticate on the separate `admin` guard, that's always `null` here. When it's `null`, Gate only invokes closures whose first parameter is nullable/defaults to `null` (i.e. explicitly "allows guests"); a zero-arg closure gets silently swapped for a no-op deny, regardless of what its body would've returned. See `viewPulse`/`viewHealth` in `AppServiceProvider::boot()` and `viewHorizon` in `HorizonServiceProvider::gate()` — all check `auth('admin')->user()?->isMotherAdmin()` internally rather than trusting the injected `$user`. Horizon's own generated `HorizonServiceProvider` additionally OR's its gate with `app()->environment('local')` in `authorization()` (auto-allowing everyone locally) — overridden here to keep behavior consistent with Pulse/Health across all environments.
- **`config/cache.php`'s `serializable_classes` (Laravel's secure-by-default `false`, blocking any object from being unserialized out of cache) breaks Pulse's dashboard**, which caches computed `Collection`/`stdClass`/`CarbonImmutable` results via `Cache::remember()` — surfaces as `The script tried to call a method on an incomplete object` on whichever card renders first. Fixed by narrowly allow-listing exactly those three classes rather than disabling the protection outright; if another Pulse card ever errors the same way for a different class, add it to that list.

Non-Inertia routes (`/pulse`, `/health`, `/horizon`) are rendered as plain `<a target="_blank">` links in `AdminLayout.tsx`'s sidebar, not Inertia `<Link>`s — Inertia's client expects an `X-Inertia` JSON response and breaks against Livewire/Blade/Vue pages that don't send one.

Health's `ScheduleCheck` needs `ScheduleCheckHeartbeatCommand` scheduled every minute (`bootstrap/app.php`) to have anything to compare against — without it, it permanently reports "did not run yet" rather than reflecting the real scheduler state. It's the one check here specifically meant to catch the production cron entry (see `composer dev` above) silently dying with nothing else noticing.

### Vite bundle chunking
`vite.config.ts` defines `manualChunks` that split vendor libraries into named chunks: `vendor-react` (react/react-dom/scheduler), `vendor-framer` (framer-motion), `vendor-three` (three.js/@react-three), `vendor-anim-misc` (gsap/animejs/lenis), `vendor-charts` (recharts), `vendor-radix` (radix-ui). When adding a new heavy library, add it to `manualChunks` and verify with `npm run perf:bundle-check` — the script fails the build on bundle size regression.

### Mother admin recovery
`php artisan admin:reset-mother-admin-credentials` — interactive "break glass" command that creates or resets the mother admin account and enforces the one-mother-admin invariant. Use it when the mother admin is locked out. Only one `is_super_admin` account is expected to exist; the command offers to demote any others.

### Career & job applications
`JobListing` (has `is_active`, `sort_order`) drives the public career page (`/careers`). `CareerController::apply()` uploads résumés to the `local` disk under `resumes/` — intentionally not publicly accessible. `Admin/JobApplicationController` provides staff download access to résumés; `Admin/JobListingController` manages the listings. Both require the `job-listings` / `job-applications` permission keys respectively.

### Other CMS-managed homepage content
`Brand` (logo marquee), `Testimonial`, `Faq`, and `ClientReview` are each managed by a corresponding `Admin/*Controller`. `Brand` and `Testimonial` are Redis-cached by `HomeController` (`home.brands`, `home.testimonials`, 60 min) and their admin controllers bust those keys on every write. `Faq` and `ClientReview` are queried fresh (no cache layer).

### Deployment (self-hosted, atomic releases)
Pushes to `main` that pass `ci.yml` trigger `deploy.yml` (`workflow_run` on CI success) on a **self-hosted** runner — there is no separate build-and-deploy path, so production always runs the exact `frontend-build-{sha}` / `ssr-build-{sha}` artifacts CI just verified, not a fresh rebuild. `deploy.yml` hands off to `scripts/deploy/deploy.sh`, which performs a Capistrano-style atomic release under `/var/www/opticore`: rsyncs the checkout into a timestamped `releases/<name>` dir, links shared `.env`/`storage`, runs `composer install --no-dev`, drops in the pre-built frontend, enables maintenance mode, migrates both DB connections, caches config/routes/views/events, swaps the `current` symlink, restarts PHP-FPM/Reverb and signals `queue:restart`, health-checks `/up`, and auto-rolls back on failure — keeping the last 5 releases. `rollback.yml` is a manual `workflow_dispatch` (requires typing `confirm: yes`) that runs `scripts/deploy/rollback.sh` against a named or previous release. Both workflows share the `production-deploy` concurrency group (queued, not cancelled) so overlapping deploys/rollbacks can't race each other.

### Stack versions
PHP 8.3, Laravel 13, Inertia v3, React 19, Tailwind v4, Pest v4. These inform which API surface is current — e.g. `Inertia::optional()` replaces the removed `Inertia::lazy()`, and Tailwind v4 class names differ from v3.

### Testing conventions
- Pest tests live in `tests/Feature` (mirrors `Admin/`, `Auth/`, `Console/`, `Support/` areas) and `tests/Unit`. There's heavy coverage of authorization edge cases — see `tests/Feature/Admin/AdminAuthorizationTest.php`, `AuthorizationGapsTest.php`, `BroadcastChannelAuthorizationTest.php`, and `AdminSessionInvalidationTest.php` as the reference pattern when adding any new permission-gated route or channel.
- Two PHPUnit configs exist: `phpunit.xml` (default — this is what GitHub Actions CI runs, DB names `opticoresolutions_test`/`opticoresolutions_admin_test`) and `phpunit.pgsql.xml` (alternate local config, `APP_ENV=testing_pgsql`, different DB names `opticore_test`/`opticore_admin_test`). Both use Postgres for both the default and `admin` connections — there is no SQLite-in-memory shortcut here.
- Playwright e2e specs live in `e2e/` (numbered, e.g. `01-admin-login.spec.ts`) with shared helpers in `e2e/utils/`. `08-visual-regression.spec.ts` does screenshot-diff testing (snapshots in its adjacent `-snapshots/` dir — regenerate deliberately, don't just delete on mismatch) and `09-accessibility.spec.ts` runs axe-core checks; both run as part of the same `npm run test:e2e` suite as the functional journeys.
- E2E tests require `APP_URL`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` env vars set locally. Admin journeys gracefully skip when these are missing. Contact form journey (`e2e/` Journey 6) is rate-limited at 5/min — don't run it in rapid succession.
