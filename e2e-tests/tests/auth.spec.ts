import { test, expect } from '@playwright/test';
import { registerUser } from '../utils/helpers';

test('E2E-01: Регистрация нового пользователя', async ({ page }) => {
    const { username } = await registerUser(page, 'user_1');
    await expect(page.getByText(username, { exact: true })).toBeVisible();
});

test('E2E-02: Вход в систему с валидными данными', async ({ page }) => {
    const { username, password } = await registerUser(page, 'user_2');

    await page.getByRole('button', { name: 'Выйти' }).click();

    await page.goto('/login');

    await page.getByRole('textbox', { name: 'Логин' }).fill(username);
    await page.getByRole('textbox', { name: 'Пароль' }).fill(password);
    await page.getByRole('button', { name: 'Войти' }).click();

    await expect(page).toHaveURL(/\/home/);
    await expect(page.getByRole('button', { name: 'Создать пост' })).toBeVisible();
});

test('E2E-03: Вход в систему с неверными данными', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('textbox', { name: 'Логин' }).fill('invalid_user');
    await page.getByRole('textbox', { name: 'Пароль' }).fill('wrong_password');
    await page.getByRole('button', { name: 'Войти' }).click();

    await expect(page.getByText('Неверное имя пользователя или пароль')).toBeVisible();
    await expect(page).toHaveURL('/login');
});