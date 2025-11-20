import {useContext} from "react";
import SearchPanel from ".//SearchPanel.jsx";
import CreatePostBtn from "./CreatePostBtn.jsx";
import {SearchIcon} from "../Icons/SearchIcon.jsx";
import {AuthContext} from "../../authcontext.jsx";



export default function Header() {

    const {auth} =useContext(AuthContext);

    return(
        <div className="flex justify-center items-center gap-8 w-[50rem] h-20 bg-black rounded-t-[40px]">
            <SearchIcon/>

            <SearchPanel></SearchPanel>
            <div className="min-w-44">
                {auth && <CreatePostBtn></CreatePostBtn>}
            </div>
        </div>
    )
}