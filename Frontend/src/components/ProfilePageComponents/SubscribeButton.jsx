import {useContext, useEffect, useState} from "react";
import {followProfile} from "../../API/ProfileAPI/followProfile.jsx";
import {unFollowProfile} from "../../API/ProfileAPI/unFollowProfile.js";
import {AuthContext} from "../../Contexts/AuthContext.jsx";

export default function ({status,subscribes,profileUsername,updateSubscribersList,size}){
    const [subStatus,setSubStatus] = useState(false);
    const [error,setError] = useState(false);
    const [text,setText] = useState("");
    const myUsername = localStorage.getItem("myUsername");
    const [isLoading, setIsLoading] = useState(false);
    const {refreshToken} = useContext(AuthContext);


    useEffect(()=>{
        checkSubscribe();
        console.log(subscribes,"Список подписчиков");
        console.log(subStatus);
    },[])

    useEffect(()=>{
        if (subStatus){
            setText("Отписаться");
        }
        else setText("Подписаться");

    }, [subStatus])

    const checkSubscribe = () =>{

        const hasMyName = Object.keys(subscribes).includes(myUsername);
        console.log(subscribes);
        if (hasMyName){
            setSubStatus(true);
        }
        else {
            setSubStatus(false);
        }
    }

    const handleSubscribe = async () =>{
        if (isLoading) return;

        setIsLoading(true);
        try {
            if (subStatus) {
                await unSubscribe(myUsername, profileUsername);
            } else {
                await subscribe(myUsername, profileUsername);
            }
            await updateSubscribersList();

        }
        finally {
            setIsLoading(false);
        }
    }

    const unSubscribe= async (myUsername,profileUsername)=>{
        const response =await unFollowProfile(myUsername,profileUsername);
        if (response.success){
        setSubStatus(false);
        } else if (response.statusCode === 401) {
            console.error(response.error);
            refreshToken();
        } else{
            setError(true);
            return response.error;
        }
    }
    const subscribe = async (myUsername,profileUsername) => {
        const response = await followProfile(myUsername, profileUsername);
        if (response.success) {
            setSubStatus(true);
        } else if (response.statusCode === 401) {
            console.error(response.error);
            refreshToken();
        } else {
            setError(true);
            return response.error;
        }
    }
    return(
        <button className={`${status ? "flex" : "hidden"} ${subStatus ? "bg-gray-200 text-black" : "bg-black text-white"}  w-fit h-fit justify-center items-center px-5 py-1 mt-2 text-${size} border-black border-2 rounded-full transition-all duration-300 ease-in-out`} onClick={handleSubscribe}>
            {text}
        </button>
    )
}