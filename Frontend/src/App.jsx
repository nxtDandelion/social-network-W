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



const AuthCheck = ({children}) => {
    const { auth,setShowLogin} = useContext(AuthContext);
    if (!auth) {
        setShowLogin(true);
        return <Navigate to="/" replace />;
    }
    return children;
}


function App() {
    return (
        <AuthProvider>
        <BrowserRouter>
            <div className="flex items-start w-[62rem] min-h-screen">
                <Sidebar/>
                    <Routes>
                        <Route path="/" element={<MainPage/>}/>
                        <Route path="/home" element={<MainPage/>}/>
                        <Route path="/profile" element={<ProfilePage cureName="Alex" cureLogin="@GUGIguh" cureMail="Alex@mail.ru" curePassword="12345678" subscribes="1000" followers="10"/>}/>
                        <Route path="/favorites" element={<FavorsPage/>}/>
                        <Route path="*" element={<NotFoundPage/>}/>
                        <Route path="/registration" element={<RegistrationPage/>}/>
                        <Route path="/login" element={<LoginPage/>}/>
                    </Routes>
            </div>
        </BrowserRouter>
        </AuthProvider>
  )
}
export default App


