import {createContext, useMemo, useState, useCallback} from "react";

export const FeedContext = createContext();

export const FeedProvider =({children}) => {
    const [postCreated, setPostCreated] = useState(false);
    const [postUpdated,setPostUpdated] = useState(null);
    const [postDeleted,setPostDeleted] = useState(null);
    const [newPostData,setNewPostData] = useState(null);
    const [likeUpdated,setLikeUpdated] = useState({})

    const refreshFeed = useCallback((post) => {
        setNewPostData(post);
        setPostCreated(post.id);
        console.log(newPostData,"новый пост - контекс");
        console.log(post.id,"ноый пост id")
    }, []);

    // Функции для очистки состояний
    const clearPostDeleted = useCallback(() => {
        setPostDeleted(null);
    }, []);

    const clearPostUpdated = useCallback(() => {
        setPostUpdated(null);
    }, []);

    const clearPostCreated = useCallback(() => {
        setPostCreated(false);
    }, []);

    const clearNewPostData = useCallback(() => {
        setNewPostData(null);
    }, []);

    const contextValue = useMemo(()=>({
        postCreated, setPostCreated,
        postUpdated, setPostUpdated,
        postDeleted, setPostDeleted,
        newPostData, setNewPostData,
        refreshFeed,
        likeUpdated,setLikeUpdated,
        clearPostDeleted,
        clearPostUpdated,
        clearPostCreated,
        clearNewPostData
    }),[postCreated, postUpdated, postDeleted, newPostData, refreshFeed,
        clearPostDeleted, clearPostUpdated, clearPostCreated, clearNewPostData,
        likeUpdated]);

    return (
        <FeedContext.Provider value={contextValue}>
            {children}
        </FeedContext.Provider>
    );
};