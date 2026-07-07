import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { loginAsAdmin } from './utils/admin-auth';
import { registerCustomer } from './utils/customer-auth';

/**
 * Drives the full offer lifecycle through the real frontend on both sides:
 * an admin creates an offer inside a customer's support conversation, and
 * the client accepts or declines it from the signed /offer/{token} page.
 * Uses two independent browser contexts (admin + customer) since they're
 * genuinely different sessions. Doesn't depend on Reverb broadcasting being
 * up — the client re-fetches the offer page after acting instead of relying
 * on the real-time echo listener, so it also works against a local dev
 * stack where BROADCAST_CONNECTION defaults to 'log'.
 */
async function sendSingleOfferToCustomer(
    adminPage: Page,
    customerName: string,
    description: string,
): Promise<string> {
    await adminPage.goto('/admin/customer-conversations');

    await adminPage.getByPlaceholder('Search channels...').fill(customerName);
    await adminPage
        .locator('[role="button"]')
        .filter({ hasText: customerName })
        .first()
        .click();

    await adminPage.getByTitle('Create an Offer').click();

    // Step 1: category (optional) — skip straight to payment type.
    await adminPage.getByRole('button', { name: 'Continue' }).click();

    // Step 2: payment type.
    await adminPage.getByRole('button', { name: 'Full Payment' }).click();
    await adminPage.getByRole('button', { name: 'Continue' }).click();

    // Step 3: details.
    await adminPage
        .getByPlaceholder(
            "Describe what's included in this offer, scope of work, deliverables...",
        )
        .fill(description);
    await adminPage.getByPlaceholder('0.00').fill('75');
    await adminPage.getByPlaceholder('7').first().fill('5');

    await adminPage.getByRole('button', { name: 'Send Offer' }).click();

    const offerLink = adminPage.getByRole('link', {
        name: /view offer details/i,
    });
    await offerLink.waitFor();

    const href = await offerLink.getAttribute('href');

    if (!href) {
        throw new Error('Offer link had no href');
    }

    return href;
}

test.describe('Client accepts or declines an admin-created offer', () => {
    test('customer accepts an offer sent by the admin', async ({ browser }) => {
        const customerContext = await browser.newContext();
        const customerPage = await customerContext.newPage();
        const customerName = `E2E Offer Accept ${Date.now()}`;

        await registerCustomer(
            customerPage,
            customerName,
            `e2e-offer-accept-${Date.now()}@example.com`,
        );
        await customerPage.goto('/dashboard');
        await customerPage.waitForResponse((res) =>
            res.url().includes('/user-chat/init'),
        );

        const adminContext = await browser.newContext();
        const adminPage = await adminContext.newPage();
        await loginAsAdmin(adminPage);

        const offerUrl = await sendSingleOfferToCustomer(
            adminPage,
            customerName,
            'E2E test offer — accept path.',
        );

        await customerPage.goto(offerUrl);
        await expect(
            customerPage.getByRole('button', { name: 'Accept Offer' }),
        ).toBeVisible();

        await customerPage
            .getByRole('button', { name: 'Accept Offer' })
            .click();
        await customerPage.waitForResponse((res) =>
            res.url().includes('/accept'),
        );

        await customerPage.reload();
        await expect(customerPage.getByText('Offer Accepted')).toBeVisible();

        await customerContext.close();
        await adminContext.close();
    });

    test('customer declines an offer sent by the admin', async ({
        browser,
    }) => {
        const customerContext = await browser.newContext();
        const customerPage = await customerContext.newPage();
        const customerName = `E2E Offer Decline ${Date.now()}`;

        await registerCustomer(
            customerPage,
            customerName,
            `e2e-offer-decline-${Date.now()}@example.com`,
        );
        await customerPage.goto('/dashboard');
        await customerPage.waitForResponse((res) =>
            res.url().includes('/user-chat/init'),
        );

        const adminContext = await browser.newContext();
        const adminPage = await adminContext.newPage();
        await loginAsAdmin(adminPage);

        const offerUrl = await sendSingleOfferToCustomer(
            adminPage,
            customerName,
            'E2E test offer — decline path.',
        );

        await customerPage.goto(offerUrl);
        await expect(
            customerPage.getByRole('button', { name: 'Decline' }),
        ).toBeVisible();

        await customerPage.getByRole('button', { name: 'Decline' }).click();
        await customerPage.waitForResponse((res) =>
            res.url().includes('/decline'),
        );

        await customerPage.reload();
        await expect(customerPage.getByText('Offer Declined')).toBeVisible();

        await customerContext.close();
        await adminContext.close();
    });
});
