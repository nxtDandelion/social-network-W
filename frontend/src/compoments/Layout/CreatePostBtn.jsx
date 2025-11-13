import {useContext, useState} from "react";
import MainPage from "../../pages/MainPage.jsx";
import LoginPage from "../../pages/LoginPage.jsx";
import {AuthContext} from "../../authcontext.jsx";
import {useNavigate} from "react-router-dom";

export default function CreatePostBtn() {
    const {auth,showLogin,setShowLogin} = useContext(AuthContext);

    const navigate = useNavigate();


    const createPost = () => {
        if (!auth) {
            navigate("/login");
            console.log("кнопка_Нажата_пользователь не авторизован");
        }
        else {}
    }

    return (


        <button className="inline-block w-44 h-10 bg-white text-xl font-bold border-none rounded-[40px] hover:opacity-80"
                onClick={createPost}>
                    Создать пост
        </button>



    )
}
