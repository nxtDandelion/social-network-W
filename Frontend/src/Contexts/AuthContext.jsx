import {createContext, useState, useMemo, useEffect} from "react";

export const AuthContext = createContext();

export const AuthProvider =({children}) =>{
    const [auth, setAuth] = useState(() => {return localStorage.getItem("auth") === 'true'});
    const [showLoginMes, setShowLoginMes] = useState(false);
    const [invalidToken,setInvalidToken] = useState(false);
    const [guestStatus,setGuestStatus] = useState(false);
    const [contextUserId,setContextUserId] = useState(()=>{return localStorage.getItem("userId") || ""});
    const [contextUserName,setContextUserName] = useState(()=>{return localStorage.getItem("myUsername") || ""})

    function refreshContext(){
        setContextUserId(localStorage.getItem("userId"));
        setContextUserName(localStorage.getItem("myUsername"));

    }

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
        else {
            localStorage.removeItem("myUsername");
            localStorage.removeItem("userId");
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
        }
    },[auth]);


    const refreshToken = () =>{
        setAuth(false);
        localStorage.removeItem('auth');
        setInvalidToken(true);
        localStorage.removeItem("myUsername");
        localStorage.removeItem("userId");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("myLogin");
    };

    const contextValue = useMemo(() => ({
        auth, setAuth,
        showLoginMes, setShowLoginMes,
        invalidToken, setInvalidToken,
        refreshToken,refreshContext,
        guestStatus,setGuestStatus,
        contextUserName,setContextUserName,
        contextUserId,setContextUserId,
    }), [auth, showLoginMes,invalidToken,guestStatus,contextUserName,contextUserId,refreshContext,refreshToken]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};