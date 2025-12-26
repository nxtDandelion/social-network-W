import MainPage from "./pages/MainPage.jsx";
import Sidebar from "./components/SideBarComponents/Sidebar.jsx";
import {BrowserRouter, Navigate, Route, Routes} from "react-router-dom";
import {useContext, useEffect, useState} from "react";
import FavorsPage from "./pages/FavorsPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import RegistrationPage from "./pages/RegistrationPage.jsx";
import {AuthProvider,AuthContext} from "./Contexts/AuthContext.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import DevMenu from "./DevMenu.jsx";
import OldTokenPage from "./pages/OldTokenPage.jsx";
import {FeedProvider} from "./Contexts/FeedContext.jsx";
import {CommentProvider} from "./Contexts/CommentContext.jsx";

const ProtectRoute = ({children,page}) => {
    const { auth, setShowLoginMes } = useContext(AuthContext);

    console.log("Зашел ProtectRoute auth:", auth);

    useEffect(() => {
        if (!auth) {
            console.log("Не авторизован");
            if(page === 'favourites'){
                console.log("маршрут до избранного");
                setShowLoginMes(true);
            }
        }
        else {
            setShowLoginMes(false);
        }
    }, [auth, setShowLoginMes]);

    if (!auth) {
        if (page === 'profile') {
            return <Navigate to="/login" replace/>;
        }
        else return <Navigate to="/home" replace/>;
    }
    return children;
}

const TokenValidator = ({ children }) => {
    const {invalidToken} = useContext(AuthContext);

    if (invalidToken) {
        return <OldTokenPage/>;
    }
    return children;
}

function App() {

    return (
        <AuthProvider>
            <FeedProvider>
                <CommentProvider>
                    <BrowserRouter>
                        <TokenValidator>
                            <div className="relative flex justify-center w-[62rem] min-h-screen">
                                <DevMenu/>
                                <div className="absolute top-0 left-[-94px]"><Sidebar/></div>

                                    <Routes>
                                        <Route path="/" element={<MainPage/>}/>
                                        <Route path="/home" element={<MainPage/>}/>
                                        <Route path="/profile/:username" element={
                                            <ProtectRoute page="profile">
                                                <ProfilePage/>
                                            </ProtectRoute>}
                                        />
                                        <Route path="/favourites" element={
                                            <ProtectRoute page="favourites">
                                                <FavorsPage/>
                                            </ProtectRoute>}
                                        />
                                        <Route path="/registration" element={<RegistrationPage/>}/>
                                        <Route path="/login" element={<LoginPage/>}/>
                                        <Route path="*" element={<NotFoundPage/>}/>
                                    </Routes>

                            </div>
                        </TokenValidator>
                    </BrowserRouter>
                </CommentProvider>
            </FeedProvider>
        </AuthProvider>
  )
}
export default App


