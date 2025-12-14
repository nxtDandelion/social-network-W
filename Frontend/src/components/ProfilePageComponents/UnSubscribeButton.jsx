import {unFollowProfile} from "../../API/ProfileAPI/unFollowProfile.js";
import {AuthContext} from "../../Contexts/AuthContext.jsx";
import {useContext, useState} from "react";

export default function UnSubscribeButton({name,curUserName,hideProfile}) {
    const {refreshToken} = useContext(AuthContext);
    const [error,setError] = useState(false);

    const unSub = async () =>{
        const response = await unFollowProfile(curUserName,name)
        if (response.success){
            console.log(`Профиль ${name} отписан`);
            hideProfile();
        }
        else if (response.statusCode===404){
            refreshToken();
        }
        else{
            setError(true);
            return response.error;

        }
    }
    //TODO:удаляем профиль апдейт список подписок устанавливаем disable профиль


    return(
        <button className={"flex justify-center items-center w-fit h-fit px-5 py-1 mt-2 text-xs bg-gray-200 text-black rounded-full transition-all duration-300 ease-in-out"} onClick={unSub}>
            Отписаться
        </button>
    )
}