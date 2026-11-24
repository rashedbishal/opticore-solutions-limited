# AgencyOS × Opticore — Gap Analysis & Development Plan

- **As of:** 2026-11-24 (repo at commit `aa8d7ea`)
- **Source blueprint:** `AgencyOS_Complete_Developer_Blueprint.pdf` (v1.0, prepared 23 Nov 2026)
- **Origin:** exported from the shared doc https://claude.ai/artifact/Uqd3qv7E5w7uuCfqSKSfhR. **This file is now the source of truth**; tick off questions and update statuses here.

---

## 1. Verdict on ChatGPT's "3 sections / 16 modules"

**Partly right.** The PDF never says "3 sections" or "16 modules": that grouping is ChatGPT's own. It is a usable skeleton and the counts add up (5 + 5 + 6 = 16), but it misses five pieces of the blueprint and mixes real modules with cross-cutting concerns. This plan keeps ChatGPT's M1–M16 numbering for continuity and adds M17–M21.

What the PDF itself defines:

- **§3: four environments plus one shared core** (public website, client portal, employee portal, Super Admin control center, shared automation/data core).
- **§5–§19: fifteen functional sections**, which ChatGPT split into 16 modules (it divided PDF §7 "Catalogue & order creation" from §8 "Quotations" and PDF §14 got stretched).
- **§21: nine delivery phases** (0–8). These are the PDF's own build order and drive our roadmap.

### Mapping ChatGPT's modules to the PDF

| ChatGPT module | PDF section(s) | Fit |
| --- | --- | --- |
| M1 Client Management & Registration | §5 | Good |
| M2 Portfolio & Agency Credentials | §5 (credentials area) | Good, small |
| M3 Client Communication & AI Support | §6 | Partial: client side only, no internal chat |
| M4 Dynamic Service Catalogue & Order Creation | §7 | Good |
| M5 Quotation, Pricing & Order Management | §8 | Partial: pricing and delivery-estimate engines not named |
| M6 Project & Task Management | §9 | Good |
| M7 Templates & Intelligent Assignment | §10 | Good |
| M8 Employee Management & HR | §11 | Good, but documents, e-signature and offboarding are heavy sub-modules |
| M9 Attendance, Capacity & Overtime | §12 | Good |
| M10 Employee Performance & Evaluation | §13 | Good |
| M11 Super Admin Control Center | §14 | Partial: View As, Emergency Center, announcements, 2FA/sessions, concurrent-edit approval, personal layouts not listed |
| M12 Finance, Budget & Expense | §15 | Partial: only the internal-finance half of §15 |
| M13 Communication, Notifications & Meetings | §16 | Partial: presence status missing |
| M14 AI & Automation Governance | §17 | Good, but cross-cutting rather than a standalone module |
| M15 Data Security, Audit, Deletion & Recovery | §18 | Good, but cross-cutting; overlaps M11 |
| M16 UI/UX & Navigation | §19 | Cross-cutting, not a deliverable module |

### What ChatGPT missed (added as M17–M21)

| New | Module | Why it is needed (PDF) |
| --- | --- | --- |
| M17 | Public Website & CMS | ChatGPT's Section 1 header names it, but none of the 16 modules covers it (§3, environment 1). |
| M18 | Internal Communication & Presence | §6 "Separate internal communication" (private messages, department groups, announcements, calls) and §16 presence. M3 covers clients only. |
| M19 | Employee Compensation & Payroll | §15: salary structures, cycles, bonuses, incentives, payslips, bKash/Nagad payment methods, final settlement. M12 only mentions salary as a cost line. |
| M20 | Client Billing, Payment Terms & Collections | §15: invoices, installments, milestone payments, overdue enforcement, production suspension, financial closure and reopening. |
| M21 | Approval & Workflow Engine | §20 entities (ApprovalRequest/Decision), §3 "shared core". Nearly every module depends on configurable multi-step approvals, yet it has no owner in ChatGPT's list. |

### Section grouping

