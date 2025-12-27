import {useNavigate} from "react-router-dom";

export default function ProfileInfo({userName,userTag, userAvatar,userId,component,children}) {
    const navigate = useNavigate();

    function navigateTo() {
        navigate(`/profile/${userName}`);
    }

    return (
        <div onClick={navigateTo} id={userId} className="flex cursor-pointer">
            <div className="flex w-16 h-16 mr-2">
                <img className="w-14 h-14 rounded-full object-cover" src={`/avatars/${userAvatar}`}  alt={`Аватар ${userName}`} />
            </div>
            <div className="flex flex-col">
                <p className={`${component === "post" ? "text-white" :"text-black"} text-2xl`}>{userName}</p>
            </div>
        </div>
    )
}