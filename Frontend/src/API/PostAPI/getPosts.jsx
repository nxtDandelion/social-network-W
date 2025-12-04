import {API_BASE_URL} from "../../config.js";
import axios from "axios";
import {errorHandler} from "../errorsHandler.js";

export const getPosts = async () =>{
    const token = localStorage.getItem("access_token");
    try {
        const response = await axios.get(`${API_BASE_URL}/post/feed`,{
            headers: {
                'Authorization': `Bearer ${token}`
            },
            params: {
                limit: 15,    // опционально: количество постов
                offset: 0     // опционально: для пагинации
            }
        });
        console.log("Лента GET успешен");
        return {success:true, data:response.data};

    }catch (error) {
        const curResponse = "Получение поста:"
        return errorHandler(error,curResponse);
    }
}