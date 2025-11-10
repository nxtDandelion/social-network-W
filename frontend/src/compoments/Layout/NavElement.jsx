import {useCallback} from "react";
import {Link} from "react-router-dom";
import {useLocation} from "react-router-dom";

export default function NavElement({label,icon,path}) {

    const location = useLocation();

    return (
        <div className={`flex items-end w-36 mb-3 border-b-2 border-black hover:opacity-50 cursor-pointer ${location.pathname === path ? 'w-40' : 'text-black'}`}>
            <Link to={path} className="flex  text-black hover:text-black font-bold tracking-wider"> {label}
                {icon}
            </Link>
        </div>
    )
}