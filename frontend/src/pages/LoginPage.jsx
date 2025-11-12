import FormInput from "../compoments/Form/FormInput.jsx";
import FormButton from "../compoments/Form/FormButton.jsx";
import FormFrame from "../compoments/Form/FormFrame.jsx";
import {Navigate, useNavigate} from "react-router-dom";
import MainPage from "./MainPage.jsx";
import {useContext, useEffect, useState} from "react";
import {AuthContext} from "../authcontext.jsx";
import FormMes from "../compoments/Form/FormMes.jsx";
import {loginValid, passwordValid} from "../assets/validation.js";


export default function LoginPage({currentPage}) {

    const navigate = useNavigate();
    const rightValue = {rightPas:"Alex",rightLog:"Alex"}

    const {redirectPath,setAuth} = useContext(AuthContext);
    const [login,  setLogin] = useState("")
    const [password,setPassword] = useState("")
    const [correct,setCorrect] = useState(false)
    const [message,setMessage] = useState("")

    const close = () => {
        navigate(-1);
    }



    const checkForm = () => {

        const loginValidation = loginValid(login);
        const passwordValidation = passwordValid(password);
        const serverLogin = localStorage.getItem('login');
        const serverPassword = localStorage.getItem('password');


        if (loginValidation.isValid && passwordValidation.isValid) {
            console.log("Данные валидный",login, password);
            if (serverLogin===login && serverPassword===password) {
                localStorage.setItem("auth","true");
                setAuth(true);

                setCorrect(true);

                setMessage("Вход успешен");
                setTimeout(() => {
                    navigate("/home");
                },1000)

            }
            else{
                setCorrect(false);
                setMessage("Не верные данные");
            }
        }
        else{
            if (!loginValidation.isValid){
                setMessage(loginValidation.message);
            }
            else {
                setMessage(passwordValidation.message);
            }
        }
    }

    return (
        <div>
            <MainPage></MainPage>
                <FormFrame path="/registration" refMessage="Нет аккаунта? Зарегистрируйся!" message="Добро пожаловать!" onClose={close} submitForm={checkForm}>
                    <FormInput formType="text" labelText="Логин" formValue={login} onChange={(e) => setLogin(e.target.value)}/>
                    <FormInput formType="password" labelText="Пароль" formValue={password} onChange={(e) => setPassword(e.target.value)} />

                    <FormButton text="Войти"></FormButton>
                    {message && <FormMes text={message} type={correct ? "message" : "error"}/>}


                </FormFrame>

        </div>
    )
}

