import {createContext, useState, useContext, useEffect, useMemo} from "react";
import {lenghtCheck} from "./API/AuthAPI/validation.js";

export const AuthContext = createContext();

export const AuthProvider =({children}) =>{
    const [auth, setAuth] = useState(() => {return localStorage.getItem("auth") === 'true'});
    const [showLog,setShowLog] = useState(false);
    const [postCreated, setPostCreated] = useState(false);
    // const [redirectPath, setRedirectPath] = useState();
    const [showLoginMes, setShowLoginMes] = useState(false);
    const [invalidToken,setInvalidToken] = useState(false);
    const [guestStatus,setGuestStatus] = useState(false);
    const [actualSubscribes,setActualSubscribes] = useState(true);

    const refreshToken = () =>{
        setAuth(false);
        localStorage.removeItem('auth');
        setInvalidToken(true);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
    }

    const refreshFeed = () => {
        setPostCreated(prev => !prev);
    };

    const contextValue = useMemo(() => ({
        auth,
        setAuth,
        showLoginMes,
        setShowLoginMes,
        setShowLog,
        showLog,
        postCreated,
        setPostCreated,
        refreshFeed,
        invalidToken,
        setInvalidToken,
        refreshToken,
        guestStatus,setGuestStatus
    }), [auth, showLoginMes, showLog,postCreated,invalidToken,guestStatus]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};