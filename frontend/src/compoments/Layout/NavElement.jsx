import {useCallback, useContext} from "react";
import {Link, useNavigate} from "react-router-dom";
import {useLocation} from "react-router-dom";
import {AuthContext} from "../../authcontext.jsx";

export default function NavElement({label,icon,path}) {

    const navigate = useNavigate();
    const location = useLocation();
    const { auth,setShowLogin,setRedirectPath } = useContext(AuthContext);

    const goTo = (e) =>{
        if (!auth){
            if (path!=="/home") {
                e.preventDefault();
                e.stopPropagation();
                setRedirectPath(path);
                navigate("/login");
            }
        }

        else {
            console.log("я авторизирован go to");
            navigate(path)}
    }

    return (
        <div className={`flex items-end w-36 mb-3 border-b-2 border-black hover:opacity-50 cursor-pointer ${(location.pathname === path) ? 'w-40' : 'text-black'}`}>
            <button>
                <a onClick={goTo} className="flex  text-black hover:text-black font-bold tracking-wider" href={path}> {label} {icon}</a>
            </button>
        </div>
    )
}

// <Link to={path} className="flex  text-black hover:text-black font-bold tracking-wider"> {label}
//     {icon}
// </Link>