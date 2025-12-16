import Post from "./Post/Post.jsx";
import {useContext, useEffect, useState} from "react";
import {getPosts} from "../../API/PostAPI/getPosts.jsx";
import {AuthContext} from "../../Contexts/AuthContext.jsx";
import {FeedContext} from "../../Contexts/FeedContext.jsx";
import NotificationCard from "../Other/NotificationCard.jsx";
import {getFavourPosts} from "../../API/PostAPI/getFavourPost.js";
import {updatePost} from "../../API/PostAPI/updatePost.js";



export default function Feed({filter}) {

    const [postsList,setPostsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error,setError] = useState('');
    const {userName} = useContext(AuthContext);
    const {postDeleted,postCreated,postUpdated,newPostData} = useContext(FeedContext);
    const [notice,setNotice] = useState(null);

    // const parentDateBroadcast = (postDate) => {
    //     feedFunc(postDate);
    // }


    const closeNotification = () =>{
        setNotice(null);
    }

    const refreshFeed = async () => {

        setLoading(true);
        setError(null);
        try {
            const posts = (filter === "favourites" ? await getFavourPosts(userName) : await getPosts());
            if (posts.success) {
                setPostsList(posts.data);
            } else {
                setError("Не удалось загрузить ленту");
            }
        } catch (err) {
            setError("Ошибка при загрузке");
            console.error("Ошибка в fetchFeed:", err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(()=>{
        refreshFeed();
    },[])

    useEffect(() => {
        const postID = postDeleted;
        const newPostList = postsList.filter(post => post.id !== postID);
        if (newPostList.length === postsList.length) {
            console.warn("Пост не был удален! Проверьте ID");
            return;
        }
        setPostsList(newPostList);
        setNotice({
            type: "success",
            message: "Пост удален успешно",
            duration: 2000
        })
        console.log("Удаленный пост убран из списка постов")
    }, [postDeleted]);

    useEffect(()=>{
        if (newPostData){
            console.log("Новая инфаа");
            const postExist = postsList.some(post => post.id === newPostData.id);
            if (!postExist){
                console.log(newPostData,"Данные нового поста");
                setPostsList(prevState => [newPostData,...prevState]);
                console.log(postsList,"Список потсов обнов");
            }
        }
        console.log(postsList);
    },[postCreated,newPostData])

    useEffect(()=>{
        if (postUpdated){
            console.log(postUpdated.id,postUpdated.text,"feed");
            setPostsList(prev =>{
               const postExist = prev.some(post => post.id === postUpdated.id);
                if (!postExist){
                    console.log("Пост для обновления не найден");
                    return prev;
                }
                console.log(postUpdated);
                return prev.map(post=> post.id === postUpdated.id  ? {...post,edited:true, text:postUpdated.text }: post )

            })
            console.log(postUpdated,"updatePost");
        }
    },[postUpdated])

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
                    className="px-4 py-2 bg-blue-500 text-white rounded"
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
            {postsList.map((post)=>(<Post
                                        key={post.id}
                                        postText={post.text}
                                        likers={post.likers}
                                        userId={post.profile_id}
                                        userName={post.username}
                                        userTag={`@${post.username}`}
                                        edited={post.edited}
                                        postDate={new Date(post.create_date).toLocaleDateString('ru-RU')}
                                        postId={post.id}
                                    />))
            }


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
    )
}



