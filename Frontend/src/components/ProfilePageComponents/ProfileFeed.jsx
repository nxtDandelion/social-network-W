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
import NotificationCard from "../Other/NotificationCard.jsx";
import { getCurrentPost } from "../../API/PostAPI/GetCurrentPost.js";
import {FeedContext} from "../../Contexts/FeedContext.jsx";

export default function ProfileFeed({ showEdit, onCloseModal}) {
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState([]);
    const [postsList, setPostsList] = useState([]);
    const [postsData, setPostsData] = useState([]);
    const [subscribers, setSubscribers] = useState({});
    const [subscribes, setSubscribes] = useState({});
    const [userId, setUserId] = useState("");
    const [userProfileName, setUserProfileName] = useState("");
    const [userLogin, setUserLogin] = useState("");
    const [userTag, setUserTag] = useState("");
    const [userMail, setUserMail] = useState("");
    const [userAvatar, setUserAvatar] = useState("");
    const [notFound, setNotFound] = useState(false);
    const {refreshToken, guestStatus, setGuestStatus,setContextUserId} = useContext(AuthContext);
    const {postDeleted,postCreated,postUpdated,newPostData} = useContext(FeedContext);
    const {username} = useParams();
    const [notice,setNotice] = useState(null);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [postsError, setPostsError] = useState(null);

    useEffect(() => {
        console.log("postsList обновился:", postsList);
        if (postsList && postsList.length > 0) {
            loadPostsData(postsList);
        } else {
            setPostsData([]);
        }
    }, [postsList]);

    const loadPostsData = async (postIds) => {
        setLoadingPosts(true);
        setPostsError(null);

        try {
            const postsPromises = postIds.map(postId => getCurrentPost(postId));
            const postsResults = await Promise.all(postsPromises);

            console.log("Результаты загрузки постов:", postsResults);

            const successfulPosts = postsResults
                .filter(result => result && result.success)
                .map(result => result.data);

            // СОРТИРОВКА: от новых к старым
            const sortedPosts = successfulPosts.sort((a, b) => {
                return new Date(b.create_date) - new Date(a.create_date);
            });

            setPostsData(sortedPosts);

            const failedPosts = postsResults.filter(result => !result || !result.success);
            if (failedPosts.length > 0) {
                console.warn(`Не удалось загрузить ${failedPosts.length} постов`);
            }
        } catch (error) {
            console.error("Ошибка при загрузке постов:", error);
            setPostsError("Ошибка при загрузке постов");
        } finally {
            setLoadingPosts(false);
        }
    };

    useEffect(() => {
        const postID = postDeleted;
        if (!postID) return;

        const newPostsList = postsList.filter(id => id !== postID);
        const newPostsData = postsData.filter(post => post.id !== postID);

        if (newPostsList.length === postsList.length &&
            newPostsData.length === postsData.length) {
            return;
        }

        setPostsList(newPostsList);
        setPostsData(newPostsData);

        setNotice({
            type: "success",
            message: "Пост удален успешно",
            duration: 2000
        });
    }, [postDeleted]);

    useEffect(() => {
        if (newPostData) {
            const postExist = postsData.some(post => post.id === newPostData.id);
            if (!postExist) {
                setPostsData(prevState => {
                    const newData = [newPostData, ...prevState];
                    return newData.sort((a, b) => {
                        return new Date(b.create_date) - new Date(a.create_date);
                    });
                });
                setPostsList(prev => [...prev, newPostData.id]);
            }
        }
    }, [postCreated, newPostData]);

    useEffect(() => {
        if (postUpdated && postUpdated.id) {
            console.log(postUpdated.id, postUpdated.text, "feed");
            setPostsData(prev => {
                const postExist = prev.some(post => post.id === postUpdated.id);
                if (!postExist) {
                    console.log("Пост для обновления не найден");
                    return prev;
                }

                const updatedData = prev.map(post =>
                    post.id === postUpdated.id
                        ? {...post, edited: true, text: postUpdated.text }
                        : post
                );

                return updatedData.sort((a, b) => {
                    return new Date(b.create_date) - new Date(a.create_date);
                });
            });
            console.log(postUpdated, "updatePost");
        }
    }, [postUpdated]);

    const getProfileInfo = async (profileUserName, isGuest) => {
        setLoading(true);
        setPostsError(null);

        console.log(profileUserName, "Грузим этот профиль");
        const userInfo = await getUserProfile(profileUserName);
        console.log("Данные профиля:", userInfo);

        if (userInfo.success) {
            setUserData(userInfo.data);
            setUserProfileName(userInfo.data.username);
            setUserLogin(userInfo.data.login);
            setUserTag(userInfo.data.username);
            setUserMail(userInfo.data.email);
            setSubscribes(userInfo.data.subscribes);
            setSubscribers(userInfo.data.subscribers);

            let postIds = [];
            if (userInfo.data.user_posts) {

                if (Array.isArray(userInfo.data.user_posts)) {
                    postIds = userInfo.data.user_posts;
                } else if (typeof userInfo.data.user_posts === 'object') {
                    postIds = Object.values(userInfo.data.user_posts).map(post => post.post_id || post.id);
                }
            }

            setPostsList(postIds);
            console.log("ID постов для загрузки:", postIds);

            setUserAvatar(userInfo.data.photo);
            setUserId(userInfo.data.uuid);

            if (!isGuest) {

                console.log("Я обновляю свой ID - я не на гостевой странице");
                localStorage.setItem("UserPhoto", userInfo.data.photo);
                localStorage.setItem("userId", userInfo.data.uuid);
                setContextUserId(userInfo.data.uuid);
                localStorage.setItem("myUserName", userInfo.data.username);
            }
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

            getProfileInfo(username, isGuest);
        }
    }, [username]);

    const refreshProfile = () => {
        getProfileInfo(username, false);
    }

    const updateSubscribersList = async () => {
        console.log("вызван");
        if (!userProfileName) {
            console.error("userProfileName не установен");
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

    function showNotice() {
        setNotice({
            type: "success",
            message: "Профиль успешно обновлен",
            duration: 1500
        })
    }

    function closeNotice() {
        setNotice(null);
    }

    // Функция для повторной загрузки постов
    const retryLoadPosts = () => {
        if (postsList.length > 0) {
            loadPostsData(postsList);
        }
    };

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

                <div className="absolute top-32 w-full max-w-[62rem] px-8">
                    <div className="flex items-end">
                        <div className="flex-shrink-0 mr-6">
                            <img
                                className="w-60 h-60 rounded-full border-4 border-black bg-white object-cover shadow-lg"
                                src={userAvatar ? userAvatar : "/avatars/defaultAvatar.png"}
                                alt="Ваш аватар"
                                onError={(e) => e.target.src = "/avatars/defaultAvatar.png"}
                            />
                        </div>

                        <div className="flex-1 pb-8">
                            <div className="flex flex-col mb-4">
                                <span className="text-3xl px-2">{userProfileName}</span>
                                <span className="text-xl px-2 text-gray-600">@{userProfileName}</span>
                            </div>

                            <div className="flex flex-col gap-2 items-start">
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
                    </div>
                </div>

                <div className="flex flex-wrap justify-center items-center max-w-[50rem] mt-48 p-2 gap-3">
                    {postsError ? (
                        <div className="text-center py-8 w-full">
                            <div className="text-red-500 mb-4">{postsError}</div>
                            <button
                                onClick={retryLoadPosts}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                Попробовать снова
                            </button>
                        </div>
                    ) : loadingPosts ? (
                        <div className="text-gray-500 text-center py-8">
                            Загрузка постов...
                        </div>
                    ) : postsData.length > 0 ? (
                        postsData.map((post) => (
                            <Post
                                key={post.id}
                                postId={post.id}
                                postDate={new Date(post.create_date).toLocaleDateString('ru-RU')}
                                userTag={`@${post.username || userProfileName}`}
                                userName={post.username || userProfileName}
                                userId={post.uuid || userId}
                                likers={post.likers}
                                postText={post.text}
                                initCommentAmount={post.comments_amount}
                                userAvatar={userAvatar}
                                edited={post.edited}
                            />
                        ))
                    ) : postsList.length > 0 ? (
                        <div className="text-gray-500 text-center py-8">
                            Загрузка постов...
                        </div>
                    ) : (
                        <div className="text-gray-500 text-center py-8">
                            {userProfileName} еще не опубликовал(а) постов
                        </div>
                    )}
                </div>
            </div>
            {showEdit && (
                <EditForm
                    closeModalPage={onCloseModal}
                    curUserId={userId}
                    curUserLogin={userLogin}
                    curUserName={userProfileName}
                    curUserMail={userMail}
                    curUserAvatar={userAvatar}
                    refreshProfile={refreshProfile}
                    showNotice={showNotice}
                />
            )}
            {notice && <NotificationCard
                type={notice.type}
                message={notice.message}
                duration={notice.duration}
                isVisible={"true"}
                onClose={closeNotice}
            />}
        </div>
    );
}