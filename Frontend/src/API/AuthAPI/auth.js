import axios from "axios";
import {API_BASE_URL} from "../../config.js";
import {errorHandler} from "../errorsHandler.js";

export const responseLog = async (login,password) =>{

    try {
        const response = await axios.post(`${API_BASE_URL}/auth/login`,{
            login: login,
            password: password,
            ip:"string"
        });
        return {success:true,data:response.data};
    }
    catch (error) {
        const curResponse = "Авторизация:"
        return errorHandler(error,curResponse);
    }
}

export const responseReg = async (login, userName, mail, password) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/auth/register`, {
            username: userName,
            email: mail,
            login: login,
            role: "user",
            password: password
        });
        return {success:true,data:response.data};
    } catch (error) {
        const curResponse = "Регистрация:"
        return (errorHandler(error,curResponse));
    }
};


export const logout = () =>{
    localStorage.clear();
}