import {useContext, useState} from "react";
import {DotsIcon} from "../../../../Icons/DotsIcon.jsx";
import {AuthContext} from "../../../../../Contexts/AuthContext.jsx";
import NotificationCard from "../../../../Other/NotificationCard.jsx";
import {updateComment} from "../../../../../API/PostAPI/updateComment.js";
import {deleteComment} from "../../../../../API/PostAPI/deleteComment.js";
import {CommentContext} from "../../../../../Contexts/CommentContext.jsx";
import EditCommentModal from "./EditCommentModal.jsx";

export default function CommentOtherMenu({component, commentId, userId, postId, initText, setEdit}) {
    const [visible, setVisible] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [note, setNote] = useState(null);
    const {refreshToken} = useContext(AuthContext);
    const {setCommentUpdated, setCommentDeleted} = useContext(CommentContext);

    const sendToUpdate = async (text) => {
        const response = await updateComment(userId, postId, commentId, text);
        if (response.success) {
            if (setEdit) setEdit(true);
            setCommentUpdated({id: commentId, text: text});
            setNote({
                type: "success",
                message: "Комментарий отредактирован",
                duration: 2000
            });
            setShowEdit(false);
        } else if (response.statusCode === 401) {
            refreshToken();
        } else {
            setNote({
                type: "error",
                message: response.error || "Ошибка при редактировании",
                duration: 2000
            });
        }
    };

    const editComment = () => {
        setShowEdit(true);
    };

    const handleClose = () => {
        setShowEdit(false);
    };

    const closeNotification = () => {
        setNote(null);
    };

    return (
        <div className="flex flex-col items-end relative">
            <button
                className="pt-2"
                onMouseEnter={() => {setVisible(true)}}
                onMouseLeave={() => {setVisible(false)}}
                onClick={() => setVisible(!visible)}
            >
                <DotsIcon
                    className={`${visible ? "opacity-80" : "opacity-100"}`}
                    color={component === "comment" ? "#000000" : "#FAFAFA"}
                />
            </button>
            {visible && (
                <div
                    onMouseEnter={() => {setVisible(true)}}
                    onMouseLeave={() => {setVisible(false)}}
                >
                    <MenuCard
                        curUserId={userId}
                        commentId={commentId}
                        postId={postId}
                        showNote={setNote}
                        openEditMenu={editComment}
                    />
                </div>
            )}

            {note && (
                <NotificationCard
                    type={note.type}
                    message={note.message}
                    duration={note.duration}
                    onClose={closeNotification}
                    isVisible="true"
                />
            )}

            {showEdit && (
                <EditCommentModal
                    sendForm={sendToUpdate}
                    closeModal={handleClose}
                    initText={initText}
                />
            )}
        </div>
    );
}

function MenuCard({curUserId, commentId, postId, showNote, openEditMenu}) {
    const {setCommentDeleted} = useContext(CommentContext);
    const {contextUserId, refreshToken} = useContext(AuthContext);
    const isMyComment = contextUserId === curUserId;

    const reportComment = async () => {
        showNote({
            type: "info",
            message: "Жалоба отправлена",
            duration: 2000
        });
    };

    const updateMyComment = () => {
        if (isMyComment) {
            openEditMenu();
        } else {
            showNote({
                type: "error",
                message: "Вы не можете редактировать этот комментарий",
                duration: 2000
            });
        }
    };

    const deleteMyComment = async () => {
        if (isMyComment) {
            const response = await deleteComment(curUserId, postId, commentId);
            if (response.success) {
                setCommentDeleted({id: commentId, post_id: postId});
                showNote({
                    type: "success",
                    message: "Комментарий удален успешно",
                    duration: 2000
                });
            } else if (response.statusCode === 401) {
                refreshToken();
            } else {
                showNote({
                    type: "error",
                    message: response.error || "Ошибка при удалении",
                    duration: 2000
                });
            }
        } else {
            showNote({
                type: "error",
                message: "Вы не можете удалить этот комментарий",
                duration: 2000
            });
        }
    };

    return (
        <div className="absolute top-5 right-0 z-10">
            <div className="bg-white border shadow-lg rounded-lg py-1 min-w-32">
                <button onClick={reportComment} className="w-full text-left px-4 py-2 hover:bg-gray-100">
                    Пожаловаться
                </button>
                <button onClick={updateMyComment} className="w-full text-left px-4 py-2 hover:bg-gray-100">
                    Редактировать
                </button>
                <button onClick={deleteMyComment} className="w-full text-left px-4 py-2 hover:bg-gray-100">
                    Удалить
                </button>
            </div>
        </div>
    );
}

function checkAccess(userId, postUserId) {
    return userId === postUserId;
}