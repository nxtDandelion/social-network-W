import Feed from "../compoments/Feed/Feed.jsx";
import Sidebar from "../compoments/Layout/Sidebar.jsx";
import Header from "../compoments/Layout/Header.jsx";

export default function MainPage() {


    const functionA = (postDate) => {
        console.log(postDate);
    }

    return (
        <div className="flex flex-col">
            <Header/>
            <Feed

                feedFunc={functionA}
            />
        </div>
    )
}