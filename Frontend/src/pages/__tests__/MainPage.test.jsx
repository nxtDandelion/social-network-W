import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MainPage from '../MainPage';
import { AuthContext } from '../../Contexts/AuthContext';
import { FeedContext } from '../../Contexts/FeedContext';

// Мокаем только тяжелые зависимости
vi.mock('../../API/SearchAPI/searchPosts', () => ({
    hashtagSearchPosts: vi.fn()
}));

// НЕ мокаем дочерние компоненты - используем реальные

describe('MainPage - простые тесты', () => {
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

    const renderMainPage = (authOverrides = {}) => {
        return render(
            <BrowserRouter>
                <AuthContext.Provider value={{ ...mockAuthContext, ...authOverrides }}>
                    <FeedContext.Provider value={mockFeedContext}>
                        <MainPage />
                    </FeedContext.Provider>
                </AuthContext.Provider>
            </BrowserRouter>
        );
    };

    // ТЕСТ 1: Проверка наличия логотипа
    it('содержит логотип', () => {
        renderMainPage();

        // Ищем по структуре SVG или по alt тексту
        const logo = document.querySelector('svg');
        expect(logo).toBeInTheDocument();
    });

    // ТЕСТ 2: Проверка наличия поля поиска
    it('содержит поле поиска', () => {
        renderMainPage();

        const searchInput = screen.getByPlaceholderText('Поиск...');
        expect(searchInput).toBeInTheDocument();
    });

    // ТЕСТ 3: Проверка наличия кнопки создания поста
    it('содержит кнопку создания поста', () => {
        renderMainPage({ auth: true });

        const createButton = screen.getByText('Создать пост');
        expect(createButton).toBeInTheDocument();
    });

    // ТЕСТ 4: Проверка что кнопка создания поста не показывается при auth=false
    it('не показывает кнопку создания поста при auth=false', () => {
        renderMainPage({ auth: false });

        const createButton = screen.queryByText('Создать пост');
        expect(createButton).not.toBeInTheDocument();
    });

    // ТЕСТ 5: Проверка модалки авторизации
    it('показывает модалку авторизации при showLoginMes=true', () => {
        renderMainPage({ showLoginMes: true });

        const modalText = screen.getByText(/Для использования запрошенных функций необходима авторизация/);
        expect(modalText).toBeInTheDocument();

        const loginLink = screen.getByText('войти');
        expect(loginLink).toBeInTheDocument();
    });

    // ТЕСТ 6: Проверка закрытия модалки
    it('закрывает модалку при клике на крестик', () => {
        renderMainPage({ showLoginMes: true });

        const closeButton = screen.getByLabelText('Закрыть');
        fireEvent.click(closeButton);

        expect(mockSetShowLoginMes).toHaveBeenCalledWith(false);
    });

    // ТЕСТ 7: Проверка ввода текста в поиск
    it('позволяет вводить текст в поле поиска', () => {
        renderMainPage();

        const searchInput = screen.getByPlaceholderText('Поиск...');
        fireEvent.change(searchInput, { target: { value: 'тестовый запрос' } });

        expect(searchInput).toHaveValue('тестовый запрос');
    });
});