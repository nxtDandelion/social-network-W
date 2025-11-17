import {useContext} from "react";
import {AuthContext} from "../../authcontext.jsx";

export default function ({text,status}){

    const{auth} = useContext(AuthContext);

    return (
        <button type={status?"submit":"button"} className={`w-fit h-12 my-5 px-10 text-white ${status ? "bg-[#202020] cursor-pointer hover:opacity-80":"bg-gray-500 cursor-default"} ${auth ? "bg-emerald-900" :"bg-[#202020]"} rounded-[30px] `}>
            {text}
        </button>
    )
}