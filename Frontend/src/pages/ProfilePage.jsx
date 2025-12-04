import Header from "../components/MainPageComponents/Header.jsx";
import ProfileFeed from "../components/ProfilePageComponents/ProfileFeed.jsx";
import {SearchIcon} from "../components/Icons/SearchIcon.jsx";
import {useState} from "react";

export default function ProfilePage() {
    const [showEdit, setShowEdit] = useState(false);

    const editProf = () => {
        setShowEdit(true);
    };

    // Функция для закрытия модального окна
    const closeModalPage = () => {
        setShowEdit(false);
    };

    return(
        <div className="flex flex-col max-w-[50rem] relative">
            <Header used="profilePage">
                <SearchIcon />
                <button
                    className="text-white underline hover:opacity-60"
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