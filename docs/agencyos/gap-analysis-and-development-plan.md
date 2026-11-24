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

This follows the PDF's nine phases (§21) with two deliberate changes: the company-tenancy core of M1 moves into Phase 1, because every later table needs `company_id`, and the client ordering screens ship with Phase 3 so quotes can be tested by real clients early. Phase 6 then completes the portal instead of starting it. Each phase ends with the PDF's definition of done: server-side permissions, audit, notifications, tests for normal, edge and unauthorized cases, and owner acceptance. Q7 is answered (4 developers, no target launch date), so phases are sequenced but not dated. With 4 developers, work can run in parallel streams after Phase 1, for example one pair on Phases 2 and 3 while another pair starts Phase 4 once the Phase 1 foundations are merged.

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

Nine questions blocked Phase 0. Eight are now answered; Q6 is waiting on a team discussion. Record each new answer in the tables below.

### Blocking (needed before Phase 1)

Status: 8 of 9 answered, Q6 is waiting on a team discussion.

| Q | Topic | Status | Answer | What it changes in the plan |
| --- | --- | --- | --- | --- |
| Q1 | Build inside the current Laravel app? | ✅ Answered | **Laravel** | No rewrite. Everything is built on the existing app, so all existing code, tests and deploy scripts stay in use. |
| Q2 | Employees (D1) | ✅ Answered | **Option A:** staff identities live in the `admin` database, extended with HR data | D1 is confirmed. Salary and evaluation data stay isolated. Main-DB tables reference staff by id plus name snapshot. |
| Q3 | Super Admins (D2) | ✅ Answered | **Several Super Admins plus one protected mother admin** (recommended) | D2 is confirmed. Add a `super_admin` role; keep `isMotherAdmin()` for the break-glass owner and the Horizon, Pulse, Health gates. |
| Q4 | Existing checkout | ✅ Answered | **Option B:** run both side by side | Today's instant-pay checkout stays untouched (fixed plans). The quote-then-approve flow is added next to it. The SSLCommerz pipeline needs no rework. |
| Q5 | Existing clients | ✅ Answered | **Existing data is all fake and is cancelled.** No migration needed | Big simplification: no conversion of `User` to `Company`, no backfill of old `Task` rows. Wipe or reseed test data. Removes the "regression for current customers" risk, but see the updated risks table. |
| Q6 | Leads CRM and Meal Management | ⏳ Waiting on discussion | **Not yet answered.** The question is: keep both features as they are, and should the Leads CRM feed into client registration and quotations (B) or stay separate (A)? | Meal Management stays as is (isolated DB). The Leads link to registration and quotation is unscheduled until decided. Phase 3 can start without it. |
| Q7 | Team and timeline | ✅ Answered | **4 developers, no target launch date** | Effort sizes can be turned into a sequence but not into calendar dates yet. With 4 developers, some phases can run in parallel streams (see section 5 note). |
| Q8 | Departments, designations, categories | ✅ Answered | **Everything dynamic:** departments, designations, headcounts, categories, and which department controls which category | Nothing is hard-coded. All five are admin-managed tables. Seeders hold only sample data. |
| Q9 | Providers | ✅ Answered | **SMS/OTP:** not needed. **Email OTP:** already set. **File storage:** local server. **Video calls:** none. **Audio calls:** via WhatsApp (internal calls via the internal WhatsApp channels). **Voice transcription:** not needed. **Payroll payout:** entered manually in the system | Drops SMS gateway, video, transcription and payout-API integrations from scope. Files use the `local` disk (backups must then include the file folder, see risks). Payroll records payouts by manual entry, with no bKash/Nagad API. |

Original wording of each question, for reference:

- **Q1:** The PDF suggests Next.js + Prisma but calls it a proposal. Recommendation was Laravel (section 2).
- **Q2:** May staff identities live in the `admin` database, extended with HR data?
- **Q3:** Several equal Super Admins plus a protected mother admin, as recommended?
- **Q4:** Does the new quote-then-approve flow replace today's instant-pay checkout, or do both run side by side?
- **Q5:** Is each current `User` converted into a one-person `Company`, and do old `Task` rows become master projects?
- **Q6:** Leads CRM and Meal Management are not in the PDF. Keep both unchanged? Should a won lead flow into client registration and quotation?
- **Q7:** How many developers, and is there a target launch date?
- **Q8:** The real list of departments, designations and headcount, and whether the 7 PDF service categories match current `Category` records.
- **Q9:** SMS/OTP gateway, object storage, video-call tool, voice transcription, and payout route.

