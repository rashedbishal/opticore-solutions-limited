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
- See `[[project_sslcommerz_instructions]]`-style context in memory for the gateway setup sequence; don't re-derive it from scratch.

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
`SiteSetting::current()` returns the single settings row, cached **permanently** (`Cache::rememberForever`). After any write to `SiteSetting`, call `SiteSetting::forgetCache()` or the stale values will persist in cache. `Admin/ConfigurationController` already does this — follow that pattern.

### Post-payment task provisioning
`TaskGenerator::createFromTransaction(Transaction $transaction)` is called after a successful SSLCommerz payment to auto-create a `Task` record for the order (keyed by `transaction_id`, idempotent). It looks up the `User` by email from the transaction, derives the category from `Category::configShape()`, and sends `TaskStatusMail`. If you modify the `Transaction` → `Task` pipeline, verify idempotency (it guards on existing `task.transaction_id`). `CheckoutMetadata` stores buyer notes and file attachment paths (keyed by `upload_token` / `transaction_id`) from the checkout form; read it inside `PendingOrderResolver` when building the pending order.

### Frontend structure
- Pages: `resources/js/pages` (Inertia `Inertia::render()` targets), split into `Admin`, `Auth`, `Blogs`, `Dashboard`, `HireUs`, `Home`, `Offer`, `Portfolio`, `Services`.
- `resources/js/actions` and `resources/js/routes` are **Wayfinder-generated** — don't hand-edit; run `php artisan wayfinder:generate` instead.
- `resources/js/components/UI` holds shared/shadcn-derived primitives (see `components.json`); check there before adding a new component.
- Heavy/animated homepage sections are `React.lazy()`-loaded with `<Suspense>` to keep initial bundle small — follow this pattern for similarly heavy new sections (see `PERFORMANCE.md`).

### Task workflow & payment → task pipeline
`TaskGenerator::createFromTransaction()` is called after a successful payment and auto-provisions a `Task` record linked to the `Transaction`. It's idempotent (checks for a duplicate `transaction_id` first) and silently skips if there's no matching `User` for the transaction email. The generated task name is built from `Category::configShape()` — don't call `Category` directly inside `TaskGenerator`.

### Redis dependency
`SESSION_DRIVER`, `CACHE_STORE`, and `QUEUE_CONNECTION` all point to Redis. The dev stack (`composer dev`) won't behave correctly without a running Redis instance. The contact form (`ContactController::store`) dispatches `ProcessContactMessage` to the queue — this mail is never sent synchronously.

### Mother admin recovery
`php artisan admin:reset-mother-admin-credentials` — interactive "break glass" command that creates or resets the mother admin account and enforces the one-mother-admin invariant. Use it when the mother admin is locked out. Only one `is_super_admin` account is expected to exist; the command offers to demote any others.

### Known open bug
`PortfolioSubCategoryController::update` throws `Undefined array key "slug"` when the payload omits the slug field (slug is auto-generated on create but not on update). Work around by always including slug in update payloads. See `docs/qa-bugs.md` for details.

