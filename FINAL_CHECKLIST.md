# Final QA & Launch Checklist

This is a practical, step-by-step Quality Assurance checklist to manually verify application integrity prior to launching the production environment.

## [ ] 1. Authentication Testing
- [ ] **Valid Login:** Submit your admin credentials on `/login`. Verify the Inertia session redirects instantly to the protected `/admin` dashboard.
- [ ] **Invalid Login:** Submit randomized/wrong credentials. Verify the app rejects the payload and highlights the email/password fields with validation errors.
- [ ] **Route Fortification:** Open an Incognito/Private window. Try pasting a direct link (e.g., `/admin/portfolios`). Ensure the middleware catches you and blocks access with a redirect to the login gate.
- [ ] **Logout Flow:** Click the sign-out trigger and use the browser's "Back" arrow. Verify you cannot re-access the dashboard data once the session is flushed.

## [ ] 2. Core CMS Operations (CRUD)
- [ ] **Creation:** Create a new dummy Portfolio and dummy Blog Post. Ensure they correctly display at the top of their respective index views.
- [ ] **Updating:** Edit the dummy files (alter the title and select a new category). Save and check the live public-facing website to verify the text changed dynamically.
- [ ] **Deletion:** Delete the dummy objects. Look at the public index—the items should disappear seamlessly without breaking the UI.
- [ ] **Empty States:** Navigate to a freshly made sub-category that holds no portfolios. Confirm the user-friendly "No items here yet" placeholder renders nicely instead of crashing.

## [ ] 3. File & Media Uploads
- [ ] **Upload Persistence:** Upload an image banner for a blog post. Save it, hit refresh, and verify the thumbnail renders without throwing a 404 storage link error.
- [ ] **Invalid Formats:** Attempt to upload a `.pdf` or a `20MB` video file into an image-only column. Ensure the server kicks it back with an "Invalid file format/size limit" warning.
- [ ] **Orphan Asset Cleanup:** Watch the `/storage/app/public` disk locally. Delete a portfolio entry from the CMS and verify that the corresponding `.png` or `.webp` file was destroyed alongside it to prevent server bloat.

## [ ] 4. Broken Link & Navigation Integrity
- [ ] **Main Navigation:** Traverse between Home, Blogs, Services, and Portfolio. Verify that Inertia picks up the click and simulates an SPA visit (no blank screen loading spinners!).
- [ ] **Footer Anchors:** Click "Terms of Conditions", "Privacy", and standard Social Media outbound tags.
- [ ] **In-App Referencing:** Click a blog's "Read More" and verify the generated slug (`/blog/your-title-name`) pulls the exact valid instance.

## [ ] 5. Mobile Responsiveness (Viewport Testing)
- [ ] **Fluid Scaling:** Open Browser Dev Tools and drag the screen size down to `375px` (iPhone baseline). Verify the CSS grid snaps from a 3-column UI structure down into a legible 1-column stack.
- [ ] **Mobile Drawer:** Tap the Hamburger menu. Ensure the navigation side-pane opens properly. Tap a link inside it and ensure the sheet naturally closes automatically on navigate.
- [ ] **Touch Safety Bounds:** Verify any tiny links, pagination dots, or 'click for more' labels are adequately spaced for a physical thumb-tap on a mobile screen without mis-clicking.

## [ ] 6. Error Page Handling
- [ ] **404 Handling:** Type absolute gibberish into the URL (e.g., `/admin/dsfiuasf89s`). Ensure it loads a cleanly styled "Page Not Found" screen pushing the user back to safety.
- [ ] **500 Handling:** Temporarily alter a password in your `.env` to break the database connection. Refresh the page to verify a generic "Server Issue" screen appears. Verify that no raw SQL queries or stack traces leak onto the page (making sure `APP_DEBUG=false` holds true in production).

## [ ] 7. Frontend Console & Network Integrity (CRITICAL)
- [ ] **Console Errors:** Open Browser DevTools → Console tab. Verify there are absolutely no red errors and no failed JS imports.
- [ ] **Network Health:** Open Network tab. Refresh the application and ensure:
  - No 404 JS/CSS bundled files missing.
  - No silently failing background API calls (Many Inertia apps "look fine" initially but fail background hydration under the hood).
  - No aggressively slow blocking requests (>2s).

## [ ] 8. Performance Sanity Check
- [ ] **First Contentful Paint:** First page boot completes load sequence under ~3 seconds.
- [ ] **SPA Navigation:** Clicking between core layout boundaries acts immediately (gives the fast SPA feel without jittering).
- [ ] **Media Bloat:** Run a quick check (or use Lighthouse) to ensure no uncompressed raw source `MB` image files are bogging down rendering.
- [ ] **Optional:** Execute a Chrome Lighthouse Mobile / Desktop test directly. 

## [ ] 9. Authorization Testing (VERY IMPORTANT)
- [ ] **Role Fuzzing:** Log in as a basic/unprivileged user (if applicable) and manually try requesting administrator restricted components.
- [ ] **IDOR Protection:** Try explicitly mutating valid URL parameters (`/admin/post/1/edit` → change to `/2/edit`). Guarantee users who lack ownership of an object throw a `403 Forbidden` rather than resolving an asset they do not own! (This is where many CMS deployments fail).

## [ ] 10. Production Build Validation
- [ ] **Hard Refresh Check:** Clear browser cache completely and reload root page. Verify exactly:
  - Core styling (CSS) hits the DOM correctly.
  - Runtime JS scripts bundle efficiently with zero 'blank screen' initialization lag.
- [ ] **Graceful Failures:** Disable JavaScript temporarily within DevTools settings. Ensure the web application fails gracefully, defaults to standard behavior constraints, or presents an expected fallback warning label.

## [ ] 11. SEO & Meta Basics
- [ ] **Dynamic Tagging:** Verify the browser tab Page Title overrides efficiently on specific unique Blog/Portfolio pages.
- [ ] **Crawling Basics:** Base meta descriptions exist for index discovery.
- [ ] **Open Graph (Optional):** Confirm social-sharing link previews load the correct image schemas on test deployment. 

## [ ] 12. Real User Simulation (Final Step)
- [ ] **Offload Testing:** Assign a non-developer to traverse the main site and use the CMS. Ask them to report arbitrary confusions, unclear actions, or anything broken. You will notoriously discover interface pitfalls actual engineers become blind to.
