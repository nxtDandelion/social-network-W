import Header from "../components/MainPageComponents/Header.jsx";
import ProfileFeed from "../components/ProfilePageComponents/ProfileFeed.jsx";
import {SearchIcon} from "../components/Icons/SearchIcon.jsx";
import {useEffect, useState} from "react";
import {useParams} from "react-router-dom";

export default function ProfilePage() {
    const [showEdit, setShowEdit] = useState(false);
    const [guestStatus,setGuestStatus] = useState(false);
    const {username} = useParams();
    const myUsername = localStorage.getItem("myUsername");

    useEffect(()=>{
        console.log("Username",username);
        console.log("myUsername",myUsername);
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

    // Функция для закрытия модального окна
    const closeModalPage = () => {
        setShowEdit(false);
    };

    console.log(guestStatus,"Статус посещения");

    return(
        <div className="flex flex-col max-w-[50rem] relative">
            <Header used="profilePage">
                <SearchIcon />
                <button
                    className={`${guestStatus ? "hidden" : "flex"} text-white underline hover:opacity-60`}
                    onClick={editProf}
                >
                    Редактировать
                </button>
            </Header>
            <ProfileFeed
                showEdit={showEdit}
                onCloseModal={closeModalPage}
                onEditClick={editProf}
            />
        </div>
    );
}