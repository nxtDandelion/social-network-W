import Post from "./Post/Post.jsx";

export default function Feed() {
    return (
        <div className="flex flex-col gap-5 items-center w-[50rem] pr-3 pl-3 pt-7 bg-white min-h-screen border-r-2 border-l-2 border-black">
            <Post></Post>
            <Post></Post>
            <Post></Post>
        </div>
    )
}



