import { API_BASE_URL } from "../../config.js";
import {errorHandler} from "../errorsHandler.js"
import axios from "axios";

export const deleteLike = async (postId) => {
    const token = localStorage.getItem("access_token");

    if (!token) {
        console.error("Токен не найден");
        return false;
    }
    try {
        const response = await axios.delete(`${API_BASE_URL}/post/${postId}/like`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }

            }
        );
        return { success: true, data: response.data };// Возвращаем созданный пост
    } catch (error) {
        const curResponse = "Удаление лайка:"
        return  errorHandler(error,curResponse);
    }
}