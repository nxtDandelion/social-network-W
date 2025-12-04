import axios from "axios";
import {API_BASE_URL} from "../../config.js";
import {AuthContext} from "../../authcontext.jsx";
import {useContext} from "react";
import {errorHandler} from "../errorsHandler.js";

export const responseLog = async (login,password) =>{

    try {
        const response = await axios.post(`${API_BASE_URL}/auth/login`,{
            login: login,
            password: password,
            ip:"string"
        });
        const {access_token,refresh_token,username} = response.data;
        console.log("Запрос на вход успешен");
        localStorage.setItem("myUsername",username);
        localStorage.setItem("myLogin",login);
        localStorage.setItem("access_token",access_token);
        localStorage.setItem("refresh_token",refresh_token);


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
        console.log("все верно");

        return {success:true,data:response.data};

    } catch (error) {
        const curResponse = "Регистрация:"
        return (errorHandler(error,curResponse));
    }
};
export const logout = () =>{
    localStorage.clear();
}