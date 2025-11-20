import axios from "axios";
import {API_BASE_URL} from "../config.js";
import {AuthContext} from "../authcontext.jsx";
import {useContext} from "react";

export const responseLog = async (login,password) =>{

    try {
        const response = await axios.post(`${API_BASE_URL}/auth/login`,{
            login: login,
            password: password,
            ip:"string"
        });
        const {access_token,refresh_token,token_type} = response.data;
        console.log("Запрос на вход успешен");
        localStorage.setItem("access_token",access_token);
        localStorage.setItem("refresh_token",refresh_token);
        return true
    }
    catch (error){
        console.error("Ошибка при авторизации:", error.response?.data || error.message);
        console.log(error.response.data.detail);
        return false;
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
        console.log("все верно");
        return true;
    } catch (error) {
        console.error("Ошибка при регистрации:", error.response?.data || error.message);
        // setTimeToClose(true);
        // setMessage(error.response.data.detail);
        console.log(error.response.data.detail);
        return false;
    }
};
export const logout = () =>{
    localStorage.clear();
}