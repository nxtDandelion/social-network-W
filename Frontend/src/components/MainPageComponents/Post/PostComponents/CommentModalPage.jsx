import ProfileInfo from "./ProfileInfo.jsx";
import OtherFuncMenu from "./OtherFuncMenu.jsx";
import Comment from "./Comment.jsx";
import {LikeIcon} from "../../../Icons/LikeIcon.jsx";
import {CommentIcon} from "../../../Icons/CommentsIcon.jsx";
import CommentForm from "./CommentForm.jsx";
import CrossIcon from "../../../Icons/CrossIcon.jsx";

export default function CommentModalPage({postDate,likeCount,commentCount,postText,userName,userTag,userId,closePage}) {
    function likeHandleClick() {

    }
    function commentHandleClick() {
        closePage();
    }

    return(
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 p-4">
            {/* Основной контейнер с прокруткой */}
            <div className="relative flex flex-col w-[42rem] max-h-[95vh] overflow-y-auto rounded-3xl bg-white">
                {/*<button onClick={commentHandleClick} aria-label="Закрыть" className="absolute top-0  z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-200 hover:scale-110 transition-transform duration-200">*/}
                {/*    <CrossIcon/>*/}
                {/*</button>*/}
                {/* Блок поста */}
                <div className="flex-shrink-0 bg-white rounded-t-3xl">
                    <div className="flex justify-between w-full max-h-20 pr-4 pl-4 pt-2 bg-black rounded-t-3xl">
                        <ProfileInfo
                            component="post"
                            userName={userName}
                            userTag={userTag}
                            userAvatar={`${userId}Avatar.png`}
                        />
                        <OtherFuncMenu/>
                    </div>
                    <div className="flex w-full min-h-80 bg-white border-r-2 border-l-2 border-black">
                        <p className="text-lg p-4"> {postText}</p>
                    </div>
                    <div className="flex w-full h-14 bg-black">
                        <div className="flex w-2/4">
                            <button onClick={likeHandleClick} className="flex w-1/2 items-center ml-3 hover:opacity-80">
                                <LikeIcon/>
                                <span className="inline-block text-white text-xl font-bold tracking-wider"> {likeCount}</span>
                            </button>
                            <button onClick={commentHandleClick} className="flex w-1/2 items-center ml-3 hover:opacity-80">
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

                {/* Блок комментариев - ОТДЕЛЬНЫЙ с фоном */}
                <div className="flex-1 bg-gray-50 rounded-b-3xl mt-2">
                    <Comment
                        userName="Alex"
                        userTag="@Alex"
                        id="211"
                        commentText="Я там был! Все не так! Я там был! Все не так!Я там был! Все не так!Я там был! Все не так!Я там был! Все не так!"
                        createDate="22.08 12:48"
                    />
                    <Comment
                        userName="Alex"
                        userTag="@Alex"
                        id="211"
                        commentText="Я там был! Все не так! Я там был! Все не так!Я там был! Все не так!Я там был! Все не так!Я там был! Все не так!"
                        createDate="22.08 12:48"
                    />
                    <Comment
                        userName="Alex"
                        userTag="@Alex"
                        id="211"
                        commentText="Я там был! Все не так! Я там был! Все не так!Я там был! Все не так!Я там был! Все не так!Я там был! Все не так!"
                        createDate="22.08 12:48"
                    />
                    <Comment
                        userName="Alex"
                        userTag="@Alex"
                        id="211"
                        commentText="Я там был! Все не так! Я там был! Все не так!Я там был! Все не так!Я там был! Все не так!Я там был! Все не так!"
                        createDate="22.08 12:48"
                    />
                    <Comment
                        userName="Alex"
                        userTag="@Alex"
                        id="211"
                        commentText="Я там был! Все не так! Я там был! Все не так!Я там был! Все не так!Я там был! Все не так!Я там был! Все не так!"
                        createDate="22.08 12:48"
                    />
                    
                    <CommentForm/>
                </div>
            </div>
        </div>
    )
}