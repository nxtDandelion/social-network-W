
import {logout, responseLog, responseReg} from "./API/AuthAPI/auth.js";
import {useContext} from "react";
import {AuthContext} from "./Contexts/Authcontext.jsx";


export default function DevMenu(){
    const {setAuth} = useContext(AuthContext);

    const devAcc = {
        login: "john_doe",
        userName: "John Doe",
        mail: "john.doe@example.com",
        password: "SecurePassword123!"
    };

    const handleCheck = async (event) => {
        if (event.target.checked) {
            const responseResult = await responseLog(devAcc.login, devAcc.password);
            if (responseResult){
                setAuth(true);
                console.log("Пользователь авторизован");
            }
            else {
                console.log("Пользователь не может авторизоавть,нужно сосздать аккаунт")
                const responseRegResult = await responseReg(devAcc.login,devAcc.userName,devAcc.mail,devAcc.password);
                if (responseRegResult){
                    console.log("Пользователь зарегистрирован");
                    console.log("Пользователь авторизован");
                    setAuth(true);
                    return responseLog(devAcc.login, devAcc.password);
                }
                else return (console.log("Ошибка авторизации"))
            }
        }
        else {
            logout(setAuth);
            setAuth(false);
        }
    }

    return(
        <div className="fixed left-0 top-1/2 w-fit h-fit p-5 flex justify-start flex-col bg-gray-100 rounded">
            Меню разработчика
            <label>
            <input type="checkbox" onChange={handleCheck} /> Войти
            </label>

        </div>
    )
}