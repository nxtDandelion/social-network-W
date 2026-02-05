import {API_BASE_URL} from "../../config.js";
import axios from "axios";
import {errorHandler} from "../errorsHandler.js";

export const updateUserProfile = async (username,login, email, photo, password,curUserName) => {
    const token = localStorage.getItem("access_token");
    if (!token) {
        console.error("Токен не найден");
        return false;
    }
    try {
        if (password === undefined ||  password.length <=0) {
            const response = await axios.put(`${API_BASE_URL}/profile/${curUserName}`, {
                    username: username,
                    login: login,
                    email: email,
                    photo: photo,
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

        }
        const response = await axios.put(`${API_BASE_URL}/profile/${curUserName}`, {
            username: username,
            login: login,
            email: email,
            photo: photo,
            password: password,
        },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

        return { success: true, data: response.data };

    } catch (error) {
        const curResponse = "Обновление профиля:"
        return errorHandler(error, curResponse);
    }
}