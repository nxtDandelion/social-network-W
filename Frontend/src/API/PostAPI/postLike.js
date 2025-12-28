import { API_BASE_URL } from "../../config.js";
import {errorHandler} from "../errorsHandler.js"
import axios from "axios";

export const postLike = async (postId) => {
    const token = localStorage.getItem("access_token");

    if (!token) {
        console.error("Токен не найден");
        return false;
    }
    try {
        const response = await axios.post(`${API_BASE_URL}/post/${postId}/like`,
            {
                 // profile_id: postId,
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return { success: true, data: response.data };
    } catch (error) {
        const curResponse = "Создание поста:"
        return  errorHandler(error,curResponse);
    }
}