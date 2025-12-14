import {createContext, useState, useMemo, useEffect} from "react";

export const AuthContext = createContext();

export const AuthProvider =({children}) =>{
    const [auth, setAuth] = useState(() => {return localStorage.getItem("auth") === 'true'});
    const [showLoginMes, setShowLoginMes] = useState(false);
    const [invalidToken,setInvalidToken] = useState(false);
    const [guestStatus,setGuestStatus] = useState(false);
    const [userId,setUserId] = useState(()=>{return localStorage.getItem("userId") || ""});
    const [userName,setUserName] = useState(()=>{return localStorage.getItem("myUsername") || ""})
    const [actualSubscribes,setActualSubscribes] = useState(true);



    useEffect(()=>{
        if (auth){
            if (!userName){
               const storedName = localStorage.getItem("myUsername");
               setUserName(storedName);
            }
            if (!userId){
                const storedId = localStorage.getItem("userId");
                setUserId(storedId);
            }
        }
    },[auth])


    const refreshToken = () =>{
        setAuth(false);
        localStorage.removeItem('auth');
        setInvalidToken(true);
        localStorage.removeItem("myUsername");
        localStorage.removeItem("myId");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
    };

    const contextValue = useMemo(() => ({
        auth, setAuth,
        showLoginMes, setShowLoginMes,
        invalidToken, setInvalidToken,
        refreshToken,
        guestStatus,setGuestStatus,
        userName,setUserName,
        userId,setUserId,
    }), [auth, showLoginMes,invalidToken,guestStatus,userName]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};