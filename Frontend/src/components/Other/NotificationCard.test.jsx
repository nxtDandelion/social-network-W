import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NotificationCard from './NotificationCard';

// Мокаем иконки
vi.mock('../../Icons/CrossIcon', () => ({
    default: ({ className }) => <div data-testid="cross-icon" className={className}>X</div>
}));

// НЕ мокаем SearchIcon - пусть используется реальный, но с Router

describe('NotificationCard - исправленные тесты', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const defaultProps = {
        message: 'Тестовое уведомление',
        type: 'info',
        duration: 3000,
        onClose: vi.fn(),
        isVisible: true
    };

    // Оборачиваем в BrowserRouter для useNavigate
    const renderWithRouter = (component) => {
        return render(
            <BrowserRouter>
                {component}
            </BrowserRouter>
        );
    };

    // ТЕСТ 1: Рендеринг
    // it('рендерит уведомление с сообщением', () => {
    //     renderWithRouter(<NotificationCard {...defaultProps} />);
    //
    //     expect(screen.getByText('Тестовое уведомление')).toBeInTheDocument();
    //     expect(screen.getByTestId('cross-icon')).toBeInTheDocument();
    // });

    // ТЕСТ 2: Не рендерится при isVisible=false
    it('не рендерится когда isVisible=false', () => {
        renderWithRouter(<NotificationCard {...defaultProps} isVisible={false} />);

        expect(screen.queryByText('Тестовое уведомление')).not.toBeInTheDocument();
    });

    // ТЕСТ 3: Закрытие по кнопке
    it('закрывается при клике на крестик', () => {
        const onClose = vi.fn();
        renderWithRouter(<NotificationCard {...defaultProps} onClose={onClose} />);

        fireEvent.click(screen.getByLabelText('Закрыть уведомление'));

        act(() => {
            vi.advanceTimersByTime(100);
        });

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    // ТЕСТ 4: Автоматическое закрытие
    it('закрывается автоматически через duration', () => {
        const onClose = vi.fn();
        renderWithRouter(<NotificationCard {...defaultProps} duration={2000} onClose={onClose} />);

        act(() => {
            vi.advanceTimersByTime(2000);
        });

        act(() => {
            vi.advanceTimersByTime(100); // время на анимацию закрытия
        });

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    // ТЕСТ 5: Не закрывается если duration=0
    it('не закрывается автоматически при duration=0', () => {
        const onClose = vi.fn();
        renderWithRouter(<NotificationCard {...defaultProps} duration={0} onClose={onClose} />);

        act(() => {
            vi.advanceTimersByTime(5000);
        });

        expect(onClose).not.toHaveBeenCalled();
    });

    // ТЕСТ 6: Проверка разных типов
    it('применяет правильные классы для типа success', () => {
        renderWithRouter(<NotificationCard {...defaultProps} type="success" />);

        const progressBar = document.querySelector('.bg-green-500');
        expect(progressBar).toBeInTheDocument();
    });

    it('применяет правильные классы для типа error', () => {
        renderWithRouter(<NotificationCard {...defaultProps} type="error" />);

        const progressBar = document.querySelector('.bg-red-500');
        expect(progressBar).toBeInTheDocument();
    });

    it('применяет правильные классы для типа warning', () => {
        renderWithRouter(<NotificationCard {...defaultProps} type="warning" />);

        const progressBar = document.querySelector('.bg-yellow-500');
        expect(progressBar).toBeInTheDocument();
    });

    it('применяет правильные классы для типа info', () => {
        renderWithRouter(<NotificationCard {...defaultProps} type="info" />);

        const progressBar = document.querySelector('.bg-gray-600');
        expect(progressBar).toBeInTheDocument();
    });

    it('использует info по умолчанию для неизвестного типа', () => {
        renderWithRouter(<NotificationCard {...defaultProps} type="unknown" />);

        const progressBar = document.querySelector('.bg-gray-600');
        expect(progressBar).toBeInTheDocument();
    });

    // ТЕСТ 7: Работает без onClose
    it('работает без onClose', () => {
        renderWithRouter(<NotificationCard {...defaultProps} onClose={undefined} />);

        fireEvent.click(screen.getByLabelText('Закрыть уведомление'));

        act(() => {
            vi.advanceTimersByTime(100);
        });

        // Просто проверяем что компонент не падает
        expect(screen.queryByText('Тестовое уведомление')).not.toBeInTheDocument();
    });

    // ТЕСТ 8: Проверка анимации при появлении
    it('имеет класс animate-fade-in при появлении', () => {
        renderWithRouter(<NotificationCard {...defaultProps} />);

        const container = screen.getByText('Тестовое уведомление').closest('.fixed');
        expect(container).toHaveClass('animate-fade-in');
    });

    // ТЕСТ 9: Проверка анимации при закрытии
    it('меняет класс на animate-fade-out при закрытии', () => {
        renderWithRouter(<NotificationCard {...defaultProps} />);

        fireEvent.click(screen.getByLabelText('Закрыть уведомление'));

        const container = screen.getByText('Тестовое уведомление').closest('.fixed');
        expect(container).toHaveClass('animate-fade-out');
    });

    // ТЕСТ 10: Прогресс-бар имеет правильную анимацию
    it('прогресс-бар имеет правильную длительность анимации', () => {
        renderWithRouter(<NotificationCard {...defaultProps} duration={5000} />);

        const progressBar = document.querySelector('.h-full');
        expect(progressBar).toHaveStyle({
            animation: 'shrink 5000ms linear forwards'
        });
    });
});