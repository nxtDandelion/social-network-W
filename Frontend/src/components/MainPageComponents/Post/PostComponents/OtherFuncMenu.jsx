import {useContext, useState} from "react";
import {DotsIcon} from "../../../Icons/DotsIcon.jsx";

import {deletePost} from  "../../../../API/PostAPI/deletePost.js"

import {FeedContext} from "../../../../Contexts/FeedContext.jsx";
import {AuthContext} from "../../../../Contexts/AuthContext.jsx"
import NotificationCard from "../../../Other/NotificationCard.jsx";
import {updatePost} from "../../../../API/PostAPI/updatePost.js";

import EditPostModal from "./EditPostModal.jsx";
import PopUpConfirm from "../../../PopupComponents/PopUpConfirm.jsx";


export default function OtherFuncMenu({component,userId,postId,initText,edited}) {

    const [visible, setVisible] = useState(false);
    const [showEdit,setShowEdit] = useState(false);
    const [note, setNote] = useState(null);
    const {refreshToken} = useContext(AuthContext);
    const {setPostUpdated} = useContext(FeedContext);

    const sendToUpdate = async (text) =>{
        const response = await updatePost(postId,text)
        if (response.success){
            setPostUpdated({id:postId,text:text});

            setNote({
                type: "success",
                message: "Пост отредактирован",
                duration: 2000
            });
            setShowEdit(false);
        }
        else if (response.statusCode === 401) {
            refreshToken();
        }
        else return response.error;
    }

    const editPost = () => {
        setShowEdit(true);
    }

    const handleClose = () =>{
        setShowEdit(false);
    }

    const closeNotification = () =>{
        setNote(null);
    }

    return (
        <div className="flex flex-col items-end relative ">
            <button
                className="pt-2 "
                onMouseEnter={() => {setVisible(true)}}
                onMouseLeave={() => {setVisible(false)}}
                onClick={() => setVisible(!visible)}
            >
                <DotsIcon className={`${visible ? "opacity-80" : "opacity-100"} `}
                          color={component === "comment" ? "#000000" : "#FAFAFA"}  />
            </button>
            {visible && (
                <div
                    onMouseEnter={() => {setVisible(true)}}
                    onMouseLeave={() => {setVisible(false)}}
                >
                    <MenuCard userId={userId}
                              postId={postId}
                              showNote = {setNote}
                              openEditMenu={editPost}
                    />
                </div>)}



            {note &&
                <NotificationCard
                    type={note.type}
                    message={note.message}
                    duration={note.duration}
                    onClose={closeNotification}
                    isVisible="true"
                >
                </NotificationCard>
            }

            {showEdit &&
                <EditPostModal
                    sendForm={sendToUpdate}
                    closeModal={handleClose}
                    initText={initText}
                    edited={edited}
                />
            }
        </div>
    )
}

function MenuCard({userId,postId,showNote,openEditMenu}) {

    const myId = localStorage.getItem("userId");
    const isMyPost = checkAccess(myId,userId);
    const {setPostDeleted} = useContext(FeedContext);
    const {refreshToken,auth} = useContext(AuthContext);
    const [confirmAlert,setConfirmAlert] = useState(false);



    const reportPost = async () =>{
        if (auth){
            showNote({
                type: "success",
                message: "Жалоба была успешно отправлена",
                duration: 2000
            });
        }
        else refreshToken();
    }
    const updateMyPost = () =>{
        if (auth) {
            if (isMyPost) {
                openEditMenu();

            } else {
                showNote({
                    type: "error",
                    message: "Вы не можете редактировать этот пост",
                    duration: 2000
                });
            }
        }
        else refreshToken();
    }

    const deleteP = async ()=>{
        if (auth){
            const response = await deletePost(myId,postId);
            if (response.success) {
                console.log("Пост удалЕн",postId);
                setPostDeleted(postId);
                showNote({
                    type: "success",
                    message: "Пост удален успешно",
                    duration: 2000
                });

            }
            else if (response.statusCode===401){
                refreshToken();
            }
            else {
                return response.error;
            }
        }
        else refreshToken();
    }
    const deleteMyPost = () =>{
       if (auth) {
           if (isMyPost) {
               setConfirmAlert(true);

           } else {
               showNote({
                   type: "error",
                   message: "Вы не можете удалить этот пост",
                   duration: 2000
               });
           }
       }
       else refreshToken();
    }

    function close(){
        setConfirmAlert(false);
    }

    return (
        <div className="absolute top-5 right-0 z-10">
            <div className="bg-white border shadow-lg rounded-lg py-1 min-w-32">
                <button onClick={reportPost} className="w-full text-left px-4 py-2 hover:bg-gray-100">
                    Пожаловаться
                </button>
                <button onClick={updateMyPost} className="w-full text-left px-4 py-2 hover:bg-gray-100">
                    Редактировать
                </button>
                <button onClick={deleteMyPost} className="w-full text-left px-4 py-2 hover:bg-gray-100">
                    Удалить
                </button>
            </div>
            {confirmAlert && <PopUpConfirm confirm={deleteP} close={close}/>}

        </div>
    )
}

function checkAccess(userId,postUserId){
    return userId === postUserId;
}
