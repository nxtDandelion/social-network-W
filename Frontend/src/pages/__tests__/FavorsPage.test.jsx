import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import FavorsPage from '../FavorsPage';
import { AuthContext } from '../../Contexts/AuthContext';
import { FeedContext } from '../../Contexts/FeedContext';

// НЕ мокаем дочерние компоненты - используем реальные

describe('FavorsPage - простые тесты', () => {
    const mockSetShowLoginMes = vi.fn();

    const mockAuthContext = {
        showLoginMes: false,
        setShowLoginMes: mockSetShowLoginMes,
        auth: true
    };

    const mockFeedContext = {
        refreshFeed: vi.fn(),
        postDeleted: null,
        postCreated: null,
        postUpdated: null,
        newPostData: null,
        likeUpdated: null,
        clearPostDeleted: vi.fn(),
        clearPostUpdated: vi.fn(),
        clearPostCreated: vi.fn(),
        clearNewPostData: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderFavorsPage = (authOverrides = {}) => {
        return render(
            <BrowserRouter>
                <AuthContext.Provider value={{ ...mockAuthContext, ...authOverrides }}>
                    <FeedContext.Provider value={mockFeedContext}>
                        <FavorsPage />
                    </FeedContext.Provider>
                </AuthContext.Provider>
            </BrowserRouter>
        );
    };

    // ТЕСТ 1: Наличие логотипа
    it('содержит логотип', () => {
        renderFavorsPage();

        const logo = document.querySelector('svg');
        expect(logo).toBeInTheDocument();
    });

    // ТЕСТ 2: Наличие поля поиска
    it('содержит поле поиска', () => {
        renderFavorsPage();

        const searchInput = screen.getByPlaceholderText('Поиск...');
        expect(searchInput).toBeInTheDocument();
    });

    // ТЕСТ 3: Наличие кнопки создания поста при auth=true
    it('содержит кнопку создания поста при auth=true', () => {
        renderFavorsPage({ auth: true });

        const createButton = screen.getByText('Создать пост');
        expect(createButton).toBeInTheDocument();
    });

    // ТЕСТ 4: Отсутствие кнопки создания поста при auth=false
    it('не содержит кнопку создания поста при auth=false', () => {
        renderFavorsPage({ auth: false });

        const createButton = screen.queryByText('Создать пост');
        expect(createButton).not.toBeInTheDocument();
    });

    // ТЕСТ 5: Модалка авторизации при showLoginMes=true
    it('показывает модалку авторизации при showLoginMes=true', () => {
        renderFavorsPage({ showLoginMes: true });

        const modalText = screen.getByText(/Для использования запрошенных функций необходима авторизация/);
        expect(modalText).toBeInTheDocument();

        const loginLink = screen.getByText('войти');
        expect(loginLink).toBeInTheDocument();
    });

    // ТЕСТ 6: Закрытие модалки
    it('закрывает модалку при клике на крестик', () => {
        renderFavorsPage({ showLoginMes: true });

        const closeButton = screen.getByLabelText('Закрыть');
        fireEvent.click(closeButton);

        expect(mockSetShowLoginMes).toHaveBeenCalledWith(false);
    });

    // ТЕСТ 7: Ввод текста в поиск
    it('позволяет вводить текст в поле поиска', () => {
        renderFavorsPage();

        const searchInput = screen.getByPlaceholderText('Поиск...');
        fireEvent.change(searchInput, { target: { value: 'тестовый запрос' } });

        expect(searchInput).toHaveValue('тестовый запрос');
    });
});