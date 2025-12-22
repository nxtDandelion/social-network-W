import {createContext, use, useMemo, useState} from "react";

export const CommentContext = createContext();

export const CommentProvider =({children}) => {
    const [commentCreated, setCommentCreated] = useState({});
    const [commentUpdated,setCommentUpdated] = useState({id:null,text:""});
    const [commentDeleted,setCommentDeleted] = useState({id:null,post_id:null});
    const [newCommentData,setNewCommentData] = useState(null);
    const [freshCommentsAmount,setFreshCommentsAmount] = useState(0);

    const refreshFeed = (comment) => {
        setNewCommentData(comment);
        setCommentCreated(comment.id);
    };



    const contextValue = useMemo(()=>({
        commentCreated,setCommentCreated,
        commentUpdated,setCommentUpdated,
        commentDeleted,setCommentDeleted,
        newCommentData,setNewCommentData,
        freshCommentsAmount,setFreshCommentsAmount,
        refreshFeed
    }),[commentCreated,commentUpdated,commentDeleted,newCommentData,refreshFeed,freshCommentsAmount]);

    return (
        <CommentContext.Provider value={contextValue}>
            {children}
        </CommentContext.Provider>
    );

};