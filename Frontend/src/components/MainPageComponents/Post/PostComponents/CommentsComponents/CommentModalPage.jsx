import Comment from "./Comment.jsx";
import CommentForm from "./CommentForm.jsx";
import CrossIcon from "../../../../Icons/CrossIcon.jsx";
import PopupBg from "../../../../PopupComponents/PopupBg.jsx";
import Post from "../../Post.jsx";
import {useContext, useEffect, useState} from "react";
import {CommentContext} from "../../../../../Contexts/CommentContext.jsx";

export default function CommentModalPage({
                                             postDate, likeCount, commentCount, postText, postId,
                                             userName, userTag, userId, closePage, comments, likers, edited
                                         }) {
    const {commentCreated, commentUpdated, commentDeleted} = useContext(CommentContext);
    const [commentsList, setCommentsList] = useState(comments || {});

    useEffect(() => {
        if (commentCreated) {
            console.log(commentCreated,"CC",commentsList,"CL",sortedComments,"SC");
            if (commentCreated.post_id === postId) {
                const isCommentExist = Object.values(commentsList).some(comment => comment.id === commentCreated.id);

                if (!isCommentExist) {
                    setCommentsList(prevState => {
                        return {
                        [commentCreated.id]:commentCreated,
                            ...prevState

                        };
                    });
                    // Прокручиваем к новому комментарию
                    // setTimeout(() => {
                    //     const container = document.querySelector('.custom-scrollbar-edge');
                    //     if (container) {
                    //         container.scrollTop = 0;
                    //     }
                    // }, 10);
                }
            }
        }
    }, [commentCreated]);

    // Обработка обновления комментария
    useEffect(() => {
        if (commentUpdated && commentUpdated.id && commentsList[commentUpdated.id]) {
            setCommentsList(prevState => ({
                ...prevState,
                [commentUpdated.id]: {
                    ...prevState[commentUpdated.id],
                    text: commentUpdated.text,
                    // Другие обновляемые поля
                }
            }));
        }
    }, [commentUpdated]);

    // Обработка удаления комментария
    useEffect(() => {
        if (commentDeleted ) {
            setCommentsList(prevState => {
                console.log(commentDeleted,)
                const newState = {...prevState};
                delete newState[commentDeleted];
                return newState;
            });

        }
    }, [commentDeleted]);

    function commentHandleClick() {
        closePage();
    }

    // Сортируем комментарии по дате (новые сверху)
    const sortedComments = Object.values(commentsList).sort((a, b) => {
        return new Date(b.create_date) - new Date(a.create_date);
    });

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
                            {sortedComments.length > 0 ? (
                                sortedComments.map(comment => (
                                    <Comment
                                        key={comment.id}
                                        commentUserId={comment.profile_id}
                                        commentUserName={comment.profile_id}
                                        userTag={comment.profile_id}
                                        userId={comment.profile_id}
                                        postId={comment.post_id}
                                        commentId={comment.id}
                                        commentText={comment.text}
                                        createDate={new Date(comment.create_date).toLocaleDateString('ru-RU')}
                                        commentLikers={comment.likers || []}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    Комментариев пока нет. Будьте первым!
                                </div>
                            )}

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