import {useCallback, useContext, useEffect, useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {useLocation} from "react-router-dom";
import {AuthContext} from "../../authcontext.jsx";

export default function NavElement({label,icon,path}) {

    const [baseLocation,setBaseLocation] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const {auth,setShowLoginMes} = useContext(AuthContext);

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
                const myProfile = localStorage.getItem("myUsername");
                navigate(`/profile/${myProfile}`);
            }
        }
    }

    return (
        <div className={`flex items-end w-36 mb-3 border-b-2 border-black hover:opacity-50 cursor-pointer ${(location.pathname === path || baseLocation) ? 'w-40' : 'text-black'}`}>
            <Link to={path} onClick={goTo} className="flex  text-black hover:text-black font-bold tracking-wider" > {label} {icon}</Link>
        </div>
    )
}
