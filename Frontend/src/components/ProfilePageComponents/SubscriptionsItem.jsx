
import UnSubscribeButton from "./UnSubscribeButton.jsx";
import {useState} from "react";
import {useNavigate} from "react-router-dom";

export default function SubscriptionsItem({name,avatar,id,subscriptions,curUserName,deleteFromList}){
    const [profileDisable,setProfileDisable] =useState(false);
    const navigate = useNavigate();

    console.log("SubscriptionsItem:",subscriptions);

    function deleteProfile(){
        setProfileDisable(true);
        deleteFromList();
    }

    function navigateTo() {
        navigate(`/profile/${name}`);
    }

    return(
        <div className={`${profileDisable ? "hidden" : "flex"} flex justify-between items-start p-4 border-b-[0.25px] border-gray-200`}>
            <div  id={id} className="flex  cursor-pointer">
                <div onClick={navigateTo} className="flex w-16 h-16 mr-2">
                    <img className="w-14 h-14 rounded-full object-cover" src={`${avatar ? avatar :`/avatars/defaultAvatar.png`}`}  alt={`Аватар ${name}`} />
                </div>
                <div className="flex flex-col">
                    <p onClick={navigateTo} className={`text-black text-2xl`}>{name}</p>
                    <a onClick={navigateTo} className={`text-black text-opacity-75 text-sm`}>{`@${name}`}</a>
                    <div className="flex w-full justify-end">

                    </div>
                </div>
            </div>
            <UnSubscribeButton
                subscriptionsList={subscriptions}
                name={name}
                curUserName={curUserName}
                hideProfile={deleteProfile}
            />


        </div>
    )
}