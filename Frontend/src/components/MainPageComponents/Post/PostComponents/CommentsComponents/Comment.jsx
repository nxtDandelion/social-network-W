import ProfileInfo from "../ProfileInfo.jsx";
import CommentOtherMenu from "./CommentOtherMenu.jsx";

export default function Comment({commentId,userId,postId,userName,userTag,commentText,createDate}) {
    return (
        <div className="relative flex flex-col w-full p-1 border-b-[0.1px] border-black">
            <div className="flex">
                <div>
                    <ProfileInfo
                        component="comment"
                        userId={userId}
                        userAvatar={`/defaultAvatar.png`}
                    />
                </div>
                <div className="flex flex-col justify-start items-start w-fit max-w-[38rem] h-fit">
                    <div className="w-[28rem]">
                        <span className="mr-1">
                            {userName}
                        </span>
                        <span className="text-gray-600">
                            {userTag}
                        </span>
                    </div>
                    <div> {commentText} </div>
                </div>
            </div>
            <div className="flex justify-end mr-1">
                <span className="text-[#979797]">{createDate}</span>
            </div>
            <div className="absolute top-1 right-2">
                <CommentOtherMenu commentId={commentId} userId={userId} postId={postId} component="comment"></CommentOtherMenu>
            </div>
    </div>)
}