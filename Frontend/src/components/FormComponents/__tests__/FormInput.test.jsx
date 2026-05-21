import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormInput from '../FormInput';

describe('FormInput', () => {
    const mockOnChange = vi.fn();

    beforeEach(() => {
        mockOnChange.mockClear();
    });

    // Базовый рендер
    test('рендерит label и input', () => {
        render(
            <FormInput
                labelText="Логин"
                formType="text"
                formValue=""
                onChange={mockOnChange}
            />
        );

        expect(screen.getByLabelText('Логин')).toBeInTheDocument();
        expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    // Отображение значения
    test('отображает переданное значение', () => {
        render(
            <FormInput
                labelText="Логин"
                formType="text"
                formValue="testuser"
                onChange={mockOnChange}
            />
        );

        expect(screen.getByRole('textbox')).toHaveValue('testuser');
    });

    // Вызов onChange при вводе
    test('вызывает onChange при вводе текста', async () => {
        const user = userEvent.setup();

        render(
            <FormInput
                labelText="Логин"
                formType="text"
                formValue=""
                onChange={mockOnChange}
            />
        );

        const input = screen.getByRole('textbox');
        await user.type(input, 'test');

        expect(mockOnChange).toHaveBeenCalledTimes(4);
    });

    // Отображение подсказки при фокусе
    test('показывает hintText при фокусе', () => {
        render(
            <FormInput
                labelText="Логин"
                formType="text"
                formValue=""
                onChange={mockOnChange}
                hintText="Допустимы: a-z, 0-9"
            />
        );

        const input = screen.getByRole('textbox');
        expect(screen.queryByText('Допустимы: a-z, 0-9')).not.toBeInTheDocument();

        fireEvent.focus(input);
        expect(screen.getByText('Допустимы: a-z, 0-9')).toBeInTheDocument();

        fireEvent.blur(input);
        expect(screen.queryByText('Допустимы: a-z, 0-9')).not.toBeInTheDocument();
    });

    // Пароль тип
    test('рендерит input type password', () => {
        render(
            <FormInput
                labelText="Пароль"
                formType="password"
                formValue=""
                onChange={mockOnChange}
            />
        );

        const input = screen.getByLabelText('Пароль');
        expect(input).toHaveAttribute('type', 'password');
    });
});
