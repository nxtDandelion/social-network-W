import Post from "./Post/Post.jsx";
import { useContext, useEffect, useState, useRef, useCallback } from "react";
import { getPosts } from "../../API/PostAPI/getPosts.jsx";
import { AuthContext } from "../../Contexts/AuthContext.jsx";
import { FeedContext } from "../../Contexts/FeedContext.jsx";
import NotificationCard from "../Other/NotificationCard.jsx";
import { getFavourPosts } from "../../API/PostAPI/getFavourPost.js";
import { searchPosts } from "../../API/SearchAPI/searchPosts.js";

export default function Feed({ filter, searchResults, searchLoading, searchError, onCloseSearch }) {
    const [postsList, setPostsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState('');
    const [hasMore, setHasMore] = useState(true);
    const [skip, setSkip] = useState(0);
    const { contextUserName } = useContext(AuthContext);
    const { postDeleted, postCreated, postUpdated, newPostData } = useContext(FeedContext);
    const [notice, setNotice] = useState(null);

    const [isSearchMode, setIsSearchMode] = useState(false);
    const [currentSearchQuery, setCurrentSearchQuery] = useState('');
    const [searchPagination, setSearchPagination] = useState({
        page: 1,
        size: 15,
        hasMore: true
    });

    const limit = 15;
    const observerTarget = useRef(null);
    const isLoadingRef = useRef(false);

    const closeNotification = () => {
        setNotice(null);
    }

    // Обработка результатов поиска
    useEffect(() => {
        if (searchResults !== null) {
            setIsSearchMode(true);
            setCurrentSearchQuery(searchResults.query || '');

            // Если это первая страница результатов
            if (searchResults.page === 1) {
                setPostsList(searchResults.posts || []);
            } else {
                // Если это доп. страница - добавляем к существующим
                setPostsList(prev => {
                    const newPosts = searchResults.posts || [];
                    const uniqueNewPosts = newPosts.filter(newPost =>
                        !prev.some(existingPost => existingPost.id === newPost.id)
                    );
                    console.log(`[Feed/Поиск] После фильтрации: ${uniqueNewPosts.length} новых постов`);
                    return [...prev, ...uniqueNewPosts];
                });
            }

            // Обновляем информацию о пагинации
            setSearchPagination({
                page: searchResults.page,
                size: searchResults.size,
                hasMore: searchResults.hasMore
            });

            setHasMore(searchResults.hasMore);
            setError(searchError || '');
            setLoading(false);
            setLoadingMore(false);

            // Если нет результатов поиска (F_SRCH_6)
            if (searchResults.posts.length === 0 && searchResults.page === 1 && !searchLoading) {
                setNotice({
                    type: "info",
                    message: "Результатов не найдено",
                    duration: 3000
                });
            }
        } else {
            setIsSearchMode(false);
            setCurrentSearchQuery('');
            setSearchPagination({
                page: 1,
                size: 15,
                hasMore: true
            });
            // Возвращаемся к обычной ленте
            if (postsList.length === 0) {
                refreshFeed();
            }
        }
    }, [searchResults, searchError, searchLoading]);

    const fetchPosts = useCallback(async (currentSkip, isInitial = false) => {
        console.log(`[Feed] fetchPosts called: skip=${currentSkip}, initial=${isInitial}, filter=${filter}, searchMode=${isSearchMode}`);

        // Если в режиме поиска - не используем эту функцию
        if (isSearchMode) {
            return;
        }

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
    }, [filter, contextUserName, limit, isSearchMode]);

    const refreshFeed = useCallback(async () => {
        console.log(`[Feed] refreshFeed called, filter=${filter}, searchMode=${isSearchMode}`);
        if (isSearchMode) return;

        setLoading(true);
        setError(null);
        setHasMore(true);
        setSkip(0);
        await fetchPosts(0, true);
    }, [filter, fetchPosts, isSearchMode]);

    // Функция для загрузки следующей страницы поиска
    const loadMoreSearchResults = useCallback(async () => {
        if (!currentSearchQuery || !searchPagination.hasMore || loadingMore || isLoadingRef.current) {
            console.log(`[Feed/Поиск] Пропускаем: query=${currentSearchQuery}, hasMore=${searchPagination.hasMore}, loadingMore=${loadingMore}`);
            return;
        }

        isLoadingRef.current = true;
        setLoadingMore(true);

        try {
            const nextPage = searchPagination.page + 1;
            console.log(`[Feed/Поиск] Загружаем страницу ${nextPage} для запроса: "${currentSearchQuery}"`);

            const results = await searchPosts(currentSearchQuery, nextPage, 15);

            if (results.success) {
                const newPosts = results.data || [];
                console.log(`[Feed/Поиск] Получено ${newPosts.length} постов`);

                // Добавляем новые посты к существующим
                setPostsList(prev => {
                    const uniqueNewPosts = newPosts.filter(newPost =>
                        !prev.some(existingPost => existingPost.id === newPost.id)
                    );
                    console.log(`[Feed/Поиск] После фильтрации: ${uniqueNewPosts.length} новых постов`);
                    return [...prev, ...uniqueNewPosts];
                });

                // Обновляем информацию о пагинации
                setSearchPagination(prev => ({
                    ...prev,
                    page: nextPage,
                    hasMore: results.hasMore
                }));

                setHasMore(results.hasMore);
            } else {
                setHasMore(false);
            }
        } catch (err) {
            console.error("[Feed/Поиск] Ошибка загрузки доп. результатов:", err);
            setHasMore(false);
        } finally {
            isLoadingRef.current = false;
            setLoadingMore(false);
        }
    }, [currentSearchQuery, searchPagination, loadingMore]);

    // Функция для загрузки следующей порции обычных постов
    const loadMoreRegularPosts = useCallback(async () => {
        console.log(`[Feed] loadMoreRegularPosts called, текущий skip=${skip}, hasMore=${hasMore}`);
        if (loadingMore || !hasMore || isLoadingRef.current) {
            console.log(`[Feed] Пропускаем загрузку: loadingMore=${loadingMore}, hasMore=${hasMore}`);
            return;
        }

        setLoadingMore(true);
        await fetchPosts(skip, false);
    }, [skip, hasMore, loadingMore, fetchPosts]);

    // Объединенная функция для загрузки "еще"
    const loadMorePosts = useCallback(async () => {
        if (isSearchMode) {
            await loadMoreSearchResults();
        } else {
            await loadMoreRegularPosts();
        }
    }, [isSearchMode, loadMoreSearchResults, loadMoreRegularPosts]);

    // Загрузка обычной ленты при изменении filter
    useEffect(() => {
        console.log(`[Feed] useEffect для filter: ${filter}, searchMode=${isSearchMode}`);
        if (!isSearchMode) {
            refreshFeed();
        }
    }, [filter, refreshFeed, isSearchMode]);

    // IntersectionObserver для бесконечного скролла
    useEffect(() => {
        if (!hasMore || loading || loadingMore || isLoadingRef.current) {
            console.log(`[Feed] Observer пропускает: hasMore=${hasMore}, loading=${loading}, loadingMore=${loadingMore}`);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    console.log(`[Feed] Observer: элемент в зоне видимости, загружаем ${isSearchMode ? 'следующую страницу поиска' : 'доп. посты'}`);
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
    }, [hasMore, loading, loadingMore, loadMorePosts, isSearchMode]);

    // Обработка удаления поста
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

    // Обработка создания поста
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

    // Обработка обновления поста
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

    // Логирование состояния
    useEffect(() => {
        console.log(`[Feed] Текущее состояние: searchMode=${isSearchMode}, postsCount=${postsList.length}, hasMore=${hasMore}, loading=${loading}, loadingMore=${loadingMore}`);
    }, [isSearchMode, postsList.length, hasMore, loading, loadingMore]);

    // Рендер заголовка поиска
    const renderSearchHeader = () => {
        if (!isSearchMode) return null;

        return (
            <div className="w-full px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
                <div className="text-lg font-semibold">
                    Результаты поиска по "{currentSearchQuery}"
                    {searchLoading && <span className="ml-2">(Загрузка...)</span>}
                </div>
                <button
                    onClick={onCloseSearch}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-full hover:bg-gray-100"
                >
                    Вернуться к ленте
                </button>
            </div>
        );
    };

    if (loading && !isSearchMode) {
        return (
            <div className="flex flex-col gap-5 items-center w-[50rem] pr-3 pl-3 pt-7 bg-white min-h-screen border-r-2 border-l-2 border-black">
                <div>Загрузка ленты...</div>
            </div>
        );
    }

    if (error && !isSearchMode) {
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

    if (postsList.length === 0 && !loading) {
        return (
            <div className="flex flex-col gap-5 items-center w-[50rem] pr-3 pl-3 pt-7 bg-white min-h-screen border-r-2 border-l-2 border-black">
                {renderSearchHeader()}
                <div>{isSearchMode ? "По вашему запросу ничего не найдено" : "Лента пуста"}</div>
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
        <div className="flex flex-col items-center w-[50rem] bg-white min-h-screen border-r-2 border-l-2 border-black">
            {renderSearchHeader()}

            <div className="flex flex-col gap-5 w-full pr-3 pl-3 pt-7">
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
                            {isSearchMode ? "Загрузка результатов..." : "Загрузка дополнительных постов..."}
                        </div>
                    )}
                    {!hasMore && postsList.length > 0 && (
                        <div className="text-gray-500 py-4">
                            {isSearchMode ? "Все результаты загружены" : "Вы достигли конца ленты"}
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
        </div>
    );
}