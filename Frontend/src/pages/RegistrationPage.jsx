import FormInput from "../components/FormComponents/FormInput.jsx";
import FormButton from "../components/FormComponents/FormButton.jsx";
import FormFrame from "../components/FormComponents/FormFrame.jsx";
import MainPage from "./MainPage.jsx";
import {Navigate, useNavigate} from "react-router-dom";
import {useContext, useEffect, useState} from "react";
import {emailValid, lenghtCheck, loginValid, passwordValid} from "../API/AuthAPI/validation.js";
import FormMes from "../components/FormComponents/FormMes.jsx";
import axios from "axios";
import {API_BASE_URL} from "../config.js";
import {responseLog, responseReg} from "../API/AuthAPI/auth.js";
import {AuthContext} from "../Contexts/AuthContext.jsx";



export default function RegistrationPage() {

    const {setAuth,setContextUserName} = useContext(AuthContext);
    const [timeToClose, setTimeToClose] = useState(true);
    const [mail, setMail] = useState("");
    const [login, setLogin] = useState("");
    const [userName, setUserName] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [correct, setCorrect] = useState(false);
    const [message, setMessage] = useState("");
    const [isActive, setIsActive] = useState(false);
    const navigate = useNavigate();



    async function logIn(login,password) {
        const response = await responseLog(login, password);
        if (response.success) {
            setCorrect(true);
            setTimeToClose(true);
            setMessage("Вход успешен");
            const myUsername = response.data.username;
            localStorage.setItem("auth", "true");
            localStorage.setItem("myUsername", myUsername);
            localStorage.setItem("access_token", response.data.access_token);
            setContextUserName(myUsername);
            setAuth(true);
            navigate(`/profile/${myUsername}`);
        }
    }
    useEffect(() => {
        if (lenghtCheck(login) && lenghtCheck(password) && lenghtCheck(mail) && lenghtCheck(userName) && lenghtCheck(passwordConfirm)) {
            setIsActive(true);

        } else {
            setIsActive(false);
        }
    }, [mail, login, password, passwordConfirm, userName]);

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
        const mailValidation = emailValid(mail);
        const userNameValidation = loginValid(userName);

        if (userNameValidation.isValid&&loginValidation.isValid && passwordValidation.isValid && mailValidation.isValid) {
            console.log("Все данные валидны");
            if (password === passwordConfirm) {
                const response =  await responseReg(login, userName, mail, password);
                if (response.success){
                    setCorrect(true);
                    console.log("Пароли совпадают");
                    setMessage("Все верно,пользователь создан");
                    console.log("Все хорошо");
                    await logIn(login,password);
                }
                else{
                    setCorrect(false);
                    console.log("Ошибка");
                    setTimeToClose(true);
                    if (response.custom) {
                        const message = response.message;
                        setMessage(message);
                    }
                    else setMessage("Ошибка регистрации");
                }
            } else {
                setCorrect(false);
                setTimeToClose(true);
                setMessage("Пароли не совпадают");
            }
        } else {
            if (!loginValidation.isValid) {
                setTimeToClose(true);
                setMessage(loginValidation.message);
            } else if (!passwordValidation.isValid) {
                setTimeToClose(true);
                setMessage(passwordValidation.message);
            } else if (!mailValidation.isValid) {
                setTimeToClose(true);
                setMessage(mailValidation.message);
            } else if (!userNameValidation.isValid) {
                setTimeToClose(true);
                setMessage(userNameValidation.message);
            }
            setCorrect(false);
        }

    }


    return (
        <div>
            <MainPage></MainPage>
                <FormFrame refMessage="Уже есть аккаунт? Войти" path="/login" message="Станьте частью большего" submitForm={checkForm} onClose={close}>
                    <div className="h-[440px]">
                    <FormInput  hintText={"Допустимы: [a-z,1-9,0,_]"}  formType="text" labelText="Имя пользователя"
                                formValue={userName} onChange={(e)=>setUserName(e.target.value)} />
                    <FormInput  hintText={"Допустимы: [a-z,1-9,0,_]"} formType="text" labelText="Логин"
                                formValue={login} onChange={(e)=>setLogin(e.target.value)} />
                    <FormInput  hintText={"Пример: name@example.com"}  formType="mail" labelText="Email"
                                formValue={mail} onChange={(e)=>setMail(e.target.value)} />
                    <FormInput  hintText={"Допустимы: [a-z,1-9,0,_,!,@,#,$,_,*,&,%]"}  formType="password" labelText="Пароль"
                                formValue={password} onChange={(e)=>setPassword(e.target.value)} />
                    <FormInput  hintText={"Повторите пароль"}  formType="password" labelText="Подтверждение пароль"
                                formValue={passwordConfirm} onChange={(e)=>setPasswordConfirm(e.target.value)} />
                    </div>
                    <FormButton status={isActive} text="Зарегистрироваться"></FormButton>
                    <div className="h-10 my-2">
                         {message && timeToClose && <FormMes text={message} type={correct ? "message" : "error"}/>}
                    </div>
                </FormFrame>


        </div>

    );
}