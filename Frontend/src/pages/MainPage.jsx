import Feed from "../components/MainPageComponents/Feed.jsx";

import Header from "../components/MainPageComponents/Header.jsx";
import {useContext, useEffect} from "react";
import {AuthContext} from "../authcontext.jsx";
import LoginPage from "./LoginPage.jsx";
import {SearchIcon} from "../components/Icons/SearchIcon.jsx";
import CrossIcon from "../components/Icons/CrossIcon.jsx";
import {useNavigate} from "react-router-dom";

export default function MainPage() {

    const {showLoginMes,setShowLoginMes}=useContext(AuthContext);

    function handleClose() {
            setShowLoginMes(false);
    }

    useEffect(() => {

    }, []);

    return (

            <div className="flex flex-col relative">
                <Header/>
                <Feed

                />
                {showLoginMes && (
                    <div className="fixed inset-0  z-50 flex justify-center items-center bg-black bg-opacity-70 backdrop-blur-sm transition-opacity duration-300">
                        <div className="relative flex flex-col justify-center items-center max-w-md w-fit h-fit px-4 py-8 border-black border-[3px] bg-white rounded-[40px]">
                            <button onClick={handleClose} aria-label="Закрыть" className="absolute top-3 right-3 z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-200 hover:scale-110 transition-transform duration-200">
                                <CrossIcon />
                            </button>
                            <SearchIcon className="my-8"/>
                            <div className="flex align-middle text-center justify-center items-center text-xl"> Для использования запрошенных функций необходима авторизация в профиль.   </div>
                            <a href="/login" className="mt-8 px-5 py-2 text-xl text-black border-black border-2 rounded-full hover:text-gray-600 cursor-pointer">войти</a>
                        </div>
                    </div>
                )}
            </div>
   )
}