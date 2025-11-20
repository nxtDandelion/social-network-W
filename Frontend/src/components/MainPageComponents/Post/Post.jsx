
import ProfileInfo from "./PostComponents/ProfileInfo.jsx";
import OtherFuncMenu from "./PostComponents/OtherFuncMenu.jsx";
import {LikeIcon} from "../../Icons/LikeIcon.jsx";
import {CommentIcon} from "../../Icons/CommentsIcon.jsx";
import {useContext} from "react";
import {AuthContext} from "../../../authcontext.jsx";

export default function Post({postH,postW,postDate,likeCount,commentCount,postText}) {

    const {auth,setShowLoginMes} = useContext(AuthContext);

    const likeHandleClick =() =>{
        if (!auth) {
            setShowLoginMes(true);
        }
        else {}
    }

    function commentHandleClick() {
        if (!auth) {
            setShowLoginMes(true);
        }
        else {}
    }

    return (
        <div className="flex flex-col w-[42rem]  min-h-96">
            <div className="flex justify-between w-2xl  max-h-20 pr-4 pl-4 pt-2 bg-black rounded-t-3xl">
                <ProfileInfo
                    userName="Vova Spridonov"
                    userTag="@DonSprinion"
                    userAvatar="/defaultAvatar.png"
                />
                <OtherFuncMenu>
                </OtherFuncMenu>
            </div>
            <div className="flex w-2xl min-h-80 bg-white border-r-2 border-l-2 border-black">
                <p className="text-lg p-4"> {postText}</p>
            </div>
            <div className="flex w-2xl h-14 bg-black">
                <div className="flex w-2/4">
                    <button  onClick={likeHandleClick} className="flex w-1/2 items-center ml-3 hover:opacity-80">
                        <LikeIcon/>
                        <span className="inline-block text-white text-xl font-bold tracking-wider"> {likeCount}</span>
                    </button >
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
    )



}