ChatGPT's three sections work. In this plan: **Section 1 Client-facing** = M1–M5 + M17; **Section 2 Agency Operations** = M6–M10 + M18; **Section 3 Management & Administration** = M11–M16 + M19–M21. M14, M15 and M16 are treated as platform-wide layers that every other module must satisfy, not as features to build once and finish.

---

## 2. What Opticore already has

Opticore today is a **marketing site + customer-support/checkout portal + admin CMS**, plus two large internal tools the blueprint never mentions (a Leads CRM and Meal Management). It has almost none of the agency-operations half (employees, departments, projects, HR, payroll, finance). Audit date 2026-11-24, from the repo at commit `aa8d7ea`.

**Stack decision first.** The PDF's Next.js/Prisma stack is labelled *proposed, not final* (§2, §1 baseline table). Opticore runs Laravel 13 + Inertia + React 19 on three Postgres databases with Redis, Reverb, Horizon and a working CI/CD pipeline. This plan builds AgencyOS **inside the existing Laravel app**, not a second system.

| Area | What exists (verified in code) | Where |
| --- | --- | --- |
| Public website + CMS | Home, About, Careers, Contact, FAQ, Blog, Portfolio, per-service marketing pages, sitemap, SEO fields, newsletter double opt-in. Admin CRUD for categories, sub-categories, portfolios, blogs, FAQs, brands, testimonials, site settings. | `HomeController`, `Category`, `Portfolio`, `Admin/*Controller` |
| Client accounts | Individual `User` (no company): email + password, link-based email verification, Google/Facebook login, profile, notification preferences, soft-delete self-removal. | `User`, `Auth/*` |
| Staff accounts | `Admin` in a separate DB: mother admin, `full_access` flag, 21 permission keys, forced logout when access changes. Plus `lead_role` (Agent/Manager). | `Admin`, `AdminPermissions` |
| Customer chat | One `Conversation` per user (unique `user_id`), live over Reverb, attachments, read receipts, admin online ping. | `Conversation`, `Message` |
| AI chatbot | Anonymous Gemini FAQ widget with hard-coded knowledge; separate from customer chat; no handover. | `ChatController`, `ChatSession` |
| Quotes (partial) | Admin builds an `Offer` with line price and milestones inside a conversation; client accepts/declines by signed token. Single version, no pricing engine. | `Offer`, `OfferMilestone` |
| Checkout & payments | Fixed-plan checkout on sub-categories, SSLCommerz + Google Pay, pending-order resolver, `Order` + `Transaction`, invoice PDF with QR, race-safe callbacks. | `CheckoutController`, `SslCommerz*`, `InvoicePdfBuilder` |
| Work tracking (flat) | `Task` per paid order: client, category, name, date, state (pending / in progress / delivered), notes, attachments; client review after delivery. | `Task`, `TaskGenerator`, `ClientReview` |
| Leads CRM (not in blueprint) | Leads from Facebook, Instagram, WhatsApp, email, contact form; pipeline board, deals, lead tasks with due times, tags, custom fields, scoring, duplicates/merge, import, reports, consent, WhatsApp calling in browser and Android app, alert bell, web push + FCM. 35 models under `app/Leads`. | `app/Leads/*`, `Admin/Leads/*` |
| Meal Management (not in blueprint) | Internal lunch program in its own `meal` DB: daily accept/decline window, holidays, Excel report, live roster. Only staff-facing feature today. | `Meal*`, `MealScheduleService` |
| Careers | Public job listings and applications with résumé upload; staff download. Recruiting only, no hiring-to-employee flow. | `JobListing`, `JobApplication` |
| Real-time & notifications | Reverb private channels per admin section; `notifications` table and web-push for lead alerts; `UserPresenceUpdated` (customer online dot). | `routes/channels.php`, `app/Leads/Notifications` |
| Platform & ops | Redis cache/session/queue, Horizon, Pulse, Health, Sentry, argon2id-only hashing, strict CSP, named rate limiters, 3-DB backup, atomic deploy with rollback, 106 PHP test files plus Vitest and Playwright. | `bootstrap/app.php`, `scripts/deploy` |

### Confirmed absent (searched the code)

