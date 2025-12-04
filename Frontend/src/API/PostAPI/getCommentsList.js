import {loginValid, passwordValid} from "../AuthAPI/validation.js";
import {responseLog} from "../AuthAPI/auth.js";
import axios from "axios";
import {API_BASE_URL} from "../../config.js";

export const responseCommentsList = async (postId) =>{
    const token = localStorage.getItem("access_token");

    try {
        const response = await axios.get(`${API_BASE_URL}/post/${postId}/comments`,{
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        console.log("Запрос на вход успешен");
        return {success:true,data:response.data};
    }
    catch (error) {
        const curResponse = "Получение комментариев поста:"
        errorHandler(error,curResponse);
    }
}