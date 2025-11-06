import SearchPanel from "./SearchPanel.jsx";
import CreatePostBtn from "./CreatePostBtn.jsx";
import {SearchIcon} from "../Icons/SearchIcon.jsx";

export default function Header() {
    return(
        <div className="flex justify-center items-center gap-8 w-[50rem] h-20 bg-black rounded-t-[40px]">
            <SearchIcon/>
            <SearchPanel></SearchPanel>
            <CreatePostBtn></CreatePostBtn>
        </div>
    )
}