No company/tenant model · no email or phone OTP · no 2FA or session management · no departments, designations or employee records · no project/sub-project/milestone hierarchy · no task assignee, deadline or dependency · no templates · no attendance, leave, overtime, payroll · no performance evaluation · no expense/budget/revenue allocation · no general audit log, versioning or recycle bin (only `LeadDeletionAudit` and per-feature status logs; soft delete exists on `User` only) · no Bengali/i18n · no voice recording or transcription · no meetings/calendar for clients or staff · no approval engine · no automation-rule engine.

---

## 3. Gap matrix: all 21 modules

**Only M17 (Public Website & CMS) is substantially built.** Six modules have nothing at all (M7, M8, M9, M10, M19, M21). Nothing existing is thrown away: the work is mostly *extending* Category, Offer, Task, Admin, Conversation and the payment pipeline, then adding the missing operations half.

Labels: **Done** = works today, no change. **Modify** = exists but must change to meet the PDF. **New** = nothing exists. Effort is a rough T-shirt size (S ≈ 1–2 weeks, M ≈ 3–5, L ≈ 6–10, XL ≈ 10+ for one developer) and will be firmed up after the open questions in section 6.

| # | Module | PDF § | Coverage today | Mix | Effort | PDF phase |
| --- | --- | --- | --- | --- | --- | --- |
| M1 | Client Management & Registration | 5 | Low | Modify + New | L | 6 |
| M2 | Portfolio & Agency Credentials | 5 | Medium | Modify | S | 6 |
| M3 | Client Communication & AI Support | 6 | Medium | Modify + New | L | 6 |
| M4 | Dynamic Service Catalogue & Order Creation | 7 | Low | Modify + New | XL | 3 |
| M5 | Quotation, Pricing & Order Management | 8 | Low | Modify + New | XL | 3 |
| M6 | Project & Task Management | 9 | Low | Replace + New | XL | 4 |
| M7 | Project Templates & Intelligent Assignment | 10 | None | New | XL | 4 |
| M8 | Employee Management & HR | 11 | None | New | XL | 2, 5 |
| M9 | Attendance, Capacity & Overtime | 12 | None | New | L | 5 |
| M10 | Employee Performance & Evaluation | 13 | None | New | L | 5 |
| M11 | Super Admin Control Center | 14 | Medium | Modify + New | XL | 2 |
| M12 | Finance, Budget & Expense Management | 15 | Low | New | XL | 7 |
| M13 | Communication, Notifications & Meetings | 16 | Low | Modify + New | L | 2–7 |
| M14 | AI & Automation Governance | 17 | Low | Modify + New | XL | 7 |
| M15 | Data Security, Audit, Deletion & Recovery | 18 | Low | Modify + New | L | 1 |
| M16 | UI/UX & Navigation | 19 | Medium | Modify + New | L | all |
| M17 | Public Website & CMS | 3 | High | Done, minor Modify | S | 6 |
| M18 | Internal Communication & Presence | 6, 16 | Low | New (reuses Reverb) | L | 5 |
| M19 | Employee Compensation & Payroll | 15 | None | New | XL | 5 |
| M20 | Client Billing, Payment Terms & Collections | 15 | Low | Modify + New | L | 7 |
| M21 | Approval & Workflow Engine | 20 | None | New | L | 1 |

### 3.1 Section 1: Client-facing (M1–M5, M17)

