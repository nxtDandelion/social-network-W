import FormInput from "../components/FormComponents/FormInput.jsx";
import FormButton from "../components/FormComponents/FormButton.jsx";
import FormFrame from "../components/FormComponents/FormFrame.jsx";
import {Navigate, useNavigate} from "react-router-dom";
import MainPage from "./MainPage.jsx";
import {useContext, useEffect, useState} from "react";
import {AuthContext} from "../authcontext.jsx";
import FormMes from "../components/FormComponents/FormMes.jsx";
import {lenghtCheck, loginValid, passwordValid} from "../assets/validation.js";

export default function LoginPage() {

    const navigate = useNavigate();
    const {setAuth} = useContext(AuthContext);
    const [timeToClose, setTimeToClose] = useState(true);
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [correct, setCorrect] = useState(false);
    const [message, setMessage] = useState("");
    const [isActive, setIsActive] = useState(false);

    const close = () => {
        navigate(-1);
    }

    const checkForm = () => {
        const loginValidation = loginValid(login);
        const passwordValidation = passwordValid(password);
        const serverLogin = localStorage.getItem('login');
        const serverPassword = localStorage.getItem('password');

        if (loginValidation.isValid && passwordValidation.isValid) {
            console.log("Данные валидны",login, password);
            if (serverLogin===login && serverPassword===password) {
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

