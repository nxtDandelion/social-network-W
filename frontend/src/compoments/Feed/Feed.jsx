import Post from "./Post/Post.jsx";

export default function Feed({feedFunc}) {

    const func = (count) => {
        console.log("Parent_Call");
    }
    const parentDateBroadcast = (postDate) => {
        feedFunc(postDate);
    }
    return (



        <div className="flex flex-col gap-5 items-center w-[50rem] pr-3 pl-3 pt-7 bg-white min-h-screen border-r-2 border-l-2 border-black">
            <Post
                count={"228"}
                parentCall={func}
                postDate={"Создан 25 мая в 12:37"}
                dateBroadcast={parentDateBroadcast}

            >

            </Post>
            <Post
                count={"2289"}
            parentCall={func}
                postDate={"Создан 25 мая в 12:37"}
                dateBroadcast={parentDateBroadcast}>

            </Post>
            <Post
                count={"0"}
                parentCall={func}
                postDate={"Создан 25 мая в 12:37"}
                dateBroadcast={parentDateBroadcast}
            >

            </Post>
        </div>
    )
}



