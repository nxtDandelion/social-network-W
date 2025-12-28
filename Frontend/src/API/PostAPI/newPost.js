import { API_BASE_URL } from "../../config.js";
import {errorHandler} from "../errorsHandler.js"
import axios from "axios";

export const newPost = async (postText) => {
    const token = localStorage.getItem("access_token");

    if (!token) {
        console.error("Токен не найден");
        return false;
    }
    const cleanedText = postText.trim();
    if (!cleanedText) {
        return { success: false, error: "Текст поста не может быть пустым" };
    }
    try {
        const profileId = localStorage.getItem("userId");
        if (!profileId) {
            return { success: false, error: "Profile ID не найден" };
        }
        const response = await axios.post(`${API_BASE_URL}/post`,
            {
                text: cleanedText
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return { success: true, data: response.data };
    } catch (error) {
        const curResponse = "Создание поста:"
        return  errorHandler(error,curResponse);
    }
}