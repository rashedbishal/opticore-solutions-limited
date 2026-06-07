import { expect, test } from '@playwright/test';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

test.describe('Admin login and logout', () => {
    test.skip(
        !ADMIN_EMAIL || !ADMIN_PASSWORD,
        'ADMIN_EMAIL and ADMIN_PASSWORD environment variables must be set to run this test',
    );

    test('admin can log in and log out of the CMS', async ({ page }) => {
        await page.goto('/admin/login');

        await page.locator('#email').fill(ADMIN_EMAIL!);
        await page.locator('#password').fill(ADMIN_PASSWORD!);
        await page
            .getByRole('button', { name: /initialize session/i })
            .click();

        await expect(
            page.getByText('Authentication Successful'),
        ).toBeVisible();
        await page.getByRole('button', { name: 'Proceed' }).click();

        await page.waitForURL((url) => url.pathname === '/admin');
        await expect(
            page.locator('header').getByText('Dashboard Overview'),
        ).toBeVisible();

        await page.getByRole('button', { name: 'Sign Out' }).click();

        await page.waitForURL((url) => url.pathname === '/admin/login');
        await expect(
            page.getByRole('button', { name: /initialize session/i }),
        ).toBeVisible();
    });
});