| Module | Feature (PDF) | Status | What exists → what changes |
| --- | --- | --- | --- |
| M1 | Registration with company details, trade licence, industry | Modify | `Auth/RegisterController` collects name/email/password only → add company profile and licence upload |
| M1 | Email OTP verification | Modify | Link-based `MustVerifyEmail` today → 6-digit OTP flow (PDF forbids phone OTP here) |
| M1 | Pending-approval state, admin approve/reject | New | No approval state → status on company, review queue in `Admin/ClientController`, locked features until approved |
| M1 | Company account with multiple client users | New | `User` has no company → `Company` + membership; **the tenant boundary for the whole system** |
| M1 | Per-user permissions, feature toggles (tracking, files, billing, Remove Ads) | New | None; Remove Ads meaning is an open question |
| M1 | Social login, profile, notification prefs, self-delete | Done | `SocialController`, `ProfileController`; must be re-scoped to company membership |
| M2 | Portfolio items, categories, sub-categories, video | Done | `Portfolio` (title, category, media, YouTube) with admin CRUD |
| M2 | Client name, keywords, search, multi-select filters, preview | Modify | No keywords or client-name column; no search → add fields, search endpoint, filter UI inside the client dashboard |
| M2 | Agency credentials page ("Who Are We?") | Modify | About, MD message exist publicly → expose inside portal |
| M3 | Live client↔staff chat, attachments, read receipts | Done | `Conversation`/`Message` over Reverb; limited to one conversation per user |
| M3 | Project communication room (roles, threads, internal-only hidden) | New | Conversations are per user, not per project → new room model keyed to project, with `visibility = internal / client` per message |
| M3 | Voice messages, calls, search, threads | New | Attachments only |
| M3 | AI chatbot with approved knowledge | Modify | Gemini widget with hard-coded `WEBSITE_KNOWLEDGE` → admin-managed knowledge base, confidence + handover, shared context with human chat |
| M3 | Phone OTP before human chat; counselor assignment and intro message | New | None |
| M3 | Bengali / English | New | English only, no i18n layer |
| M4 | Service categories and sub-services as editable data | Modify | `Category` + `PortfolioSubCategory` hold marketing content and fixed plans → need typed fields, options, preview media, conditional rules |
| M4 | Dynamic conditional brief form, multi-category order | New | Checkout takes one sub-category and a plan → form-definition engine + order-draft model |
| M4 | Draft auto-save, 30-day expiry | New | `CheckoutMetadata` only holds notes and upload paths; add scheduled expiry job |
| M4 | Files, reference links, voice-to-text | Modify | File upload via `CheckoutController::uploadAttachments` exists; no links or transcription |
| M4 | Quick Response option | New | None |
| M5 | Quotation by counselor with price, milestones, validity | Modify | `Offer` + `OfferMilestone` inside chat → becomes the first quotation path; add scope, exclusions, tax, payment terms, revision rules |
| M5 | Client accept/decline via signed link | Done | `OfferController` token flow |
| M5 | Quotation version history | New | Offer is edited in place → add `QuotationVersion` (append-only) |
| M5 | Pricing engine and separate delivery-estimate engine | New | Prices are hand-typed or fixed plans; no capacity data until M9 exists |
| M5 | AI-assisted quotation | New | None |
| M5 | Approved quote creates official order + draft master project (one transaction) | Modify | `Order` is a *payment* record from SSLCommerz, not a business order → introduce a true `Order` and relate payments to it |
| M17 | All public pages, blogs, FAQ, careers, contact, SEO, sitemap | Done | Keep as is |
| M17 | Public entry points for new registration and Bengali toggle | Modify | Small additions once M1 and M16 land |

### 3.2 Section 2: Agency Operations (M6–M10, M18)

