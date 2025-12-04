import {SearchIcon} from "../components/Icons/SearchIcon.jsx";
import {Link} from "react-router-dom";

import {AuthContext} from "../authcontext.jsx";
import {useContext} from "react";

export default function OldTokenPage() {

    const {setInvalidToken} = useContext(AuthContext);



    return (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black">
            <div className=" flex flex-col w-fit h-fit p-10 justify-center items-center bg-white rounded-3xl opacity-95">
                <SearchIcon/>
                <h2 className="text-2xl font-bold mb-4">Ваш токен недействителен</h2>
                <p className="text-gray-600 mb-4">Срок вашего токена авторизации истек! Перезайдите в учетную запись для его обновления</p>
                <Link onClick={() =>setInvalidToken(false)} to="/home" className="text-black underline hover:text-gray-500">
                    Вернуться на главную
                </Link>
                <Link onClick={() =>setInvalidToken(false)} to="/login" className="text-black underline hover:text-gray-500">
                    Войти снова
                </Link>


            </div>
        </div>
    )
}