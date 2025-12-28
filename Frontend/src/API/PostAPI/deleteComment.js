import { API_BASE_URL } from "../../config.js";
import {errorHandler} from "../errorsHandler.js"
import axios from "axios";

export const deleteComment = async (profileId,postId,commentId) => {
    const token = localStorage.getItem("access_token");

    if (!token) {
        console.error("Токен не найден");
        return false;
    }
    try {

        const response = await axios.delete(`${API_BASE_URL}/post/${postId}/comments/${commentId}?profile_id=${profileId}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return { success: true, data: response.data };// Возвращаем созданный пост
    } catch (error) {
        const curResponse = "Удаление комментария:"
        return  errorHandler(error,curResponse);
    }
}