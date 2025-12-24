// getFavourPosts.js
import axios from "axios";
import {API_BASE_URL} from "../../config.js";
import {errorHandler} from "../errorsHandler.js";

export const getFavourPosts = async (username, skip = 0, limit = 15) => {
    const token = localStorage.getItem("access_token");
    try {
        console.log(`[API] Запрос ленты подписок: skip=${skip}, limit=${limit}, username=${username}`);
        const response = await axios.get(`${API_BASE_URL}/post/subscribe_feed`, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            params: {
                username: username,
                limit: limit,
                skip: skip
            }
        });
        console.log(`[API] Лента подписок: получено ${response.data?.length || 0} постов`);
        return {success: true, data: response.data};
    } catch (error) {
        console.error("[API] Ошибка при загрузке ленты подписок:", error);
        const curResponse = "Получение ленты подписок:"
        return errorHandler(error, curResponse);
    }
}