# QA Automation Report

This report documents all issues found, what was fixed, and what still requires manual testing.

---

## Issues Found & Fixed

### 1. No Rate Limiting on Public Form Routes (Security — CRITICAL)
**File:** `routes/web.php`  
**Issue:** The `/api/contact`, `/api/appointment`, `/api/career/apply`, and `/chat` POST routes had **zero throttle protection**. An attacker could spam thousands of contact forms or overwhelm the Gemini AI endpoint.  
**Fix:** Applied `throttle` middleware:
- Contact & Appointment: `throttle:5,1` (5 requests per minute)
- Career Apply: `throttle:3,1` (3 requests per minute — file uploads are heavier)
- Chat: `throttle:30,1` (30 requests per minute — conversational, needs higher limit)

### 2. No Input Validation on Chat Endpoint (Security)
**File:** `app/Http/Controllers/ChatController.php`  
**Issue:** The `handleChat` method used a manual `empty()` check instead of Laravel validation. No max length constraint existed — an attacker could send megabytes of text in a single message, which then gets forwarded to the Gemini API.  
**Fix:** Replaced with proper `$request->validate()`:
- `message`: `required|string|max:2000`
- `session_id`: `nullable|string|max:255`

### 3. Flash Error Messages Not Shared via Inertia (UX)
**File:** `app/Http/Middleware/HandleInertiaRequests.php`  
**Issue:** Only `flash.success` was shared. Controllers that use `->with('error', ...)` (e.g., `UserController::destroy`, `PortfolioSubCategoryController::destroy`) would silently fail from the user's perspective — the error message was never visible in the frontend.  
**Fix:** Added `'error' => fn () => $request->session()->get('error')` to the shared flash data.

### 4. No Custom Error Pages — Raw Exceptions Visible (Security + UX — CRITICAL)
**Files:** `bootstrap/app.php`, `resources/js/pages/Error.tsx` (NEW)  
**Issue:** No Inertia error page existed. A 404 or 500 would render Laravel's default HTML error page, which:
- Breaks the SPA experience (full page reload into a different template)
- May expose stack traces if `APP_DEBUG` is accidentally left as `true`  
**Fix:**
- Created `resources/js/pages/Error.tsx` with styled pages for 403, 404, 500, and 503 status codes.
- Configured `bootstrap/app.php` to intercept HTTP exceptions and render them through Inertia.
- The error page opts out of the default layout (uses `Error.layout = (page) => page`) to avoid depending on shared layout data that may be unavailable during errors.

---

## Pre-Existing Strengths (No Fix Needed)

| Area | Status | Notes |
|------|--------|-------|
| Auth middleware on admin routes | ✅ Correct | All `/admin/*` routes wrapped in `auth` middleware group |
| File upload validation | ✅ Correct | `PortfolioController` validates MIME types + 100MB max. `BlogController` validates `image\|max:10240` |
| Storage cleanup on delete | ✅ Correct | Both `PortfolioController` and `BlogController` delete associated files from `public` disk on destroy |
| Storage cleanup on update | ✅ Correct | `PortfolioController::update` deletes old media before storing new file |
| Self-delete protection | ✅ Correct | `UserController::destroy` blocks `auth()->id() === $user->id` |
| Sub-category delete protection | ✅ Correct | `PortfolioSubCategoryController::destroy` blocks deletion if portfolios reference it |
| SEO Head tags | ✅ Correct | All 16+ pages use `<Head title="...">` with meta descriptions |
| SPA navigation | ✅ Correct | All navigation uses Inertia `<Link>` component, not `<a>` tags |
| Lazy loading images | ✅ Partial | Present on Portfolio, Contact, Services, and Lightbox components |

---

## Still Requires Manual Testing

### Console & Network Integrity
- [ ] Open DevTools → Console on every page. Check for red errors, especially broken JS imports
- [ ] Open Network tab — verify no 404s on `.js` or `.css` chunks after running `npm run build`
- [ ] Check that lazy-loaded `Section2`–`Section5` chunks load correctly as you scroll

### Mobile Responsiveness
- [ ] Test at 375px viewport (iPhone) — verify grid collapses to single column
- [ ] Test mobile navigation drawer open/close behavior
- [ ] Verify touch target sizes on small interactive elements

### Authorization / IDOR Testing
- [ ] Log in as User A → create a Portfolio → note the ID
- [ ] Log in as User B → try `/admin/portfolios/{ID}/edit` — verify it works (this is a single-admin CMS, so all authenticated users share access)
- [ ] If future roles are added, IDOR protection needs per-model authorization policies

### Performance Sanity
- [ ] First load time under 3 seconds on production
- [ ] Navigation between pages should be instant (SPA behavior)
- [ ] Run Lighthouse audit in Chrome DevTools

### File Upload Edge Cases
- [ ] Upload a large video (~80MB) to Portfolio — verify it succeeds within the 100MB limit
- [ ] Upload a `.pdf` disguised as `.jpg` — verify server rejects it via MIME validation
- [ ] Delete a portfolio with a video attachment — verify the file is removed from `/storage/app/public/portfolios/`

### Production Build
- [ ] Run `npm run build` — verify no build errors
- [ ] Clear browser cache → hard reload → verify no blank screen
- [ ] Temporarily disable JavaScript in browser → verify a graceful fallback (Inertia renders server-side on first load)

### Error Pages
- [ ] Navigate to `/this-does-not-exist` — verify the styled 404 page appears
- [ ] Temporarily break `.env` DB credentials → reload → verify 500 page shows (no stack trace)
