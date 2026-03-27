import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../../Contexts/AuthContext';
import NavElement from '../NavElement';

// Мокаем хуки react-router-dom
const mockNavigate = vi.fn();
const mockUseLocation = vi.fn();
const mockUseParams = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useLocation: () => mockUseLocation(),
        useParams: () => mockUseParams()
    };
});

describe('NavElement', () => {
    const mockSetShowLoginMes = vi.fn();
    const defaultProps = {
        label: 'Главная',
        icon: <span data-testid="icon">🏠</span>,
        path: '/home'
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Полностью очищаем и пересоздаем localStorage
        delete global.localStorage;
        global.localStorage = {
            getItem: vi.fn(),
            setItem: vi.fn(),
            removeItem: vi.fn(),
            clear: vi.fn(),
            key: vi.fn(),
            length: 0
        };

        mockUseLocation.mockReturnValue({ pathname: '/' });
        mockUseParams.mockReturnValue({});
    });

    const renderComponent = (auth = true, props = {}) => {
        return render(
            <MemoryRouter>
                <AuthContext.Provider value={{
                    auth,
                    setShowLoginMes: mockSetShowLoginMes
                }}>
                    <NavElement {...defaultProps} {...props} />
                </AuthContext.Provider>
            </MemoryRouter>
        );
    };

    test('рендерит ссылку с лейблом и иконкой', () => {
        renderComponent();
        expect(screen.getByText('Главная')).toBeInTheDocument();
        expect(screen.getByTestId('icon')).toBeInTheDocument();
        expect(screen.getByRole('link')).toHaveAttribute('href', '/home');
    });

    test('для авторизованного переходит на профиль по /profile', () => {
        // Устанавливаем мок для getItem, который вернет testuser
        global.localStorage.getItem.mockImplementation((key) => {
            if (key === 'myUsername') return 'testuser';
            return null;
        });

        renderComponent(true, { path: '/profile' });

        fireEvent.click(screen.getByRole('link'));

        expect(mockNavigate).toHaveBeenCalledWith('/profile/testuser');
    });

    test('для неавторизованного редиректит на логин при /profile', () => {
        renderComponent(false, { path: '/profile' });

        fireEvent.click(screen.getByRole('link'));

        expect(mockNavigate).toHaveBeenCalledWith('/login');
        expect(mockSetShowLoginMes).not.toHaveBeenCalled();
    });

    test('для неавторизованного показывает сообщение при /favourites', () => {
        mockUseLocation.mockReturnValue({ pathname: '/' });

        renderComponent(false, { path: '/favourites' });

        fireEvent.click(screen.getByRole('link'));

        expect(mockNavigate).toHaveBeenCalledWith('/home');
        expect(mockSetShowLoginMes).toHaveBeenCalledWith(true);
    });
});