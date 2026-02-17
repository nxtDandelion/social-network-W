import { render, screen, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../../Contexts/AuthContext';
import { FeedContext } from '../../Contexts/FeedContext';
import FavorsPageFeed from './FavorsPageFeed';
import { getPosts } from '../../API/PostAPI/getPosts';
import { getFavourPost } from '../../API/PostAPI/getFavourPost';

// Мокаем API
vi.mock('../../API/PostAPI/getPosts', () => ({
    getPosts: vi.fn()
}));

vi.mock('../../API/PostAPI/getFavourPost', () => ({
    getFavourPost: vi.fn()
}));

// Мокаем компоненты
vi.mock('../MainPageComponents/Post/Post', () => ({
    default: function MockPost({ postText, userName }) {
        return (
            <div data-testid="mock-post">
                <span>{userName}: {postText}</span>
            </div>
        );
    }
}));

vi.mock('../MainPageComponents/Other/NotificationCard', () => ({
    default: function MockNotificationCard({ message }) {
        return <div data-testid="mock-notification">{message}</div>;
    }
}));

describe('FavorsPageFeed', () => {
    const mockAuthContext = {
        auth: true,
        userName: 'testuser',
        setShowLoginMes: vi.fn()
    };

    const mockFeedContext = {
        postDeleted: null,
        postCreated: false,
        postUpdated: null,
        newPostData: null,
        clearPostDeleted: vi.fn(),
        clearPostUpdated: vi.fn(),
        clearPostCreated: vi.fn(),
        clearNewPostData: vi.fn()
    };

    const mockPosts = [
        {
            id: 1,
            text: 'Пост 1',
            username: 'user1',
            profile_id: 1,
            create_date: '2026-02-16T10:00:00Z'
        },
        {
            id: 2,
            text: 'Пост 2',
            username: 'user2',
            profile_id: 2,
            create_date: '2026-02-16T11:00:00Z'
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        getPosts.mockReset();
        getFavourPost.mockReset();
    });

    const renderComponent = (authOverrides = {}, feedOverrides = {}) => {
        return render(
            <BrowserRouter>
                <AuthContext.Provider value={{ ...mockAuthContext, ...authOverrides }}>
                    <FeedContext.Provider value={{ ...mockFeedContext, ...feedOverrides }}>
                        <FavorsPageFeed />
                    </FeedContext.Provider>
                </AuthContext.Provider>
            </BrowserRouter>
        );
    };

    test('рендерит загрузку при старте', () => {
        renderComponent();
        expect(screen.getByText('Загрузка ленты...')).toBeInTheDocument();
    });

    test('загружает и отображает посты', async () => {
        getPosts.mockResolvedValue({
            success: true,
            data: mockPosts
        });

        renderComponent();

        const posts = await screen.findAllByTestId('mock-post');
        expect(posts).toHaveLength(2);
        expect(screen.getByText('user1: Пост 1')).toBeInTheDocument();
        expect(screen.getByText('user2: Пост 2')).toBeInTheDocument();
    });

    test('отображает ошибку при неудачной загрузке', async () => {
        getPosts.mockResolvedValue({
            success: false,
            error: 'Ошибка загрузки'
        });

        renderComponent();

        // Для unsuccessful response
        const errorElement = await screen.findByText('Не удалось загрузить ленту');
        expect(errorElement).toBeInTheDocument();

        const retryButton = await screen.findByRole('button', { name: /попробовать снова/i });
        expect(retryButton).toBeInTheDocument();
    });

    test('отображает сообщение о пустой ленте', async () => {
        getPosts.mockResolvedValue({
            success: true,
            data: []
        });

        renderComponent();

        const emptyMessage = await screen.findByText('Лента пуста');
        expect(emptyMessage).toBeInTheDocument();
    });

    test('удаляет пост из ленты при postDeleted', async () => {
        getPosts.mockResolvedValue({
            success: true,
            data: mockPosts
        });

        const { rerender } = renderComponent();

        // Ждем загрузки постов
        await screen.findAllByTestId('mock-post');

        // Обновляем контекст с удаленным постом
        await act(async () => {
            rerender(
                <BrowserRouter>
                    <AuthContext.Provider value={mockAuthContext}>
                        <FeedContext.Provider value={{
                            ...mockFeedContext,
                            postDeleted: 1
                        }}>
                            <FavorsPageFeed />
                        </FeedContext.Provider>
                    </AuthContext.Provider>
                </BrowserRouter>
            );
        });

        // Проверяем, что пост удалился
        const posts = await screen.findAllByTestId('mock-post');
        expect(posts).toHaveLength(1);
        expect(screen.queryByText('user1: Пост 1')).not.toBeInTheDocument();
        expect(screen.getByText('user2: Пост 2')).toBeInTheDocument();
    });

    test('добавляет новый пост в ленту при newPostData', async () => {
        getPosts.mockResolvedValue({
            success: true,
            data: mockPosts
        });

        const newPost = {
            id: 3,
            text: 'Новый пост',
            username: 'testuser',
            profile_id: 123,
            create_date: '2026-02-16T12:00:00Z'
        };

        const { rerender } = renderComponent();

        // Ждем загрузки постов
        await screen.findAllByTestId('mock-post');

        // Обновляем контекст с новым постом
        await act(async () => {
            rerender(
                <BrowserRouter>
                    <AuthContext.Provider value={mockAuthContext}>
                        <FeedContext.Provider value={{
                            ...mockFeedContext,
                            newPostData: newPost,
                            postCreated: true
                        }}>
                            <FavorsPageFeed />
                        </FeedContext.Provider>
                    </AuthContext.Provider>
                </BrowserRouter>
            );
        });

        // Проверяем, что новый пост добавился
        const posts = await screen.findAllByTestId('mock-post');
        expect(posts).toHaveLength(3);
        expect(screen.getByText('testuser: Новый пост')).toBeInTheDocument();
    });

    test('обновляет пост при postUpdated', async () => {
        getPosts.mockResolvedValue({
            success: true,
            data: mockPosts
        });

        const { rerender } = renderComponent();

        // Ждем загрузки постов
        await screen.findAllByTestId('mock-post');

        // Обновляем контекст с измененным постом
        await act(async () => {
            rerender(
                <BrowserRouter>
                    <AuthContext.Provider value={mockAuthContext}>
                        <FeedContext.Provider value={{
                            ...mockFeedContext,
                            postUpdated: {
                                id: 1,
                                text: 'Обновленный текст поста 1'
                            }
                        }}>
                            <FavorsPageFeed />
                        </FeedContext.Provider>
                    </AuthContext.Provider>
                </BrowserRouter>
            );
        });

        // Проверяем, что пост обновился
        expect(screen.getByText('user1: Обновленный текст поста 1')).toBeInTheDocument();
        expect(screen.getByText('user2: Пост 2')).toBeInTheDocument();
    });

    test('обрабатывает ошибку сети', async () => {
        getPosts.mockRejectedValue(new Error('Network Error'));

        renderComponent();

        // Для сетевой ошибки - другой текст!
        const errorElement = await screen.findByText('Ошибка при загрузке');
        expect(errorElement).toBeInTheDocument();

        const retryButton = await screen.findByRole('button', { name: /попробовать снова/i });
        expect(retryButton).toBeInTheDocument();
    });
});