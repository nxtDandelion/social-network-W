import {useState} from "react";
import SubscribeButton from "./SubscribeButton.jsx";
import SubscribesModal from "./SubscriptionsModal.jsx";


export default function ProfileButton({text,count,status,subscribes,update3}){
    const [showSubscribers,setShowSubscribers ] = useState(false)

    function handleClick() {
            setShowSubscribers(true);
    }
    const update =()=>{
        update3();
    }

    return(
        <>
        <button onClick={handleClick} disabled={status} className="text-xl px-2 hover:opacity-60">
            {text}: {count}
        </button>
            {showSubscribers && <SubscribesModal subscribes={subscribes} ></SubscribesModal>}
        </>

    )
}