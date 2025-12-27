import {SearchIcon} from "../Icons/SearchIcon.jsx";

export default function PopupHeader({children}) {
    return(
        <div className={`relative flex items-center justify-center w-full  h-fit bg-black rounded-t-[40px]`}>
            <SearchIcon/>
            {children}
        </div>
    )
}