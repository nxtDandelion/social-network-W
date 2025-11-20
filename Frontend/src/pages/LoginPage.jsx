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
import {responseLog} from "../assets/auth.js";

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

    const checkForm = async () => {
        const loginValidation = loginValid(login);
        const passwordValidation = passwordValid(password);
        if (loginValidation.isValid && passwordValidation.isValid) {
            console.log("Данные валидны",login, password);

            const response = await responseLog(login,password);
            if (response) {
                localStorage.setItem("auth","true");
                setTimeToClose(true);
                setMessage("Вход успешен");
                setCorrect(true);
                setAuth(true);
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

                    <FormButton status={isActive} enterStatus={correct} text="Войти"></FormButton>
                    {message && timeToClose && <FormMes text={message} type={correct ? "message" : "error"}/>}
                </FormFrame>
        </div>
    )
}

