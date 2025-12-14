import {useContext, useEffect, useState} from "react";
import Post from "../MainPageComponents/Post/Post.jsx";
import ProfileButton from "../ProfilePageComponents/ProfileButton.jsx";
import {getUserProfile} from "../../API/ProfileAPI/getUserProfile.js";
import {AuthContext} from "../../Contexts/AuthContext.jsx";
import {useParams} from "react-router-dom";
import EditForm from "../ProfilePageComponents/EditForm.jsx";
import SubscribeButton from "../ProfilePageComponents/SubscribeButton.jsx";
import {getFollowers} from "../../API/ProfileAPI/getFollowers.js";
import NotFoundPage from "../../pages/NotFoundPage.jsx";
import ShowSubscriptionsButton from "./ShowSubscriptionsButton.jsx";
import {getFollowing} from "../../API/ProfileAPI/getFollowing.js";

// Принимаем пропсы из родительского компонента
export default function ProfileFeed({ showEdit, onCloseModal, onEditClick }) {
    const [isActive, setIsActive] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState("");
    const [userData, setUserData] = useState([]);
    const [postsList, setPostsList] = useState([]);
    const [userPassword, setUserPassword] = useState("");
    const [subscribers, setSubscribers] = useState({});
    const [subscribes, setSubscribes] = useState({});
    const [userPasswordConfirm, setPasswordConfirm] = useState("");
    const [userProfileName, setUserProfileName] = useState("");
    const [userTag, setUserTag] = useState("");
    const [userMail, setUserMail] = useState("");
    const [userAvatar, setUserAvatar] = useState("");
    const [notFound, setNotFound] = useState(false);

    const {refreshToken, guestStatus, setGuestStatus} = useContext(AuthContext);
    const {username} = useParams();

    // Убираем локальное состояние showEdit, используем пропс
    // const [showEdit, setShowEdit] = useState(false); // УДАЛИТЬ

    // Убираем локальные функции, используем пропсы
    // const editProf = () => { setShowEdit(true); }; // УДАЛИТЬ
    // function closeModalPage() { setShowEdit(false); } // УДАЛИТЬ

    useEffect(() => {
        console.log("postsList обновился:", postsList);
    }, [postsList]);

    const getProfileInfo = async (profileUserName, isGuest) => {
        setLoading(true);

        console.log(profileUserName, "Грузим этот профиль");
        const userInfo = await getUserProfile(profileUserName);
        console.log(userInfo);

        if (userInfo.success) {
            setUserData(userInfo.data);
            setUserProfileName(userInfo.data.username);
            setUserTag(userInfo.data.username);
            setUserMail(userInfo.data.email);
            setSubscribes(userInfo.data.subscribes);
            console.log("Список подписок от профиля:", userInfo.data.subscribes);
            setSubscribers(userInfo.data.subscribers);
            setPostsList(userInfo.data.user_posts);
            setUserAvatar(userInfo.data.photo);
            console.log(userAvatar, "Аватар Пользователя");
            setUserId(userInfo.data.uuid);

            if (!isGuest) {
                console.log("Я обновляю свой ID - я не на гостевой странице");
                localStorage.setItem("userId", userInfo.data.uuid);
            }

            console.log(postsList, "Посты");
        } else if (userInfo.statusCode === 401) {
            console.error(userInfo.error);
            refreshToken();
        } else if (userInfo.statusCode === 404) {
            setNotFound(true);
        } else {
            console.error(userInfo.error);
        }

        setLoading(false);
    };

    useEffect(() => {
        if (username) {
            const curUsername = localStorage.getItem("myUsername");
            console.log("Текущий пользователь:", curUsername, "Запрашиваемый:", username);

            const isGuest = curUsername !== username;
            setGuestStatus(isGuest);

            //TODO: обработку размонтирования
            getProfileInfo(username, isGuest);
        }
    }, [username]);

    const updateSubscribersList = async () => {
        console.log("вызван");
        if (!userProfileName) {
            console.error("userProfileName не установлен");
            return;
        }

        const response = await getFollowers(userProfileName);
        if (response.success) {
            console.log("успешно вызван");
            setSubscribers(response.data.followers);
        } else if (response.statusCode === 401) {
            refreshToken();
        } else {
            return response.error;
        }
    };

    const updateSubscriptionsList = async () => {
        const response = await getFollowing(userProfileName);
        if (response.success) {
            console.log("успешно вызван");
            setSubscribes(response.data.followings);
        } else if (response.statusCode === 401) {
            refreshToken();
        } else {
            return response.error;
        }
    }

    if (notFound) {
        return <NotFoundPage />;
    }

    if (loading) {
        return (
            <div className="relative flex flex-col items-center w-full max-w-[62rem] min-h-screen bg-white border-r-2 border-l-2 border-black">
                <div className="h-56 w-full max-w-[62rem] bg-[#D9D9D9]"></div>
                <div className="absolute left-10 top-20 w-60 h-60 pb-1 rounded-full border-4 border-black bg-gray-300 animate-pulse"></div>
                <div className="absolute left-72 top-48">
                    <div className="w-40 h-8 bg-gray-300 rounded animate-pulse mb-2"></div>
                    <div className="w-32 h-6 bg-gray-300 rounded animate-pulse"></div>
                </div>
                <p className="text-2xl font-bold mt-72">Загрузка профиля...</p>
            </div>
        );
    }

    if (!userData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <div>Ошибка загрузки профиля</div>
                <button
                    onClick={() => getProfileInfo(username, guestStatus)}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
                >
                    Попробовать снова
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            <div className="relative flex flex-col items-center w-full max-w-[62rem] min-h-screen bg-white border-r-2 border-l-2 border-black">
                <div className="h-56 w-full max-w-[62rem] bg-[#D9D9D9]"></div>
                <img
                    className="absolute left-10 top-20 w-60 h-60 pb-1 rounded-full border-4 border-black"
                    src={userAvatar ? `/avatars/${userId}Avatar.png` : "/avatars/defaultAvatar.png"}
                    alt="Ваш аватар"
                />
                <div className="absolute flex flex-col left-72 top-48">
                    <span className="text-3xl px-2">{userProfileName}</span>
                    <span className="text-xl px-2 text-gray-600">@{userTag}</span>
                    <div className="flex flex-col gap-2 items-start mt-2">
                        <ShowSubscriptionsButton
                            status={guestStatus}
                            text="Подписки"
                            myName={userProfileName}
                            count={Object.keys(subscribes).length}
                            subscriptions={subscribes}
                            updateList={updateSubscriptionsList}
                        />
                        <ProfileButton
                            status={guestStatus}
                            text="Подписчики"
                            count={Object.keys(subscribers).length}

                        />
                        <SubscribeButton
                            size={"xl"}
                            status={guestStatus}
                            profileUsername={userProfileName}
                            subscribes={subscribers}
                            updateSubscribersList={updateSubscribersList}
                        />
                    </div>
                </div>
                <div className="flex justify-center items-center mt-2"></div>
                <div className="flex flex-wrap justify-center items-center max-w-[50rem] mt-48 p-2 gap-3">
                    {Object.keys(postsList).length > 0 ? (
                        Object.values(postsList).map((post, index) => (
                            <Post
                                key={index}
                                postId={post.post_id}
                                postDate={post.create_date}
                                userTag={`@${userProfileName}`}
                                userName={userProfileName}
                                userId={userId}
                                likers={post.likers}  // Убедитесь, что передаете объект, а не число
                                comments={post.comments}
                                postText={post.text}
                            />
                        ))
                    ) : (
                        <div className="text-gray-500 text-center py-8">
                            {userProfileName} еще не опубликовал(а) постов
                        </div>
                    )}
                </div>
            </div>
            {showEdit && (
                <EditForm
                    closeModalPage={onCloseModal}  // Используем пропс
                    curUserId={userId}
                    curUserLogin={localStorage.getItem("myLogin")}
                    curUserName={userProfileName}
                    curUserMail={userMail}
                    curUserTag={userTag}
                    curUserPhoto={userId}
                />
            )}
        </div>
    );
}
