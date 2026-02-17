import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../../../Contexts/AuthContext';
import { FeedContext } from '../../../Contexts/FeedContext';
import CreatePostBtn from '../CreatePostBtn';
import { newPost } from '../../../API/PostAPI/newPost';

// Мокаем API
vi.mock('../../../API/PostAPI/newPost');
vi.mock('../../../API/PostAPI/deletePost');

// Мокаем EditPostModal
vi.mock('../Post/PostComponents/EditPostModal', () => ({
    default: function MockEditPostModal({ sendForm, closeModal }) {
        return (
            <div data-testid="edit-post-modal">
                <button
                    data-testid="mock-send-post"
                    onClick={() => sendForm('Тестовый пост')}
                >
                    Отправить
                </button>
                <button
                    data-testid="mock-close"
                    onClick={closeModal}
                >
                    Закрыть
                </button>
            </div>
        )
    }
}));

// Мокаем NotificationCard
vi.mock('../../Other/NotificationCard', () => ({
    default: function MockNotificationCard({ message, type, onClose }) {
        return (
            <div data-testid="notification-card" data-type={type}>
                <span>{message}</span>
                <button onClick={onClose}>Закрыть</button>
            </div>
        )
    }
}));

// Мокаем хуки роутера
const mockNavigate = vi.fn();
const mockUseLocation = vi.fn(() => ({ pathname: '/home' }));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useLocation: () => mockUseLocation()
    };
});

describe('CreatePostBtn', () => {
    const mockAuthContext = {
        auth: true,
        setShowLoginMes: vi.fn(),
        refreshToken: vi.fn(),
        contextUserName: 'testuser'
    };
    const mockFeedContext = {
        refreshFeed: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Полностью очищаем localStorage
        localStorage.clear();

        // Восстанавливаем оригинальные методы localStorage
        delete global.localStorage;
        global.localStorage = {
            getItem: vi.fn(),
            setItem: vi.fn(),
            removeItem: vi.fn(),
            clear: vi.fn(),
            key: vi.fn(),
            length: 0
        };

        mockUseLocation.mockReturnValue({ pathname: '/home' });
    });

    const renderComponent = (auth = true, pathname = '/home') => {
        mockUseLocation.mockReturnValue({ pathname });

        return render(
            <BrowserRouter>
                <AuthContext.Provider value={{ ...mockAuthContext, auth }}>
                    <FeedContext.Provider value={mockFeedContext}>
                        <CreatePostBtn />
                    </FeedContext.Provider>
                </AuthContext.Provider>
            </BrowserRouter>
        );
    };

    test('рендерит кнопку создания поста', () => {
        renderComponent();
        expect(screen.getByRole('button', { name: /создать пост/i })).toBeInTheDocument();
    });

    test('открывает модалку для авторизованного пользователя', () => {
        renderComponent(true);
        fireEvent.click(screen.getByRole('button', { name: /создать пост/i }));
        expect(screen.getByTestId('edit-post-modal')).toBeInTheDocument();
        expect(mockAuthContext.setShowLoginMes).not.toHaveBeenCalled();
    });

    test('показывает сообщение о авторизации для неавторизованного', () => {
        renderComponent(false);
        fireEvent.click(screen.getByRole('button', { name: /создать пост/i }));
        expect(mockAuthContext.setShowLoginMes).toHaveBeenCalledWith(true);
        expect(screen.queryByTestId('edit-post-modal')).not.toBeInTheDocument();
    });

    test('успешно создает пост и показывает уведомление', async () => {
        // Устанавливаем мок для getItem, который вернет avatar.jpg
        global.localStorage.getItem.mockImplementation((key) => {
            if (key === 'UserPhoto') return 'avatar.jpg';
            return null;
        });

        newPost.mockResolvedValue({
            success: true,
            data: { id: 1, text: 'Тестовый пост' }
        });

        renderComponent();

        fireEvent.click(screen.getByRole('button', { name: /создать пост/i }));
        fireEvent.click(screen.getByTestId('mock-send-post'));

        await waitFor(() => {
            expect(newPost).toHaveBeenCalledWith('Тестовый пост');
            expect(screen.getByTestId('notification-card')).toBeInTheDocument();
            expect(screen.getByText('Пост добавлен успешно')).toBeInTheDocument();
        });

        expect(mockFeedContext.refreshFeed).toHaveBeenCalledWith({
            id: 1,
            text: 'Тестовый пост',
            username: 'testuser',
            photo: 'avatar.jpg'
        });
    });

    test('обрабатывает ошибку 401 и обновляет токен', async () => {
        global.localStorage.getItem.mockImplementation((key) => {
            if (key === 'UserPhoto') return 'avatar.jpg';
            return null;
        });

        newPost.mockResolvedValue({
            success: false,
            statusCode: 401,
            error: 'Token expired'
        });

        renderComponent();

        fireEvent.click(screen.getByRole('button', { name: /создать пост/i }));
        fireEvent.click(screen.getByTestId('mock-send-post'));

        await waitFor(() => {
            expect(mockAuthContext.refreshToken).toHaveBeenCalled();
        });
    });

    test('редиректит на /home при создании поста не с главной', async () => {
        global.localStorage.getItem.mockImplementation((key) => {
            if (key === 'UserPhoto') return 'avatar.jpg';
            return null;
        });

        newPost.mockResolvedValue({
            success: true,
            data: { id: 1, text: 'Тестовый пост' }
        });

        renderComponent(true, '/profile');

        fireEvent.click(screen.getByRole('button', { name: /создать пост/i }));
        fireEvent.click(screen.getByTestId('mock-send-post'));

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/home');
        });
    });
});