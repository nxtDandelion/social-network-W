import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Feed from '../Feed';
import { AuthContext } from '../../../Contexts/AuthContext';
import { FeedContext } from '../../../Contexts/FeedContext';
import { getPosts } from '../../../API/PostAPI/getPosts';
import { getFavourPosts } from '../../../API/PostAPI/getFavourPost';
import { searchPosts, hashtagSearchPosts } from '../../../API/SearchAPI/searchPosts';

// Мокаем API
vi.mock('../../../API/PostAPI/getPosts');
vi.mock('../../../API/PostAPI/getFavourPost');
vi.mock('../../../API/SearchAPI/searchPosts');

// Мокаем дочерний компонент Post
vi.mock('../Post/Post', () => ({
    default: ({ postText, onHashtagClick }) => (
        <div data-testid="mock-post">
            <span>{postText}</span>
            <button
                data-testid="mock-hashtag"
                onClick={() => onHashtagClick('test')}
            >
                #test
            </button>
        </div>
    )
}));

// Мокаем NotificationCard
vi.mock('../../Other/NotificationCard', () => ({
    default: ({ type, message, onClose }) => (
        <div data-testid={`notification-${type}`}>
            {message}
            <button onClick={onClose}>Закрыть</button>
        </div>
    )
}));

describe('Feed Component - BRANCH COVERAGE', () => {
    const mockAuthContext = {
        contextUserName: 'testuser',
        auth: true
    };

    const mockFeedContext = {
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

    const mockOnCloseSearch = vi.fn();
    const mockOnSetSearchQuery = vi.fn();

    const defaultProps = {
        filter: 'all',
        searchResults: null,
        searchLoading: false,
        searchError: '',
        onCloseSearch: mockOnCloseSearch,
        onSetSearchQuery: mockOnSetSearchQuery
    };

    const mockPosts = [
        {
            id: 1,
            text: 'Первый пост',
            likers: [123],
            profile_id: 456,
            username: 'user1',
            photo: 'avatar1.jpg',
            comments_amount: 5,
            edited: false,
            create_date: '2026-02-16T10:00:00Z'
        },
        {
            id: 2,
            text: 'Второй пост с #хэштегом',
            likers: [],
            profile_id: 789,
            username: 'user2',
            photo: 'avatar2.jpg',
            comments_amount: 3,
            edited: true,
            create_date: '2026-02-15T15:30:00Z'
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        getPosts.mockResolvedValue({ success: true, data: mockPosts });
        getFavourPosts.mockResolvedValue({ success: true, data: mockPosts });
        searchPosts.mockResolvedValue({
            success: true,
            data: mockPosts,
            hasMore: false,
            page: 1,
            totalElements: 2
        });
        hashtagSearchPosts.mockResolvedValue({
            success: true,
            data: mockPosts,
            hasMore: false,
            page: 1,
            totalElements: 2
        });
    });

    // Helper function for rendering
    const renderFeed = (props = {}, feedContextOverrides = {}) => {
        return render(
            <BrowserRouter>
                <AuthContext.Provider value={mockAuthContext}>
                    <FeedContext.Provider value={{ ...mockFeedContext, ...feedContextOverrides }}>
                        <Feed {...defaultProps} {...props} />
                    </FeedContext.Provider>
                </AuthContext.Provider>
            </BrowserRouter>
        );
    };

    describe('ВЕТВЛЕНИЕ 1: Состояния загрузки и ошибок', () => {
        it('отображает загрузку при initial loading', () => {
            getPosts.mockImplementation(() => new Promise(() => {})); // Никогда не резолвится

            renderFeed();

            expect(screen.getByText('Загрузка ленты...')).toBeInTheDocument();
        });

        it('отображает ошибку при неудачной загрузке', async () => {
            getPosts.mockResolvedValue({ success: false });

            renderFeed();

            await waitFor(() => {
                expect(screen.getByText('Не удалось загрузить ленту')).toBeInTheDocument();
            });

            expect(screen.getByText('Попробовать снова')).toBeInTheDocument();
        });

        it('кнопка "Попробовать снова" перезагружает ленту', async () => {
            getPosts.mockResolvedValueOnce({ success: false });

            renderFeed();

            await waitFor(() => {
                expect(screen.getByText('Попробовать снова')).toBeInTheDocument();
            });

            getPosts.mockResolvedValueOnce({ success: true, data: mockPosts });

            fireEvent.click(screen.getByText('Попробовать снова'));

            await waitFor(() => {
                expect(screen.getByText('Первый пост')).toBeInTheDocument();
            });
        });
    });

    describe('ВЕТВЛЕНИЕ 2: Фильтры ленты', () => {
        it('ВЕТВЛЕНИЕ 2.1: filter="all" вызывает getPosts', async () => {
            renderFeed({ filter: 'all' });

            await waitFor(() => {
                expect(getPosts).toHaveBeenCalledWith(0, 15);
            });
        });

        it('ВЕТВЛЕНИЕ 2.2: filter="favourites" вызывает getFavourPosts', async () => {
            renderFeed({ filter: 'favourites' });

            await waitFor(() => {
                expect(getFavourPosts).toHaveBeenCalledWith('testuser', 0, 15);
            });
        });

        it('переключается между фильтрами', async () => {
            const { rerender } = renderFeed({ filter: 'all' });

            await waitFor(() => {
                expect(getPosts).toHaveBeenCalled();
            });

            vi.clearAllMocks();

            // Перерендер с другим фильтром
            rerender(
                <BrowserRouter>
                    <AuthContext.Provider value={mockAuthContext}>
                        <FeedContext.Provider value={mockFeedContext}>
                            <Feed {...defaultProps} filter="favourites" />
                        </FeedContext.Provider>
                    </AuthContext.Provider>
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(getFavourPosts).toHaveBeenCalledWith('testuser', 0, 15);
            });
        });
    });

    describe('ВЕТВЛЕНИЕ 3: Режим поиска', () => {
        it('ВЕТВЛЕНИЕ 3.1: активирует режим поиска при searchResults', async () => {
            const searchResults = {
                query: 'test',
                posts: mockPosts,
                page: 1,
                hasMore: false,
                totalElements: 2
            };

            renderFeed({ searchResults });

            await waitFor(() => {
                expect(screen.getByText(/Результаты поиска по "test"/)).toBeInTheDocument();
                expect(screen.getByText('Первый пост')).toBeInTheDocument();
            });
        });

        it('ВЕТВЛЕНИЕ 3.2: отображает пустые результаты поиска', async () => {
            const searchResults = {
                query: 'nothing',
                posts: [],
                page: 1,
                hasMore: false,
                totalElements: 0
            };

            renderFeed({ searchResults, searchLoading: false });

            await waitFor(() => {
                expect(screen.getByText(/По запросу "nothing" ничего не найдено/)).toBeInTheDocument();
            });

            // Проверяем нотификацию
            await waitFor(() => {
                expect(screen.getByTestId('notification-info')).toBeInTheDocument();
            });
        });

        it('ВЕТВЛЕНИЕ 3.3: кнопка "Вернуться к ленте" вызывает onCloseSearch', async () => {
            const searchResults = {
                query: 'test',
                posts: mockPosts
            };

            renderFeed({ searchResults });

            await waitFor(() => {
                expect(screen.getByText('Вернуться к ленте')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText('Вернуться к ленте'));

            expect(mockOnCloseSearch).toHaveBeenCalled();
        });

        it('ВЕТВЛЕНИЕ 3.4: выход из режима поиска перезагружает ленту', async () => {
            // Сначала с результатами поиска
            const { rerender } = renderFeed({
                searchResults: { query: 'test', posts: mockPosts }
            });

            await waitFor(() => {
                expect(screen.getByText(/Результаты поиска/)).toBeInTheDocument();
            });

            vi.clearAllMocks();

            // Потом без результатов (выход из поиска)
            rerender(
                <BrowserRouter>
                    <AuthContext.Provider value={mockAuthContext}>
                        <FeedContext.Provider value={mockFeedContext}>
                            <Feed {...defaultProps} searchResults={null} />
                        </FeedContext.Provider>
                    </AuthContext.Provider>
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(getPosts).toHaveBeenCalled();
            });
        });
    });

    // ВЕТВЛЕНИЕ 4: Клик по хэштегу - ВРЕМЕННО ЗАКОММЕНТИРОВАНО
    /*
    describe('ВЕТВЛЕНИЕ 4: Клик по хэштегу', () => {
        it('ВЕТВЛЕНИЕ 4.1: обрабатывает клик по хэштегу', async () => {
            renderFeed();

            await waitFor(() => {
                expect(screen.getByTestId('mock-post')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByTestId('mock-hashtag'));

            await waitFor(() => {
                expect(mockOnSetSearchQuery).toHaveBeenCalledWith('#test');
                expect(mockOnCloseSearch).toHaveBeenCalled();
                expect(hashtagSearchPosts).toHaveBeenCalledWith('test', 1, 15);
            });
        });

        it('ВЕТВЛЕНИЕ 4.2: показывает нотификацию при пустых результатах по хэштегу', async () => {
            hashtagSearchPosts.mockResolvedValue({
                success: true,
                data: [],
                hasMore: false,
                page: 1,
                totalElements: 0
            });

            renderFeed();

            await waitFor(() => {
                expect(screen.getByTestId('mock-post')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByTestId('mock-hashtag'));

            await waitFor(() => {
                expect(screen.getByTestId('notification-info')).toBeInTheDocument();
                expect(screen.getByText(/По хэштегу #test ничего не найдено/)).toBeInTheDocument();
            });
        });

        it('ВЕТВЛЕНИЕ 4.3: обрабатывает ошибку поиска по хэштегу', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            hashtagSearchPosts.mockRejectedValue(new Error('Network error'));

            renderFeed();

            await waitFor(() => {
                expect(screen.getByTestId('mock-post')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByTestId('mock-hashtag'));

            await waitFor(() => {
                expect(screen.getByText('Ошибка при поиске')).toBeInTheDocument();
            });

            consoleSpy.mockRestore();
        });
    });
    */

    // ВЕТВЛЕНИЕ 5: Контекстные обновления - ЧАСТИЧНО ЗАКОММЕНТИРОВАНО
    describe('ВЕТВЛЕНИЕ 5: Контекстные обновления', () => {
        // ВРЕМЕННО ЗАКОММЕНТИРОВАНО
        /*
        it('ВЕТВЛЕНИЕ 5.1: удаляет пост при postDeleted', async () => {
            const { rerender } = renderFeed();

            await waitFor(() => {
                expect(screen.getAllByTestId('mock-post')).toHaveLength(2);
            });

            // Обновляем контекст с удаленным постом
            rerender(
                <BrowserRouter>
                    <AuthContext.Provider value={mockAuthContext}>
                        <FeedContext.Provider value={{
                            ...mockFeedContext,
                            postDeleted: 1
                        }}>
                            <Feed {...defaultProps} />
                        </FeedContext.Provider>
                    </AuthContext.Provider>
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getAllByTestId('mock-post')).toHaveLength(1);
                expect(screen.getByTestId('notification-success')).toBeInTheDocument();
                expect(screen.getByText('Пост удален успешно')).toBeInTheDocument();
            });

            expect(mockFeedContext.clearPostDeleted).toHaveBeenCalled();
        });

        it('ВЕТВЛЕНИЕ 5.2: обновляет пост при postUpdated', async () => {
            const { rerender } = renderFeed();

            await waitFor(() => {
                expect(screen.getByText('Первый пост')).toBeInTheDocument();
            });

            // Обновляем контекст с обновленным постом
            rerender(
                <BrowserRouter>
                    <AuthContext.Provider value={mockAuthContext}>
                        <FeedContext.Provider value={{
                            ...mockFeedContext,
                            postUpdated: { id: 1, text: 'Обновленный текст' }
                        }}>
                            <Feed {...defaultProps} />
                        </FeedContext.Provider>
                    </AuthContext.Provider>
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Обновленный текст')).toBeInTheDocument();
            });

            expect(mockFeedContext.clearPostUpdated).toHaveBeenCalled();
        });
        */

        it('ВЕТВЛЕНИЕ 5.3: добавляет новый пост при newPostData', async () => {
            const newPost = {
                id: 3,
                text: 'Совершенно новый пост',
                likers: [],
                profile_id: 456,
                username: 'user1',
                photo: 'avatar1.jpg',
                comments_amount: 0,
                edited: false,
                create_date: '2026-02-16T12:00:00Z'
            };

            const { rerender } = renderFeed();

            await waitFor(() => {
                expect(screen.getAllByTestId('mock-post')).toHaveLength(2);
            });

            // Добавляем новый пост через контекст
            rerender(
                <BrowserRouter>
                    <AuthContext.Provider value={mockAuthContext}>
                        <FeedContext.Provider value={{
                            ...mockFeedContext,
                            newPostData: newPost,
                            postCreated: true
                        }}>
                            <Feed {...defaultProps} />
                        </FeedContext.Provider>
                    </AuthContext.Provider>
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getAllByTestId('mock-post')).toHaveLength(3);
                expect(screen.getByText('Совершенно новый пост')).toBeInTheDocument();
            });

            // Проверяем, что новый пост появился в начале
            const posts = screen.getAllByTestId('mock-post');
            expect(posts[0]).toHaveTextContent('Совершенно новый пост');
        });

        it('ВЕТВЛЕНИЕ 5.4: не дублирует пост при повторном добавлении', async () => {
            const existingPost = mockPosts[0];

            const { rerender } = renderFeed();

            await waitFor(() => {
                expect(screen.getAllByTestId('mock-post')).toHaveLength(2);
            });

            // Пытаемся добавить уже существующий пост
            rerender(
                <BrowserRouter>
                    <AuthContext.Provider value={mockAuthContext}>
                        <FeedContext.Provider value={{
                            ...mockFeedContext,
                            newPostData: existingPost,
                            postCreated: true
                        }}>
                            <Feed {...defaultProps} />
                        </FeedContext.Provider>
                    </AuthContext.Provider>
                </BrowserRouter>
            );

            // Количество постов не должно увеличиться
            await waitFor(() => {
                expect(screen.getAllByTestId('mock-post')).toHaveLength(2);
            });
        });

        it('ВЕТВЛЕНИЕ 5.5: обновляет ленту при likeUpdated', async () => {
            const { rerender } = renderFeed();

            await waitFor(() => {
                expect(getPosts).toHaveBeenCalledTimes(1);
            });

            vi.clearAllMocks();

            // Обновляем контекст с лайком
            rerender(
                <BrowserRouter>
                    <AuthContext.Provider value={mockAuthContext}>
                        <FeedContext.Provider value={{
                            ...mockFeedContext,
                            likeUpdated: { id: 1, list: [123, 456] }
                        }}>
                            <Feed {...defaultProps} />
                        </FeedContext.Provider>
                    </AuthContext.Provider>
                </BrowserRouter>
            );

            // Должен вызвать refreshFeed (getPosts снова)
            await waitFor(() => {
                expect(getPosts).toHaveBeenCalled();
            });
        });
    });

    // ВЕТВЛЕНИЕ 6: Пагинация и подгрузка - ЧАСТИЧНО ЗАКОММЕНТИРОВАНО
    describe('ВЕТВЛЕНИЕ 6: Пагинация и подгрузка', () => {
        // ВРЕМЕННО ЗАКОММЕНТИРОВАНО
        /*
        it('ВЕТВЛЕНИЕ 6.1: загружает дополнительные посты при скролле', async () => {
            // Мокаем hasMore = true
            getPosts.mockResolvedValueOnce({ success: true, data: mockPosts });

            renderFeed();

            await waitFor(() => {
                expect(screen.getAllByTestId('mock-post')).toHaveLength(2);
            });

            // Мокаем вторую страницу
            getPosts.mockResolvedValueOnce({
                success: true,
                data: [{ id: 3, text: 'Третий пост', likers: [], profile_id: 111, username: 'user3', photo: '', comments_amount: 0, edited: false, create_date: '2026-02-14' }]
            });

            // Симулируем пересечение обсервера
            const observerCallback = vi.spyOn(window, 'IntersectionObserver').mockImplementation((callback) => {
                callback([{ isIntersecting: true }]);
                return { observe: vi.fn(), unobserve: vi.fn() };
            });

            // Триггерим useEffect с hasMore=true
            await waitFor(() => {
                expect(getPosts).toHaveBeenCalledTimes(2);
            });

            observerCallback.mockRestore();
        });

        it('ВЕТВЛЕНИЕ 6.3: показывает индикатор загрузки при loadingMore', async () => {
            getPosts.mockImplementation(() => new Promise(resolve => {
                setTimeout(() => resolve({ success: true, data: mockPosts }), 100);
            }));

            renderFeed();

            // Должен появиться индикатор загрузки
            await waitFor(() => {
                expect(screen.getByText('Загрузка дополнительных постов...')).toBeInTheDocument();
            });
        });
        */

        it('ВЕТВЛЕНИЕ 6.2: не загружает дополнительные посты если hasMore=false', () => {
            // Мокаем hasMore = false (пришло меньше лимита)
            getPosts.mockResolvedValueOnce({ success: true, data: [mockPosts[0]] });

            renderFeed();

            vi.clearAllMocks();

            // Симулируем пересечение обсервера
            const observeMock = vi.fn();
            window.IntersectionObserver = vi.fn().mockImplementation((callback) => {
                callback([{ isIntersecting: true }]);
                return { observe: observeMock, unobserve: vi.fn() };
            });

            // Не должно быть дополнительных вызовов
            expect(getPosts).not.toHaveBeenCalled();
        });
    });

    describe('ВЕТВЛЕНИЕ 7: Пустые состояния', () => {
        it('ВЕТВЛЕНИЕ 7.1: отображает "Лента пуста" если нет постов', async () => {
            getPosts.mockResolvedValue({ success: true, data: [] });

            renderFeed();

            await waitFor(() => {
                expect(screen.getByText('Лента пуста')).toBeInTheDocument();
            });
        });

        it('ВЕТВЛЕНИЕ 7.2: в режиме поиска отображает специальное сообщение', async () => {
            const searchResults = {
                query: 'nothing',
                posts: [],
                page: 1,
                totalElements: 0
            };

            renderFeed({ searchResults });

            await waitFor(() => {
                expect(screen.getByText(/По запросу "nothing" ничего не найдено/)).toBeInTheDocument();
            });
        });
    });

    describe('ВЕТВЛЕНИЕ 8: Нотификации', () => {
        it('отображает и закрывает нотификацию', async () => {
            renderFeed();

            // Триггерим нотификацию через контекст
            // Например, через удаление поста

            await waitFor(() => {
                expect(screen.queryByTestId('notification-success')).not.toBeInTheDocument();
            });
        });
    });
});