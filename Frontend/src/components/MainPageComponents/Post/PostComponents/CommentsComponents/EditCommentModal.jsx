import CrossIcon from "../../../../Icons/CrossIcon.jsx";
import ProfileInfo from "../ProfileInfo.jsx";
import FormButton from "../../../../FormComponents/FormButton.jsx";
import PopupBg from "../../../../PopupComponents/PopupBg.jsx";
import {useContext, useState} from "react";
import {AuthContext} from "../../../../../Contexts/AuthContext.jsx";

import {usePostTextValidation} from "../../../../../Hooks/UsePostValidation.jsx";
import CommentOtherMenu from "./CommentOtherMenu.jsx";

export default function EditCommentModal({sendForm,closeModal,initText,userAvatar}) {
    const {contextUserName,contextUserId} = useContext(AuthContext);
    const [postText,setPostText] = useState(initText || "");
    const [isPostSend,setIsPostSend] = useState(false);
    const maxChar = 100;
    const {allowSend, symbolLimit} = usePostTextValidation(postText, maxChar,initText);
    console.log(allowSend,"allowSend");
    function handleClose(e) {
        e.preventDefault();
        closeModal();
    }

    const handleTextChange = (e) =>{
        const text = e.target.value;
        if (text.length <= maxChar){
            setPostText(text);
        }
    }

    const submit = async (e) =>{
        e.preventDefault();
        await sendForm(postText);
    }


    return(
        <PopupBg>
            <form onSubmit={submit} className="flex flex-col items-end  relative w-fit h-fit pt-12 px-5 bg-white rounded-[40px]">
                <button onClick={handleClose} aria-label="Закрыть" className="absolute top-3 right-3 z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-200 hover:scale-110 transition-transform duration-200">
                    <CrossIcon/>
                </button>
                <div className="flex flex-col min-w-[40rem] min-h-[20rem]]">
                    <div className="relative flex flex-col w-full p-1">
                        <div className="flex">
                            <div>
                                <img className="w-14 h-14 rounded-full object-cover" src={`${userAvatar ? userAvatar :`/avatars/defaultAvatar.png`}`}  alt={`Аватар ${contextUserName}`} />
                            </div>
                            <div className="flex flex-col justify-start items-start w-fit max-w-[38rem] h-fit">
                                <div className="w-[28rem]">
                                    <span className="mr-1">
                                        {contextUserName}
                                    </span>
                                    <span className="text-gray-600">
                                        {`@${contextUserName}`}
                                    </span>
                                </div>
                                <textarea className="min-w-[38rem] h-fit outline-none resize-none"
                                          value={postText}
                                          onChange={handleTextChange}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-between items-center w-full gap-4 my-5">
                    <div className={` p-2 border-2 border-gray-500 rounded-[40px] ${symbolLimit ? "border-red-600" : "border-gray-500"}`}>{postText.length}/100</div>
                    <FormButton text="Сохранить" status={allowSend} enterStatus={isPostSend}/>
                </div>
            </form>
        </PopupBg>
    )
}