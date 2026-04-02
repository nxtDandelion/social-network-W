import { test, expect } from '@playwright/test';
import { registerUser, logoutUser } from '../utils/helpers';

test('E2E-07: Подписка на другого пользователя', async ({ browser }) => {
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    const { username: userA } = await registerUser(pageA, 'userA');

    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    const { username: userB } = await registerUser(pageB, 'userB');

    await pageA.goto(`/profile/${userA}`);
    await expect(pageA).toHaveURL(new RegExp(`/profile/${userA}`));
    await expect(pageA.getByText(userA, { exact: true })).toBeVisible();
    await pageA.goto('/home');
    await expect(pageA.getByRole('button', { name: 'Создать пост' })).toBeVisible();

    await pageB.goto(`/profile/${userB}`);
    await expect(pageB).toHaveURL(new RegExp(`/profile/${userB}`));
    await expect(pageB.getByText(userB, { exact: true })).toBeVisible();
    await pageB.goto('/home');
    await expect(pageB.getByRole('button', { name: 'Создать пост' })).toBeVisible();

    // Переход на профиль userB от лица userA
    await pageA.goto(`/profile/${userB}`);
    await expect(pageA.getByText(userB, { exact: true })).toBeVisible();

    const subscribeButton = pageA.getByRole('button', { name: 'Подписаться' });
    await subscribeButton.click();

    // Ожидаем, что кнопка изменится на "Отписаться"
    await expect(pageA.getByRole('button', { name: 'Отписаться' })).toBeVisible({ timeout: 5000 });

    await logoutUser(pageA, userA);
    await logoutUser(pageB, userB);
});

test('E2E-08: Лента подписок', async ({ browser }) => {
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    const { username: userA } = await registerUser(pageA, 'userC');

    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    const { username: userB } = await registerUser(pageB, 'userD');

    await pageA.goto(`/profile/${userA}`);
    await expect(pageA).toHaveURL(new RegExp(`/profile/${userA}`));
    await expect(pageA.getByText(userA, { exact: true })).toBeVisible();
    await pageA.goto('/home');
    await expect(pageA.getByRole('button', { name: 'Создать пост' })).toBeVisible();

    await pageB.goto(`/profile/${userB}`);
    await expect(pageB).toHaveURL(new RegExp(`/profile/${userB}`));
    await expect(pageB.getByText(userB, { exact: true })).toBeVisible();
    await pageB.goto('/home');
    await expect(pageB.getByRole('button', { name: 'Создать пост' })).toBeVisible();

    // Подписка userA на userB
    await pageA.goto(`/profile/${userB}`);
    const subscribeButton = pageA.getByRole('button', { name: 'Подписаться' });
    await subscribeButton.click();
    await expect(pageA.getByRole('button', { name: 'Отписаться' })).toBeVisible({ timeout: 5000 });

    // Создание поста пользователем B
    const postText = `Пост от ${userB} ${Date.now()}`;
    await pageB.getByRole('button', { name: 'Создать пост' }).click();
    await pageB.getByPlaceholder('Диктуйте миру ваши мысли...').fill(postText);
    await pageB.getByRole('button', { name: 'Сохранить' }).click();

    const successNotification = pageB.getByText('Пост добавлен успешно');
    await expect(successNotification).toBeVisible({ timeout: 15000 });
    await expect(successNotification).toBeHidden();
    await expect(pageB.getByPlaceholder('Диктуйте миру ваши мысли...')).toBeHidden({ timeout: 10000 });
    await expect(pageB.getByText(postText)).toBeVisible();

    // Проверка ленты подписок у userA
    await pageA.goto('/favourites');
    await expect(pageA.getByText(postText)).toBeVisible();

    await logoutUser(pageA, userA);
    await logoutUser(pageB, userB);
});