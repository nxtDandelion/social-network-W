import { API_BASE_URL } from "../../config.js";
import {errorHandler} from "../errorsHandler.js"
import axios from "axios";

export const deleteCommentLike = async (commentId,profileId) => {
    const token = localStorage.getItem("access_token");

    if (!token) {
        console.error("Токен не найден");
        return false;
    }
    try {

        const response = await axios.delete(`${API_BASE_URL}/post/comments/${commentId}/like`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                data:{
                    profile_id: profileId,
                }
            }
        );
        console.log("Комментарий удален успешно:", response.data);
        return { success: true, data: response.data };
    } catch (error) {
        const curResponse = "Удаление лайка на комментарий:"
        return  errorHandler(error,curResponse);
    }
}