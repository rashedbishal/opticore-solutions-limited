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
