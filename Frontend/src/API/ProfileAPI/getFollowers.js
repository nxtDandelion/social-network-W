import {API_BASE_URL} from "../../config.js";
import axios from "axios";
import {errorHandler} from "../errorsHandler.js";

export const getFollowers =async (username) => {
    const token = localStorage.getItem("access_token");
    if (!token) {
        console.error("Токен не найден");
        return false;
    }
    try{
        const response = await axios.get(`${API_BASE_URL}/profile/${username}/followers`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        });

        return { success: true, data: response.data };

    } catch (error) {
        const curResponse = `Получение списка подписчиков ${username}:`
        return errorHandler(error,curResponse);
    }
}