| Module | Feature (PDF) | Status | What exists → what changes |
| --- | --- | --- | --- |
| M6 | Master project, sub-projects, milestones | New | Only a flat `Task` per paid order → new hierarchy; existing `Task` rows migrate to master projects |
| M6 | Statuses (Draft → Delivered), configurable transitions | New | `Task.state` has 3 values → explicit state machine with admin-configurable transitions |
| M6 | Two approval gates (master, then each sub-project) | New | None; depends on M21 |
| M6 | Task assignee, deadline, progress, revisions, extension requests | New | `Task` has none of these |
| M6 | PM assignment history, deadline change log with reason | New | None |
| M6 | Client review and final delivery | Modify | `ClientReview` + `TaskStatusMail` delivery message exist → hook to milestone approval and revision limits |
| M6 | Role-based timeline visibility (client sees only approved milestones) | New | None; high leak risk, needs tests |
| M7 | Templates, versions, publish by Super Admin, validation report | New | None |
| M7 | Task dependencies, auto task generation | New | `TaskGenerator` only creates one task per payment → rewrite as template-driven |
| M7 | Skill/capacity-based assignment, escalation chain | New | Needs employee skills (M8) and capacity (M9) first |
| M7 | AI template recommendation | New | Needs M14 |
| M8 | Employee record, departments, designations, reporting lines | New | `Admin` is a CMS login only, in a separate database → see section 4, decision D1 |
| M8 | Reference-code onboarding, joining letter PDF | New | `spatie/laravel-pdf` already installed and used for invoices → reuse for letters |
| M8 | Contracts, renewals, e-signature, NDAs, versioning | New | None |
| M8 | Resignation and offboarding workflow | New | None; depends on M21 |
| M8 | Recruiting (job listings, applications) | Done | `JobListing`, `JobApplication`; add "convert to employee" later |
| M9 | Login / break / logout, duty hours, productive hours | New | None; `MealClock` gives a timezone helper only |
| M9 | Capacity calculation, workload | New | None |
| M9 | Overtime request and rates, leave types and balances | New | None; both feed M19 |
| M9 | Holidays and weekly off days | Modify | `MealHoliday` exists in the meal DB → promote to a company-wide calendar |
| M10 | Stage 1 productivity (value ÷ actual hours), stage 2 evaluation, 60/40 weights | New | None; stage-2 formula is undefined by the owner |
| M10 | Monthly/quarterly/annual cycles, appeals, rankings | New | None |
| M18 | Private messages, department and company groups, announcements | New | Reverb, channel auth patterns and chat UI components can be reused |
| M18 | Presence (online, on break, in meeting, DND) | Modify | `UserPresenceUpdated` and the admin ping only cover customer online dots |
| M18 | Internal-only discussion hidden from clients | New | Belongs to the project room in M3 |

### 3.3 Section 3: Management & Administration (M11–M16, M19–M21)

