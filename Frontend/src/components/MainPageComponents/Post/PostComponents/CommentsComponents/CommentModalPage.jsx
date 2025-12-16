import Comment from "./Comment.jsx";
import CommentForm from "./CommentForm.jsx";
import CrossIcon from "../../../../Icons/CrossIcon.jsx";
import PopupBg from "../../../../PopupComponents/PopupBg.jsx";
import Post from "../../Post.jsx";

export default function CommentModalPage({
                                             postDate, likeCount, commentCount, postText, postId,
                                             userName, userTag, userId, closePage, comments, likers,
                                                edited
                                         }) {

    function commentHandleClick() {
        closePage();
    }

    return(
        <PopupBg>
            <div className="relative w-[42rem] h-[95vh] my-auto rounded-3xl bg-white overflow-hidden">
                <div className="h-full overflow-y-auto custom-scrollbar-edge">
                    <div className="h-full pr-2">
                        <div>
                            <Post
                                postText={postText}
                                likers={likers}
                                userId={userId}
                                userName={userName}
                                userTag={userTag}
                                postDate={postDate}
                                postId={postId}
                                onModalFunc={commentHandleClick}
                                isModal={true}
                                edited={edited}
                            />
                        </div>

                        <div className="px-4 py-2 border-t border-gray-100">
                            {Object.values(comments).map(comment => (
                                <Comment
                                    key={comment.id}
                                    userName={comment.profile_id}
                                    userTag={comment.profile_id}
                                    userId={comment.profile_id}
                                    postId={postId}
                                    commentId={comment.id}
                                    commentText={comment.text}
                                    createDate={new Date(comment.create_date).toLocaleDateString('ru-RU')}
                                    // Передаем лайки комментария
                                    commentLikers={comment.likers || []}
                                />
                            ))}

                            <div className="h-20"></div>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100">
                    <CommentForm
                        postId={postId}
                        userId={userId}
                    />
                </div>
            </div>

            <button
                onClick={commentHandleClick}
                aria-label="Закрыть"
                className="absolute top-4 right-4 z-20 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-200 hover:scale-110 hover:bg-gray-50 transition-all duration-200"
            >
                <CrossIcon/>
            </button>
        </PopupBg>
    )
}