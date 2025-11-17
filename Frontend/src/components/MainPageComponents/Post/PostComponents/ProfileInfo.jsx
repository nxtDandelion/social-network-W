export default function ProfileInfo({userName,userTag, userAvatar}) {
    return (
        <div className="flex">
            <div className="flex w-16 h-16 mr-2">
                <img className="w-14 h-14 rounded-full object-cover" src={`avatars/${userAvatar}`}  alt={`Аватар ${userName}`} />
            </div>
            <div className="flex flex-col">
                <p className="text-white text-2xl">{userName}</p>
                <a className="text-[#C0C0C0] text-sm">{userTag}</a>
            </div>
        </div>
    )
}