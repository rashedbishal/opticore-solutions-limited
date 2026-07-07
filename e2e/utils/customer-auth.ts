import type { Page } from '@playwright/test';

export async function registerCustomer(
    page: Page,
    name: string,
    email: string,
    password = 'E2eTest!2026',
): Promise<void> {
    await page.goto('/register');

    await page.locator('input[name="name"]').fill(name);
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[type="tel"]').fill('1712345678');
    await page.locator('input[name="password"]').fill(password);
    await page.locator('input[name="password_confirmation"]').fill(password);
    await page.locator('input[type="checkbox"]').check();

    await page.getByRole('button', { name: /create account/i }).click();
    await page.waitForURL((url) => url.pathname === '/verify-email');
}
