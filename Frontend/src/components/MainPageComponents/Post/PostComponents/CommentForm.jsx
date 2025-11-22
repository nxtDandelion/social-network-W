import {useContext, useEffect, useState} from "react";
import FormButton from "../../../FormComponents/FormButton.jsx";
import {AuthContext} from "../../../../authcontext.jsx";

export default function CommentForm() {
    const {auth,setShowLoginMes} = useContext(AuthContext);
    const [showCreatePost,setShowCreatePost] = useState(false);
    const [postText,setPostText] = useState("");
    const [isPostSend,setIsPostSend] = useState(false);
    const [allowSend,setAllowSend] = useState(false);
    const [symbolLimit,setSymbolLimit] = useState(false);
    const maxChar = 100;

    const handleTextChange = (e) =>{
        const text = e.target.value;
        let maxChar = 100;
        if (text.length <= maxChar){
            setPostText(text);
        }
    }

    useEffect(()=>{
        if ( postText.length === 0){
            setAllowSend(false);
            setSymbolLimit(false);
        }
        else if (postText.length > maxChar){
            setAllowSend(false);
            setSymbolLimit(true);
        }
        else {
            setSymbolLimit(false);
            setAllowSend(true);
        }
    },[postText])

    return(
        <form className="sticky rounded-b-3xl w-[42rem] h-fit bg-white p-3">
            <div className="flex justify-center w-full h-fit bg-white border-r-2 border-l-2 border-black">
                <textarea className="w-[40rem] min-h-10 h-fit outline-none resize-none" value={postText} onChange={handleTextChange}/>
            </div>
            <div className="flex justify-between items-center w-full gap-4 mb-5">
                <div className={` p-2 border-2 border-gray-500 rounded-[40px] ${symbolLimit ? "border-red-600" : "border-gray-500"}`}>{postText.length}/100</div>
                <FormButton text="Отправить" status={allowSend} enterStatus={isPostSend}/>
            </div>
        </form>
    )
}