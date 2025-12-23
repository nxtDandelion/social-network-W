import Comment from "./Comment.jsx";
import CommentForm from "./CommentForm.jsx";
import CrossIcon from "../../../../Icons/CrossIcon.jsx";
import PopupBg from "../../../../PopupComponents/PopupBg.jsx";
import Post from "../../Post.jsx";
import {useContext, useEffect, useState} from "react";
import {CommentContext} from "../../../../../Contexts/CommentContext.jsx";
import PostPreview from "../../PostPreview.jsx";

export default function CommentModalPage({
                                             postDate, likeCount, commentsAmount, postText, postId,
                                             userName, userTag, userId, userAvatar, closePage, comments, likers,
                                             edited

                                         }) {
    const {commentCreated, commentUpdated, commentDeleted, setFreshCommentsAmount} = useContext(CommentContext);
    const [commentsList, setCommentsList] = useState(comments || {});
    const [reactComments, setReactComments] = useState(commentsAmount || null);

    useEffect(() => {
        const updatedCommentsAmount = Object.keys(commentsList).length;
        setFreshCommentsAmount(updatedCommentsAmount);
    }, [commentsList]);

    useEffect(() => {
        if (commentCreated) {
            if (commentCreated.post_id === postId) {
                const isCommentExist = Object.values(commentsList).some(comment => comment.id === commentCreated.id);

                if (!isCommentExist) {
                    setReactComments(prevState =>{
                        return prevState + 1
                    });
                    setCommentsList(prevState => {
                        return {
                            [commentCreated.id]: commentCreated,
                            ...prevState
                        };
                    });
                }
            }
        }
    }, [commentCreated]);

    useEffect(() => {
        if (commentUpdated && commentUpdated.id && commentsList[commentUpdated.id]) {
            setCommentsList(prevState => ({
                ...prevState,
                [commentUpdated.id]: {
                    ...prevState[commentUpdated.id],
                    text: commentUpdated.text,
                }
            }));
        }
    }, [commentUpdated]);

    useEffect(() => {
        if (commentDeleted && commentDeleted.post_id) {
            setCommentsList(prevState => {
                const newState = {...prevState};
                delete newState[commentDeleted.id];
                return newState;
            });
            setReactComments(prevState => {
                return prevState - 1
            })
        }
    }, [commentDeleted]);

    function commentHandleClick() {
        closePage();
    }

    const sortedComments = Object.values(commentsList).sort((a, b) => {
        return new Date(b.create_date) - new Date(a.create_date);
    });

    console.log(commentsList);

    return(
        <PopupBg>
            <div className="relative w-[42rem] h-[95vh] my-auto rounded-3xl bg-white overflow-hidden flex flex-col">
                {/* Основной контент с прокруткой */}
                <div className="flex-1 overflow-y-auto custom-scrollbar-edge pb-24">
                    <div className="pr-2">
                        <div>
                            <PostPreview
                                postText={postText}
                                likers={likers}
                                userId={userId}
                                userName={userName}
                                userTag={userTag}
                                userAvatar={userAvatar}
                                postDate={postDate}
                                postId={postId}
                                commentsList={commentsList}
                                initCommentAmount={reactComments}
                                onModalFunc={commentHandleClick}
                                edited={edited}
                            />
                        </div>

                        <div className="px-4 py-2 border-t border-gray-100">
                            {sortedComments.length > 0 ? (
                                sortedComments.map(comment => (
                                    <Comment
                                        key={comment.id}
                                        commentUserId={comment.profile_id}
                                        commentUserName={comment.username}
                                        userTag={`@${comment.username}`}
                                        userId={comment.profile_id}
                                        postId={comment.post_id}
                                        userAvatar={comment.photo}
                                        commentId={comment.id}
                                        commentText={comment.text}
                                        createDate={new Date(comment.create_date).toLocaleDateString('ru-RU')}
                                        commentLikers={comment.likers || []}
                                        edited={comment.edited}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    Комментариев пока нет. Будьте первым!
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Форма комментариев - фиксированная внизу */}
                <div className="border-t border-gray-100 bg-white">
                    <CommentForm
                        postId={postId}
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