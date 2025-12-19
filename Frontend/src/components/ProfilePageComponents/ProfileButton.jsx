import {useState} from "react";
import SubscribesModal from "./SubscriptionsModal.jsx";


export default function ProfileButton({text,count,status,subscribes,update3}){
    const [showSubscribers,setShowSubscribers ] = useState(false)


    return(
        <>
        <button  disabled={status} className="text-xl px-2 hover:opacity-60">
            {text}: {count}
        </button>
            {showSubscribers && <SubscribesModal subscribes={subscribes} ></SubscribesModal>}
        </>

    )
}