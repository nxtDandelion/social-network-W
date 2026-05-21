// tests/auth.spec.ts
import { test, expect } from '@playwright/test';
import { registerUser, logoutUser } from '../utils/helpers';

test('E2E-01: Регистрация нового пользователя', async ({ page }) => {
    const { username } = await registerUser(page, 'user_1');
    await logoutUser(page, username);
});