import {API_BASE_URL} from "../../config.js";
import axios from "axios";
import {errorHandler} from "../errorsHandler.js";

export const getUserProfile =async (username) => {
    const token = localStorage.getItem("access_token");
    console.log(username,"Создаю профиль с таким ником");

    try{
        const response = await axios.get(`${API_BASE_URL}/profile/${username}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        });

        return { success: true, data: response.data };

    } catch (error) {
        const curResponse = "Получение профиля:"
        return errorHandler(error,curResponse);
    }
}

