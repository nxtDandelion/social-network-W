import axios from "axios";
import {API_BASE_URL} from "../../config.js";
import {errorHandler} from "../errorsHandler.js";

export const getFavourPosts = async (username) =>{
    const token = localStorage.getItem("access_token");
    try {
        const response = await axios.get(`${API_BASE_URL}/post/subscribe_feed?username=${username}`,{
            headers: {
                'Authorization': `Bearer ${token}`
            },
            params: {
                limit: 15,    // опционально: количество постов
                offset: 0     // опционально: для пагинации
            }
        });
        console.log("Лента подписок успешно полученна");
        return {success:true, data:response.data};

    }catch (error) {
        const curResponse = "Получение ленты подписок:"
        return errorHandler(error,curResponse);
    }
}