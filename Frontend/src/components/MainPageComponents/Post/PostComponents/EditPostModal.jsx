import CrossIcon from "../../../Icons/CrossIcon.jsx";
import ProfileInfo from "./ProfileInfo.jsx";
import FormButton from "../../../FormComponents/FormButton.jsx";
import PopupBg from "../../../PopupComponents/PopupBg.jsx";
import {useContext, useState} from "react";
import {AuthContext} from "../../../../Contexts/AuthContext.jsx";
import {usePostTextValidation} from "../../../../Hooks/UsePostValidation.jsx";

export default function EditPostModal({sendForm,closeModal,initText,edited,myAvatar}) {
    const {contextUserName} = useContext(AuthContext);
    const [postText,setPostText] = useState(initText || "");
    const [isPostSend,setIsPostSend] = useState(false);
    const maxChar = 1000;
    const {allowSend, symbolLimit} = usePostTextValidation(postText, maxChar,initText);

    function handleClose(e) {
        e.preventDefault();
        closeModal();
    }

    const handleInput = (e) => {
        const text = e.target.value;
        const filteredText = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');

        if (filteredText !== text) {
            e.target.value = filteredText;
        }

        if (filteredText.length <= maxChar){
            setPostText(filteredText);
        }
    }

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedText = e.clipboardData.getData('text/plain');

        const filteredText = pastedText.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');

        const textarea = e.target;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        const newText = postText.substring(0, start) + filteredText + postText.substring(end);

        if (newText.length <= maxChar) {
            setPostText(newText);

            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + filteredText.length;
            }, 0);
        }
    }

    const submit = async (e) =>{
        e.preventDefault();
        await sendForm(postText);
    }

    return(
        <PopupBg>
            <form onSubmit={submit} className="flex flex-col items-end relative w-fit h-fit pt-12 px-5 bg-white rounded-[40px] min-w-[42rem] max-w-[90vw]">
                <button onClick={handleClose} aria-label="Закрыть" className="absolute top-3 right-3 z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-200 hover:scale-110 transition-transform duration-200">
                    <CrossIcon/>
                </button>
                <div className="flex flex-col w-full min-h-96">
                    <div className="flex justify-between w-full max-h-20 pr-4 pl-4 pt-2 bg-black rounded-t-3xl">
                        <ProfileInfo
                            component="post"
                            userName={contextUserName}
                            userTag={`@${contextUserName}`}
                            userAvatar={myAvatar}
                        />
                        <div className={`${edited ? "inline-block" : "hidden"} text-white`}>
                            Отредактирован
                        </div>
                    </div>

                    <div className="flex justify-center w-full min-h-80 h-fit p-4 bg-white border-r-2 border-l-2 border-black">
                        <textarea
                            className="w-full min-h-80 h-fit outline-none resize-none whitespace-pre-wrap break-words overflow-wrap-anywhere"
                            value={postText}
                            onInput={handleInput}
                            onPaste={handlePaste}
                            placeholder="Диктуйте миру ваши мысли..."
                            style={{wordBreak: "break-word"}}
                        />
                    </div>
                    <div className="flex w-full h-14 bg-black"></div>
                </div>
                <div className="flex justify-between items-center w-full gap-4 my-5">
                    <div className={`p-2 border-2 rounded-[40px] ${symbolLimit ? "border-red-600" : "border-gray-500"}`}>
                        {postText.length}/1000
                    </div>
                    <FormButton text="Сохранить" status={allowSend} enterStatus={isPostSend}/>
                </div>
            </form>
        </PopupBg>
    )
}