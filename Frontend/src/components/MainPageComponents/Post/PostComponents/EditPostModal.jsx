import CrossIcon from "../../../Icons/CrossIcon.jsx";
import ProfileInfo from "./ProfileInfo.jsx";
import FormButton from "../../../FormComponents/FormButton.jsx";
import PopupBg from "../../../PopupComponents/PopupBg.jsx";
import {useContext, useState} from "react";
import {AuthContext} from "../../../../Contexts/AuthContext.jsx";

import {usePostTextValidation} from "../../../../Hooks/UsePostValidation.jsx";

export default function EditPostModal({sendForm,closeModal,initText,edited}) {
    const {contextUserName} = useContext(AuthContext);
    const [postText,setPostText] = useState(initText || "");
    const [isPostSend,setIsPostSend] = useState(false);
    const maxChar = 1000;
    const {allowSend, symbolLimit} = usePostTextValidation(postText, maxChar,initText);



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
                <div className="flex flex-col w-[42rem]  min-h-96">
                    <div className="flex justify-between w-[42rem]  max-h-20 pr-4 pl-4 pt-2 bg-black rounded-t-3xl">
                        <ProfileInfo
                            component="post"
                            userName={contextUserName}
                            userTag={`@${contextUserName}`}
                            userAvatar={"defaultAvatar.png" }
                        />
                        <div className={`${edited ? "inline-block" : "hidden"} text-white`}>
                            Отредактирован
                        </div>
                    </div>

                    <div className="flex justify-center w-[42rem] min-h-80 h-fit p-2 bg-white border-r-2 border-l-2 border-black">
                        <textarea className="w-[40rem] min-h-80 h-fit outline-none resize-none"
                                  value={postText}
                                  onChange={handleTextChange}
                                  placeholder="Диктуйте миру ваши мысли..."
                        />
                    </div>
                    <div className="flex w-2xl h-14 bg-black"></div>
                </div>
                <div className="flex justify-between items-center w-full gap-4 my-5">
                    <div className={` p-2 border-2 border-gray-500 rounded-[40px] ${symbolLimit ? "border-red-600" : "border-gray-500"}`}>{postText.length}/1000</div>
                    <FormButton text="Сохранить" status={allowSend} enterStatus={isPostSend}/>
                </div>
            </form>
        </PopupBg>
    )
}