| Module | Feature (PDF) | Status | What exists → what changes |
| --- | --- | --- | --- |
| M11 | Admin dashboard with counts and charts | Modify | `Admin/DashboardController` shows content, transaction and task counts → widgets for projects, capacity, finance, risk; per-admin saved layouts |
| M11 | Per-section permissions, session invalidation on change | Done | `AdminPermissions`, `admin.permission`, `EnsureAdminSessionIsCurrent`; permission keys must grow with each new module |
| M11 | Multiple equal Super Admins, last one protected | Modify | Today exactly **one** mother admin is enforced (`admin:reset-mother-admin-credentials`) → conflicts with the PDF; decision D2 |
| M11 | Designation defaults + per-person overrides, departments | New | Flat list of 21 keys per admin → role/designation layer on top |
| M11 | Client and employee management screens | Modify | `Admin/ClientController` exists; employee side is new |
| M11 | Service and order management, project oversight | Modify | `Admin/CategoryController`, `OrderController`, `TaskController` → replaced or extended by M4/M5/M6 |
| M11 | Master activity history (before/after, reason) | New | None, see M15 |
| M11 | View As / preview user | New | None; must be read-only and logged |
| M11 | Emergency Control Center (pause registration, orders, AI, maintenance) | New | Laravel maintenance mode exists via deploy script only; build feature flags in `SiteSetting` |
| M11 | Announcements to segments | New | None; shares infrastructure with M18 |
| M11 | 2FA, new-device alerts, session list and remote logout, inactivity logout | New | None; sessions are in Redis, so listing and revoking is feasible |
| M11 | Concurrent-edit approval by previous editor | New | None; needs row versioning from M15 |
| M11 | Global configuration (company, currency, hours, holidays, notification templates) | Modify | `SiteSetting` and `ConfigurationController` cover contact info and backup only |
| M11 | Database backup, health, queue and request dashboards | Done | `DatabaseBackupService`, Pulse, Health, Horizon |
| M12 | Revenue and cost per project, margin, department budgets | New | `Transaction` records payments only; leads module has `Deal` values and `LeadSourceCost` but for sales, not delivery |
| M12 | Expense records, receipts, duplicate detection, approval chain | New | None; depends on M21 |
| M12 | Revenue allocation across sub-projects, versioned | New | None |
| M13 | In-app notifications | Modify | `notifications` table and live alert bell exist for lead staff only → generalise to all roles |
| M13 | Email notifications | Modify | Mail classes exist for orders, tasks, subscriptions → centralised templates and user preferences |
| M13 | Browser / mobile push | Modify | `laravel-notification-channels/webpush` and FCM already wired for lead calls → reuse; mobile app decision is open |
| M13 | Meetings, calendar, attendance, notes, action items | New | Lead tasks have due times and meeting alerts, but no calendar or meeting model |
| M14 | Client-facing AI with limits | Modify | Gemini widget, see M3 |
| M14 | AI quotation, task recommendation, delivery estimate, risk detection | New | None |
| M14 | Configurable rule engine with approval gates and emergency stop | New | `LeadScoringRule` is rule-shaped but lead-only; build one generic engine |
| M14 | Log of AI drafts and decisions | New | None |
| M15 | Server-side RBAC for admin sections | Done | Strong test coverage in `AdminAuthorizationTest`, `AuthorizationGapsTest`, channel tests |
| M15 | Client-company data isolation | New | Needs `company_id` on every client-owned table and a global query scope |
| M15 | General audit trail, append-only, searchable | New | Only `LeadDeletionAudit` and status logs |
| M15 | Version history for quotes, templates, contracts, deadlines | New | None |
| M15 | Recycle Bin with restore / permanent delete | New | `SoftDeletes` only on `User`; extend to every critical model |
| M15 | Security headers, hashing, rate limits, private files | Done | CSP, argon2id-only, named limiters, local-disk résumés and attachments |
| M16 | Admin layout and navigation | Modify | `AdminLayout.tsx` `NAV_ITEMS` → grouped navigation from PDF §14 |
| M16 | Employee portal shell and role-based dashboards | New | No staff-facing portal besides Meal self-service |
| M16 | Client portal navigation | Modify | `Dashboard/Index.tsx` and `Profile.tsx` → full portal menu |
| M16 | Responsive layouts, light/dark theme | Done | Tailwind v4 theme tokens in `app.css` |
| M16 | Bengali / English interface | New | No i18n; adopt one library project-wide before more screens are built |
| M19 | Salary structures, history, cycles, bonuses, incentives | New | None |
| M19 | Payroll run, 3-step approval, payslip PDF, bKash/Nagad/bank | New | Reuse PDF and mail stack; SSLCommerz is inbound only |
| M19 | Final settlement | New | Depends on offboarding in M8 |
| M20 | Invoice PDF with QR and verification | Done | `InvoicePdfBuilder`, signed verify link; extend to partial and milestone invoices |
| M20 | Online payment (cards, Google Pay) | Done | SSLCommerz pipeline with callback-race hardening |
| M20 | Payment terms, instalments, due dates, partial payments, refunds, credit notes | New | One payment per checkout today |
| M20 | Overdue reminders, grace period, production restrictions, project suspension | New | None; needs scheduler rules from M14 |
| M20 | Financial closure and reopening | New | None |
| M21 | Generic approval request, steps, decisions, delegation | New | Offers and meal selection use their own ad hoc status fields; most modules in this section and in M6, M8, M9 need this |
| M21 | State-transition rules, idempotent triggers | New | Pattern already proven in `claimOrderForProcessing()`; generalise it |

---

## 4. Architecture decisions and integration points

Seven decisions shape everything else and must be settled before Phase 1 coding. Each has a recommendation; none is final until confirmed.

