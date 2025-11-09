import NavElement from "./NavElement";
import {ProfileIcon} from "../Icons/ProfileIcon.jsx";
import {FavoriteIcon} from "../Icons/FavoritesIcon.jsx";
import {HomeIcon} from "../Icons/HomeIcon.jsx";


const navItems = [
    {
        label: "Главная",
        icon: <HomeIcon/>,
        path: "/home"
    },
    {
        label: "Подписки",
        icon: <FavoriteIcon/>,
        path: "/favorites"
    },
    {
        label: "Профиль",
        icon: <ProfileIcon/>,
        path: "/profile"
    }
];

export default function Sidebar() {
    return (
        <div className="flex flex-col justify-center items-end w-48 h-fit mt-20 py-10 rounded-l-3xl rounded-bl-3xl bg-white border-y-2 border-l-2 border-black">
            {navItems.map((item) => (
                <NavElement
                    label={item.label}
                    icon={item.icon}

                    path={item.path}

                    // Передаем функцию навигации
                />
            ))}
        </div>
    );
}