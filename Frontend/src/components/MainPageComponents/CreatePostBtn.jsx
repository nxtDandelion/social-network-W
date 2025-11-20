import {useContext, useEffect, useState} from "react";
import MainPage from "../../pages/MainPage.jsx";
import LoginPage from "../../pages/LoginPage.jsx";
import {AuthContext} from "../../authcontext.jsx";
import {useNavigate} from "react-router-dom";
import Post from "./Post/Post.jsx";
import ProfileInfo from "./Post/PostComponents/ProfileInfo.jsx";
import OtherFuncMenu from "./Post/PostComponents/OtherFuncMenu.jsx";
import {LikeIcon} from "../Icons/LikeIcon.jsx";
import {CommentIcon} from "../Icons/CommentsIcon.jsx";
import FormButton from "../FormComponents/FormButton.jsx";
import CrossIcon from "../Icons/CrossIcon.jsx";

export default function CreatePostBtn() {
    const {auth,setShowLoginMes} = useContext(AuthContext);
    const [showCreatePost,setShowCreatePost] = useState(false);
    const [postText,setPostText] = useState("");
    const [isPostSend,setIsPostSend] = useState(false);
    const [allowSend,setAllowSend] = useState(false);
    const [symbolLimit,setSymbolLimit] = useState(false);
    const maxChar = 1000;
    const navigate =useNavigate()

    const createPost = () => {
        if (!auth) {
            setShowLoginMes(true);
        }
        else {
            setShowCreatePost(true);
        }
    }

    const handleTextChange = (e) =>{
       const text = e.target.value;
       if (text.length <= maxChar){
           setPostText(text);
       }
    }

    useEffect(()=>{
       if ( postText.length === 0){
           setAllowSend(false);
           setSymbolLimit(false);
       }
       else if (postText.length > maxChar){
           setAllowSend(false);
           setSymbolLimit(true);
       }
       else {
           setSymbolLimit(false);
           setAllowSend(true);
       }
    },[postText])

    function sendPost() {
    }

    function handleClose(e) {
        e.preventDefault();
        setShowCreatePost(false);
    }

    return (

        <div>
            <button className="inline-block w-44 h-10 bg-white text-xl font-bold border-none rounded-[40px] hover:opacity-80"
                    onClick={createPost}>
                        Создать пост
            </button>
            {showCreatePost &&
                <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-80">
                    <form onSubmit={sendPost} className="flex flex-col items-end  relative w-fit h-fit pt-12 px-5 bg-white rounded-[40px]">
                        <button onClick={handleClose} aria-label="Закрыть" className="absolute top-3 right-3 z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-200 hover:scale-110 transition-transform duration-200">
                            <CrossIcon/>
                        </button>
                        <div className="flex flex-col w-[42rem]  min-h-96">
                            <div className="flex justify-between w-[42rem]  max-h-20 pr-4 pl-4 pt-2 bg-black rounded-t-3xl">
                                <ProfileInfo
                                    userName="Vova Spridonov"
                                    userTag="@DonSprinion"
                                    userAvatar="/defaultAvatar.png"
                                />
                            </div>
                            <div className="flex justify-center w-[42rem] min-h-80 h-fit bg-white border-r-2 border-l-2 border-black">
                                <textarea className="w-[40rem] min-h-80 h-fit outline-none resize-none" value={postText} onChange={handleTextChange}/>
                            </div>
                            <div className="flex w-2xl h-14 bg-black"></div>
                        </div>
                        <div className="flex justify-between items-center w-full gap-4 mb-5">
                            <div className={` p-2 border-2 border-gray-500 rounded-[40px] ${symbolLimit ? "border-red-600" : "border-gray-500"}`}>{postText.length}/1000</div>
                            <FormButton text="Сохранить" status={allowSend} enterStatus={isPostSend}/>
                        </div>
                    </form>
                </div>
            }
        </div>
    )
}
