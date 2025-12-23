import ProfileInfo from "../MainPageComponents/Post/PostComponents/ProfileInfo.jsx";
import SubscribeButton from "./SubscribeButton.jsx";
import {updateUserProfile} from "../../API/ProfileAPI/updateUserProfile.jsx";
import {getFollowers} from "../../API/ProfileAPI/getFollowers.js";
import UnSubscribeButton from "./UnSubscribeButton.jsx";
import {useState} from "react";

export default function SubscriptionsItem({name,avatar,id,subscriptions,curUserName,deleteFromList}){
    const [profileDisable,setProfileDisable] =useState(false);

    console.log("SubscriptionsItem:",subscriptions);
    // const update = () =>{
    //     update1()
    // }

    function deleteProfile(){
        setProfileDisable(true);
        deleteFromList();
    }

    return(
        <div className={`${profileDisable ? "hidden" : "flex"} flex-col justify-between items-end p-4 border-b-[0.25px] border-gray-200`}>
            <ProfileInfo
                userName={name}
                userAvatar={`defaultAvatar.png`}
                userId={id}
            >
                <UnSubscribeButton
                    subscriptionsList={subscriptions}
                    name={name}
                    curUserName={curUserName}
                    hideProfile={deleteProfile}
                />
            </ProfileInfo>

        </div>
    )
}