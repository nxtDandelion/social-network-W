export default function CreatePostBtn() {
    return (
        <button className="inline-block w-44 h-10 bg-white text-xl font-bold border-none rounded-[40px] hover:opacity-80" onClick={createPost}>
                Создать пост
        </button>
    )
}
const createPost = () => {}