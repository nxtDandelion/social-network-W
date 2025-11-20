import {createContext, useState, useContext, useEffect, useMemo} from "react";

export const AuthContext = createContext();

export const AuthProvider =({children}) =>{
    const [auth, setAuth] = useState(false);
    const [showLog,setShowLog] = useState(false)
    const [redirectPath, setRedirectPath] = useState();
    const [showLoginMes, setShowLoginMes] = useState(false);

    useEffect(() => {
        const savedAuth = localStorage.getItem('auth');
        if(savedAuth) {
            setAuth(true);
        }
    }, [auth]);

    const contextValue = useMemo(() => ({
        auth,
        setAuth,
        redirectPath,
        setRedirectPath,
        showLoginMes,
        setShowLoginMes,
        setShowLog,
        showLog
    }), [auth, redirectPath, showLoginMes, showLog]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};