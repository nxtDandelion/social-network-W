import {useNavigate} from "react-router-dom";

export default function ProfileInfo({userName,userTag, userAvatar,userId,component,children}) {
    const navigate = useNavigate();

    function navigateTo() {
            navigate(`/profile/${userName}`);
        }

    return (

        <div  id={userId} className="flex cursor-pointer">
            <div onClick={navigateTo} className="flex w-16 h-16 mr-2">
                <img className="w-14 h-14 rounded-full object-cover" src={`${userAvatar ? userAvatar :`/avatars/defaultAvatar.png`}`}  alt={`Аватар ${userName}`} />
            </div>
            <div className="flex flex-col">
                <p onClick={navigateTo} className={`${component === "post" ? "text-white" :"text-black"} text-2xl`}>{userName}</p>
                <a onClick={navigateTo} className={`${component === "post" ? "text-[#C0C0C0]" :"text-black text-opacity-75"} text-sm`}>{userTag}</a>
                <div className="flex w-full justify-end">
                    {children}
                </div>
            </div>
        </div>
    )
}