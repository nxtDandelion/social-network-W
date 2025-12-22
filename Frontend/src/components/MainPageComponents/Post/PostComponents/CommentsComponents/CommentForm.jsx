import {useContext, useState} from "react";
import FormButton from "../../../../FormComponents/FormButton.jsx";
import {AuthContext} from "../../../../../Contexts/AuthContext.jsx";
import {usePostTextValidation} from "../../../../../Hooks/UsePostValidation.jsx";
import {createComment} from "../../../../../API/PostAPI/createComment.js";
import {CommentContext} from "../../../../../Contexts/CommentContext.jsx";

export default function CommentForm({postId}) {
    const {refreshToken,contextUserId} = useContext(AuthContext);
    const {setCommentCreated,commentCreated} = useContext(CommentContext);
    const [commentText, setCommentText] = useState("");
    const [isPostSend, setIsPostSend] = useState(false);
    const maxChar = 100;
    const {allowSend, symbolLimit} = usePostTextValidation(commentText, maxChar);

    const handleTextChange = (e) => {
        const text = e.target.value;
        if (text.length <= maxChar) {
            setCommentText(text);
        }
    }

    const submitHandler = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        setIsPostSend(true);

        try {
            if (contextUserId) {
                console.log(contextUserId,"MYID");
                const response = await createComment(postId, commentText, contextUserId);

                if (response.success) {
                    setCommentCreated(response.data);
                    console.log(commentCreated, "Добавленный коммент");
                    setCommentText("");
                    setIsPostSend(false);

                } else if (response.status === 401) {
                    refreshToken();
                    setIsPostSend(false);
                } else {
                    console.error("Ошибка при создании комментария:", response);
                    setIsPostSend(false);
                }
            }
            else{
                console.error("Нет id")
            }
        }
        catch
            (error)
            {
                console.error("Ошибка сети:", error);
                setIsPostSend(false);
            }


    }

    return (
        <form onSubmit={submitHandler} className="rounded-b-3xl w-[42rem] border-t-[0.1px] border-black h-fit bg-white p-3">
            <div className="flex justify-center w-full h-fit bg-white border-r-2 border-l-2 border-black">
                <textarea
                    className="w-[40rem] min-h-10 h-fit outline-none resize-none"
                    value={commentText}
                    onChange={handleTextChange}
                    placeholder="Напишите комментарий..."
                    disabled={isPostSend}
                />
            </div>
            <div className="flex justify-between items-center w-full gap-4 mt-2">
                <div className={`p-2 border-2 rounded-[40px] ${symbolLimit ? "border-red-600 text-red-600" : "border-gray-500 text-gray-500"}`}>
                    {commentText.length}/{maxChar}
                </div>
                <FormButton
                    text={isPostSend ? "Отправка..." : "Отправить"}
                    status={allowSend && !isPostSend}
                    enterStatus={isPostSend}
                    disabled={!allowSend || isPostSend}
                />
            </div>
        </form>
    )
}