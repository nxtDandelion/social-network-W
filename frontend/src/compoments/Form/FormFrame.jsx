import {SearchIcon} from "../Icons/SearchIcon.jsx";

export default function FormFrame({ message,children}) {
    return (

        <div>
            <div className={`flex items-center justify-center w-full h-fit bg-black rounded-t-[40px]`}>
                <SearchIcon/>
            </div>
            <div className={`flex flex-col items-center justify-start w-[400px] h-fit px-3 pb-10 bg-white rounded-b-[40px] border-[3px] border-black `}>
                <h1 className="my-8 text-3xl font-light"> {message} </h1>

                {children}
            </div>
        </div>
    )
}