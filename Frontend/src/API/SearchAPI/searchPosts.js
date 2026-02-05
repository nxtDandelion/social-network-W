import { API_BASE_URL } from "../../config.js";
import axios from "axios";
import { errorHandler } from "../errorsHandler.js";

export const searchPosts = async (text, page = 1, size = 15) => {
    try {
        console.log(`[API] Запрос результатов поиска: "${text}", страница ${page}, размер ${size}`);

        const backendPage = page - 1;
        // const encodedQuery = encodeURIComponent(text);
        const url = `${API_BASE_URL}/search?query=${text}&page=${backendPage}&size=${size}`;

        console.log(`[API] Полный URL: ${url}`);

        const response = await axios.get(url);

        // Если сервер возвращает 200 OK с пустыми результатами
        console.log(`[API] Ответ от бэкенда:`, response.data);
        console.log(`[API] Найдено постов: ${response.data.totalElements || 0}`);

        return {
            success: true,
            data: response.data.results || [],
            page: response.data.page + 1,
            size: response.data.size,
            totalPages: response.data.totalPages,
            totalElements: response.data.totalElements,
            hasMore: (response.data.page + 1) < response.data.totalPages
        };
    } catch (error) {
        console.error("[API] Ошибка при загрузке результата поиска:", error);

        // Обработка специфической ситуации: 404 с телом ответа
        if (error.response?.status === 404 && error.response?.data) {
            console.log("[API] Сервер вернул 404 но с данными, обрабатываем как успех");
            const responseData = error.response.data;

            return {
                success: true,
                data: responseData.results || [],
                page: responseData.page + 1 || 1,
                size: responseData.size || 15,
                totalPages: responseData.totalPages || 0,
                totalElements: responseData.totalElements || 0,
                hasMore: false
            };
        }

        // Детальный лог ошибки
        if (error.response) {
            console.error("[API] Статус ошибки:", error.response.status);
            console.error("[API] Данные ошибки:", error.response.data);
        }

        const curResponse = "Получение поста через поиск:"
        return errorHandler(error, curResponse);
    }
}

export const hashtagSearchPosts = async (text, page = 1, size = 15) => {
    try {
        console.log(`[API] Запрос результатов поиска хэщтэга: "${text}", страница ${page}, размер ${size}`);

        const backendPage = page - 1;
        // const encodedQuery = encodeURIComponent(text);
        console.log(text, "текст");
        // console.log(encodedQuery,"итоговой текст для запроса");
        const url = `${API_BASE_URL}/search/hashtag?query=${text}&page=${backendPage}&size=${size}`;

        console.log(`[API] Полный URL: ${url}`);

        const response = await axios.get(url);

        // Если сервер возвращает 200 OK с пустыми результатами
        console.log(`[API] Ответ от бэкенда:`, response.data);
        console.log(`[API] Найдено постов: ${response.data.totalElements || 0}`);

        return {
            success: true,
            data: response.data.results || [],
            page: response.data.page + 1,
            size: response.data.size,
            totalPages: response.data.totalPages,
            totalElements: response.data.totalElements,
            hasMore: (response.data.page + 1) < response.data.totalPages
        };
    } catch (error) {
        console.error("[API] Ошибка при загрузке результата поиска по хэштэгу:", error);

        // Обработка специфической ситуации: 404 с телом ответа
        if (error.response?.status === 404 && error.response?.data) {
            console.log("[API] Сервер вернул 404 но с данными, обрабатываем как успех");
            const responseData = error.response.data;

            return {
                success: true,
                data: responseData.results || [],
                page: responseData.page + 1 || 1,
                size: responseData.size || 15,
                totalPages: responseData.totalPages || 0,
                totalElements: responseData.totalElements || 0,
                hasMore: false
            };
        }

        // Детальный лог ошибки
        if (error.response) {
            console.error("[API] Статус ошибки:", error.response.status);
            console.error("[API] Данные ошибки:", error.response.data);
        }

        const curResponse = "Получение поста через поиск по хэштэгу:"
        return errorHandler(error, curResponse);
    }
}
