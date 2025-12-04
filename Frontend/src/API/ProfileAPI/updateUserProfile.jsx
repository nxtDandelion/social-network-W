import {API_BASE_URL} from "../../config.js";
import axios from "axios";
import {errorHandler} from "../errorsHandler.js";

export const updateUserProfile = async (username, email, tag, photo, password) => {
    const token = localStorage.getItem("access_token");
    const curUserName = localStorage.getItem("myUsername");

    if (!token) {
        console.error("Токен не найден");
        return false;
    }

    try {
        const response = await axios.put(`${API_BASE_URL}/profile/${curUserName}`, {
            username: username,
            email: email,
            tag: tag,
            photo: photo,
            password: password,
        },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

        console.log("Данные профиля успешно изменены:", response.data);
        localStorage.setItem("myUsername",username);
        console.log('Новое имя пользователя',username);
        return { success: true, data: response.data };

    } catch (error) {
        console.log("Ошибка");
        const curResponse = "Обновление профиля:"
        return errorHandler(error, curResponse);
    }
}