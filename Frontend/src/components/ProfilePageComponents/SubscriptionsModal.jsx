import PopupBg from "../PopupComponents/PopupBg.jsx";
import SubscriptionsItem from "./SubscriptionsItem.jsx";
import CrossIcon from "../Icons/CrossIcon.jsx";

export default function SubscriptionsModal({subscriptions,curUserName,func,handleUpdate}) {

    function closeHandleClick() {
        func();
    }

    function update(){
        handleUpdate();
    }

    return(
        <PopupBg>
            <div className="flex flex-col">
                <div className={`relative flex justify-start w-full text-white py-2 h-fit bg-black rounded-t-[20px]`}>
                    <div className="ml-8">Подписки</div>
                </div>
                <div className="flex flex-col bg-white w-[23rem] h-[30rem] overflow-y-auto rounded-b-[20px]">
                    {Object.values(subscriptions).length !==0 ? (
                        Object.values(subscriptions).map(((profile,index) => (
                        <SubscriptionsItem
                            key={index}
                            id={profile.uuid}
                            name={profile.username}
                            avatar={profile.photo}
                            subscriptions={subscriptions}
                            curUserName={curUserName}
                            deleteFromList={update}
                        >
                        </SubscriptionsItem>
                    )))):(
                        <div className="text-gray-500 text-center py-8"> Ваши подписки пусты</div>
                    )}
                </div>
            </div>

            <button
                onClick={closeHandleClick}
                aria-label="Закрыть"
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-200 hover:scale-110 hover:bg-gray-50 transition-all duration-200"
            >
                <CrossIcon/>
            </button>
        </PopupBg>
    )
}