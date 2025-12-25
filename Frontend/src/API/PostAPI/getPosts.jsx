// getPosts.js
import {API_BASE_URL} from "../../config.js";
import axios from "axios";
import {errorHandler} from "../errorsHandler.js";

export const getPosts = async (skip = 0, limit = 15) => {
    try {
        console.log(`[API] Запрос общей ленты: skip=${skip}, limit=${limit}`);
        const response = await axios.get(`${API_BASE_URL}/post/feed`, {
            params: {
                page: limit,
                size: skip
            }
        });
        console.log(`[API] Общая лента: получено ${response.data?.length || 0} постов`);
        return {success: true, data: response.data};
    } catch (error) {
        console.error("[API] Ошибка при загрузке общей ленты:", error);
        const curResponse = "Получение поста:"
        return errorHandler(error, curResponse);
    }
}