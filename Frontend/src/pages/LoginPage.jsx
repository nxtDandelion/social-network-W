import axios from "axios";
import FormInput from "../components/FormComponents/FormInput.jsx";
import FormButton from "../components/FormComponents/FormButton.jsx";
import FormFrame from "../components/FormComponents/FormFrame.jsx";
import {useNavigate} from "react-router-dom";
import MainPage from "./MainPage.jsx";
import {useContext, useEffect, useState} from "react";
import {AuthContext} from "../authcontext.jsx";
import FormMes from "../components/FormComponents/FormMes.jsx";
import {lenghtCheck, loginValid, passwordValid} from "../assets/validation.js";
import {API_BASE_URL} from "../config.js";

export default function LoginPage() {
    const navigate = useNavigate();
    const {setAuth} = useContext(AuthContext);
    const [timeToClose, setTimeToClose] = useState(true);
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [correct, setCorrect] = useState(false);
    const [message, setMessage] = useState("");
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        if (lenghtCheck(login) && lenghtCheck(password)) {
            setIsActive(true);
        } else {
            setIsActive(false);
        }
    }, [login, password]);

    useEffect(() => {

        const timer = setTimeout(() => {
            setTimeToClose(false);
        }, 2000);

        return () => clearTimeout(timer);
    }, [timeToClose]);

    const close = () => {
        navigate(-1);
    }

    const responseLog = async (login,password) =>{

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
            console.error("Ошибка при регистрации:", error.response?.data || error.message);
            setMessage(error.response.data.detail);
            console.log(error.response.data.detail);
            return false;
        }
    }

    const checkForm = async () => {
        const loginValidation = loginValid(login);
        const passwordValidation = passwordValid(password);
        if (loginValidation.isValid && passwordValidation.isValid) {
            console.log("Данные валидны",login, password);

            const response = await responseLog(login,password);
            if (response) {
                localStorage.setItem("auth","true");
                setAuth(true);
                setCorrect(true);
                setTimeToClose(true);
                setMessage("Вход успешен");
                setTimeout(() => {
                    navigate("/profile");
                },2000)
            }
            else{
                setCorrect(false);
                setTimeToClose(true);
                setMessage("Неверное имя пользователя или пароль");
            }
        }
        else{
            setTimeToClose(true);
           setMessage("Неверное имя пользователя или пароль");
        }
    }

    return (
        <div>
            <MainPage></MainPage>
                <FormFrame frameFor="login" path="/registration" refMessage="Нет аккаунта? Зарегистрируйся!" message="Добро пожаловать!" onClose={close} submitForm={checkForm}>
                    <FormInput formType="text" labelText="Логин" formValue={login} onChange={(e) => setLogin(e.target.value)}/>
                    <FormInput formType="password" labelText="Пароль" formValue={password} onChange={(e) => setPassword(e.target.value)} />

                    <FormButton status={isActive} text="Войти"></FormButton>
                    {message && timeToClose && <FormMes text={message} type={correct ? "message" : "error"}/>}
                </FormFrame>
        </div>
    )
}

