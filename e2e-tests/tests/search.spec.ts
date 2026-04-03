// tests/search.spec.ts (E2E-09) и tests/mention.spec.ts (E2E-10)
import { test, expect } from '@playwright/test';
import { registerUser } from '../utils/helpers';

test('E2E-09: Поиск по хэштегу', async ({ browser }) => {
    // --- ПЕРВЫЙ ПОЛЬЗОВАТЕЛЬ ---
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    const { username: user1 } = await registerUser(page1, 'user_91');

    await page1.goto(`/profile/${user1}`);
    await expect(page1).toHaveURL(new RegExp(`/profile/${user1}`));
    await expect(page1.getByText(user1, { exact: true })).toBeVisible();
    await page1.goto('/home');
    await expect(page1.getByRole('button', { name: 'Создать пост' })).toBeVisible();

    const hashtag = `#тест${Date.now()}`;
    const postText1 = `Первый пост с хэштегом ${hashtag}`;

    await page1.getByRole('button', { name: 'Создать пост' }).click();
    await page1.getByPlaceholder('Диктуйте миру ваши мысли...').fill(postText1);
    await page1.getByRole('button', { name: 'Сохранить' }).click();

    const successNotification1 = page1.getByText('Пост добавлен успешно');
    await expect(successNotification1).toBeVisible({ timeout: 15000 });
    await expect(successNotification1).toBeHidden();
    await expect(page1.getByPlaceholder('Диктуйте миру ваши мысли...')).toBeHidden({ timeout: 15000 });
    await expect(page1.getByText(postText1)).toBeVisible();

    await context1.close();

    // --- ВТОРОЙ ПОЛЬЗОВАТЕЛЬ ---
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    const { username: user2 } = await registerUser(page2, 'user_92');

    await page2.goto(`/profile/${user2}`);
    await expect(page2).toHaveURL(new RegExp(`/profile/${user2}`));
    await expect(page2.getByText(user2, { exact: true })).toBeVisible();
    await page2.goto('/home');
    await expect(page2.getByRole('button', { name: 'Создать пост' })).toBeVisible();

    const postText2 = `Второй пост с хэштегом ${hashtag}`;

    await page2.getByRole('button', { name: 'Создать пост' }).click();
    await page2.getByPlaceholder('Диктуйте миру ваши мысли...').fill(postText2);
    await page2.getByRole('button', { name: 'Сохранить' }).click();

    const successNotification2 = page2.getByText('Пост добавлен успешно');
    await expect(successNotification2).toBeVisible({ timeout: 15000 });
    await expect(successNotification2).toBeHidden();
    await expect(page2.getByPlaceholder('Диктуйте миру ваши мысли...')).toBeHidden({ timeout: 15000 });
    await expect(page2.getByText(postText2)).toBeVisible();

    // Поиск по хэштегу
    const hashtagElement = page2.getByText(hashtag, { exact: true }).first();
    await hashtagElement.click();

    const searchInput = page2.getByPlaceholder('Поиск...');
    await expect(searchInput).toHaveValue(hashtag);

    await expect(page2.getByText(/Результаты поиска по/)).toBeVisible();
    await expect(page2.getByText(postText1)).toBeVisible();
    await expect(page2.getByText(postText2)).toBeVisible();

    await context2.close();
});

test('E2E-10: Упоминание другого пользователя в посте', async ({ browser }) => {
    // Пользователь A (упоминает)
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    const { username: userA } = await registerUser(pageA, 'user_10');

    await pageA.goto(`/profile/${userA}`);
    await expect(pageA).toHaveURL(new RegExp(`/profile/${userA}`));
    await expect(pageA.getByText(userA, { exact: true })).toBeVisible();
    await pageA.goto('/home');
    await expect(pageA.getByRole('button', { name: 'Создать пост' })).toBeVisible();

    // Пользователь B (тот, кого упоминают)
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    const { username: userB } = await registerUser(pageB, 'user_11');

    await pageB.goto(`/profile/${userB}`);
    await expect(pageB).toHaveURL(new RegExp(`/profile/${userB}`));
    await expect(pageB.getByText(userB, { exact: true })).toBeVisible();
    await pageB.goto('/home');
    await expect(pageB.getByRole('button', { name: 'Создать пост' })).toBeVisible();

    // Пользователь A создаёт пост с упоминанием B
    await pageA.goto('/home');
    await pageA.getByRole('button', { name: 'Создать пост' }).click();
    const mentionText = `Привет @${userB}`;
    await pageA.getByPlaceholder('Диктуйте миру ваши мысли...').fill(mentionText);
    await pageA.getByRole('button', { name: 'Сохранить' }).click();

    const successNotification = pageA.getByText('Пост добавлен успешно');
    await expect(successNotification).toBeVisible({ timeout: 15000 });
    await expect(successNotification).toBeHidden();
    await expect(pageA.getByPlaceholder('Диктуйте миру ваши мысли...')).toBeHidden({ timeout: 15000 });
    await expect(pageA.getByText(mentionText)).toBeVisible();

    // Находим упоминание и кликаем
    const mentionElement = pageA.getByText(`@${userB}`, { exact: true });
    await mentionElement.click();

    await expect(pageA).toHaveURL(new RegExp(`/profile/${userB}`));
    await expect(pageA.getByText(userB, { exact: true })).toBeVisible();

    await contextA.close();
    await contextB.close();
});