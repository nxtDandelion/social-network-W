import {useContext} from "react";

import {AuthContext} from "../../Contexts/AuthContext.jsx";



export default function Header({children,used}) {

    const {auth} =useContext(AuthContext);

    return(
        <div className={`flex ${used === "profilePage" ? "justify-between":"justify-center"} items-center gap-8 px-12  w-[50rem] h-20 bg-black rounded-t-[40px]`}>
            {children}
        </div>
    )
}