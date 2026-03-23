import { test, expect } from '@playwright/test';
import { registerUser } from '../utils/helpers';

test('E2E-04: Создание поста', async ({ page }) => {
    const { username } = await registerUser(page, 'user_3');

    await page.goto('/home');

    const postText = `Мой первый пост ${Date.now()}`;
    await page.getByRole('button', { name: 'Создать пост' }).click();
    await expect(page.getByPlaceholder('Диктуйте миру ваши мысли...')).toBeVisible();
    await page.getByPlaceholder('Диктуйте миру ваши мысли...').fill(postText);
    await page.getByRole('button', { name: 'Сохранить' }).click();

    await expect(page.getByText(postText)).toBeVisible();
});

test('E2E-05: Редактирование поста', async ({ page }) => {
    const { username } = await registerUser(page, 'user_4');

    await page.goto('/home');
    await expect(page.getByRole('button', { name: 'Создать пост' })).toBeVisible();

    const originalText = `Исходный текст ${Date.now()}`;
    await page.getByRole('button', { name: 'Создать пост' }).click();
    await page.getByPlaceholder('Диктуйте миру ваши мысли...').fill(originalText);
    await page.getByRole('button', { name: 'Сохранить' }).click();

    await expect(page.getByPlaceholder('Диктуйте миру ваши мысли...')).toBeHidden({ timeout: 10000 });
    const successNotification = page.getByText('Пост добавлен успешно');
    await expect(successNotification).toBeVisible();
    await expect(successNotification).toBeHidden();

    await expect(page.getByText(originalText)).toBeVisible();

    const postBlock = page.locator(`div:has-text("${originalText}")`).first();
    const menuButton = postBlock.locator('button.pt-2').first();
    await menuButton.click();

    await page.getByRole('button', { name: 'Редактировать' }).click();

    const updatedText = `Новый текст ${Date.now()}`;
    await page.getByPlaceholder('Диктуйте миру ваши мысли...').fill(updatedText);
    await page.getByRole('button', { name: 'Сохранить' }).click();

    await expect(page.getByPlaceholder('Диктуйте миру ваши мысли...')).toBeHidden({ timeout: 5000 });
    await expect(page.getByText('Пост отредактирован')).toBeHidden({ timeout: 5000 });

    const updatedPostBlock = page.locator(`div:has-text("${updatedText}")`).first();
    await expect(updatedPostBlock).toBeVisible();
    await expect(updatedPostBlock.getByText('Отредактирован', { exact: true }).first()).toBeVisible();
});

test('E2E-06: Удаление поста', async ({ page }) => {
    const { username } = await registerUser(page, 'user_5');

    await page.goto('/home');
    await expect(page.getByRole('button', { name: 'Создать пост' })).toBeVisible();

    const postText = `Пост для удаления ${Date.now()}`;
    await page.getByRole('button', { name: 'Создать пост' }).click();
    await page.getByPlaceholder('Диктуйте миру ваши мысли...').fill(postText);
    await page.getByRole('button', { name: 'Сохранить' }).click();

    await expect(page.getByPlaceholder('Диктуйте миру ваши мысли...')).toBeHidden({ timeout: 10000 });
    const successNotification = page.getByText('Пост добавлен успешно');
    await expect(successNotification).toBeVisible();
    await expect(successNotification).toBeHidden();

    await expect(page.getByText(postText)).toBeVisible();

    const postBlock = page.locator(`div:has-text("${postText}")`).first();
    const menuButton = postBlock.locator('button.pt-2').first();
    await menuButton.click();

    await page.getByRole('button', { name: 'Удалить' }).click();

    const confirmDialog = page.locator('div:has-text("Вы уверены что хотите удалить этот пост?")').first();
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.locator('button:has-text("Удалить")').last().click();

    await expect(page.getByText(postText)).toBeHidden({ timeout: 5000 });
});

test('E2E-07: Лайк поста', async ({ page }) => {
    const { username } = await registerUser(page, 'user_6');

    await page.goto('/home');

    const postText = `Пост для лайка ${Date.now()}`;
    await page.getByRole('button', { name: 'Создать пост' }).click();
    await page.getByPlaceholder('Диктуйте миру ваши мысли...').fill(postText);
    await page.getByRole('button', { name: 'Сохранить' }).click();

    await expect(page.getByPlaceholder('Диктуйте миру ваши мысли...')).toBeHidden({ timeout: 5000 });

    await expect(page.getByText(postText)).toBeVisible();

    const postBlock = page.locator(`div:has-text("${postText}")`).first();

    const likeButton = postBlock.getByRole('button').filter({ hasText: /^\s*\d+\s*$/ }).first();

    const initialText = await likeButton.textContent();
    const initialCount = parseInt(initialText?.trim() || '0');
    await likeButton.click();

    await expect(async () => {
        const newText = await likeButton.textContent();
        const newCount = parseInt(newText?.trim() || '0');
        expect(newCount).toBe(initialCount + 1);
    }).toPass({ timeout: 5000 });

    await likeButton.click();
    await expect(async () => {
        const newText = await likeButton.textContent();
        const newCount = parseInt(newText?.trim() || '0');
        expect(newCount).toBe(initialCount);
    }).toPass({ timeout: 5000 });
});

test('E2E-08: Создание комментария', async ({ page }) => {
    const { username } = await registerUser(page, 'user_7');

    await page.goto('/home');
    await expect(page.getByRole('button', { name: 'Создать пост' })).toBeVisible({ timeout: 5000 });

    const postText = `Пост для комментария ${Date.now()}`;
    await page.getByRole('button', { name: 'Создать пост' }).click();
    await page.getByPlaceholder('Диктуйте миру ваши мысли...').fill(postText);
    await page.getByRole('button', { name: 'Сохранить' }).click();

    await expect(page.getByPlaceholder('Диктуйте миру ваши мысли...')).toBeHidden({ timeout: 10000 });
    const successNotification = page.getByText('Пост добавлен успешно');
    await expect(successNotification).toBeVisible();
    await expect(successNotification).toBeHidden();

    await expect(page.getByText(postText)).toBeVisible();

    const postBlock = page.locator(`div:has-text("${postText}")`).first();
    const actions = postBlock.locator('div:has(button)').last();
    const commentButton = actions.getByRole('button').nth(1);
    await commentButton.click();

    const modal = page.locator('.fixed.inset-0.z-50');
    await expect(modal).toBeVisible();

    const commentField = modal.getByPlaceholder('Напишите комментарий...');
    await expect(commentField).toBeVisible();

    const commentText = `Комментарий ${Date.now()}`;
    await commentField.fill(commentText);
    await modal.getByRole('button', { name: /Отправить/i }).click();

    await expect(modal.getByText(commentText)).toBeVisible();
});