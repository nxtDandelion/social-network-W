import {createContext, useState, useMemo, useEffect} from "react";

export const AuthContext = createContext();

export const AuthProvider =({children}) =>{
    const [auth, setAuth] = useState(() => {return localStorage.getItem("auth") === 'true'});
    const [showLoginMes, setShowLoginMes] = useState(false);
    const [invalidToken,setInvalidToken] = useState(false);
    const [guestStatus,setGuestStatus] = useState(false);
    const [contextUserId,setContextUserId] = useState(()=>{return localStorage.getItem("userId") || ""});
    const [contextUserName,setContextUserName] = useState(()=>{return localStorage.getItem("myUsername") || ""})
    const [actualSubscribes,setActualSubscribes] = useState(true);



    useEffect(()=>{
        if (auth){
            if (!contextUserName){
               const storedName = localStorage.getItem("myUsername");
               setContextUserName(storedName);
            }
            if (!contextUserId){
                const storedId = localStorage.getItem("userId");
                setContextUserId(storedId);
            }
        }
    },[auth])


    const refreshToken = () =>{
        setAuth(false);
        localStorage.removeItem('auth');
        setInvalidToken(true);
        localStorage.removeItem("myUsername");
        localStorage.removeItem("userId");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
    };

    const contextValue = useMemo(() => ({
        auth, setAuth,
        showLoginMes, setShowLoginMes,
        invalidToken, setInvalidToken,
        refreshToken,
        guestStatus,setGuestStatus,
        contextUserName,setContextUserName,
        contextUserId,setContextUserId,
    }), [auth, showLoginMes,invalidToken,guestStatus,contextUserName,contextUserId]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};