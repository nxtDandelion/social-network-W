import {useCallback, useContext, useEffect, useState} from "react";
import {Link, useNavigate, useParams} from "react-router-dom";
import {useLocation} from "react-router-dom";
import {AuthContext} from "../../Contexts/AuthContext.jsx";

export default function NavElement({label,icon,path}) {

    const [baseLocation,setBaseLocation] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const {auth,setShowLoginMes} = useContext(AuthContext);
    const {username} = useParams();
    const myProfile = localStorage.getItem("myUsername");

    useEffect(()=>{

        console.log(location.pathname);
        const curLocation = location.pathname;
        if (curLocation === '/'){
            if (path==='/home'){
                setBaseLocation(true);
                console.log(path,"path");
            }
        }
        else {
            setBaseLocation(false);
            // console.log('Мы не на базовой странице')
        }
    },[location]);

    const goTo = (e) =>{
        if (!auth){
            if (path==="/profile") {
                e.preventDefault();
                navigate("/login");
            }
            else if (path==="/favourites"){
                e.preventDefault();
                navigate("/home");
                setShowLoginMes(true);
            }
        }
        else{
            if (path === "/profile"){
                e.preventDefault();
                navigate(`/profile/${myProfile}`);
            }
        }
    }

    return (
        <div className={`flex items-end w-36 mb-3 border-b-2 border-black hover:opacity-50 cursor-pointer ${(location.pathname === path || baseLocation || (location.pathname === `/profile/${myProfile}` && path === '/profile')) ? 'w-40' : 'text-black'}`}>
            <Link to={path} onClick={goTo} className="flex  text-black hover:text-black font-bold tracking-wider" > {label} {icon}</Link>
        </div>
    )
}
