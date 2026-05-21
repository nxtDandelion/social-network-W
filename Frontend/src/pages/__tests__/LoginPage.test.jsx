import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../LoginPage';
import { AuthContext } from '../../Contexts/AuthContext';

// Мокаем только MainPage, остальное используем реальное
vi.mock('../MainPage', () => ({
    default: () => <div data-testid="main-page">Main Page</div>
}));

describe('LoginPage - базовые тесты', () => {
    const mockSetAuth = vi.fn();
    const mockSetContextUserName = vi.fn();
    const mockSetContextUserId = vi.fn();

    const mockAuthContext = {
        setAuth: mockSetAuth,
        setContextUserName: mockSetContextUserName,
        setContextUserId: mockSetContextUserId
    };

    const renderLoginPage = () => {
        return render(
            <BrowserRouter>
                <AuthContext.Provider value={mockAuthContext}>
                    <LoginPage />
                </AuthContext.Provider>
            </BrowserRouter>
        );
    };

    // ТЕСТ 1: Заголовок
    it('рендерит страницу с заголовком', () => {
        renderLoginPage();
        expect(screen.getByText('Добро пожаловать!')).toBeInTheDocument();
    });

    // ТЕСТ 2: Поле логина
    it('содержит поле для логина', () => {
        renderLoginPage();
        expect(screen.getByLabelText('Логин')).toBeInTheDocument();
    });

    // ТЕСТ 3: Поле пароля
    it('содержит поле для пароля', () => {
        renderLoginPage();
        expect(screen.getByLabelText('Пароль')).toBeInTheDocument();
    });

    // ТЕСТ 4: Кнопка входа
    it('содержит кнопку входа', () => {
        renderLoginPage();
        expect(screen.getByText('Войти')).toBeInTheDocument();
    });

    // ТЕСТ 5: Ссылка на регистрацию
    it('содержит ссылку на регистрацию', () => {
        renderLoginPage();
        expect(screen.getByText('Нет аккаунта? Зарегистрируйся!')).toBeInTheDocument();
    });

    // ТЕСТ 6: Заполнение полей
    it('позволяет вводить текст в поля', () => {
        renderLoginPage();

        const loginInput = screen.getByLabelText('Логин');
        fireEvent.change(loginInput, { target: { value: 'testuser' } });
        expect(loginInput).toHaveValue('testuser');

        const passwordInput = screen.getByLabelText('Пароль');
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        expect(passwordInput).toHaveValue('password123');
    });
});