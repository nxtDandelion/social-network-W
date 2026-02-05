import {API_BASE_URL} from "../../config.js";
import axios from "axios";
import {errorHandler} from "../errorsHandler.js";

export const getCurrentPost = async (postId) =>{

    const token = localStorage.getItem("access_token");

    if (!token) {
        console.error("Токен не найден");
        return false;
    }
    try {
        const response = await axios.get(`${API_BASE_URL}/post/${postId}`,{
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return {success:true, data:response.data};

    }catch (error) {
        const curResponse = "Получение поста:"
        return errorHandler(error,curResponse);
    }
}
