import Feed from "../compoments/Feed/Feed.jsx";
import Sidebar from "../compoments/Layout/Sidebar.jsx";
import Header from "../compoments/Layout/Header.jsx";

export default function MainPage() {
    return (
        <div className="flex items-start w-[62rem] min-h-screen">
            <Sidebar/>
            <div className="flex flex-col">
                <Header/>
                <Feed/>
            </div>
        </div>
    )
}