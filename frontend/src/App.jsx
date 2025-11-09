import MainPage from "./pages/MainPage.jsx";
import Sidebar from "./compoments/Layout/Sidebar.jsx";
import { BrowserRouter,Route , Routes} from "react-router-dom";
import {useState} from "react";
import FavorsPage from "./pages/FavorsPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import RegistrationPage from "./pages/RegistrationPage.jsx";


function App() {
    return (
        <BrowserRouter>
            <div className="flex items-start w-[62rem] min-h-screen">
                <Sidebar/>
                <Routes>
                    <Route path="/" element={<MainPage/>}/>
                    <Route path="/home" element={<MainPage/>}/>
                    <Route path="/profile" element={<ProfilePage/>}/>
                    <Route path="/registration" element={<RegistrationPage/>}/>
                    <Route path="/favorites" element={FavorsPage}/>
                    <Route path="*" element={NotFoundPage}/>
                </Routes>
            </div>
        </BrowserRouter>
  )
}
export default App

