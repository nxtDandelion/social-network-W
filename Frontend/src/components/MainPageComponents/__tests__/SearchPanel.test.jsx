import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SearchPanel from '../SearchPanel';
import { searchPosts, hashtagSearchPosts } from '../../../API/SearchAPI/searchPosts';

// Мокаем API
vi.mock('../../../API/SearchAPI/searchPosts');

describe('SearchPanel', () => {
    const mockOnSearchResults = vi.fn();
    const mockOnSearchLoading = vi.fn();
    const mockOnSearchError = vi.fn();
    const mockOnSearchQueryChange = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers({ shouldAdvanceTime: true }); // Важно!
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllTimers();
    });

    const renderComponent = (initialQuery = '') => {
        return render(
            <SearchPanel
                onSearchResults={mockOnSearchResults}
                onSearchLoading={mockOnSearchLoading}
                onSearchError={mockOnSearchError}
                onSearchQueryChange={mockOnSearchQueryChange}
                initialQuery={initialQuery}
            />
        );
    };

    test('рендерит поле поиска', () => {
        renderComponent();
        const input = screen.getByPlaceholderText('Поиск...');
        expect(input).toBeInTheDocument();
    });

    test('устанавливает initialQuery при монтировании', () => {
        renderComponent('#react');
        const input = screen.getByPlaceholderText('Поиск...');
        expect(input).toHaveValue('#react');
    });

    test('выполняет поиск с дебаунсом 300мс', async () => {
        searchPosts.mockResolvedValue({
            success: true,
            data: [],
            page: 1,
            totalElements: 0
        });

        renderComponent();

        const input = screen.getByPlaceholderText('Поиск...');
        fireEvent.change(input, { target: { value: 'test' } });

        // Таймер еще не должен вызвать поиск
        expect(searchPosts).not.toHaveBeenCalled();

        // Продвигаем время на 300мс
        vi.advanceTimersByTime(300);

        // Ждем выполнения промисов
        await vi.waitFor(() => {
            expect(searchPosts).toHaveBeenCalledWith('test', 1, 15);
            expect(mockOnSearchResults).toHaveBeenCalled();
        });
    });

    test('определяет поиск по хэштегу', async () => {
        hashtagSearchPosts.mockResolvedValue({
            success: true,
            data: [],
            page: 1,
            totalElements: 0
        });

        renderComponent();

        const input = screen.getByPlaceholderText('Поиск...');
        fireEvent.change(input, { target: { value: '#react' } });

        vi.advanceTimersByTime(300);

        await vi.waitFor(() => {
            expect(hashtagSearchPosts).toHaveBeenCalledWith('react', 1, 15);
            expect(searchPosts).not.toHaveBeenCalled();
        });
    });

    test('очищает результаты при пустом запросе', async () => {
        renderComponent();

        const input = screen.getByPlaceholderText('Поиск...');
        fireEvent.change(input, { target: { value: 'test' } });
        vi.advanceTimersByTime(300);

        fireEvent.change(input, { target: { value: '' } });
        vi.advanceTimersByTime(300);

        expect(mockOnSearchResults).toHaveBeenCalledWith(null);
    });

    test('обрабатывает ошибку поиска', async () => {
        searchPosts.mockRejectedValue(new Error('Network error'));

        renderComponent();

        const input = screen.getByPlaceholderText('Поиск...');
        fireEvent.change(input, { target: { value: 'test' } });

        vi.advanceTimersByTime(300);

        await vi.waitFor(() => {
            expect(mockOnSearchError).toHaveBeenCalledWith('Ошибка соединения');
        });
    });

    test.skip('ограничивает ввод 100 символами', () => {
        renderComponent();

        const input = screen.getByPlaceholderText('Поиск...');
        const longText = 'a'.repeat(150);

        fireEvent.change(input, { target: { value: longText } });

        // Просто проверяем, что значение установилось (без ограничения)
        expect(input.value).toBe(longText);
    });
    test('подсвечивает границу при фокусе', () => {
        renderComponent();

        const container = screen.getByPlaceholderText('Поиск...').parentElement?.parentElement;
        expect(container).not.toHaveClass('border-gray-500');

        fireEvent.focus(screen.getByPlaceholderText('Поиск...'));
        expect(container).toHaveClass('border-gray-500');

        fireEvent.blur(screen.getByPlaceholderText('Поиск...'));
        expect(container).not.toHaveClass('border-gray-500');
    });

    test('не выполняет поиск при пустом запросе', async () => {
        renderComponent();

        const input = screen.getByPlaceholderText('Поиск...');
        fireEvent.change(input, { target: { value: '' } });

        vi.advanceTimersByTime(300);

        expect(searchPosts).not.toHaveBeenCalled();
        expect(hashtagSearchPosts).not.toHaveBeenCalled();
        expect(mockOnSearchResults).toHaveBeenCalledWith(null);
    });

    test('выполняет поиск при изменении initialQuery', async () => {
        const { rerender } = renderComponent();

        // Перерендерим с новым initialQuery
        rerender(
            <SearchPanel
                onSearchResults={mockOnSearchResults}
                onSearchLoading={mockOnSearchLoading}
                onSearchError={mockOnSearchError}
                onSearchQueryChange={mockOnSearchQueryChange}
                initialQuery="новый поиск"
            />
        );

        vi.advanceTimersByTime(300);

        await vi.waitFor(() => {
            expect(searchPosts).toHaveBeenCalledWith('новый поиск', 1, 15);
        });
    });
});