### Testing conventions
- Pest tests live in `tests/Feature` (mirrors `Admin/`, `Auth/`, `Console/`, `Support/` areas) and `tests/Unit`. There's heavy coverage of authorization edge cases — see `tests/Feature/Admin/AdminAuthorizationTest.php`, `AuthorizationGapsTest.php`, `BroadcastChannelAuthorizationTest.php`, and `AdminSessionInvalidationTest.php` as the reference pattern when adding any new permission-gated route or channel.
- Two PHPUnit configs exist: `phpunit.xml` (default — this is what GitHub Actions CI runs, DB names `opticoresolutions_test`/`opticoresolutions_admin_test`) and `phpunit.pgsql.xml` (alternate local config, `APP_ENV=testing_pgsql`, different DB names `opticore_test`/`opticore_admin_test`). Both use Postgres for both the default and `admin` connections — there is no SQLite-in-memory shortcut here.
- Playwright e2e specs live in `e2e/` (numbered, e.g. `01-admin-login.spec.ts`) with shared helpers in `e2e/utils/`.
- E2E tests require `APP_URL`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` env vars set locally. Admin journeys gracefully skip when these are missing. Contact form journey (`e2e/` Journey 6) is rate-limited at 5/min — don't run it in rapid succession.

### SiteSetting singleton
`SiteSetting` (`app/Models/SiteSetting.php`) is a single-row table for contact info, addresses, and social links. Always access it via `SiteSetting::current()` (cached indefinitely via `Cache::rememberForever`). `SiteSetting::forgetCache()` invalidates it. Edited from the admin `configuration` section. The `toPublicArray()` shape is what gets injected into shared Inertia props for the footer and contact page — don't read the model attributes directly on the frontend.

### Career / Job listings
`JobListing` and `JobApplication` are independent CMS-managed models. `CareerController` serves the public careers page (`/careers`). `Admin/JobListingController` and `Admin/JobApplicationController` manage listings and applications from the CMS. Both require the `job-listings` / `job-applications` permission keys respectively.

### Vite bundle chunking
`vite.config.ts` defines `manualChunks` that split vendor libraries into named chunks: `vendor-react` (react/react-dom/scheduler), `vendor-framer` (framer-motion), `vendor-three` (three.js/@react-three), `vendor-anim-misc` (gsap/animejs/lenis), `vendor-charts` (recharts), `vendor-radix` (radix-ui). When adding a new heavy library, add it to `manualChunks` and verify with `npm run perf:bundle-check` — the script fails the build on bundle size regression.

<laravel-boost-guidelines>
=== foundation rules ===

# Laravel Boost Guidelines

The Laravel Boost guidelines are specifically curated by Laravel maintainers for this application. These guidelines should be followed closely to ensure the best experience when building Laravel applications.

## Foundational Context

This application is a Laravel application and its main Laravel ecosystems package & versions are below. You are an expert with them all. Ensure you abide by these specific packages & versions.

- php - 8.3
- inertiajs/inertia-laravel (INERTIA_LARAVEL) - v3
- laravel/framework (LARAVEL) - v13
- laravel/prompts (PROMPTS) - v0
- laravel/wayfinder (WAYFINDER) - v0
- laravel/boost (BOOST) - v2
- laravel/mcp (MCP) - v0
- laravel/pail (PAIL) - v1
- laravel/pint (PINT) - v1
- laravel/sail (SAIL) - v1
- pestphp/pest (PEST) - v4
- phpunit/phpunit (PHPUNIT) - v12
- @inertiajs/react (INERTIA_REACT) - v3
- react (REACT) - v19
- tailwindcss (TAILWINDCSS) - v4
- @laravel/vite-plugin-wayfinder (WAYFINDER_VITE) - v0
- eslint (ESLINT) - v9
- prettier (PRETTIER) - v3

## Skills Activation

This project has domain-specific skills available. You MUST activate the relevant skill whenever you work in that domain—don't wait until you're stuck.

- `laravel-best-practices` — Apply this skill whenever writing, reviewing, or refactoring Laravel PHP code. This includes creating or modifying controllers, models, migrations, form requests, policies, jobs, scheduled commands, service classes, and Eloquent queries. Triggers for N+1 and query performance issues, caching strategies, authorization and security patterns, validation, error handling, queue and job configuration, route definitions, and architectural decisions. Also use for Laravel code reviews and refactoring existing Laravel code to follow best practices. Covers any task involving Laravel backend PHP code patterns.
- `wayfinder-development` — Use this skill for Laravel Wayfinder which auto-generates typed functions for Laravel controllers and routes. ALWAYS use this skill when frontend code needs to call backend routes or controller actions. Trigger when: connecting any React/Vue/Svelte/Inertia frontend to Laravel controllers, routes, building end-to-end features with both frontend and backend, wiring up forms or links to backend endpoints, fixing route-related TypeScript errors, importing from @/actions or @/routes, or running wayfinder:generate. Use Wayfinder route functions instead of hardcoded URLs. Covers: wayfinder() vite plugin, .url()/.get()/.post()/.form(), query params, route model binding, tree-shaking. Do not use for backend-only task
- `pest-testing` — Use this skill for Pest PHP testing in Laravel projects only. Trigger whenever any test is being written, edited, fixed, or refactored — including fixing tests that broke after a code change, adding assertions, converting PHPUnit to Pest, adding datasets, and TDD workflows. Always activate when the user asks how to write something in Pest, mentions test files or directories (tests/Feature, tests/Unit, tests/Browser), or needs browser testing, smoke testing multiple pages for JS errors, or architecture tests. Covers: it()/expect() syntax, datasets, mocking, browser testing (visit/click/fill), smoke testing, arch(), Livewire component tests, RefreshDatabase, and all Pest 4 features. Do not use for factories, seeders, migrations, controllers, models, or non-test PHP code.
- `inertia-react-development` — Develops Inertia.js v3 React client-side applications. Activates when creating React pages, forms, or navigation; using <Link>, <Form>, useForm, useHttp, setLayoutProps, or router; working with deferred props, prefetching, optimistic updates, instant visits, or polling; or when user mentions React with Inertia, React pages, React forms, or React navigation.
- `tailwindcss-development` — Always invoke when the user's message includes 'tailwind' in any form. Also invoke for: building responsive grid layouts (multi-column card grids, product grids), flex/grid page structures (dashboards with sidebars, fixed topbars, mobile-toggle navs), styling UI components (cards, tables, navbars, pricing sections, forms, inputs, badges), adding dark mode variants, fixing spacing or typography, and Tailwind v3/v4 work. The core use case: writing or fixing Tailwind utility classes in HTML templates (Blade, JSX, Vue). Skip for backend PHP logic, database queries, API routes, JavaScript with no HTML/CSS component, CSS file audits, build tool configuration, and vanilla CSS.

## Conventions

- You must follow all existing code conventions used in this application. When creating or editing a file, check sibling files for the correct structure, approach, and naming.
- Use descriptive names for variables and methods. For example, `isRegisteredForDiscounts`, not `discount()`.
- Check for existing components to reuse before writing a new one.

## Verification Scripts

- Do not create verification scripts or tinker when tests cover that functionality and prove they work. Unit and feature tests are more important.

## Application Structure & Architecture

- Stick to existing directory structure; don't create new base folders without approval.
- Do not change the application's dependencies without approval.

## Frontend Bundling

- If the user doesn't see a frontend change reflected in the UI, it could mean they need to run `npm run build`, `npm run dev`, or `composer run dev`. Ask them.

## Documentation Files

- You must only create documentation files if explicitly requested by the user.

## Replies

- Be concise in your explanations - focus on what's important rather than explaining obvious details.

=== boost rules ===

# Laravel Boost

## Tools

- Laravel Boost is an MCP server with tools designed specifically for this application. Prefer Boost tools over manual alternatives like shell commands or file reads.
- Use `database-query` to run read-only queries against the database instead of writing raw SQL in tinker.
- Use `database-schema` to inspect table structure before writing migrations or models.
- Use `get-absolute-url` to resolve the correct scheme, domain, and port for project URLs. Always use this before sharing a URL with the user.
- Use `browser-logs` to read browser logs, errors, and exceptions. Only recent logs are useful, ignore old entries.

## Searching Documentation (IMPORTANT)

- Always use `search-docs` before making code changes. Do not skip this step. It returns version-specific docs based on installed packages automatically.
- Pass a `packages` array to scope results when you know which packages are relevant.
- Use multiple broad, topic-based queries: `['rate limiting', 'routing rate limiting', 'routing']`. Expect the most relevant results first.
- Do not add package names to queries because package info is already shared. Use `test resource table`, not `filament 4 test resource table`.

### Search Syntax

1. Use words for auto-stemmed AND logic: `rate limit` matches both "rate" AND "limit".
2. Use `"quoted phrases"` for exact position matching: `"infinite scroll"` requires adjacent words in order.
3. Combine words and phrases for mixed queries: `middleware "rate limit"`.
4. Use multiple queries for OR logic: `queries=["authentication", "middleware"]`.

## Artisan

- Run Artisan commands directly via the command line (e.g., `php artisan route:list`). Use `php artisan list` to discover available commands and `php artisan [command] --help` to check parameters.
- Inspect routes with `php artisan route:list`. Filter with: `--method=GET`, `--name=users`, `--path=api`, `--except-vendor`, `--only-vendor`.
- Read configuration values using dot notation: `php artisan config:show app.name`, `php artisan config:show database.default`. Or read config files directly from the `config/` directory.
- To check environment variables, read the `.env` file directly.

## Tinker

- Execute PHP in app context for debugging and testing code. Do not create models without user approval, prefer tests with factories instead. Prefer existing Artisan commands over custom tinker code.
- Always use single quotes to prevent shell expansion: `php artisan tinker --execute 'Your::code();'`
  - Double quotes for PHP strings inside: `php artisan tinker --execute 'User::where("active", true)->count();'`

=== php rules ===

# PHP

- Always use curly braces for control structures, even for single-line bodies.
- Use PHP 8 constructor property promotion: `public function __construct(public GitHub $github) { }`. Do not leave empty zero-parameter `__construct()` methods unless the constructor is private.
- Use explicit return type declarations and type hints for all method parameters: `function isAccessible(User $user, ?string $path = null): bool`
- Use TitleCase for Enum keys: `FavoritePerson`, `BestLake`, `Monthly`.
- Prefer PHPDoc blocks over inline comments. Only add inline comments for exceptionally complex logic.
- Use array shape type definitions in PHPDoc blocks.

=== inertia-laravel/core rules ===

# Inertia

- Inertia creates fully client-side rendered SPAs without modern SPA complexity, leveraging existing server-side patterns.
- Components live in `resources/js/pages` (unless specified in `vite.config.js`). Use `Inertia::render()` for server-side routing instead of Blade views.
- ALWAYS use `search-docs` tool for version-specific Inertia documentation and updated code examples.
- IMPORTANT: Activate `inertia-react-development` when working with Inertia client-side patterns.

# Inertia v3

- Use all Inertia features from v1, v2, and v3. Check the documentation before making changes to ensure the correct approach.
- New v3 features: standalone HTTP requests (`useHttp` hook), optimistic updates with automatic rollback, layout props (`useLayoutProps` hook), instant visits, simplified SSR via `@inertiajs/vite` plugin, custom exception handling for error pages.
- Carried over from v2: deferred props, infinite scroll, merging props, polling, prefetching, once props, flash data.
- When using deferred props, add an empty state with a pulsing or animated skeleton.
- Axios has been removed. Use the built-in XHR client with interceptors, or install Axios separately if needed.
- `Inertia::lazy()` / `LazyProp` has been removed. Use `Inertia::optional()` instead.
- Prop types (`Inertia::optional()`, `Inertia::defer()`, `Inertia::merge()`) work inside nested arrays with dot-notation paths.
- SSR works automatically in Vite dev mode with `@inertiajs/vite` - no separate Node.js server needed during development.
- Event renames: `invalid` is now `httpException`, `exception` is now `networkError`.
- `router.cancel()` replaced by `router.cancelAll()`.
- The `future` configuration namespace has been removed - all v2 future options are now always enabled.

=== laravel/core rules ===

# Do Things the Laravel Way

- Use `php artisan make:` commands to create new files (i.e. migrations, controllers, models, etc.). You can list available Artisan commands using `php artisan list` and check their parameters with `php artisan [command] --help`.
- If you're creating a generic PHP class, use `php artisan make:class`.
- Pass `--no-interaction` to all Artisan commands to ensure they work without user input. You should also pass the correct `--options` to ensure correct behavior.

### Model Creation

- When creating new models, create useful factories and seeders for them too. Ask the user if they need any other things, using `php artisan make:model --help` to check the available options.

## APIs & Eloquent Resources

- For APIs, default to using Eloquent API Resources and API versioning unless existing API routes do not, then you should follow existing application convention.

## URL Generation

- When generating links to other pages, prefer named routes and the `route()` function.

## Testing

- When creating models for tests, use the factories for the models. Check if the factory has custom states that can be used before manually setting up the model.
- Faker: Use methods such as `$this->faker->word()` or `fake()->randomDigit()`. Follow existing conventions whether to use `$this->faker` or `fake()`.
- When creating tests, make use of `php artisan make:test [options] {name}` to create a feature test, and pass `--unit` to create a unit test. Most tests should be feature tests.

## Vite Error

- If you receive an "Illuminate\Foundation\ViteException: Unable to locate file in Vite manifest" error, you can run `npm run build` or ask the user to run `npm run dev` or `composer run dev`.

=== wayfinder/core rules ===

# Laravel Wayfinder

Use Wayfinder to generate TypeScript functions for Laravel routes. Import from `@/actions/` (controllers) or `@/routes/` (named routes).

=== pint/core rules ===

# Laravel Pint Code Formatter

- If you have modified any PHP files, you must run `vendor/bin/pint --dirty --format agent` before finalizing changes to ensure your code matches the project's expected style.
- Do not run `vendor/bin/pint --test --format agent`, simply run `vendor/bin/pint --format agent` to fix any formatting issues.

=== pest/core rules ===

## Pest

- This project uses Pest for testing. Create tests: `php artisan make:test --pest {name}`.
- Run tests: `php artisan test --compact` or filter: `php artisan test --compact --filter=testName`.
- Do NOT delete tests without approval.

=== inertia-react/core rules ===

# Inertia + React

- IMPORTANT: Activate `inertia-react-development` when working with Inertia React client-side patterns.

</laravel-boost-guidelines>
