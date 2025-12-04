import ProfileInfo from "./ProfileInfo.jsx";
import OtherFuncMenu from "./OtherFuncMenu.jsx";
import Comment from "./Comment.jsx";
import {LikeIcon} from "../../../Icons/LikeIcon.jsx";
import {CommentIcon} from "../../../Icons/CommentsIcon.jsx";
import CommentForm from "./CommentForm.jsx";
import CrossIcon from "../../../Icons/CrossIcon.jsx";
import {comment} from "postcss";
import PopupBg from "../../../PopupComponents/PopupBg.jsx";
import { useState, useContext } from "react";
import { AuthContext } from "../../../../authcontext.jsx";

export default function CommentModalPage({postDate,likeCount,commentCount,postText,userName,userTag,userId,closePage,comments}) {
    const [isLiked, setIsLiked] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const { auth } = useContext(AuthContext);

    function likeHandleClick() {
        if (!auth) return;

        setIsAnimating(true);
        setIsLiked(!isLiked);

        // Останавливаем анимацию через 300ms
        setTimeout(() => {
            setIsAnimating(false);
        }, 300);
    }

    function commentHandleClick() {
        closePage();
    }

    return(
        <PopupBg>
            {/* Основной контейнер с прокруткой */}
            <div className="relative flex flex-col w-[42rem] max-h-[95vh] overflow-y-auto overflow-x-hidden rounded-3xl bg-white custom-scrollbar">
                <div className="flex-shrink-0 bg-white rounded-t-3xl">
                    <div className="flex justify-between w-full max-h-20 pr-4 pl-4 pt-2 bg-black rounded-t-3xl">
                        <ProfileInfo
                            component="post"
                            userName={userName}
                            userTag={userTag}
                            userAvatar={`defaultAvatar.png`}
                        />
                        <OtherFuncMenu/>
                    </div>
                    <div className="flex w-full min-h-80 bg-white border-r-2 border-l-2 border-black">
                        <p className="text-lg p-4"> {postText}</p>
                    </div>
                    <div className="flex w-full h-14 bg-black">
                        <div className="flex w-2/4">
                            <button
                                onClick={likeHandleClick}
                                className="flex w-1/2 items-center ml-3 hover:opacity-80 transition-opacity duration-200"
                                disabled={isAnimating}
                            >
                                <div className={`
                                    transition-all duration-300 ease-in-out 
                                    transform origin-center
                                    ${isAnimating ? 'scale-125' : 'scale-100'}
                                `}>
                                    <LikeIcon color={isLiked ? "red" : "white"} />
                                </div>
                                <span className={`
                                    inline-block text-white text-xl font-bold tracking-wider ml-2
                                    transition-all duration-300
                                    ${isAnimating ? 'scale-110' : 'scale-100'}
                                `}>
                                    {isLiked ? likeCount + 1 : likeCount}
                                </span>
                            </button>
                            <button onClick={commentHandleClick} className="flex w-1/2 items-center ml-3 hover:opacity-80 transition-opacity duration-200">
                                <CommentIcon/>
                                <span className="inline-block text-white text-xl font-bold tracking-wider"> {commentCount}</span>
                            </button>
                        </div>
                        <div className="flex w-2/4 justify-end items-center">
                            <span className="text-base text-[#979797] font-bold tracking-wider mr-4">
                                {postDate}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Комментарии с отступами */}
                <div className="flex-1 px-4 py-2">
                    {Object.values(comments).map(comment => (
                        <Comment
                            key={comment.id}
                            userName={comment.profile_id}
                            userTag="@Alex"
                            id={comment.id}
                            commentText={comment.text}
                            createDate={new Date(comment.create_date).toLocaleDateString('ru-RU')}
                        />
                    ))}
                </div>

                {/* Форма комментария */}
                <div className="sticky bottom-0 bg-white border-t border-gray-100">
                    <CommentForm/>
                </div>
            </div>

            {/* Кнопка закрытия с улучшенными стилями */}
            <button
                onClick={commentHandleClick}
                aria-label="Закрыть"
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-200 hover:scale-110 hover:bg-gray-50 transition-all duration-200"
            >
                <CrossIcon/>
            </button>
        </PopupBg>
    )
}