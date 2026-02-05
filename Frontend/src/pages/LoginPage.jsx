import axios from "axios";
import FormInput from "../components/FormComponents/FormInput.jsx";
import FormButton from "../components/FormComponents/FormButton.jsx";
import FormFrame from "../components/FormComponents/FormFrame.jsx";
import {useNavigate} from "react-router-dom";
import MainPage from "./MainPage.jsx";
import {useContext, useEffect, useState} from "react";
import {AuthContext} from "../Contexts/AuthContext.jsx";
import FormMes from "../components/FormComponents/FormMes.jsx";
import {lenghtCheck, loginValid, passwordValid} from "../API/AuthAPI/validation.js";
import {responseLog} from "../API/AuthAPI/auth.js";
import {errorLog} from "../API/errorsHandler.js";
import {getUserProfile} from "../API/ProfileAPI/getUserProfile.js";

export default function LoginPage() {
    const navigate = useNavigate();
    const {setAuth,setContextUserName,setContextUserId} = useContext(AuthContext);
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
            if (response.success) {
                localStorage.setItem("auth","true");
                setTimeToClose(true);
                setMessage("Вход успешен");
                setCorrect(true);
                console.log(response.data);
                localStorage.setItem("myUsername",response.data.username);
                localStorage.setItem("userId",response.data.id);
                localStorage.setItem("myLogin",login);
                localStorage.setItem("access_token",response.data.access_token);
                const getMyProfile = await getUserProfile(response.data.username);
                if (getMyProfile.success) {
                    localStorage.setItem("UserPhoto",getMyProfile.data.photo);
                }
                else {
                    setMessage("Ошибка получение данный этого профиля");
                    console.error(response.error);
                }
                setContextUserName(response.data.username);
                setContextUserId(response.data.id)
                setAuth(true);
                navigate(`/home`);
            }
            else{
                errorLog(response);
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

                    <div className="my-5">
                        <FormButton status={isActive} enterStatus={correct} text="Войти"></FormButton>
                    </div>
                    <div className="h-10">
                        {message && timeToClose && <FormMes text={message} type={correct ? "message" : "error"}/>}

                    </div>
                </FormFrame>
        </div>
    )
}

