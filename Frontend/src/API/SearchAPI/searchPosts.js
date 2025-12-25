import { API_BASE_URL } from "../../config.js";
import axios from "axios";
import { errorHandler } from "../errorsHandler.js";

export const searchPosts = async (text, page = 1, size = 15) => {
    try {
        console.log(`[API] Запрос результатов поиска: "${text}", страница ${page}, размер ${size}`);

        const response = await axios.get(`${API_BASE_URL}/search`, {
            params: {
                query: text,
                page: page,
                size: size
            },
            // withCredentials: true
        });

        console.log(`[API] Результат поиска: получено ${response.data?.length || 0} постов`);
        return {
            success: true,
            data: response.data,
            page: page,
            size: size,
            hasMore: (response.data?.length || 0) === size
        };
    } catch (error) {
        console.error("[API] Ошибка при загрузке результата поиска:", error);
        const curResponse = "Получение поста через поиск:"
        return errorHandler(error, curResponse);
    }
}