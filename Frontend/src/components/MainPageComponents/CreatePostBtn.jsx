import {useContext, useEffect, useState} from "react";

import {AuthContext} from "../../Contexts/AuthContext.jsx";
import {useNavigate} from "react-router-dom";

import {newPost} from "../../API/PostAPI/newPost.js";

import {FeedContext} from "../../Contexts/FeedContext.jsx";
import NotificationCard from "../Other/NotificationCard.jsx";

import EditPostModal from "./Post/PostComponents/EditPostModal.jsx";

export default function CreatePostBtn() {

    const {auth,setShowLoginMes,refreshToken,userName} = useContext(AuthContext);
    const {refreshFeed,logContext} = useContext(FeedContext);
    const [userId,setUserId] = useState("")
    const [showCreatePost,setShowCreatePost] = useState(false);
    const [postText,setPostText] = useState("");
    const [isPostSend,setIsPostSend] = useState(false);
    const [error,setError] = useState('');
    const [notice,setNotice] = useState(null);
    const maxChar = 1000;
    const navigate =useNavigate();

    function handleClose() {
        setShowCreatePost(false);
    }

    const createPost = () => {
        if (!auth) {
            setShowLoginMes(true);
        }
        else {
            // setUserId(localStorage.getItem("userId"));
            setShowCreatePost(true);
        }
    }

    const sendPost = async (postText) => {

        setError(null);
        const response = await newPost(postText);

        if (response.success) {
            setNotice({
                type: "success",
                message: "Пост добавлен успешно",
                duration: 1000
            })
            const postData = { ...response.data, username: userName}
            refreshFeed(postData);
            setTimeout(()=>(
                setShowCreatePost(false)
            ),200);
        }
        else if (response.statusCode === 401) {
            console.log('Ошибка 401');
            console.error(response.error);
            refreshToken();
        }
        else{
            setError(response.error);
            console.error(response.error);
            return response.error;
        }
    }


    const closeNotice = () =>{
        setNotice(null);
    }

    if (error) {
        return (
            <div className="flex flex-col gap-5 items-center w-[50rem] pr-3 pl-3 pt-7 bg-white min-h-screen border-r-2 border-l-2 border-black">
                <div className="text-red-500">{error}</div>
                <button
                    onClick={sendPost}
                    className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                    Попробовать снова
                </button>
            </div>
        );
    }
    return (

        <div>
            <button className="inline-block w-44 h-10 bg-white text-xl font-bold border-none rounded-[40px] hover:opacity-80"
                    onClick={createPost}>
                Создать пост
            </button>
            {showCreatePost && <EditPostModal
                                    sendForm={sendPost}
                                    closeModal={handleClose}
                                />

            }
            {notice && <NotificationCard
                            type={notice.type}
                            message={notice.message}
                            duration={notice.duration}
                            isVisible={"true"}
                            onClose={closeNotice}

                        />


            }
        </div>
    )
}
