import {createContext, use, useMemo, useState} from "react";

export const FeedContext = createContext();

export const FeedProvider =({children}) => {
    const [postCreated, setPostCreated] = useState(false);
    const [postUpdated,setPostUpdated] = useState({id:null,text:""});
    const [postDeleted,setPostDeleted] = useState("");
    const [newPostData,setNewPostData] = useState(null);

    const refreshFeed = (post) => {
        setNewPostData(post);
        setPostCreated(post.id);

        console.log(newPostData,"новый пост - контекс");
        console.log(post.id,"ноый пост id")
    };



    const contextValue = useMemo(()=>({
        postCreated,setPostCreated,
        postUpdated,setPostUpdated,
        postDeleted,setPostDeleted,
        newPostData,setNewPostData,
        refreshFeed
    }),[postCreated,postUpdated,postDeleted,refreshFeed]);

    return (
        <FeedContext.Provider value={contextValue}>
            {children}
        </FeedContext.Provider>
    );

};