| ID | Decision | Recommendation | Why |
| --- | --- | --- | --- |
| D1 | Where do employees live? `Admin` is a separate database; Postgres cannot join across databases. | Extend `Admin` (admin DB) into the staff identity and keep HR, salary and evaluations there. Project, task and order tables in the main DB reference staff by id plus a name snapshot, with no foreign key. | Already the pattern in `LeadTask.assigned_to`. Keeps salary data isolated, which the PDF requires. Merging the databases would be a risky migration for no functional gain. |
| D2 | One mother admin vs multiple equal Super Admins (PDF §14). | Add a `super_admin` role that many people can hold. Keep the mother admin as the non-removable break-glass owner. | `CLAUDE.md` and Horizon, Pulse, Health gates depend on `isMotherAdmin()`. Replacing it outright would break those. |
| D3 | Client tenancy. | New `Company` model; `User` becomes a member of a company; every client-owned table gets `company_id` and a global scope; a dedicated isolation test suite runs in CI. | PDF §3 and §18 make this a hard rule. Retrofitting later is far costlier. |
| D4 | Name clash: today's `Order` is a payment record. | Keep `Order` / `Transaction` as the payment layer. Name the new business entity `ServiceOrder` (created from an approved quotation) and link payments to it. | Avoids touching the SSLCommerz pipeline, events, admin Orders screen and their tests. |
| D5 | Build order for shared foundations. | Phase 1 delivers company tenancy (D3), generic audit trail, versioning, soft-delete/recycle bin, approval engine and role layer **before** any workflow module. | Every later module needs these; retrofitting audit and approvals into finished modules is the main schedule risk. |
| D6 | Dynamic catalogue and forms. | New `Service`, `ServiceField`, `FieldRule` tables that reference `Category`; `Category` stays the marketing/SEO record. | `CLAUDE.md` records that a separate `services` table was already merged into `categories`; keep marketing and ordering concerns apart now to avoid a second merge. |
| D7 | Language and AI/voice stack. | Add i18n now (Bengali + English) before more screens exist. Stay on the existing Gemini client for AI and transcription unless another vendor is chosen. | Retrofitting translation into finished screens is expensive. Gemini is already integrated. |

### Where the new modules plug into what exists

| Existing piece | Connects to | How |
| --- | --- | --- |
| `Offer` / `OfferMilestone` | M5 Quotation | Becomes the counselor path; `QuotationVersion` added; accepted version creates `ServiceOrder` |
| `Order` / `Transaction` / SSLCommerz | M20 Billing | Payments attach to `ServiceOrder` invoices; callbacks, events and race guard unchanged |
| `Task` / `TaskGenerator` | M6 Projects | Existing rows backfill into master projects; generator is replaced by template-driven creation |
| `Conversation` / `Message` | M3 Project room | Conversation stays for pre-sales support; each project gets a room with internal/client visibility |
| Leads CRM (`Lead`, `Deal`) | M1 Registration, M5 Quotation | Lead converts to a registered company; won deal can start a quotation. Not in the PDF, so a decision is needed (question Q6) |
| `Admin`, `AdminPermissions`, `lead_role` | M8, M11 | Merge the three access systems (permission keys, lead role, meal-only flag) under one role + override model |
| `JobApplication` | M8 Onboarding | "Hire" action creates an employee reference code |
| `Meal*` models, `MealClock`, `MealHoliday` | M9 Attendance | Holiday calendar and timezone helper promoted to shared services; meal DB stays isolated |
| `SiteSetting`, `ConfigurationController` | M11 Emergency / global config | Add feature flags (pause registration, orders, AI) and work-week settings |
| Reverb channels, `notifications`, webpush, FCM | M13, M18 | One notification service over existing channels; add presence and internal chat channels |
| `DatabaseBackupService`, Horizon, Pulse, Health, deploy scripts | M15, Phase 8 | Kept; backup extends automatically through `pg_dump` |

---

## 5. Phased roadmap

This follows the PDF's nine phases (§21) with two deliberate changes: the company-tenancy core of M1 moves into Phase 1, because every later table needs `company_id`, and the client ordering screens ship with Phase 3 so quotes can be tested by real clients early. Phase 6 then completes the portal instead of starting it. Each phase ends with the PDF's definition of done: server-side permissions, audit, notifications, tests for normal, edge and unauthorized cases, and owner acceptance. Phases are not dated until Q7 is answered.

Foundation first: audit, approvals and tenancy gate every later phase (Phase 1 is the critical one).

