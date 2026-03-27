import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RegistrationPage from '../RegistrationPage';
import { AuthContext } from '../../Contexts/AuthContext';

// Мокаем только MainPage
vi.mock('../MainPage', () => ({
    default: () => <div data-testid="main-page">Main Page</div>
}));

describe('RegistrationPage - простые тесты', () => {
    const mockSetAuth = vi.fn();
    const mockSetContextUserName = vi.fn();

    const mockAuthContext = {
        setAuth: mockSetAuth,
        setContextUserName: mockSetContextUserName
    };

    const renderRegistrationPage = () => {
        return render(
            <BrowserRouter>
                <AuthContext.Provider value={mockAuthContext}>
                    <RegistrationPage />
                </AuthContext.Provider>
            </BrowserRouter>
        );
    };

    // ТЕСТ 1: Страница рендерится
    it('рендерит страницу с заголовком', () => {
        renderRegistrationPage();
        expect(screen.getByText('Станьте частью большего')).toBeInTheDocument();
    });

    // ТЕСТ 2: Есть поле для имени пользователя
    it('содержит поле для имени пользователя', () => {
        renderRegistrationPage();
        expect(screen.getByLabelText('Имя пользователя')).toBeInTheDocument();
    });

    // ТЕСТ 3: Есть поле для логина
    it('содержит поле для логина', () => {
        renderRegistrationPage();
        expect(screen.getByLabelText('Логин')).toBeInTheDocument();
    });

    // ТЕСТ 4: Есть поле для email
    it('содержит поле для email', () => {
        renderRegistrationPage();
        expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    // ТЕСТ 5: Есть поле для пароля
    it('содержит поле для пароля', () => {
        renderRegistrationPage();
        expect(screen.getByLabelText('Пароль')).toBeInTheDocument();
    });

    // ТЕСТ 6: Есть поле для подтверждения пароля
    it('содержит поле для подтверждения пароля', () => {
        renderRegistrationPage();
        expect(screen.getByLabelText('Подтверждение пароль')).toBeInTheDocument();
    });

    // ТЕСТ 7: Есть кнопка регистрации
    it('содержит кнопку регистрации', () => {
        renderRegistrationPage();
        expect(screen.getByText('Зарегистрироваться')).toBeInTheDocument();
    });

    // ТЕСТ 8: Есть ссылка на вход
    it('содержит ссылку на страницу входа', () => {
        renderRegistrationPage();
        expect(screen.getByText('Уже есть аккаунт? Войти')).toBeInTheDocument();
    });

    // ТЕСТ 9: Можно ввести текст в поля
    it('позволяет вводить текст в поля', () => {
        renderRegistrationPage();

        const nameInput = screen.getByLabelText('Имя пользователя');
        fireEvent.change(nameInput, { target: { value: 'testuser' } });
        expect(nameInput).toHaveValue('testuser');

        const loginInput = screen.getByLabelText('Логин');
        fireEvent.change(loginInput, { target: { value: 'testlogin' } });
        expect(loginInput).toHaveValue('testlogin');

        const emailInput = screen.getByLabelText('Email');
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        expect(emailInput).toHaveValue('test@example.com');
    });

    // ТЕСТ 10: Можно заполнить все поля
    it('позволяет заполнить все поля', () => {
        renderRegistrationPage();

        fireEvent.change(screen.getByLabelText('Имя пользователя'), { target: { value: 'testuser' } });
        fireEvent.change(screen.getByLabelText('Логин'), { target: { value: 'testlogin' } });
        fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'password123' } });
        fireEvent.change(screen.getByLabelText('Подтверждение пароль'), { target: { value: 'password123' } });

        expect(screen.getByLabelText('Имя пользователя')).toHaveValue('testuser');
        expect(screen.getByLabelText('Логин')).toHaveValue('testlogin');
        expect(screen.getByLabelText('Email')).toHaveValue('test@example.com');
        expect(screen.getByLabelText('Пароль')).toHaveValue('password123');
        expect(screen.getByLabelText('Подтверждение пароль')).toHaveValue('password123');
    });
});