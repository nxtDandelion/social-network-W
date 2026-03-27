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

    await expect(page).toHaveURL(new RegExp(`/profile/${username}$`));
    return { username, email, password };
}