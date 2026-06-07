import { expect, test } from '@playwright/test';

test.describe('Visitor submits the contact form', () => {
    test('shows the success state after a valid submission', async ({
        page,
    }) => {
        await page.goto('/contact');

        await page.getByPlaceholder('Your name').fill('E2E Test Visitor');
        await page
            .getByPlaceholder('your@email.com')
            .fill(`e2e-contact-${Date.now()}@example.com`);
        await page
            .getByPlaceholder('How can we help?')
            .fill('Automated end-to-end test inquiry');
        await page
            .getByPlaceholder('Tell us about your project or inquiry...')
            .fill(
                'This message was submitted by an automated end-to-end test and can be safely ignored.',
            );

        await page
            .getByRole('button', { name: 'Submit contact form' })
            .click();

        await expect(
            page.getByRole('heading', { name: 'Message Received' }),
        ).toBeVisible();
        await expect(
            page.getByText('Thank you for reaching out.'),
        ).toBeVisible();
    });
});
