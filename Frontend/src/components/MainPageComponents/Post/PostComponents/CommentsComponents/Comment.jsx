import ProfileInfo from "../ProfileInfo.jsx";
import CommentOtherMenu from "./CommentOtherMenu.jsx";
import {LikeIcon} from "../../../../Icons/LikeIcon.jsx";
import {useContext, useEffect, useState} from "react";
import {AuthContext} from "../../../../../Contexts/AuthContext.jsx";
import {deleteCommentLike} from "../../../../../API/PostAPI/deleteCommentLike.js";
import {postCommentLike} from "../../../../../API/PostAPI/postCommentLike.js";

export default function Comment({
                                    commentId, commentUserId, postId, commentUserName, userTag,
                                    commentText, createDate, commentLikers = []
                                }) {

    const {auth,setShowLoginMes,contextUserName,contextUserId,refreshToken} = useContext(AuthContext);
    const [isLiked, setIsLiked] = useState(false);
    const [likersList, setLikersList] = useState([]);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const safeLikers = Array.isArray(commentLikers) ? commentLikers : [];

        setLikersList(safeLikers);

        const curUser = localStorage.getItem("userId");

        if (safeLikers.includes(curUser)) {
            setIsLiked(true);
        } else {
            setIsLiked(false);
        }

        setIsLoading(false);
    }, [commentLikers]);

    const likeHandleClick = async () => {
        if (!auth) {
            setShowLoginMes(true);
            return;
        }

        setIsAnimating(true);


        const wasLiked = likersList.includes(contextUserId);

        try {
            let response;

            if (wasLiked) {
                response = await deleteCommentLike(commentId,contextUserId);
                console.log("Удаляем лайк с комментария:", commentId);
                response = { success: true, data: { commentId } };
            } else {
                response = await postCommentLike(commentId,contextUserId);
                console.log("Добавляем лайк к комментарию:", commentId);
                response = { success: true, data: { commentId } };
            }

            if (response.success) {

                setIsLiked(!wasLiked);

                if (wasLiked) {
                    setLikersList(prev => prev.filter(id => id !== contextUserId));
                } else {
                    setLikersList(prev => [...prev, contextUserId]);
                }
                setTimeout(() => {
                    setIsAnimating(false);
                }, 100);

            } else if (response.statusCode === 401) {
                console.log('Ошибка 401 при лайке комментария');
                refreshToken();
                setIsAnimating(false);
            } else {
                console.log("Ошибка при лайке комментария");
                setIsAnimating(false);
            }
        } catch (error) {
            console.error("Ошибка при обработке лайка комментария:", error);
            setIsAnimating(false);
        }
    }

    if (isLoading) {
        return (
            <div className="relative flex flex-col w-full p-1 border-b-[0.1px] border-black animate-pulse">
                <div className="flex">
                    <div className="w-14 h-14 rounded-full bg-gray-300"></div>
                    <div className="flex flex-col ml-2 space-y-2">
                        <div className="w-32 h-4 bg-gray-300 rounded"></div>
                        <div className="w-48 h-4 bg-gray-300 rounded"></div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gray-300 rounded"></div>
                            <div className="w-6 h-4 bg-gray-300 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex flex-col w-full p-1 border-b-[0.1px] border-black">
            <div className="flex">
                <div>
                    <img
                        className="w-14 h-14 rounded-full object-cover"
                        src={`/avatars/defaultAvatar.png`}
                        alt={`Аватар ${commentUserName}`}
                    />
                </div>
                <div className="flex flex-col justify-start items-start w-fit max-w-[38rem] h-fit ml-2">
                    <div className="w-[28rem]">
                        <span className="mr-1 font-medium">
                            {commentUserName}
                        </span>
                        <span className="text-gray-600">
                            {userTag}
                        </span>
                    </div>
                    <div className="mt-1 mb-1"> {commentText} </div>

                    <button
                        onClick={likeHandleClick}
                        className="flex items-center gap-1 hover:opacity-80 transition-opacity duration-200"
                        disabled={isAnimating}
                    >
                        <div className={`
                            transition-all duration-300 ease-in-out 
                            transform origin-center
                            ${isAnimating ? 'scale-125' : 'scale-100'}
                        `}>
                            <LikeIcon color={isLiked ? "red" : "gray"} size={16} />
                        </div>
                        <span className={`
                            text-sm font-medium
                            transition-all duration-300
                            ${isAnimating ? 'scale-110' : 'scale-100'}
                            ${isLiked ? 'text-red-500' : 'text-gray-500'}
                        `}>
                            {likersList.length}
                        </span>
                    </button>
                </div>
            </div>
            <div className="flex justify-end mr-1 mt-1">
                <span className="text-sm text-[#979797]">{createDate}</span>
            </div>
            <div className="absolute top-1 right-2">
                <CommentOtherMenu
                    component="comment"
                    commentId={commentId}
                    userId={commentUserId}
                    postId={postId}
                    initText={commentText}
                />
            </div>
        </div>
    )
}