### Owner decisions the PDF itself leaves open (§22)

Status: 5 decided, 5 waiting on discussion.

| # | Open item | Status | Decision | How it is built |
| --- | --- | --- | --- | --- |
| 1 | Rejected extension request | ⏳ Waiting | Up to the team to discuss | Configurable setting until decided |
| 2 | "Remove Ads" toggle | ⏳ Waiting | Up to the team to discuss | Toggle is built, meaning is set later |
| 3 | Super Admin concurrent edit | ✅ Decided | **Another Super Admin can approve in A's place, or the mother admin can override** | Approval request can be fulfilled by any other Super Admin or by the mother admin. Every override is audit-logged. |
| 4 | Attendance edge cases | ⏳ Waiting | Up to the team to discuss | Lateness grace, auto-logout and correction rules are settings |
| 5 | Stage-two performance formula | ✅ Decided | **Fully customized:** weights are set by the admin | Criteria and weights are admin-editable, not coded. The Team Leader 60% / Manager 40% split stays as the PDF fixed it. |
| 6 | Data retention | ✅ Decided | **Customized schedule; an admin can also delete manually** | Retention rules are per data type, editable. Manual deletion is admin-only, goes through the recycle bin and is audit-logged. Legal and financial records still need advice before being made deletable. |
| 7 | PM delegation and substitutes | ✅ Decided | **Whoever the Super Admin picks** | A Super Admin assigns a substitute approver per Project Manager, with start and end dates. All actions record "acting for". |
| 8 | Rate card, tax, discount policy | ⏳ Waiting | Up to the team to discuss | Pricing engine reads prices, tax and discount limits from admin settings. Needed before Phase 3 testing. |
| 9 | Native mobile app or web only | ✅ Decided | **A mobile app is planned** | Build the web app API-first so a later app can reuse it. Native push (FCM) is already in the stack. The app itself is not in the current phases. |
| 10 | Visual design and Bengali typography | ⏳ Waiting | Up to the team to discuss | Extend the current Opticore look in the meantime; font choice is a theme setting |

These must stay configurable in code until answered; the PDF forbids silently choosing.

#### What each open decision means, with the options (for team discussion)

Until the owner decides, each item is built as a setting that can be changed, not a fixed rule.

| # | Open item | Plain meaning | Options to choose from |
| --- | --- | --- | --- |
| 1 | **Rejected extension request** | An employee asks for more time on a task and the Project Manager says no. What happens next? | The original deadline stays binding; the employee can resubmit with a better reason; the task is reassigned to someone else; or a mix. |
| 2 | **"Remove Ads" toggle** | Clients get a switch called "Remove Ads". What does it remove? | It hides Opticore's own promotional banners and offers; it is a paid ad-free feature; or something else the owner has in mind. |
| 3 | **Super Admin concurrent edit** | If Super Admin B wants to change something Super Admin A edited, A must approve first. What if A is unavailable, on leave, or has left? | B waits; another Super Admin can approve in A's place; the approval expires after a set time; or the mother admin can override. |
| 4 | **Attendance edge cases** | Everyday messy cases: someone arrives late, works overnight, works on a day off, or forgets to log out. | Set rules for each. For example: a grace period for lateness, a maximum auto-logout time, a manager correction step. |
| 5 | **Stage-two performance formula** | Employee scores combine attendance, quality, errors, deadlines, teamwork and more. How much does each count? | Percentages per criterion, such as quality 30%, deadlines 25%, attendance 15%. The Team Leader 60% and Manager 40% split is already fixed. |
| 6 | **Data retention** | How long do we keep files, chat messages, logs, invoices and contracts before deleting them? | A schedule, for example chats 2 years, logs 1 year, financial and legal records 7+ years. An accountant or lawyer may need to advise. |
| 7 | **PM delegation and substitutes** | When a Project Manager is absent, who approves things in their place? | A named backup per PM; the Department Manager; whoever the Super Admin picks; or automatic after a waiting time. |
| 8 | **Rate card, tax, discount policy** | The price engine needs real prices. The PDF's ৳25 per second was only an example. | The actual price list per service, the VAT or tax rate, and rules for discounts, such as who can give them and the maximum. |
| 9 | **Native mobile app or web only** | An installable phone app, or is a mobile-friendly website enough? | Web only (cheapest, fastest). Or a native app later, which affects phone push notifications. An Android app for lead calling already exists. |
| 10 | **Visual design and Bengali typography** | How should the new portals look, and which Bengali font? | Keep the current Opticore look and extend it; or a new design system. Pick a Bengali font such as Hind Siliguri, Noto Sans Bengali or similar. |

