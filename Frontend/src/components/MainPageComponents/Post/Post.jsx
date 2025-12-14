import ProfileInfo from "./PostComponents/ProfileInfo.jsx";
import OtherFuncMenu from "./PostComponents/OtherFuncMenu.jsx";
import {LikeIcon} from "../../Icons/LikeIcon.jsx";
import {CommentIcon} from "../../Icons/CommentsIcon.jsx";
import {useContext, useEffect, useState} from "react";
import {AuthContext} from "../../../Contexts/AuthContext.jsx";
import CommentModalPage from "./PostComponents/CommentsComponents/CommentModalPage.jsx";
import {responseCommentsList} from "../../../API/PostAPI/getCommentsList.js";
import {postLike} from "../../../API/PostAPI/postLike.js";
import {deleteLike} from "../../../API/PostAPI/deleteLike.js";
import OldTokenPage from "../../../pages/OldTokenPage.jsx";

export default function Post({postH,postW,postDate,likers,postText,userName,userTag,userId,postId,isModal,onModalFunc}) {

    const {auth,setShowLoginMes,refreshToken} = useContext(AuthContext);
    const [showComments,setShowComments] = useState(false);
    const [commentsList,setCommentsList] = useState({});
    const [isLiked,setIsLiked] = useState(false);
    const [likersList,setLikersList] = useState([]);
    const [isLoading,setIsLoading] = useState(true);
    const [isAnimating, setIsAnimating] = useState(false);



    useEffect(() => {
        // 1. Создаем безопасный массив
        const safeLikers = Array.isArray(likers) ? likers : [];

        // 2. Используем safeLikers везде
        setLikersList(safeLikers);

        const curUser = localStorage.getItem("userId");

        if (safeLikers.includes(curUser)) {
            setIsLiked(true);
        } else {
            setIsLiked(false);
        }

        setIsLoading(false);
    }, [likers]);

    const likeHandleClick = async () => {
        if (!auth) {
            setShowLoginMes(true);
            return;
        }

        setIsAnimating(true);

        const curUser = localStorage.getItem("userId");
        const wasLiked = likersList.includes(curUser);

        try {
            let response;

            if (wasLiked) {
                response = await deleteLike(postId);
            } else {
                response = await postLike(postId);
            }

            if (response.success) {
                // Плавное изменение состояния
                setIsLiked(!wasLiked);

                // Плавное изменение счетчика
                if (wasLiked) {
                    setLikersList(prev => prev.filter(id => id !== curUser));
                } else {
                    setLikersList(prev => [...prev, curUser]);
                }

                // Останавливаем анимацию через 300ms
                setTimeout(() => {
                    setIsAnimating(false);
                }, 300);

            } else if (response.statusCode === 401) {
                console.log('Ошибка 401');
                console.error(response.error);
                refreshToken();
                setIsAnimating(false);
            } else {
                console.log("ошибка");
                setIsAnimating(false);
            }
        } catch (error) {
            console.error("Ошибка при обработке лайка:", error);
            setIsAnimating(false);
        }
    }

    async function commentHandleClick () {

        if (isModal){
            onModalFunc();
        }
        const response = await responseCommentsList(postId);
        if (response.success) {

            setCommentsList(response.data);
            setShowComments(true);
        } else {
            console.log(response.success);
        }
    }

    const handleClose = () =>{
        setShowComments(false);
    }

    if (isLoading) {
        return (
            <div className="flex flex-col w-[42rem] min-h-96 animate-pulse">
                <div className="flex justify-between w-2xl max-h-20 pr-4 pl-4 pt-2 bg-gray-300 rounded-t-3xl">
                    <div className="w-32 h-8 bg-gray-400 rounded"></div>
                    <div className="w-8 h-8 bg-gray-400 rounded"></div>
                </div>
                <div className="flex w-2xl min-h-80 bg-gray-200 border-r-2 border-l-2 border-gray-300">
                    <div className="w-full h-40 bg-gray-300 m-4 rounded"></div>
                </div>
                <div className="flex w-2xl h-14 bg-gray-300">
                    <div className="flex w-2/4">
                        <div className="flex w-1/2 items-center ml-3">
                            <div className="w-6 h-6 bg-gray-400 rounded"></div>
                            <div className="w-8 h-6 bg-gray-400 rounded ml-2"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col w-[42rem]  min-h-96">
            <div className="flex justify-between w-2xl  max-h-20 pr-4 pl-4 pt-2 bg-black rounded-t-3xl">
                <ProfileInfo
                    component="post"
                    userName={userName}
                    userTag={userTag}
                    userAvatar={`defaultAvatar.png`}
                    userId={userId}
                />
                <OtherFuncMenu
                    userId={userId}
                    postId={postId}
                    initText={postText}
                />
            </div>
            <div className="flex w-2xl min-h-80 bg-white border-r-2 border-l-2 border-black">
                <p className="text-lg p-4"> {postText}</p>
            </div>
            <div className="flex w-2xl h-14 bg-black">
                <div className="flex w-2/4">
                    <button
                        onClick={likeHandleClick}
                        className="flex w-1/2 items-center ml-3 hover:opacity-80 transition-opacity duration-200"
                        disabled={isAnimating}
                    >
                        {/* Контейнер для анимации */}
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
                            {likersList.length}
                        </span>
                    </button >
                    <button onClick={commentHandleClick} className="flex w-1/2 items-center ml-3 hover:opacity-80">
                        <CommentIcon/>
                        <span className="inline-block text-white text-xl font-bold tracking-wider"> {Object.keys(commentsList).length}</span>
                    </button>
                </div>
                <div className="flex w-2/4 justify-end items-center">
                    <span className="text-base text-[#979797] font-bold tracking-wider mr-4">
                        {postDate}
                    </span>
                </div>
            </div>
            {showComments && <CommentModalPage
                                   closePage={handleClose}
                                   postDate={postDate}
                                   postText={postText}
                                   postId={postId}
                                   commentCount={Object.keys(commentsList).length}
                                   likeCount={Object.keys(likers).length}
                                   userName={userName}
                                   userTag={userTag}
                                   userId={userId}
                                   likers={likersList}
                                   comments={commentsList}


            />}
        </div>
    )
}