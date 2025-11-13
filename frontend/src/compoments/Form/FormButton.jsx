import {useContext} from "react";
import {AuthContext} from "../../authcontext.jsx";

export default function ({text}){



    const{auth} = useContext(AuthContext);

    return (
        <button type="submit" className={`w-fit h-12 my-5 px-10 text-white ${auth ? "bg-emerald-900" :"bg-[#202020]"} rounded-[30px] hover:opacity-80`}>
            {text}
        </button>
    )
}