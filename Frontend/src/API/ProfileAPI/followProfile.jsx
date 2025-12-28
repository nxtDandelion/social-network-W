import { API_BASE_URL } from "../../config.js";
import {errorHandler} from "../errorsHandler.js"
import axios from "axios";

export const followProfile = async (username,profileName) => {
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
        console.log("Поодписываюсь на :",profileName,"Я:",username);
        const response = await axios.post(`${API_BASE_URL}/profile/${profileName}/follow?current_user=${username}`,
            {

            },{
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return { success: true, data: response.data };
    } catch (error) {
        console.log("я пойман");
        const curResponse = "Подписка:"
        return  errorHandler(error,curResponse);
    }
}