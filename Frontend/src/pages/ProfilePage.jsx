import Header from "../components/MainPageComponents/Header.jsx";
import ProfileFeed from "../components/ProfilePageComponents/ProfileFeed.jsx";
import {SearchIcon} from "../components/Icons/SearchIcon.jsx";
import {useContext, useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {AuthContext} from "../Contexts/AuthContext.jsx";

export default function ProfilePage() {
    const [showEdit, setShowEdit] = useState(false);
    const [guestStatus,setGuestStatus] = useState(false);
    const {username} = useParams();
    const {setAuth,setShowLoginMes} = useContext(AuthContext);
    const myUsername = localStorage.getItem("myUsername");

    useEffect(()=>{
       if(myUsername!==username){
           setGuestStatus(true);
       }
       else {
           setGuestStatus(false);
       }
    },[username])

    const editProf = () => {
        setShowEdit(true);
    };

    const exitProf = () => {
        localStorage.removeItem("myUsername");
        localStorage.removeItem("userId");
        localStorage.removeItem("myLogin");
        localStorage.removeItem("UserPhoto");
        localStorage.removeItem("access_token");
        localStorage.removeItem("auth");
        setAuth(false);
        setShowLoginMes(false);
    }

    const closeModalPage = () => {
        setShowEdit(false);
    };

    console.log(guestStatus,"Статус посещения");

    return(
        <div className="flex flex-col max-w-[50rem] relative">
            <Header used="profilePage">
                <SearchIcon />
               <div className="flex gap-8">
                <button
                    className={`${guestStatus ? "hidden" : "flex"} text-white underline hover:opacity-60`}
                    onClick={exitProf}
                >
                    Выйти
                </button>
                <button
                    className={`${guestStatus ? "hidden" : "flex"} text-white underline hover:opacity-60`}
                    onClick={editProf}
                >
                    Редактировать
                </button>
               </div>

            </Header>
            <ProfileFeed
                showEdit={showEdit}
                onCloseModal={closeModalPage}
                onEditClick={editProf}
            />
        </div>
    );
}