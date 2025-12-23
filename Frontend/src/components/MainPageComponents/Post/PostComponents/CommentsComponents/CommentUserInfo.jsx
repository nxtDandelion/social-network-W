import {useNavigate} from "react-router-dom";

export default function CommentUserInfo({userName,userTag}) {
    const navigate = useNavigate();

    function navigateTo() {
        navigate(`/profile/${userName}`);
    }

    return (
        <div className="w-[28rem]">
            <span className="mr-1 font-medium cursor-pointer"
                  onClick={navigateTo}>
                {userName}
            </span>
            <span className="text-gray-600 cursor-pointer"
                  onClick={navigateTo}>
                            {userTag}
            </span>
        </div>
    )
}