**How urgent each one is**

- **Needed soon (before Phases 1–3):** #8 rate card, #10 design and fonts, #6 retention, because they affect early foundations.
- **Needed later (Phases 4–5):** #1, #4, #5, #7, because they matter when projects, attendance and evaluations are built.
- **Can wait or follow other answers:** #2 (owner's business call), #3 (matters once multiple Super Admins exist, see Q3), #9 (can stay web only for now).

### Risks

How to read this table: **Likelihood** is how probable the problem is. **Severity** is how bad it is if it happens. "What it means" explains it in plain words, "Early warning" is how we would notice, and "Plan" is what we do about it.

| # | Risk | What it means, in plain words | Likelihood | Severity | Early warning | Plan to prevent or reduce it |
| --- | --- | --- | --- | --- | --- | --- |
| R1 | **Scope is very large** | 21 modules, six of them extra-large. With 4 developers and no deadline, work can drag on and never reach a usable state. | High | High | A phase takes much longer than its estimate | Ship phase by phase so each one gives something usable. If time runs short, cut the detail of Performance (M10) and Finance (M12) first. Plan parallel work streams for the 4 developers. |
| R2 | **One client sees another client's data** | Each client company must only see its own orders and files. If this is added late, it will have gaps. | Medium | Very high | An isolation test fails, or a client reports seeing unfamiliar data | Build company tenancy in Phase 1, before anything else. Every client table gets `company_id` and an automatic filter. Isolation tests must pass before every release. |
| R3 | **Staff and project data live in different databases** | Staff are in the `admin` database, projects in the main one. A database cannot link across them, so a deleted employee could leave a project pointing at nothing. | Medium | Medium | The nightly integrity check reports unmatched ids | Store the staff id plus a copy of the name. One service class handles all staff lookups. A nightly job checks for mismatches. |
| R4 | **Three overlapping permission systems** | Today access is controlled by permission keys, a lead role and a meal-only flag. Adding more roles on top could leave gaps where someone gets access they should not have. | Medium | High | An authorization test fails, or someone reaches a page they should not | Merge them into one role-plus-override model in Phase 1. Every new route gets an authorization test, following the existing test pattern. |
| R5 | **Breaking the payment flow** | The SSLCommerz and Google Pay code is carefully protected against double processing. Changing it could lose an order or send an invoice twice. | Low | Very high | A payment test fails, or a double invoice appears | Do not change the SSLCommerz handlers. Link payments to the new `ServiceOrder` through a foreign key only. Keep the existing race tests passing. Because both checkouts run side by side (Q4), instant checkout continues to work unchanged. |
| R6 | **Internal information leaking to clients** | Salaries, internal notes and staff chat must never show up on a client page. Returning raw database records to a page is the usual cause. | Medium | High | A leak test fails, or a client sees an internal field | Use separate client-facing resources that list each field explicitly. Never send raw models to client pages. Add field-level leak tests. |
| R7 | **AI acting beyond its authority** | The AI could change a price, a deadline or an assignment without a human agreeing. | Medium | High | An AI action appears without an approval record | Anything the AI proposes that affects money, deadlines or assignments waits for human approval. Every AI action is logged. |
| R8 | **Test data mixed with real data** | Existing data is all fake (Q5), so there is no migration risk today. The risk is that real customers start using the system while it still contains fake records, or that new tables are changed after real data exists. | Low | Medium | Fake accounts or orders still present at launch | Wipe or reseed the fake data before the first real customer. Add all new tables as new migrations, never edit old ones. Use feature flags and release admin-only first. |
| R9 | **Files stored on the local server (Q9)** | Uploaded files sit on one machine. If the disk fails or a deploy replaces the folder, files are lost. They also grow without limit. | Medium | High | Disk space check warns, or a restore test is missing files | Keep the upload folder in shared storage that deploys do not replace. Include it in backups (today's backup covers databases only). Add a disk-space alert through the Health checks. Plan a move to object storage later. |
| R10 | **Open decisions not yet made** | Five decisions are still waiting (extension rule, Remove Ads, attendance rules, rate card, design and fonts), plus Q6. Building on a guess means rework. | Medium | Medium | A developer asks "what should this do?" with no written answer | Each one is a setting, not hard-coded. Rate card (#8) and design (#10) are needed before Phase 3. Keep this document as the single place to record answers. |
| R11 | **Deleting data that must be kept** | An admin can delete data manually (decision 6). Deleting invoices, contracts or audit records by mistake could cause legal or accounting trouble. | Low | High | A deletion with no recycle-bin entry or audit record | Manual deletes go through the recycle bin first and are logged. Financial and legal records are protected from deletion until a retention period is confirmed with an accountant or lawyer. |
| R12 | **Super Admin approval and override misuse** | Any Super Admin can approve in another's place, and the mother admin can override (decision 3). Power concentrated this way could be misused or approved by mistake. | Low | Medium | Many overrides by one person, or an override with no reason | Every override and substitute approval is audit-logged with who, what and why. The mother admin receives a periodic summary. |

---

## 7. CMS scaffolding: three sections for the mother admin

**Status: IMPLEMENTED (structure only).** This step organizes the CMS into three sections and adds section roles. No planned module (Projects, Payroll, etc.) is built. Placement and behaviour below were agreed with the owner.

### 7.1 What was asked

- When an admin logs in, `/admin` shows **only three cards**, one per planned section (nothing else on the page).
- Clicking a card opens a **section page** listing that section's modules. The sidebar is also grouped by section.
- Each section has **its own role**. When the mother admin creates a Super Admin, they tick the section roles and can also pick individual modules.
- Existing modules were distributed into the sections (7.2). New modules go where this plan placed them (7.3).

| Card | Section | Plan modules |
| --- | --- | --- |
| 1 | **Client-facing** | M1–M5, M17 |
| 2 | **Agency Operations** | M6–M10, M18 |
| 3 | **Management & Administration** | M11–M16, M19–M21 |

### 7.2 Placement of existing modules (agreed)

| Existing item | Permission key | Plan module | Section |
| --- | --- | --- | --- |
| Customer Support | `customer-conversations` | M3 | 1 Client-facing |
| Leads (fold-out group) | lead role, not a key | Not in PDF (Q6) | 1 Client-facing |
| Clients | `clients` | M1 | 1 Client-facing |
| Orders | `orders` | M5 | 1 Client-facing |
| Portfolios | `portfolios` | M2 / M17 | 1 Client-facing |
| Categories | `categories` | M4 / M17 | 1 Client-facing |
| Sub Categories | `sub-categories` | M4 / M17 | 1 Client-facing |
| Blogs, FAQs, Brands, Testimonials | `blogs`, `faqs`, `brands`, `testimonials` | M17 | 1 Client-facing |
| Review Control | `client-reviews` | M17 | 1 Client-facing |
| Contacts, Subscriptions | `contacts`, `subscriptions` | M17 | 1 Client-facing |
| Chat Archive | `chats` | M3 | 1 Client-facing |
| Client Workflow | `tasks` | M6 | 2 Agency Operations |
| Job Listings, Job Applications | `job-listings`, `job-applications` | M8 | 2 Agency Operations |
| Meal Management | `meal-management` | M9 (neighbour) | 2 Agency Operations |
| **Dashboard** | none (every admin) | n/a | **3 Management & Administration** (changed from the proposal: it moves into Section 3; dashboards for Sections 1 and 2 will be designed later) |
| Transactions | `transactions` | M20 | 3 Management & Administration |
| Admins | `users` | M8 / M11 | 3 Management & Administration |
| Configuration | `configuration` | M11 | 3 Management & Administration |
| Storage clean-up, Pulse, Health, Horizon | mother admin only | M15 | 3 Management & Administration |

### 7.3 Placement of new modules (already decided in this plan)

Shown greyed out ("Planned, not built yet") on each section page until built.

| Section | New modules |
| --- | --- |
| 1 Client-facing | M1 registration and company, M3 project room, M4 service catalogue and forms, M5 quotations and ServiceOrder |
| 2 Agency Operations | M6 projects, M7 templates and assignment, M8 employees and departments, M9 attendance, M10 performance, M18 internal chat |
| 3 Management & Administration | M11 control center, M12 finance, M13 meetings and notifications, M14 AI and rules, M15 audit and recycle bin, M19 payroll, M20 billing, M21 approvals |

### 7.4 Decisions recorded

| # | Question | Decision |
| --- | --- | --- |
| S1 | Placement table | Approved, except the Dashboard moves into Section 3 |
| S2 | Section role vs individual modules | **Both:** the mother admin ticks a section role and can also pick individual modules inside it |
| S3 | Create Super Admins now? | **Yes.** The mother admin creates Super Admins and assigns section roles to them |
| S4 | Home and navigation | `/admin` shows only the three cards. Clicking a card opens a page listing its modules. The sidebar is grouped by section |
| S5 | Unbuilt modules | Shown greyed out (on the section page) |
| S6 | Other admins | See their allowed modules grouped by section too, filtered to what they hold |

### 7.5 How it behaves now

- **No sidebar on the cards page:** `/admin` shows the three cards with no sidebar (a Sign Out button sits in the header instead). The sidebar appears on every page after a card is opened.
- **Section roles:** three, one per section (Client-facing role, Agency Operations role, Management & Administration role), stored per admin in a new `section_roles` column on the `admin` database.
- **Role plus modules:** a role opens the section (card, page, sidebar group). Modules inside it are still gated by the existing permission keys, so nothing about module access changed. On the create/edit form, ticking a role ticks all its modules to start; any can be unticked. Granting a module automatically adds its section's role, so a module is never granted without its section.
- **Mother admin and "Allow full access" admins** get all three sections automatically.
- **Existing admins keep working with no data change:** the sections they can enter are their stored roles plus the section of every module (or Leads role) they already hold.
- **Security stamp:** changing an admin's section roles logs them out, like changing permissions already does (only added to the stamp when roles are set, so no one is logged out by this release).
- **Dashboard** is still allowed for every admin on the server (unchanged). It is listed under Section 3, so an admin without that section does not see the link.
- **Meal-only admins** are still sent straight to Meal Management from `/admin`.
- **Mother-admin-only tools** (Storage clean-up, Pulse, Health, Horizon) appear only for the mother admin, as before.
- **Super Admin interpretation:** every non-mother admin account the mother admin creates is a Super Admin whose reach is defined by the section roles and modules given. No new privileges were added; the Admins module (`users`) still controls managing other admins, and everything gated to the mother admin stays that way.
- **Single source of truth:** `app/Support/AdminSections.php` holds the section-to-module map and is shared to the sidebar. A test checks every `AdminPermissions` key sits in exactly one section. The three-places rule for permission keys is unchanged.

### 7.6 Implementation log

| Area | Change |
| --- | --- |
| Database (`admin`) | Migration `2026_11_24_100000_add_section_roles_to_admins_table` adds nullable JSON `section_roles` |
| Registry | New `app/Support/AdminSections.php` (sections, modules, planned modules, role derivation) |
| Model | `Admin`: `section_roles` fillable and cast, `canAccessSection()`, security stamp includes roles when set |
| Routes | `/admin` is now `admin.home` (cards), new `admin/sections/{section}` (`admin.sections.show`), the existing dashboard moved to `/admin/dashboard` (route name `admin.dashboard` unchanged). Login, guest redirect and notification fallbacks now point to `admin.home` |
| Controller | New `Admin\SectionController` (`home`, `show`) |
| Admin form | `UserController` validates `section_roles`, passes section options, and stores roles |
| Shared props | `HandleInertiaRequests` shares `adminSections` (admin pages only) |
| Frontend | New pages `Admin/Home.tsx`, `Admin/Section.tsx`; `AdminLayout` sidebar grouped by section with an "All sections" link, and a `hideSidebar` option used by the cards page; `PermissionCheckboxGroup` grouped by section role; Create/Edit admin pages pass section data; loading overlay labels updated |
| Tests | New `tests/Feature/Admin/AdminSectionsTest.php`; `AuthTest` updated for the new `/admin` and `/admin/dashboard` |

### 7.7 Open items from this step

- [ ] Whether the Create/Edit Admin pages should be renamed "Super Admin" in the UI (left as "Admin" so far to avoid renaming beyond what was asked).
- [ ] Section dashboards for Client-facing and Agency Operations (to be designed later, per the owner).
