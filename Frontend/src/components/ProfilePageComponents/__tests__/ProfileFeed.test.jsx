import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, useParams } from 'react-router-dom';
import ProfileFeed from '../ProfileFeed';
import { AuthContext } from '../../../Contexts/AuthContext';
import { FeedContext } from '../../../Contexts/FeedContext';
import { getUserProfile } from '../../../API/ProfileAPI/getUserProfile';
import { getFollowers } from '../../../API/ProfileAPI/getFollowers';
import { getFollowing } from '../../../API/ProfileAPI/getFollowing';

// Мокаем зависимости
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useParams: vi.fn()
    };
});

vi.mock('../../../API/ProfileAPI/getUserProfile');
vi.mock('../../../API/ProfileAPI/getFollowers');
vi.mock('../../../API/ProfileAPI/getFollowing');

// Мокаем дочерние компоненты - простые моки без логики
vi.mock('../MainPageComponents/Post/Post', () => ({
    default: () => <div data-testid="mocked-post">Mocked Post</div>
}));

vi.mock('../ProfilePageComponents/ProfileButton', () => ({
    default: ({ text, count }) => (
        <button data-testid={`profile-button-${text}`}>
            {text}: {count}
        </button>
    )
}));

vi.mock('../ProfilePageComponents/SubscribeButton', () => ({
    default: ({ size, status, profileUsername }) => (
        <button data-testid="subscribe-button">
            {status ? 'Подписаться' : 'Отписаться'}
        </button>
    )
}));

vi.mock('../ProfilePageComponents/ShowSubscriptionsButton', () => ({
    default: ({ text, count }) => (
        <button data-testid={`subscriptions-button-${text}`}>
            {text}: {count}
        </button>
    )
}));

vi.mock('../ProfilePageComponents/EditForm', () => ({
    default: ({ closeModalPage }) => (
        <div data-testid="edit-form">
            <button onClick={closeModalPage}>Закрыть</button>
        </div>
    )
}));

vi.mock('../../Other/NotificationCard', () => ({
    default: ({ type, message, onClose }) => (
        <div data-testid={`notification-${type}`}>
            {message}
            <button onClick={onClose}>Закрыть</button>
        </div>
    )
}));

vi.mock('../../../pages/NotFoundPage', () => ({
    default: () => <div data-testid="not-found-page">404 Not Found</div>
}));

describe('ProfileFeed Component - BRANCH COVERAGE', () => {
    const mockAuthContext = {
        refreshToken: vi.fn(),
        guestStatus: true,
        setGuestStatus: vi.fn(),
        setContextUserId: vi.fn(),
        refreshContext: vi.fn()
    };

    const mockFeedContext = {
        postDeleted: null,
        postCreated: null,
        postUpdated: null,
        newPostData: null
    };

    const mockUserData = {
        success: true,
        data: {
            username: 'testuser',
            login: 'testlogin',
            email: 'test@example.com',
            subscribes: { '1': true, '2': true },
            subscribers: { '3': true },
            user_posts: [],
            photo: 'avatar.jpg',
            uuid: 'user-123'
        }
    };

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();

        // Мокаем useParams
        useParams.mockReturnValue({ username: 'testuser' });

        // Мокаем API
        getUserProfile.mockResolvedValue(mockUserData);
        getFollowers.mockResolvedValue({
            success: true,
            data: { followers: { '3': true, '4': true } }
        });
        getFollowing.mockResolvedValue({
            success: true,
            data: { followings: { '1': true, '2': true, '5': true } }
        });
    });

    const renderProfileFeed = (props = {}, authOverrides = {}, feedOverrides = {}) => {
        return render(
            <BrowserRouter>
                <AuthContext.Provider value={{ ...mockAuthContext, ...authOverrides }}>
                    <FeedContext.Provider value={{ ...mockFeedContext, ...feedOverrides }}>
                        <ProfileFeed
                            showEdit={false}
                            onCloseModal={vi.fn()}
                            {...props}
                        />
                    </FeedContext.Provider>
                </AuthContext.Provider>
            </BrowserRouter>
        );
    };

    describe('ВЕТВЛЕНИЕ 1: Роутинг и параметры', () => {
        it('получает username из useParams', () => {
            renderProfileFeed();
            expect(useParams).toHaveBeenCalled();
        });

        it('обрабатывает отсутствие username', () => {
            useParams.mockReturnValue({ username: undefined });
            renderProfileFeed();
            expect(getUserProfile).not.toHaveBeenCalled();
        });
    });

    describe('ВЕТВЛЕНИЕ 3: Успешная загрузка профиля', () => {
        it('загружает и отображает данные профиля', async () => {
            renderProfileFeed();

            await waitFor(() => {
                expect(screen.getByText('testuser')).toBeInTheDocument();
                expect(screen.getByText('@testuser')).toBeInTheDocument();
            });
        });
    });

    describe('ВЕТВЛЕНИЕ 4: Гость vs владелец профиля', () => {
        it('устанавливает guestStatus=true для чужого профиля', async () => {
            localStorage.setItem('myUsername', 'differentuser');

            renderProfileFeed();

            await waitFor(() => {
                expect(mockAuthContext.setGuestStatus).toHaveBeenCalledWith(true);
            });
        });

        it('устанавливает guestStatus=false для своего профиля', async () => {
            localStorage.setItem('myUsername', 'testuser');

            renderProfileFeed();

            await waitFor(() => {
                expect(mockAuthContext.setGuestStatus).toHaveBeenCalledWith(false);
            });
        });
    });

    describe('ВЕТВЛЕНИЕ 5: Обработка ошибок профиля', () => {
        it('отображает 404 страницу', async () => {
            getUserProfile.mockResolvedValue({
                success: false,
                statusCode: 404
            });

            renderProfileFeed();

            await waitFor(() => {
                expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
            });
        });

        it('вызывает refreshToken при 401 ошибке', async () => {
            getUserProfile.mockResolvedValue({
                success: false,
                statusCode: 401
            });

            renderProfileFeed();

            await waitFor(() => {
                expect(mockAuthContext.refreshToken).toHaveBeenCalled();
            });
        });
    });

    describe('ВЕТВЛЕНИЕ 6: Загрузка постов', () => {
        it('обрабатывает отсутствие постов', async () => {
            renderProfileFeed();

            await waitFor(() => {
                expect(screen.getByText('testuser еще не опубликовал(а) постов')).toBeInTheDocument();
            });
        });
    });

    describe('ВЕТВЛЕНИЕ 9: Редактирование профиля', () => {
        it('не отображает EditForm когда showEdit=false', () => {
            renderProfileFeed({ showEdit: false });

            expect(screen.queryByTestId('edit-form')).not.toBeInTheDocument();
        });
    });
});