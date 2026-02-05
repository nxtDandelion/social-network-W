import {useContext, useState, useEffect} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {AuthContext} from "../../Contexts/AuthContext.jsx";
import {newPost} from "../../API/PostAPI/newPost.js";
import {FeedContext} from "../../Contexts/FeedContext.jsx";
import NotificationCard from "../Other/NotificationCard.jsx";
import EditPostModal from "./Post/PostComponents/EditPostModal.jsx";

export default function CreatePostBtn({}) {
    const location = useLocation();
    const navigate = useNavigate();
    const {auth,setShowLoginMes,refreshToken,contextUserName} = useContext(AuthContext);
    const {refreshFeed} = useContext(FeedContext);
    const [showCreatePost,setShowCreatePost] = useState(false);
    const [error,setError] = useState('');
    const [notice,setNotice] = useState(null);
    const [shouldRedirect, setShouldRedirect] = useState(false);
    const myAvatar = localStorage.getItem("UserPhoto");

    const isNotOnHomePage = location.pathname !== '/home';

    function handleClose() {
        setShowCreatePost(false);
    }

    const createPost = () => {
        if (!auth) {
            setShowLoginMes(true);
        }
        else {
            if (isNotOnHomePage) {
                setShouldRedirect(true);
            }
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

            if (isNotOnHomePage) {
                setShouldRedirect(true);
            }

            const postData = { ...response.data, username: contextUserName, photo: myAvatar }
            refreshFeed(postData);

            setTimeout(() => {
                setShowCreatePost(false);
            }, 100);
        }
        else if (response.statusCode === 401) {
            console.error(response.error);
            refreshToken();
        }
        else {
            setError(response.error);
            console.error(response.error);
        }
    }

    useEffect(() => {
        if (shouldRedirect && !showCreatePost) {
            navigate('/home');
            setShouldRedirect(false);
        }
    }, [shouldRedirect, showCreatePost, navigate]);

    const closeNotice = () =>{
        setNotice(null);
    }

    const closeError = () =>{
        setError(null);
    }

    const retryPost = () => {
        setError(null);
        setShowCreatePost(true);
    }

    return (
        <div>
            <button
                className="inline-block w-44 h-10 bg-white text-xl font-bold border-none rounded-[40px] hover:opacity-80"
                onClick={createPost}
            >
                Создать пост
            </button>

            {showCreatePost &&
                <EditPostModal
                    sendForm={sendPost}
                    closeModal={handleClose}
                    myAvatar={myAvatar}
                />
            }

            {error &&
                <div className="fixed inset-0 z-[999] flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={closeError}
                    />

                    <div className="relative bg-white rounded-2xl z-[1000] shadow-2xl p-8 w-[90%] max-w-md mx-4 transform transition-all duration-300 scale-100 animate-fadeIn">
                        <div className="text-center mb-6">
                            <div className="flex justify-center mb-4">
                                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                    <svg
                                        className="w-6 h-6 text-red-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                Ошибка при создании поста
                            </h3>
                            <p className="text-gray-600 text-sm mb-2">
                                {error}
                            </p>
                            <p className="text-gray-500 text-xs">
                                Попробуйте снова или обратитесь в поддержку
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={closeError}
                                className="flex-1 px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                            >
                                Закрыть
                            </button>
                            <button
                                onClick={retryPost}
                                className="flex-1 px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                            >
                                Попробовать снова
                            </button>
                        </div>

                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-black to-gray-200 rounded-t-2xl" />
                    </div>
                </div>
            }

            {notice &&
                <NotificationCard
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