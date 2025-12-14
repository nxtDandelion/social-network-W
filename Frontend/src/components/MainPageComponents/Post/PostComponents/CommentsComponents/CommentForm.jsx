import {useContext, useEffect, useState} from "react";
import FormButton from "../../../../FormComponents/FormButton.jsx";
import {AuthContext} from "../../../../../Contexts/AuthContext.jsx";
import {usePostTextValidation} from "../../../../../Hooks/UsePostValidation.jsx";
import {responseCommentsList} from "../../../../../API/PostAPI/getCommentsList.js";
import {createComment} from "../../../../../API/PostAPI/createComment.js";

export default function CommentForm({userId,postId}) {
    const {refreshToken} = useContext(AuthContext);
    const [commentText,setCommentText] = useState("");
    const [isPostSend,setIsPostSend] = useState(false);
    const maxChar = 100;
    const {allowSend, symbolLimit} = usePostTextValidation(commentText, maxChar);

    const handleTextChange = (e) =>{
        const text = e.target.value;
        let maxChar = 100;
        if (text.length <= maxChar){
            setCommentText(text);
        }
    }

    const submitHandler = async (e) =>{
        e.preventDefault();
        const response = await createComment(postId,commentText,userId);
        if(response.success){
            //todo логика обновления
        }
        else if (response.status === 401){
            refreshToken();
        }
    }

    return(
        <form onSubmit={submitHandler} className="rounded-b-3xl w-[42rem] border-t-[0.1px] border-black h-fit bg-white p-3">
            <div className="flex justify-center w-full h-fit bg-white border-r-2 border-l-2 border-black">
                <textarea className="w-[40rem] min-h-10 h-fit outline-none resize-none" value={commentText} onChange={handleTextChange}/>
            </div>
            <div className="flex justify-between items-center w-full gap-4">
                <div className={` p-2 border-2 border-gray-500 rounded-[40px] ${symbolLimit ? "border-red-600" : "border-gray-500"}`}>{commentText.length}/100</div>
                <FormButton  text="Отправить" status={allowSend} enterStatus={isPostSend}/>
            </div>
        </form>
    )
}