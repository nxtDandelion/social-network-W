import { API_BASE_URL } from "../../config.js";
import {errorHandler} from "../errorsHandler.js"
import axios from "axios";

export const unFollowProfile = async (username,profileName) => {
    const token = localStorage.getItem("access_token");

    if (!token) {
        console.error("Токен не найден");
        return false;
    }
    try {
        const profileId = localStorage.getItem("userId");
        if (!profileId) {
            return { success: false, error: "Profile ID не найден" };
        }
        const response = await axios.delete(`${API_BASE_URL}/profile/${profileName}/follow?current_user=${username}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log("Отписан успешно:", response.data);
        return { success: true, data: response.data };// Возвращаем созданный пост
    } catch (error) {
        const curResponse = "Отписка:"
        return  errorHandler(error,curResponse);
    }
}