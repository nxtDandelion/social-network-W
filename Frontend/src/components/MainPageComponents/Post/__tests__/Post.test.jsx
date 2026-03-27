import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../../../../Contexts/AuthContext';
import { FeedContext } from '../../../../Contexts/FeedContext';
import Post from '../Post';
import { responseCommentsList } from '../../../../API/PostAPI/getCommentsList';
import { postLike } from '../../../../API/PostAPI/postLike';
import { deleteLike } from '../../../../API/PostAPI/deleteLike';

// Мокаем API
vi.mock('../../../../API/PostAPI/getCommentsList');
vi.mock('../../../../API/PostAPI/postLike');
vi.mock('../../../../API/PostAPI/deleteLike');

// Мокаем дочерние компоненты
vi.mock('../PostComponents/ProfileInfo', () => ({
    default: function MockProfileInfo({ userName, userTag, userAvatar, userId, component }) {
        return (
            <div data-testid="profile-info" data-userid={userId} data-component={component}>
                <span>{userName}</span>
                <span>{userTag}</span>
                <img src={userAvatar} alt={`Аватар ${userName}`} />
            </div>
        );
    }
}));

vi.mock('../PostComponents/OtherFuncMenu', () => ({
    default: function MockOtherFuncMenu({ userId, postId, initText, edited, userAvatar }) {
        return (
            <div data-testid="other-func-menu" data-postid={postId}>
                <button data-testid="mock-menu-button">Меню</button>
                {edited && <span data-testid="edited-indicator">Edited</span>}
            </div>
        );
    }
}));

vi.mock('../PostComponents/CommentsComponents/CommentModalPage', () => ({
    default: function MockCommentModalPage({ closePage, postId, comments }) {
        return (
            <div data-testid="comment-modal" data-postid={postId}>
                <button
                    data-testid="mock-close-modal"
                    onClick={() => closePage(comments)}
                >
                    Закрыть
                </button>
            </div>
        );
    }
}));

vi.mock('../../../TextWithTag', () => ({
    default: function MockTextWithTags({ text, onHashtagSearch }) {
        return (
            <div data-testid="text-with-tags">
                <span>{text}</span>
                {text.includes('#') && (
                    <button
                        data-testid="mock-hashtag"
                        onClick={() => onHashtagSearch('test')}
                    >
                        #test
                    </button>
                )}
            </div>
        );
    }
}));

// Мокаем иконки
vi.mock('../../../Icons/LikeIcon', () => ({
    LikeIcon: ({ color }) => <span data-testid="like-icon" data-color={color}>❤️</span>
}));

vi.mock('../../../Icons/CommentsIcon', () => ({
    CommentIcon: () => <span data-testid="comment-icon">💬</span>
}));

