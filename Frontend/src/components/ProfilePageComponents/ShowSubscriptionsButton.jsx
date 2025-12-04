import {useState} from "react";
import SubscribeButton from "./SubscribeButton.jsx";
import subscriptionsModal from "./SubscriptionsModal.jsx";
import SubscriptionsModal from "./SubscriptionsModal.jsx";


export default function ShowSubscriptionsButton({text,count,status,subscriptions,myName,updateList}){
    const [showSubscriptions,setShowSubscriptions ] = useState(false)

    function handleClick() {
        setShowSubscriptions(true);
    }

    function closeModal(){
        setShowSubscriptions(false);
    }
    function update(){
        updateList();
    }

    return(
        <>
            <button onClick={handleClick} disabled={status} className="text-xl px-2 hover:opacity-60">
                {text}: {count}
            </button>
            {showSubscriptions && <SubscriptionsModal subscriptions={subscriptions} curUserName={myName} func={closeModal} handleUpdate={update}></SubscriptionsModal>}
        </>

    )
}