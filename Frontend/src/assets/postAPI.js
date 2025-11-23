import {loginValid, passwordValid} from "./validation.js";
import {responseLog} from "./auth.js";
import axios from "axios";
import {API_BASE_URL} from "../config.js";

export const responseCommentsList = async (postId) =>{

    try {
        const response = await axios.post(`${API_BASE_URL}/posts/${postId}/comments`,{

        });
        const {access_token,refresh_token,token_type} = response.data;
        console.log("Запрос на вход успешен");
        const comments = response.data;
        return (console.log(comments,"Список комментов"));
    }
    catch (error){
        console.error("Ошибка при авторизации:", error.response?.data || error.message);
        console.log(error.response.data.detail);
        return false;
    }
}