describe('Post Component - стабильные тесты', () => {
    const mockAuthContext = {
        auth: true,
        setShowLoginMes: vi.fn(),
        refreshToken: vi.fn(),
        contextUserId: 123
    };

    const mockFeedContext = {
        likeUpdated: { id: null, list: [] }
    };

    const mockOnHashtagClick = vi.fn();
    const mockOnModalFunc = vi.fn();

    const defaultProps = {
        postId: 1,
        postDate: '14.02.2026',
        likers: [456, 789],
        postText: 'Тестовый пост с #хэштегом',
        userName: 'testuser',
        userTag: '@testuser',
        userAvatar: 'avatar.jpg',
        userId: 456,
        edited: false,
        initCommentAmount: 5,
        onHashtagClick: mockOnHashtagClick,
        isModal: false,
        onModalFunc: mockOnModalFunc
    };

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        localStorage.setItem('userId', '123');
        localStorage.setItem('myUsername', 'testuser');
    });

    const renderPost = (props = {}, authOverrides = {}, feedOverrides = {}) => {
        return render(
            <BrowserRouter>
                <AuthContext.Provider value={{ ...mockAuthContext, ...authOverrides }}>
                    <FeedContext.Provider value={{ ...mockFeedContext, ...feedOverrides }}>
                        <Post {...defaultProps} {...props} />
                    </FeedContext.Provider>
                </AuthContext.Provider>
            </BrowserRouter>
        );
    };

    // ТЕСТ 1: Рендеринг
    test('рендерит пост с пропсами', () => {
        renderPost();

        expect(screen.getByText(/Тестовый пост/i)).toBeInTheDocument();
        expect(screen.getByTestId('profile-info')).toBeInTheDocument();
        expect(screen.getByTestId('other-func-menu')).toBeInTheDocument();
        expect(screen.getByTestId('text-with-tags')).toBeInTheDocument();
    });

    // ТЕСТ 2: Метка редактирования
    test('показывает метку "Отредактирован" при edited=true', () => {
        renderPost({ edited: true });

        expect(screen.getByText('Отредактирован')).toBeInTheDocument();
    });

    // ТЕСТ 3: Количество лайков
    test('показывает правильное количество лайков', () => {
        renderPost({ likers: [456, 789] });

        expect(screen.getByText('2')).toBeInTheDocument();
    });

    // ТЕСТ 4: Обработка не-массива likers
    test('обрабатывает likers как не-массив', () => {
        renderPost({ likers: null });

        expect(screen.getByText('0')).toBeInTheDocument();
    });

    // ТЕСТ 5: Модалка авторизации
    test('показывает модалку авторизации при клике без auth', async () => {
        renderPost({}, { auth: false });

        const likeButton = screen.getByRole('button', { name: /❤️ 2/i });
        fireEvent.click(likeButton);

        expect(mockAuthContext.setShowLoginMes).toHaveBeenCalledWith(true);
    });

    // ТЕСТ 6: Успешный лайк
    test('успешно ставит лайк', async () => {
        postLike.mockResolvedValue({ success: true });

        renderPost({ likers: [456] }, { auth: true, contextUserId: 123 });

        const likeButton = screen.getByRole('button', { name: /❤️ 1/i });
        fireEvent.click(likeButton);

        await waitFor(() => {
            expect(postLike).toHaveBeenCalledWith(1);
            expect(screen.getByTestId('like-icon')).toHaveAttribute('data-color', 'red');
            expect(screen.getByText('2')).toBeInTheDocument();
        });
    });

    // ТЕСТ 7: Успешный дизлайк
    test('успешно убирает лайк', async () => {
        deleteLike.mockResolvedValue({ success: true });

        renderPost({ likers: [123, 456] }, { auth: true, contextUserId: 123 });

        const likeButton = screen.getByRole('button', { name: /❤️ 2/i });
        fireEvent.click(likeButton);

        await waitFor(() => {
            expect(deleteLike).toHaveBeenCalledWith(1);
            expect(screen.getByTestId('like-icon')).toHaveAttribute('data-color', 'white');
            expect(screen.getByText('1')).toBeInTheDocument();
        });
    });

    // ТЕСТ 8: Ошибка 401
    test('обрабатывает ошибку 401 при лайке', async () => {
        postLike.mockResolvedValue({ success: false, statusCode: 401 });

        renderPost({ likers: [456] }, { auth: true, contextUserId: 123 });

        const likeButton = screen.getByRole('button', { name: /❤️ 1/i });
        fireEvent.click(likeButton);

        await waitFor(() => {
            expect(mockAuthContext.refreshToken).toHaveBeenCalled();
        });
    });

    // ТЕСТ 9: Другие ошибки
    test('обрабатывает другие ошибки при лайке', async () => {
        postLike.mockResolvedValue({ success: false });

        renderPost({ likers: [456] }, { auth: true, contextUserId: 123 });

        const likeButton = screen.getByRole('button', { name: /❤️ 1/i });

        await act(async () => {
            fireEvent.click(likeButton);
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(screen.getByTestId('like-icon')).toHaveAttribute('data-color', 'white');
        expect(screen.getByText('1')).toBeInTheDocument();
    });

    // ТЕСТ 10: Исключение
    test('обрабатывает исключение при лайке', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        postLike.mockRejectedValue(new Error('Network error'));

        renderPost({ likers: [456] }, { auth: true, contextUserId: 123 });

        const likeButton = screen.getByRole('button', { name: /❤️ 1/i });

        await act(async () => {
            fireEvent.click(likeButton);
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(consoleErrorSpy).toHaveBeenCalled();
        consoleErrorSpy.mockRestore();
    });

    // ТЕСТ 11: Открытие комментариев
    test('открывает модалку комментариев', async () => {
        responseCommentsList.mockResolvedValue({
            success: true,
            data: {
                comment1: { id: 1, text: 'Комментарий 1' },
                comment2: { id: 2, text: 'Комментарий 2' }
            }
        });

        renderPost();

        const commentButton = screen.getByRole('button', { name: /💬 5/i });
        fireEvent.click(commentButton);

        await waitFor(() => {
            expect(responseCommentsList).toHaveBeenCalledWith(1);
            expect(screen.getByTestId('comment-modal')).toBeInTheDocument();
        });
    });

    // ТЕСТ 12: Ошибка комментариев
    test('обрабатывает ошибку при загрузке комментариев', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        responseCommentsList.mockResolvedValue({
            success: false,
            error: 'Ошибка загрузки'
        });

        renderPost();

        const commentButton = screen.getByRole('button', { name: /💬 5/i });
        fireEvent.click(commentButton);

        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        expect(screen.queryByTestId('comment-modal')).not.toBeInTheDocument();
        consoleErrorSpy.mockRestore();
    });

    // ТЕСТ 13: Закрытие комментариев
    test('закрывает модалку и обновляет количество комментариев', async () => {
        responseCommentsList.mockResolvedValue({
            success: true,
            data: {
                comment1: { id: 1, text: 'Комментарий 1' },
                comment2: { id: 2, text: 'Комментарий 2' }
            }
        });

        renderPost();

        const commentButton = screen.getByRole('button', { name: /💬 5/i });
        fireEvent.click(commentButton);

        await waitFor(() => {
            expect(screen.getByTestId('comment-modal')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('mock-close-modal'));

        await waitFor(() => {
            expect(screen.queryByTestId('comment-modal')).not.toBeInTheDocument();
            expect(screen.getByTestId('comment-icon').nextSibling).toHaveTextContent('2');
        });
    });

    // ТЕСТ 14: Хэштеги
    test('вызывает onHashtagClick при клике на хэштег', () => {
        renderPost();

        fireEvent.click(screen.getByTestId('mock-hashtag'));

        expect(mockOnHashtagClick).toHaveBeenCalledWith('test');
    });

    // ТЕСТ 15: Нет хэштега
    test('не показывает хэштег если в тексте нет #', () => {
        renderPost({ postText: 'Текст без хэштега' });

        expect(screen.queryByTestId('mock-hashtag')).not.toBeInTheDocument();
    });

    // ТЕСТ 16: initCommentAmount
    test('использует initCommentAmount для отображения', () => {
        renderPost({ initCommentAmount: 10 });

        const commentIcon = screen.getByTestId('comment-icon');
        expect(commentIcon.nextSibling).toHaveTextContent('10');
    });

    // ТЕСТ 17: initCommentAmount по умолчанию
    test('использует 0 если initCommentAmount не передан', () => {
        renderPost({ initCommentAmount: undefined });

        const commentIcon = screen.getByTestId('comment-icon');
        expect(commentIcon.nextSibling).toHaveTextContent('0');
    });

    // ТЕСТ 18: likeUpdated для другого поста
    test('не обновляет лайк при likeUpdated для другого поста', async () => {
        const { rerender } = renderPost(
            { postId: 1, likers: [456] },
            { contextUserId: 123 }
        );

        await waitFor(() => {
            expect(screen.getByTestId('like-icon')).toHaveAttribute('data-color', 'white');
        });

        await act(async () => {
            rerender(
                <BrowserRouter>
                    <AuthContext.Provider value={{ ...mockAuthContext, contextUserId: 123 }}>
                        <FeedContext.Provider value={{
                            likeUpdated: {
                                id: 2,
                                list: [123, 456]
                            }
                        }}>
                            <Post {...defaultProps} postId={1} likers={[456]} />
                        </FeedContext.Provider>
                    </AuthContext.Provider>
                </BrowserRouter>
            );
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        await waitFor(() => {
            expect(screen.getByTestId('like-icon')).toHaveAttribute('data-color', 'white');
        });
    });
});