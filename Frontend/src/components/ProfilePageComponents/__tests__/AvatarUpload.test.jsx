import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AvatarUpload from '../AvatarUpload';

// Мокаем только тяжелые зависимости
vi.mock('../../../utils/cropImage', () => ({
    getCroppedImg: vi.fn()
}));

// Мокаем URL методы
global.URL.createObjectURL = vi.fn(() => 'blob:test-url');
global.URL.revokeObjectURL = vi.fn();

describe('AvatarUpload - простые тесты', () => {
    const mockOnAvatarChange = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderAvatarUpload = (props = {}) => {
        return render(<AvatarUpload onAvatarChange={mockOnAvatarChange} {...props} />);
    };

    // ТЕСТ 1: Рендеринг заглушки
    it('рендерит заглушку "Добавить фото"', () => {
        renderAvatarUpload();
        expect(screen.getByText('Добавить фото')).toBeInTheDocument();
    });

    // ТЕСТ 2: Наличие кнопки камеры
    it('содержит кнопку для загрузки фото', () => {
        renderAvatarUpload();

        const cameraButton = document.querySelector('.absolute.bottom-2.right-2');
        expect(cameraButton).toBeInTheDocument();
    });

    // ТЕСТ 3: Наличие скрытого input file
    it('содержит скрытый input для выбора файла', () => {
        renderAvatarUpload();

        const fileInput = document.querySelector('input[type="file"]');
        expect(fileInput).toBeInTheDocument();
        expect(fileInput).toHaveAttribute('accept', '.jpg,.jpeg,.png,.webp');
    });

    // ТЕСТ 4: Клик по заглушке открывает выбор файла
    it('клик по заглушке открывает диалог выбора файла', () => {
        renderAvatarUpload();

        const fileInput = document.querySelector('input[type="file"]');
        const clickSpy = vi.spyOn(fileInput, 'click');

        const avatarContainer = screen.getByText('Добавить фото').parentElement?.parentElement;
        fireEvent.click(avatarContainer);

        expect(clickSpy).toHaveBeenCalled();
    });

    // ТЕСТ 5: Клик по кнопке камеры открывает выбор файла
    it('клик по кнопке камеры открывает диалог выбора файла', () => {
        renderAvatarUpload();

        const fileInput = document.querySelector('input[type="file"]');
        const clickSpy = vi.spyOn(fileInput, 'click');

        const cameraButton = document.querySelector('.absolute.bottom-2.right-2');
        fireEvent.click(cameraButton);

        expect(clickSpy).toHaveBeenCalled();
    });

    // ТЕСТ 6: Показывает имя файла после выбора
    it('показывает имя файла после выбора', () => {
        renderAvatarUpload();

        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
        const fileInput = document.querySelector('input[type="file"]');

        fireEvent.change(fileInput, { target: { files: [file] } });

        expect(screen.getByText('test.jpg')).toBeInTheDocument();
    });

    // ТЕСТ 7: Показывает ошибку при неправильном типе
    it('показывает ошибку при неправильном типе файла', () => {
        const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

        renderAvatarUpload();

        const file = new File(['test'], 'test.txt', { type: 'text/plain' });
        const fileInput = document.querySelector('input[type="file"]');

        fireEvent.change(fileInput, { target: { files: [file] } });

        expect(alertMock).toHaveBeenCalledWith('Разрешены только файлы JPG, PNG или WebP!');

        alertMock.mockRestore();
    });

    // ТЕСТ 8: Показывает ошибку при превышении размера
    it('показывает ошибку при превышении размера', () => {
        const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

        renderAvatarUpload();

        const file = new File(['test'], 'large.jpg', { type: 'image/jpeg' });
        Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 });

        const fileInput = document.querySelector('input[type="file"]');

        fireEvent.change(fileInput, { target: { files: [file] } });

        expect(alertMock).toHaveBeenCalledWith('Максимальный размер - 5MB');

        alertMock.mockRestore();
    });

    // ТЕСТ 9: Кнопка "Выбрать" присутствует всегда (исправлено)
    it('кнопка "Выбрать" присутствует всегда', () => {
        renderAvatarUpload();

        expect(screen.getByText('Выбрать')).toBeInTheDocument();
    });

    // ТЕСТ 10: Работает без onAvatarChange
    it('работает без onAvatarChange', () => {
        renderAvatarUpload({ onAvatarChange: undefined });

        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
        const fileInput = document.querySelector('input[type="file"]');

        expect(() => {
            fireEvent.change(fileInput, { target: { files: [file] } });
        }).not.toThrow();
    });
});