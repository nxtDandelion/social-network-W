import FormInput from "../compoments/Form/FormInput.jsx";
import FormButton from "../compoments/Form/FormButton.jsx";
import FormFrame from "../compoments/Form/FormFrame.jsx";
import MainPage from "./MainPage.jsx";
import {Navigate, useNavigate} from "react-router-dom";
import {useState} from "react";
import {emailValid, loginValid, passwordValid} from "../assets/validation.js";
import FormMes from "../compoments/Form/FormMes.jsx";


export default function RegistrationPage() {

    const [mail, setMail] = useState("");
    const [login, setLogin] = useState("");
    const [userName, setUserName] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [correct, setCorrect] = useState(false)
    const [message, setMessage] = useState("")

    const navigate = useNavigate();

    const close = () => {
        navigate(-1);
    }

    const checkForm = () => {

        const loginValidation = loginValid(login);
        const passwordValidation = passwordValid(password);
        const mailValidation = emailValid(mail);
        const userNameValidation =loginValid(userName);


        if (loginValidation.isValid && passwordValidation.isValid && mailValidation.isValid) {
            console.log("Все данные валидны")
            if (password === passwordConfirm) {

                console.log("Пароли совпадают")
                localStorage.setItem("login", login);
                localStorage.setItem("password", password);
                setMessage("Все верно,пользователь создан");
                setCorrect(true);
                navigate("/profile");
            } else {
                setCorrect(false);
                setMessage("Пароли не совпадают");
            }
        } else {
            if (!loginValidation.isValid) {
                setMessage(loginValidation.message);
            } else if (!passwordValidation.isValid) {
                setMessage(passwordValidation.message);
            } else if (!mailValidation.isValid) {
                setMessage(mailValidation.message);
            }
            else if (!userNameValidation.isValid) {
                setMessage(userNameValidation.message);
            }
            setCorrect(false);
        }
    }



    return (
        <div>
            <MainPage></MainPage>
                <FormFrame refMessage="Уже есть аккаунт? Войти" path="/login" message="Станьте частью большего!" submitForm={checkForm} onClose={close}>
                    <FormInput formType="text" labelText="Имя пользователя" formValue={userName} onChange={(e)=>setUserName(e.target.value)} />
                    <FormInput formType="text" labelText="Логин" formValue={login} onChange={(e)=>setLogin(e.target.value)} />
                    <FormInput formType="mail" labelText="Email" formValue={mail} onChange={(e)=>setMail(e.target.value)} />
                    <FormInput formType="password" labelText="Пароль" formValue={password} onChange={(e)=>setPassword(e.target.value)} />
                    <FormInput formType="password" labelText="Подтверждение пароль" formValue={passwordConfirm} onChange={(e)=>setPasswordConfirm(e.target.value)} />
                    <FormButton text="Зарегестрироваться"></FormButton>
                    {message && <FormMes text={message} type={correct ? "message" : "error"}/>}
                </FormFrame>


        </div>

    );
}