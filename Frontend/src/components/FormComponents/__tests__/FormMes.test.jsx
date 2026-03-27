import { render, screen } from '@testing-library/react';
import FormMes from '../FormMes';

describe('FormMes', () => {
    // Сообщение об ошибке
    test('отображает сообщение об ошибке с красной рамкой', () => {
        render(<FormMes text="Неверный пароль" type="error" />);

        const message = screen.getByText('Неверный пароль');
        expect(message).toBeInTheDocument();
        expect(message).toHaveClass('border-red-800');
    });

    // Сообщение об успехе
    test('отображает сообщение об успехе с зеленой рамкой', () => {
        render(<FormMes text="Вход выполнен" type="message" />);

        const message = screen.getByText('Вход выполнен');
        expect(message).toBeInTheDocument();
        expect(message).toHaveClass('border-green-600');
    });

    // Дефолтное состояние
    test('рендерится с правильными классами', () => {
        render(<FormMes text="Тест" type="error" />);

        const container = screen.getByText('Тест');
        expect(container).toHaveClass('w-fit', 'h-8', 'border-2', 'py-1', 'px-2', 'rounded-2xl');
    });
});