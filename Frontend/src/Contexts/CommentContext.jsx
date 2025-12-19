import {createContext, use, useMemo, useState} from "react";

export const CommentContext = createContext();

export const CommentProvider =({children}) => {
    const [commentCreated, setCommentCreated] = useState({});
    const [commentUpdated,setCommentUpdated] = useState({id:null,text:""});
    const [commentDeleted,setCommentDeleted] = useState(null);
    const [newCommentData,setNewCommentData] = useState(null);

    const refreshFeed = (comment) => {
        setNewCommentData(comment);
        setCommentCreated(comment.id);

        console.log(newCommentData,"новый пост - контекс");
        console.log(comment.id,"ноый пост id");
    };



    const contextValue = useMemo(()=>({
        commentCreated,setCommentCreated,
        commentUpdated,setCommentUpdated,
        commentDeleted,setCommentDeleted,
        newCommentData,setNewCommentData,
        refreshFeed
    }),[commentCreated,commentUpdated,commentDeleted,refreshFeed]);

    return (
        <CommentContext.Provider value={contextValue}>
            {children}
        </CommentContext.Provider>
    );

};