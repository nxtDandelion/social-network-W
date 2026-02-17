import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import FormFrame from '../FormFrame';

// Мокаем navigate
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate
    };
});

describe('FormFrame', () => {
    const mockOnClose = vi.fn();
    const mockSubmitForm = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderComponent = (props = {}) => {
        return render(
            <BrowserRouter>
                <FormFrame
                    message="Добро пожаловать!"
                    onClose={mockOnClose}
                    submitForm={mockSubmitForm}
                    refMessage="Нет аккаунта?"
                    path="/register"
                    frameFor="login"
                    {...props}
                >
                    <div data-testid="child-content">Дочерний контент</div>
                </FormFrame>
            </BrowserRouter>
        );
    };

    test('рендерит заголовок и дочерние элементы', () => {
        renderComponent();

        expect(screen.getByText('Добро пожаловать!')).toBeInTheDocument();
        expect(screen.getByTestId('child-content')).toBeInTheDocument();
        expect(screen.getByText('Нет аккаунта?')).toBeInTheDocument();
    });

    test('вызывает onClose при клике на крестик', () => {
        renderComponent();

        const closeButton = screen.getByLabelText('Закрыть');
        fireEvent.click(closeButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('вызывает submitForm при отправке формы', () => {
        renderComponent();

        // Ищем форму по тегу, так как у нее нет role="form"
        const form = document.querySelector('form');
        expect(form).toBeInTheDocument();

        // Триггерим событие submit на форме
        fireEvent.submit(form);

        expect(mockSubmitForm).toHaveBeenCalledTimes(1);
    });

    test('навигация при клике на refMessage', () => {
        renderComponent();

        const link = screen.getByText('Нет аккаунта?');
        fireEvent.click(link);

        expect(mockNavigate).toHaveBeenCalledWith('/register');
    });
});