import axios from "axios";
import {API_BASE_URL} from "../../config.js";
import {errorHandler} from "../errorsHandler.js";

export const postCommentLike = async (commentId,profileId) =>{
    const token = localStorage.getItem("access_token");

    try {
        const response = await axios.post(`${API_BASE_URL}/post/comments/${commentId}/like`, {
            profile_id: profileId,
        },{
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        console.log("Запрос на отпраку комментария успешен");
        return {success:true,data:response.data};
    }
    catch (error) {
        const curResponse = "Отпрака комментариев поста:"
        return errorHandler(error,curResponse);
    }
}