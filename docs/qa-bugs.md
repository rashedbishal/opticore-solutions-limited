# QA Discovered Bugs

## BUG-001 — PortfolioSubCategoryController::update — Undefined array key "slug"
- Discovered: Phase 2 backend testing
- File: app/Http/Controllers/Admin/PortfolioSubCategoryController.php (update method)
- Description: When "slug" is omitted from the update payload, the controller 
  throws "Undefined array key slug". The slug field is not being generated 
  automatically on update the way it is on create.
- Workaround in tests: Always supply slug in payload, matching HireUsPageTest.php convention
- Impact: If the frontend CMS form ever omits slug on edit, the update will crash
- Priority: High — data loss risk on content edits
- Status: Open — not fixed (fix is out of QA scope)

## Known Test Limitations (Phase 4)

- Journey 6 (contact form) leaves a row in the contacts table on each run — 
  no cleanup was included per spec. Manual cleanup needed periodically.
- Contact form rate limit: /api/contact throttles at 5 requests/minute. 
  Do not run Journey 6 repeatedly in quick succession during debugging.
- E2E tests require APP_URL, ADMIN_EMAIL, ADMIN_PASSWORD env vars set locally.
  Admin journeys gracefully skip if these are missing.
- Homepage testimonial test (Journey 3) depends on SpotlightCarousel lazy-load 
  threshold — if that component's scroll behavior changes, update the test.
- Visual/design regression, file uploads, email delivery, WebSockets (Reverb), 
  and accessibility are NOT covered — these remain manual.
