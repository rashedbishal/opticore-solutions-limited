import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export async function loginAsAdmin(page: Page): Promise<void> {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
        throw new Error(
            'ADMIN_EMAIL and ADMIN_PASSWORD environment variables must be set to log in as an admin',
        );
    }

    await page.goto('/admin/login');
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);
    await page.getByRole('button', { name: /initialize session/i }).click();

    await expect(page.getByText('Authentication Successful')).toBeVisible();
    await page.getByRole('button', { name: 'Proceed' }).click();
    await page.waitForURL((url) => url.pathname === '/admin');
}
