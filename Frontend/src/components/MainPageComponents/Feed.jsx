import Post from "./Post/Post.jsx";
import {useContext, useEffect, useState} from "react";
import {getPosts} from "../../API/PostAPI/getPosts.jsx";
import {AuthContext} from "../../authcontext.jsx";

export default function Feed({feedFunc}) {

    const [postsList,setPostsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error,setError] = useState('');
    const {postCreated} = useContext(AuthContext);

    const func = (count) => {
        console.log("Parent_Call");
    }
    // const parentDateBroadcast = (postDate) => {
    //     feedFunc(postDate);
    // }

    const refreshFeed = async () => {
        setLoading(true);
        setError(null);
        try {
            const posts = await getPosts();
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
        console.log(postsList);
    },[postCreated])

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
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5 items-center w-[50rem] pr-3 pl-3 pt-7 bg-white min-h-screen border-r-2 border-l-2 border-black">
            {postsList.map((post)=>(<Post
                key={post.id}
                postText={post.text}
                comments={""}
                likers={post.likers}
                userId={post.profile_id}
                userName={post.username}
                userTag={`@${post.username}`}
                postDate={new Date(post.create_date).toLocaleDateString('ru-RU')}
                postId={post.id}
            />))}
        </div>
    )
}



