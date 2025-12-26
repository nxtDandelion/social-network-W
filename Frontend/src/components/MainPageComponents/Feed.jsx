import Post from "./Post/Post.jsx";
import { useContext, useEffect, useState, useRef, useCallback } from "react";
import { getPosts } from "../../API/PostAPI/getPosts.jsx";
import { AuthContext } from "../../Contexts/AuthContext.jsx";
import { FeedContext } from "../../Contexts/FeedContext.jsx";
import NotificationCard from "../Other/NotificationCard.jsx";
import { getFavourPosts } from "../../API/PostAPI/getFavourPost.js";
import { searchPosts } from "../../API/SearchAPI/searchPosts.js";
import {normalizePostDate} from "../../utils/dateFormater.jsx";

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
        totalElements: 0,
        totalPages: 0,
        hasMore: false
    });

    const limit = 15;
    const observerTarget = useRef(null);
    const isLoadingRef = useRef(false);

    const closeNotification = () => {
        setNotice(null);
    }

    useEffect(() => {
        if (searchResults && searchResults.query) {
            console.log('[Feed] Активируем режим поиска:', searchResults);
            setIsSearchMode(true);
            setCurrentSearchQuery(searchResults.query);

            setPostsList(searchResults.posts || []);

            setSearchPagination({
                page: searchResults.page || 1,
                size: searchResults.size || 15,
                totalElements: searchResults.totalElements || (searchResults.posts?.length || 0),
                totalPages: searchResults.totalPages || 0,
                hasMore: searchResults.hasMore || false
            });

            setHasMore(searchResults.hasMore || false);
            setError(searchError || '');
            setLoading(false);
            setLoadingMore(false);

            if ((searchResults.posts?.length || 0) === 0 && !searchLoading) {
                setNotice({
                    type: "info",
                    message: `По запросу "${searchResults.query}" ничего не найдено`,
                    duration: 3000
                });
            }
        } else if (searchResults === null) {
            console.log('[Feed] Выходим из режима поиска');
            setIsSearchMode(false);
            setCurrentSearchQuery('');
            setSearchPagination({
                page: 1,
                size: 15,
                totalElements: 0,
                totalPages: 0,
                hasMore: false
            });

            if (postsList.length === 0 && !loading) {
                console.log('[Feed] Загружаем обычную ленту');
                refreshFeed();
            }
        }
    }, [searchResults, searchError, searchLoading]);

    const fetchPosts = useCallback(async (currentSkip, isInitial = false) => {
        console.log(`[Feed] fetchPosts: skip=${currentSkip}, initial=${isInitial}, filter=${filter}`);

        if (isSearchMode) {
            console.log('[Feed] Пропускаем fetchPosts в режиме поиска');
            return;
        }

        if (isLoadingRef.current) {
            console.log('[Feed] Уже загружается, пропускаем');
            return;
        }

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
        console.log(`[Feed] refreshFeed called, filter=${filter}`);
        if (isSearchMode) return;

        setLoading(true);
        setError(null);
        setHasMore(true);
        setSkip(0);
        await fetchPosts(0, true);
    }, [filter, fetchPosts, isSearchMode]);

    // Функция для загрузки следующей порции обычных постов
    const loadMoreRegularPosts = useCallback(async () => {
        console.log(`[Feed] loadMoreRegularPosts: skip=${skip}, hasMore=${hasMore}`);
        if (loadingMore || !hasMore || isLoadingRef.current) {
            return;
        }

        setLoadingMore(true);
        await fetchPosts(skip, false);
    }, [skip, hasMore, loadingMore, fetchPosts]);

    const loadMoreSearchResults = useCallback(async () => {
        console.log(`[Feed] loadMoreSearchResults: query="${currentSearchQuery}", page=${searchPagination.page}, hasMore=${searchPagination.hasMore}`);

        if (!currentSearchQuery || !searchPagination.hasMore || loadingMore || isLoadingRef.current) {
            return;
        }

        isLoadingRef.current = true;
        setLoadingMore(true);

        try {
            const nextPage = searchPagination.page + 1;
            console.log(`[Feed] Загружаем страницу ${nextPage} поиска`);

            const results = await searchPosts(currentSearchQuery, nextPage, 15);

            if (results.success) {
                const newPosts = results.data || [];
                console.log(`[Feed] Получено ${newPosts.length} постов поиска`);

                setPostsList(prev => {
                    const uniqueNewPosts = newPosts.filter(newPost =>
                        !prev.some(existingPost => existingPost.id === newPost.id)
                    );
                    return [...prev, ...uniqueNewPosts];
                });

                setSearchPagination(prev => ({
                    ...prev,
                    page: nextPage,
                    hasMore: results.hasMore,
                    totalElements: results.totalElements || prev.totalElements,
                    totalPages: results.totalPages || prev.totalPages
                }));

                setHasMore(results.hasMore);
            } else {
                setHasMore(false);
                setSearchPagination(prev => ({ ...prev, hasMore: false }));
            }
        } catch (err) {
            console.error("[Feed] Ошибка загрузки доп. результатов:", err);
            setHasMore(false);
            setSearchPagination(prev => ({ ...prev, hasMore: false }));
        } finally {
            isLoadingRef.current = false;
            setLoadingMore(false);
        }
    }, [currentSearchQuery, searchPagination, loadingMore]);

    const loadMorePosts = useCallback(async () => {
        console.log(`[Feed] loadMorePosts: isSearchMode=${isSearchMode}`);
        if (isSearchMode) {
            await loadMoreSearchResults();
        } else {
            await loadMoreRegularPosts();
        }
    }, [isSearchMode, loadMoreSearchResults, loadMoreRegularPosts]);

    useEffect(() => {
        console.log(`[Feed] Изменение filter: ${filter}, isSearchMode=${isSearchMode}`);
        if (!isSearchMode) {
            refreshFeed();
        }
    }, [filter, isSearchMode]);

    useEffect(() => {
        if (!hasMore || loading || loadingMore || isLoadingRef.current) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMorePosts();
                }
            },
            { threshold: 0.1, rootMargin: '100px' }
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
            setPostsList(prev => prev.filter(post => post.id !== postDeleted));
            setNotice({
                type: "success",
                message: "Пост удален успешно",
                duration: 2000
            });
        }
    }, [postDeleted]);

    useEffect(() => {
        if (newPostData) {
            setPostsList(prev => {
                const postExist = prev.some(post => post.id === newPostData.id);
                if (!postExist) {
                    return [newPostData, ...prev];
                }
                return prev;
            });
        }
    }, [newPostData, postCreated]);

    useEffect(() => {
        if (postUpdated) {
            setPostsList(prev => prev.map(post =>
                post.id === postUpdated.id ? { ...post, edited: true, text: postUpdated.text } : post
            ));
        }
    }, [postUpdated]);

    const renderSearchHeader = () => {
        if (!isSearchMode) return null;

        const totalElements = searchPagination.totalElements || 0;
        const foundText = totalElements === 0
            ? "Ничего не найдено"
            : `Найдено: ${totalElements} пост${totalElements % 10 === 1 && totalElements % 100 !== 11 ? '' :
                totalElements % 10 >= 2 && totalElements % 10 <= 4 && (totalElements % 100 < 10 || totalElements % 100 >= 20) ? 'а' : 'ов'}`;

        return (
            <div className="w-full px-4 pb-8 border-b-[0.5px] border-gray-300 flex justify-between items-center mb-7">
                <div className="flex flex-col">
                    <div className="text-lg font-semibold">
                        Результаты поиска по "{currentSearchQuery}"
                    </div>
                    <div className={`text-sm mt-1 ${totalElements === 0 ? 'hidden' : 'text-gray-600'}`}>
                        {foundText}
                    </div>
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

    return (
        <div className="flex flex-col gap-5 items-center w-[50rem] pr-3 pl-3 pt-7 bg-white min-h-screen border-r-2 border-b-2 border-l-2 rounded-b-2xl mb-8 border-black">
            {renderSearchHeader()}

            {postsList.length === 0 ? (
                <div className="text-gray-500 py-8 text-center">
                    {isSearchMode ? (
                        <div className="flex flex-col items-center">
                            <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <p className="text-xl mb-2">По запросу "{currentSearchQuery}" ничего не найдено</p>
                            <p className="text-gray-500">Попробуйте изменить запрос или поискать что-то другое</p>
                        </div>
                    ) : (
                        "Лента пуста"
                    )}
                </div>
            ) : (
                <>
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
                            postDate={normalizePostDate(post.create_date)}
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
                        {/*{!hasMore && postsList.length > 0 && (*/}
                        {/*    <div className="text-gray-500 py-4">*/}
                        {/*        {isSearchMode ? "Все результаты загружены" : "Вы достигли конца ленты"}*/}
                        {/*    </div>*/}
                        {/*)}*/}
                    </div>
                </>
            )}

            {notice && (
                <NotificationCard
                    type={notice.type}
                    message={notice.message}
                    duration={notice.duration}
                    onClose={closeNotification}
                    isVisible={"true"}
                />
            )}
        </div>
    );
}