import Post from "./Post/Post.jsx";
import {useContext, useEffect, useState, useRef, useCallback} from "react";
import {getPosts} from "../../API/PostAPI/getPosts.jsx";
import {AuthContext} from "../../Contexts/AuthContext.jsx";
import {FeedContext} from "../../Contexts/FeedContext.jsx";
import NotificationCard from "../Other/NotificationCard.jsx";
import {getFavourPosts} from "../../API/PostAPI/getFavourPost.js";

export default function Feed({filter}) {
    const [postsList, setPostsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState('');
    const [hasMore, setHasMore] = useState(true);
    const [skip, setSkip] = useState(0);
    const {contextUserName} = useContext(AuthContext);
    const {postDeleted, postCreated, postUpdated, newPostData} = useContext(FeedContext);
    const [notice, setNotice] = useState(null);
    const limit = 15;
    const observerTarget = useRef(null);
    const isLoadingRef = useRef(false);

    const closeNotification = () => {
        setNotice(null);
    }

    // Функция загрузки постов
    const fetchPosts = useCallback(async (currentSkip, isInitial = false) => {
        console.log(`[Feed] fetchPosts called: skip=${currentSkip}, initial=${isInitial}, filter=${filter}`);

        if (isLoadingRef.current) return;
        isLoadingRef.current = true;

        try {
            const posts = (filter === "favourites"
                ? await getFavourPosts(contextUserName, currentSkip, limit)
                : await getPosts(currentSkip, limit));

            console.log(`[Feed] API response:`, posts);

            if (posts.success) {
                const newPosts = posts.data || [];
                console.log(`[Feed] Received ${newPosts.length} posts`);

                if (isInitial) {
                    setPostsList(newPosts);
                    setHasMore(newPosts.length === limit);
                    setSkip(newPosts.length);
                } else {

                    setPostsList(prev => {
                        const uniqueNewPosts = newPosts.filter(newPost =>
                            !prev.some(existingPost => existingPost.id === newPost.id)
                        );
                        console.log(`[Feed] После фильтрации дубликатов: ${uniqueNewPosts.length} новых постов`);
                        return [...prev, ...uniqueNewPosts];
                    });
                    setHasMore(newPosts.length === limit);
                    setSkip(prev => prev + newPosts.length);
                }

                console.log(`[Feed] hasMore установлен в: ${newPosts.length === limit}`);
            } else {
                console.error(`[Feed] API вернул ошибку:`, posts);
                setError("Не удалось загрузить ленту");
                setHasMore(false);
            }
        } catch (err) {
            console.error("[Feed] Ошибка при загрузке:", err);
            setError("Ошибка при загрузке");
            setHasMore(false);
        } finally {
            isLoadingRef.current = false;
            if (isInitial) {
                setLoading(false);
            } else {
                setLoadingMore(false);
            }
        }
    }, [filter, contextUserName, limit]);

    const refreshFeed = useCallback(async () => {
        console.log(`[Feed] refreshFeed called, filter=${filter}`);
        setLoading(true);
        setError(null);
        setHasMore(true);
        setSkip(0);
        await fetchPosts(0, true);
    }, [filter, fetchPosts]);

    const loadMorePosts = useCallback(async () => {
        console.log(`[Feed] loadMorePosts called, текущий skip=${skip}, hasMore=${hasMore}`);
        if (loadingMore || !hasMore || isLoadingRef.current) {
            console.log(`[Feed] Пропускаем загрузку: loadingMore=${loadingMore}, hasMore=${hasMore}, isLoadingRef=${isLoadingRef.current}`);
            return;
        }

        setLoadingMore(true);
        await fetchPosts(skip, false);
    }, [skip, hasMore, loadingMore, fetchPosts]);

    useEffect(() => {
        console.log(`[Feed] useEffect для filter: ${filter}`);
        refreshFeed();
    }, [filter, refreshFeed]);

    useEffect(() => {
        if (!hasMore || loading || loadingMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    console.log('[Feed] Observer: элемент в зоне видимости, загружаем посты');
                    loadMorePosts();
                }
            },
            {
                threshold: 0.1,
                rootMargin: '100px'
            }
        );

        const currentTarget = observerTarget.current;
        if (currentTarget) {
            observer.observe(currentTarget);
        }

        return () => {
            if (currentTarget) {
                observer.unobserve(currentTarget);
            }
        };
    }, [hasMore, loading, loadingMore, loadMorePosts]);

    useEffect(() => {
        if (postDeleted) {
            console.log(`[Feed] Удаление поста с ID: ${postDeleted}`);
            setPostsList(prev => {
                const newList = prev.filter(post => post.id !== postDeleted);
                console.log(`[Feed] После удаления: было ${prev.length}, стало ${newList.length}`);
                return newList;
            });
            setNotice({
                type: "success",
                message: "Пост удален успешно",
                duration: 2000
            });
        }
    }, [postDeleted]);

    useEffect(() => {
        if (newPostData) {
            console.log(`[Feed] Добавление нового поста с ID: ${newPostData.id}`);
            setPostsList(prev => {
                const postExist = prev.some(post => post.id === newPostData.id);
                if (!postExist) {
                    console.log(`[Feed] Новый пост добавлен в начало`);
                    return [newPostData, ...prev];
                }
                console.log(`[Feed] Пост уже существует, пропускаем`);
                return prev;
            });
        }
    }, [newPostData, postCreated]);

    useEffect(() => {
        if (postUpdated) {
            console.log(`[Feed] Обновление поста с ID: ${postUpdated.id}`);
            setPostsList(prev => {
                return prev.map(post => post.id === postUpdated.id
                    ? {...post, edited: true, text: postUpdated.text}
                    : post);
            });
        }
    }, [postUpdated]);

    useEffect(() => {
        console.log(`[Feed] Текущее состояние: skip=${skip}, postsCount=${postsList.length}, hasMore=${hasMore}, loading=${loading}, loadingMore=${loadingMore}`);
    }, [skip, postsList.length, hasMore, loading, loadingMore]);

    if (loading) {
        return (
            <div className="flex flex-col gap-5 items-center w-[50rem] pr-3 pl-3 pt-7 bg-white min-h-screen border-r-2 border-l-2 border-black">
                <div>Загрузка ленты...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col gap-5 items-center w-[50rem] pr-3 pl-3 pt-7 bg-white min-h-screen border-r-2 border-l-2 border-black">
                <div className="text-red-500">{error}</div>
                <button
                    onClick={refreshFeed}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Попробовать снова
                </button>
            </div>
        );
    }

    if (postsList.length === 0) {
        return (
            <div className="flex flex-col gap-5 items-center w-[50rem] pr-3 pl-3 pt-7 bg-white min-h-screen border-r-2 border-l-2 border-black">
                <div>Лента пуста</div>
                { notice &&
                    <NotificationCard
                        type={notice.type}
                        message={notice.message}
                        duration={notice.duration}
                        onClose={closeNotification}
                        isVisible={"true"}
                    />
                }
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5 items-center w-[50rem] pr-3 pl-3 pt-7 bg-white min-h-screen border-r-2 border-l-2 border-black">
            {postsList.map((post) => (
                <Post
                    key={post.id}
                    postText={post.text}
                    likers={post.likers}
                    userId={post.profile_id}
                    userName={post.username}
                    userTag={`@${post.username}`}
                    userAvatar={post.photo}
                    initCommentAmount={post.comments_amount}
                    edited={post.edited}
                    postDate={new Date(post.create_date).toLocaleDateString('ru-RU')}
                    postId={post.id}
                />
            ))}

            <div
                ref={observerTarget}
                className="h-20 flex items-center justify-center"
                style={{ minHeight: '80px' }}
            >
                {loadingMore && (
                    <div className="text-gray-500 animate-pulse">
                        Загрузка дополнительных постов...
                    </div>
                )}
                {!hasMore && postsList.length > 0 && (
                    <div className="text-gray-500 py-4">
                        Вы достигли конца ленты
                    </div>
                )}
            </div>

            { notice &&
                <NotificationCard
                    type={notice.type}
                    message={notice.message}
                    duration={notice.duration}
                    onClose={closeNotification}
                    isVisible={"true"}
                />
            }
        </div>
    );
}