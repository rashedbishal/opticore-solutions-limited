import { expect, test } from '@playwright/test';
import { registerCustomer } from './utils/customer-auth';

/**
 * Drives the real checkout form (registration → profile completion →
 * /checkout → "Pay Now") through the actual React frontend, up to the
 * handoff to SSLCommerz's gateway. It intentionally stops there rather than
 * completing a real sandbox payment: that step happens on SSLCommerz's own
 * hosted page (card entry, possible OTP challenge) and isn't something an
 * automated spec can drive deterministically without committing live
 * sandbox card credentials to the repo. This still covers the part most
 * likely to silently break in a frontend regression — the submit button,
 * profile-completeness gate, and the embed script handoff.
 */
test.describe('Customer completes checkout up to the payment gateway handoff', () => {
    test('registers, completes the profile, and opens the SSLCommerz gateway from checkout', async ({
        page,
        context,
    }) => {
        const email = `e2e-checkout-${Date.now()}@example.com`;

        await registerCustomer(page, 'E2E Checkout Tester', email);

        // ── Complete the profile fields SSLCommerz requires ─────────────
        await page.goto('/profile?tab=settings');

        await page.locator('#country').fill('Bangladesh');
        await page.locator('#address').fill('93 B, New Eskaton Road, Dhaka');

        await page.getByRole('button', { name: /save changes/i }).click();
        await expect(
            page.getByText('Profile updated successfully.'),
        ).toBeVisible();

        // ── Checkout ─────────────────────────────────────────────────────
        await page.goto(
            '/checkout?service=E2E+Test+Service&plan=Standard&price=%2450&delivery=4+Days&category=graphic-design&subcategory=Test+Service&subcategory_id=1',
        );

        await expect(
            page.getByRole('heading', { name: 'Complete Your Order' }),
        ).toBeVisible();
        await expect(page.getByText('E2E Test Service')).toBeVisible();

        const popupPromise = context.waitForEvent('page', { timeout: 20_000 });

        await page.getByRole('button', { name: /pay now/i }).click();

        const popup = await popupPromise;
        await popup.waitForLoadState('domcontentloaded');

        expect(popup.url()).toContain('sslcommerz.com');
    });
});
