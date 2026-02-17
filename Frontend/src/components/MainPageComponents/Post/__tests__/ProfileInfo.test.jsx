import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProfileInfo from '../PostComponents/ProfileInfo';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate
    };
});

describe('ProfileInfo', () => {
    const defaultProps = {
        userName: 'testuser',
        userTag: '@testuser',
        userAvatar: 'avatar.jpg',
        userId: 123,
        component: 'post'
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderComponent = (props = {}) => {
        return render(
            <BrowserRouter>
                <ProfileInfo {...defaultProps} {...props} />
            </BrowserRouter>
        );
    };

    // ТЕСТ 1: Рендер с аватаром
    test('рендерит имя, тег и аватар', () => {
        renderComponent();

        expect(screen.getByText('testuser')).toBeInTheDocument();
        expect(screen.getByText('@testuser')).toBeInTheDocument();

        const avatar = screen.getByAltText('Аватар testuser');
        expect(avatar).toBeInTheDocument();
        expect(avatar).toHaveAttribute('src', 'avatar.jpg');
        expect(avatar).toHaveClass('w-14 h-14 rounded-full object-cover');
    });

    // ТЕСТ 2: Дефолтный аватар
    test('использует дефолтный аватар при отсутствии', () => {
        renderComponent({ userAvatar: null });

        const avatar = screen.getByAltText('Аватар testuser');
        expect(avatar).toHaveAttribute('src', '/avatars/defaultAvatar.png');
    });

    test('использует дефолтный аватар при "null"', () => {
        renderComponent({ userAvatar: "null" });

        const avatar = screen.getByAltText('Аватар testuser');
        expect(avatar).toHaveAttribute('src', '/avatars/defaultAvatar.png');
    });

    // ТЕСТ 3: Навигация при клике
    test('переходит на профиль при клике на имя', () => {
        renderComponent();

        fireEvent.click(screen.getByText('testuser'));
        expect(mockNavigate).toHaveBeenCalledWith('/profile/testuser');
    });

    test('переходит на профиль при клике на тег', () => {
        renderComponent();

        fireEvent.click(screen.getByText('@testuser'));
        expect(mockNavigate).toHaveBeenCalledWith('/profile/testuser');
    });

    test('переходит на профиль при клике на аватар', () => {
        renderComponent();

        fireEvent.click(screen.getByAltText('Аватар testuser'));
        expect(mockNavigate).toHaveBeenCalledWith('/profile/testuser');
    });

    // ТЕСТ 4: Цвет текста для разных компонентов
    test('имеет белый текст для компонента post', () => {
        renderComponent({ component: 'post' });

        expect(screen.getByText('testuser')).toHaveClass('text-white');
        expect(screen.getByText('@testuser')).toHaveClass('text-[#C0C0C0]');
    });

    test('имеет черный текст для других компонентов', () => {
        renderComponent({ component: 'comment' });

        expect(screen.getByText('testuser')).toHaveClass('text-black');
        expect(screen.getByText('@testuser')).toHaveClass('text-black text-opacity-75');
    });

    // ТЕСТ 5: Дочерние элементы
    test('рендерит дочерние элементы', () => {
        renderComponent({
            children: <button data-testid="child-button">Кнопка</button>
        });

        expect(screen.getByTestId('child-button')).toBeInTheDocument();
        expect(screen.getByText('Кнопка')).toBeInTheDocument();
    });

    // ТЕСТ 6: ID элемента
    test('устанавливает id элемента', () => {
        renderComponent({ userId: 999 });

        const container = screen.getByText('testuser').closest('div[class*="cursor-pointer"]');
        expect(container).toHaveAttribute('id', '999');
    });
});