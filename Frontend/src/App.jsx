import MainPage from "./pages/MainPage.jsx";
import Sidebar from "./components/SideBarComponents/Sidebar.jsx";
import {BrowserRouter, Navigate, Route, Routes} from "react-router-dom";
import {useContext, useEffect, useState} from "react";
import FavorsPage from "./pages/FavorsPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import RegistrationPage from "./pages/RegistrationPage.jsx";
import {AuthProvider,AuthContext} from "./authcontext.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import DevMenu from "./DevMenu.jsx";

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

function App() {
    return (
        <AuthProvider>
        <BrowserRouter>
            <div className="flex items-start w-[62rem] min-h-screen">
                <DevMenu/>
                <Sidebar/>
                    <Routes>
                        <Route path="/" element={<MainPage/>}/>
                        <Route path="/home" element={<MainPage/>}/>
                        <Route path="/profile" element={
                            <ProtectRoute page="profile">
                                <ProfilePage cureName="Alex"
                                             cureLogin="@GUGIguh"
                                             cureMail="Alex@mail.ru"
                                             curePassword="12345678"
                                             subscribes="1000"
                                             followers="10"
                                />
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
        </BrowserRouter>
        </AuthProvider>
  )
}
export default App


