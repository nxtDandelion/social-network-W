// utils/helpers.ts
import { Page, expect } from '@playwright/test';

export async function registerUser(page: Page, customUsername?: string) {
    const username = customUsername;
    const email = `${username}@example.com`;
    const password = 'Test123!';

    await page.goto('/registration');
    await page.getByRole('textbox', { name: 'Имя пользователя' }).fill(username);
    await page.getByRole('textbox', { name: 'Логин' }).fill(username);
    await page.getByRole('textbox', { name: 'Email' }).fill(email);
    await page.getByRole('textbox', { name: 'Пароль', exact: true }).fill(password);
    await page.getByRole('textbox', { name: 'Подтверждение пароль' }).fill(password);
    await page.getByRole('button', { name: 'Зарегистрироваться' }).click();

    await expect(page).toHaveURL(/\/home|\//, { timeout: 10000 });

    await expect(page.getByRole('button', { name: 'Создать пост' })).toBeVisible({ timeout: 5000 });

    return { username, email, password };
}

export async function logoutUser(page: Page, username: string) {
    await page.goto(`/profile/${username}`);
    await page.getByRole('button', { name: 'Выйти' }).click();
    await page.goto('/home');
}