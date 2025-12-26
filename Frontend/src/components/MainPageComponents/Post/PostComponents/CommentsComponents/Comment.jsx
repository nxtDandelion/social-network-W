import CommentOtherMenu from "./CommentOtherMenu.jsx";
import {LikeIcon} from "../../../../Icons/LikeIcon.jsx";
import {useContext, useEffect, useState} from "react";
import {AuthContext} from "../../../../../Contexts/AuthContext.jsx";
import {deleteCommentLike} from "../../../../../API/PostAPI/deleteCommentLike.js";
import {postCommentLike} from "../../../../../API/PostAPI/postCommentLike.js";
import CommentUserInfo from "./CommentUserInfo.jsx";
import {useNavigate} from "react-router-dom";

export default function Comment({
                                    commentId, commentUserId, postId,userAvatar, commentUserName, userTag,
                                    commentText, createDate, commentLikers,edited
                                }) {

    const {auth,setShowLoginMes,contextUserId,refreshToken} = useContext(AuthContext);
    const [isLiked, setIsLiked] = useState(false);
    const [likersList, setLikersList] = useState([]);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const [isEdit,setIsEdit] = useState(edited);

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
                response = { success: true, data: { commentId } };
            } else {
                response = await postCommentLike(commentId,contextUserId);
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
                refreshToken();
                setIsAnimating(false);
            } else {
                setIsAnimating(false);
            }
        } catch (error) {
            setIsAnimating(false);
        }
    }

    function navigateTo() {
        navigate(`/profile/${commentUserName}`);
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
            <div className="flex items-start">
                <div className="flex-shrink-0">
                    <img
                        className="w-14 h-14 rounded-full object-cover cursor-pointer"
                        src={`${userAvatar ? userAvatar :`/avatars/defaultAvatar.png`}`}
                        alt={`Аватар ${commentUserName}`}
                        onClick={navigateTo}
                    />
                </div>

                <div className="flex flex-col ml-2 flex-grow min-w-0 relative">
                    <div className="flex justify-between items-start">
                        <CommentUserInfo userName={commentUserName} userTag={`@${commentUserName}`}/>
                        <CommentOtherMenu
                            setEdit={setIsEdit}
                            component="comment"
                            commentId={commentId}
                            userId={commentUserId}
                            postId={postId}
                            initText={commentText}
                            userAvatar={userAvatar}
                        />
                    </div>

                    <div className="mt-1 mb-1 break-words whitespace-pre-wrap overflow-wrap-anywhere w-full pr-10">
                        {commentText}
                    </div>

                    <div className="flex justify-between items-center mt-2">
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

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-[#979797]">{createDate}</span>
                            {isEdit && (
                                <span className="text-xs text-gray-500 italic whitespace-nowrap">
                                    Отредактирован
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}