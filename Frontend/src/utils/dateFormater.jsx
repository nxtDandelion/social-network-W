export const formatBackendDate = (dateArray) => {
    if (!Array.isArray(dateArray) || dateArray.length < 6) {
        return 'Дата неизвестна';
    }

    try {
        // dateArray: [год, месяц, день, час, минута, секунда]
        // Месяц в JavaScript 0-based (январь = 0), поэтому отнимаем 1
        const date = new Date(
            dateArray[0],      // год
            dateArray[1] - 1,  // месяц (0-based)
            dateArray[2],      // день
            dateArray[3],      // час
            dateArray[4],      // минута
            dateArray[5]       // секунда
        );

        // Форматируем как "25.12.2025"
        return date.toLocaleDateString('ru-RU');
    } catch (error) {
        console.error('Ошибка форматирования даты:', dateArray, error);
        return 'Дата неизвестна';
    }
};

export const normalizePostDate = (dateInput) => {
    if (!dateInput) return 'Дата неизвестна';

    // Если это массив [2025, 12, 25, 17, 24, 36]
    if (Array.isArray(dateInput)) {
        return formatBackendDate(dateInput);
    }

    // Если это строка ISO (например, "2025-12-25T17:24:36.000Z")
    if (typeof dateInput === 'string') {
        try {
            return new Date(dateInput).toLocaleDateString('ru-RU');
        } catch {
            return 'Дата неизвестна';
        }
    }

    // Если это Date объект
    if (dateInput instanceof Date) {
        return dateInput.toLocaleDateString('ru-RU');
    }

    return 'Дата неизвестна';
};