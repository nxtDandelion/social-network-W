import {useContext, useState} from "react";
import MainPage from "../../pages/MainPage.jsx";
import LoginPage from "../../pages/LoginPage.jsx";
import {AuthContext} from "../../authcontext.jsx";
import {useNavigate} from "react-router-dom";

export default function CreatePostBtn() {
    const {auth,setShowLoginMes} = useContext(AuthContext);

    const createPost = () => {
        if (!auth) {
            setShowLoginMes(true);
        }
        else {}
    }

    return (

        <div>
            <button className="inline-block w-44 h-10 bg-white text-xl font-bold border-none rounded-[40px] hover:opacity-80"
                    onClick={createPost}>
                        Создать пост
            </button>
        </div>
    )
}
