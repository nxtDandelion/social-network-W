

export default function ProfileButton({text,count}){

    function handleClick() {
    }

    return(
        <button onClick={handleClick} className="flex items-start min-w-52 w-fit px-3 py-1 text-xl border-black border-2 rounded-full">
            {text}: {count}
        </button>
    )
}