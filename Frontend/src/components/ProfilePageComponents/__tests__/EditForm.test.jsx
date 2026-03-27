import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EditForm from '../EditForm';
import { AuthContext } from '../../../Contexts/AuthContext';

// Мокаем только тяжелые зависимости
vi.mock('../../../API/ProfileAPI/updateUserProfile', () => ({
    updateUserProfile: vi.fn()
}));

vi.mock('../../../utils/fileToBase64', () => ({
    fileToBase64Optimized: vi.fn().mockResolvedValue('base64-string')
}));

// НЕ мокаем дочерние компоненты - используем реальные
// НЕ мокаем useNavigate - пусть используется реальный

describe('EditForm - простые тесты', () => {
    const mockProps = {
        curUserLogin: 'testlogin',
        curUserName: 'testuser',
        curUserMail: 'test@example.com',
        curUserAvatar: 'avatar.jpg',
        closeModalPage: vi.fn(),
        refreshProfile: vi.fn(),
        showNotice: vi.fn()
    };

    const mockAuthContext = {
        auth: true,
        contextUserId: 123
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderEditForm = (props = {}) => {
        return render(
            <BrowserRouter>
                <AuthContext.Provider value={mockAuthContext}>
                    <EditForm {...mockProps} {...props} />
                </AuthContext.Provider>
            </BrowserRouter>
        );
    };

    // ТЕСТ 1: Рендеринг заголовка
    it('рендерит заголовок "Редактирование профиля"', () => {
        renderEditForm();
        expect(screen.getByText('Редактирование профиля')).toBeInTheDocument();
    });

    // ТЕСТ 2: Поле имени пользователя
    it('содержит поле для имени пользователя', () => {
        renderEditForm();
        expect(screen.getByLabelText('Имя пользователя')).toBeInTheDocument();
    });

    // ТЕСТ 3: Поле логина
    it('содержит поле для логина', () => {
        renderEditForm();
        expect(screen.getByLabelText('Логин')).toBeInTheDocument();
    });

    // ТЕСТ 4: Поле email
    it('содержит поле для email', () => {
        renderEditForm();
        expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    // ТЕСТ 5: Поле пароля
    it('содержит поле для пароля', () => {
        renderEditForm();
        expect(screen.getByLabelText('Пароль')).toBeInTheDocument();
    });

    // ТЕСТ 6: Поле подтверждения пароля
    it('содержит поле для подтверждения пароля', () => {
        renderEditForm();
        expect(screen.getByLabelText('Подтверждение пароля')).toBeInTheDocument();
    });

    // ТЕСТ 7: Кнопка сохранения
    it('содержит кнопку "Сохранить изменения"', () => {
        renderEditForm();
        expect(screen.getByText('Сохранить изменения')).toBeInTheDocument();
    });

    // ТЕСТ 8: Кнопка отмены
    it('содержит кнопку "Отменить"', () => {
        renderEditForm();
        expect(screen.getByText('Отменить')).toBeInTheDocument();
    });

    // ТЕСТ 9: Кнопка закрытия
    it('содержит кнопку закрытия (×)', () => {
        renderEditForm();
        expect(screen.getByText('×')).toBeInTheDocument();
    });

    // ТЕСТ 10: Поля содержат начальные значения
    it('поля содержат начальные значения из пропсов', () => {
        renderEditForm();

        expect(screen.getByLabelText('Имя пользователя')).toHaveValue('testuser');
        expect(screen.getByLabelText('Логин')).toHaveValue('testlogin');
        expect(screen.getByLabelText('Email')).toHaveValue('test@example.com');
    });

    // ТЕСТ 11: Изменение имени
    it('позволяет изменить имя пользователя', () => {
        renderEditForm();

        const nameInput = screen.getByLabelText('Имя пользователя');
        fireEvent.change(nameInput, { target: { value: 'newusername' } });

        expect(nameInput).toHaveValue('newusername');
    });

    // ТЕСТ 12: Изменение логина
    it('позволяет изменить логин', () => {
        renderEditForm();

        const loginInput = screen.getByLabelText('Логин');
        fireEvent.change(loginInput, { target: { value: 'newlogin' } });

        expect(loginInput).toHaveValue('newlogin');
    });

    // ТЕСТ 13: Изменение email
    it('позволяет изменить email', () => {
        renderEditForm();

        const emailInput = screen.getByLabelText('Email');
        fireEvent.change(emailInput, { target: { value: 'new@email.com' } });

        expect(emailInput).toHaveValue('new@email.com');
    });

    // ТЕСТ 14: Изменение пароля
    it('позволяет изменить пароль', () => {
        renderEditForm();

        const passwordInput = screen.getByLabelText('Пароль');
        fireEvent.change(passwordInput, { target: { value: 'newpassword' } });

        expect(passwordInput).toHaveValue('newpassword');
    });

    // ТЕСТ 15: Изменение подтверждения пароля
    it('позволяет изменить подтверждение пароля', () => {
        renderEditForm();

        const confirmInput = screen.getByLabelText('Подтверждение пароля');
        fireEvent.change(confirmInput, { target: { value: 'newpassword' } });

        expect(confirmInput).toHaveValue('newpassword');
    });

    // ТЕСТ 16: Кнопка отмены закрывает форму
    it('кнопка "Отменить" вызывает closeModalPage', () => {
        renderEditForm();

        fireEvent.click(screen.getByText('Отменить'));
        expect(mockProps.closeModalPage).toHaveBeenCalled();
    });

    // ТЕСТ 17: Кнопка закрытия вызывает closeModalPage
    it('кнопка закрытия (×) вызывает closeModalPage', () => {
        renderEditForm();

        fireEvent.click(screen.getByText('×'));
        expect(mockProps.closeModalPage).toHaveBeenCalled();
    });
});