| Phase | Name | Modules | Exit gate |
| --- | --- | --- | --- |
| 0 | Decisions | Answer Q1 to Q9, ERD, permission matrix | Requirements baseline approved |
| 1 | **Foundation** | M15 audit, M21 approvals, M1 tenancy, roles, i18n | Tenancy and permission tests pass in CI |
| 2 | Super Admin and organization | M11 control center, M8 employees and departments | Admin configures the org structure safely |
| 3 | Services and quotations | M4 catalogue and forms, M5 quotes, pricing, ServiceOrder | Approved quote creates a ServiceOrder |
| 4 | Projects and tasks | M6 projects, M7 templates and assignment, M3 project room | Order becomes a reviewable project with tasks |
| 5 | Employee operations | M9 attendance and leave, M10, M19 payroll, M18 chat | Attendance to payslip works end to end |
| 6 | Client portal | M1 OTP and approval, M2, M3 AI and human, M16 shell | Client runs the full lifecycle in company roles |
| 7 | Finance and automation | M12 finance, M20 billing, M14 AI and rules, M13 meetings | Finance reconciles; rules obey approval gates |
| 8 | Quality and launch | Security review, load tests, backups, training | Security, backup and UAT checks pass |

---

## 6. Questions for you and risks

Nine answers block Phase 0; the rest can wait. Tick a box once answered and write the answer under it.

### Blocking (needed before Phase 1)

- [ ] **Q1. Build inside the current Laravel app?** The PDF suggests Next.js + Prisma but calls it a proposal. Recommendation: Laravel (section 2).
- [ ] **Q2. Employees (D1):** may staff identities live in the `admin` database, extended with HR data?
- [ ] **Q3. Super Admins (D2):** several equal Super Admins plus a protected mother admin, as recommended?
- [ ] **Q4. Existing checkout:** does the new quote-then-approve flow replace today's instant-pay checkout, or do both run side by side (for example fixed plans stay instant)?
- [ ] **Q5. Existing clients:** is each current `User` converted into a one-person `Company`, and do old `Task` rows become master projects?
- [ ] **Q6. Leads CRM and Meal Management** are not in the PDF. Keep both unchanged? Should a won lead flow into client registration and quotation?
- [ ] **Q7. Team and timeline:** how many developers, and is there a target launch date? Without this the effort sizes cannot become dates.
- [ ] **Q8. Departments today:** the real list of departments, designations and headcount, and whether the 7 service categories in the PDF match your current `Category` records.
- [ ] **Q9. Providers:** SMS/OTP gateway for Bangladesh, object storage, video-call tool, voice transcription, and bKash/Nagad/bank payout route. The PDF lists none of these as chosen.

### Owner decisions the PDF itself leaves open (§22)

- [ ] Action after a task-extension request is rejected
- [ ] Meaning of the "Remove Ads" client toggle
- [ ] Super Admin concurrent edit when the previous editor is unavailable
- [ ] Attendance edge cases: late arrival, overnight shifts, day-offs, missed logout
- [ ] Stage-two performance formula (criteria weights)
- [ ] Data retention schedule for files, messages, logs, financial and legal records
- [ ] Project Manager delegation and substitute approvers
- [ ] Rate card, tax and discount policy for the pricing engine
- [ ] Native mobile app or web only (an Android calling app already exists for leads)
- [ ] Visual design system and Bengali typography

These must stay configurable in code until answered; the PDF forbids silently choosing.

### Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Scope: 21 modules, six of them XL | Plan slips for months | Ship by phase with a usable result each time; cut M10 and M12 detail first |
| Tenant isolation retrofitted late | Client A sees client B | Do M1 company core and global scope in Phase 1; isolation tests gate every release |
| Cross-database references (admin DB vs main DB) | Orphaned ids, no foreign keys | Name snapshots, nightly integrity check job, one service class owns staff lookups |
| Three overlapping permission systems | Privilege gaps | One role + override model in Phase 1; extend existing authorization test pattern to every new route |
| Touching the payment pipeline | Lost orders or double invoices | Leave SSLCommerz handlers unchanged; attach payments to `ServiceOrder` by foreign key only; keep existing race tests green |
| Internal data leaking to clients | Trust and legal damage | Separate client-facing resources, never serialize raw models to portal pages, add per-field leak tests |
| AI acting beyond its authority | Wrong commitments | Approval gate on every AI output that changes money, deadlines or assignments |
| Production data on Opticore's live system | Regression for current customers | Feature flags per module; all new tables additive; staged rollout behind admin-only access first |
