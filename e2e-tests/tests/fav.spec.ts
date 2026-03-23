import { test, expect } from '@playwright/test';
import { registerUser } from '../utils/helpers';

test('E2E-09: Подписка на другого пользователя', async ({ browser }) => {
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    const { username: userA } = await registerUser(pageA, 'userA');

    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    const { username: userB } = await registerUser(pageB, 'userB');

    await pageA.goto(`/profile/${userB}`);
    await expect(pageA.getByText(userB, { exact: true })).toBeVisible();

    const subscribeButton = pageA.getByRole('button', { name: 'Подписаться' });
    await subscribeButton.click();

    await expect(pageA.getByRole('button', { name: 'Отписаться' })).toBeVisible();
});

test('E2E-10: Лента подписок', async ({ browser }) => {
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    const { username: userA } = await registerUser(pageA, 'userC');

    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    const { username: userB } = await registerUser(pageB, 'userD');

    await pageA.goto(`/profile/${userB}`);
    const subscribeButton = pageA.getByRole('button', { name: 'Подписаться' });
    await subscribeButton.click();

    await expect(pageA.getByRole('button', { name: 'Отписаться' })).toBeVisible();

    await pageB.goto('/home');
    await pageB.getByRole('button', { name: 'Создать пост' }).click();
    const postText = `Пост от ${userB} ${Date.now()}`;
    await pageB.getByPlaceholder('Диктуйте миру ваши мысли...').fill(postText);
    await pageB.getByRole('button', { name: 'Сохранить' }).click();
    await expect(pageB.getByPlaceholder('Диктуйте миру ваши мысли...')).toBeHidden({ timeout: 5000 });
    await expect(pageB.getByText(postText)).toBeVisible();

    await pageA.goto('/favourites');
    await expect(pageA.getByText(postText)).toBeVisible();
});