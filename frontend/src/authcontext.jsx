import {createContext, useState, useContext, useEffect, useMemo} from "react";

export const AuthContext = createContext();

export const AuthProvider =({children}) =>{
    const [auth, setAuth] = useState(false)
    const [redirectPath, setRedirectPath] = useState();
    const [showLogin, setShowLogin] = useState(false);


    useEffect((auth) => {
       const savedAuth = localStorage.getItem('auth');
       if(savedAuth){setAuth(true)}
    },[auth])

        // ✅ Стабильная ссылка на объект
        const contextValue = useMemo(() => ({
            auth,
            setAuth,
            redirectPath,
            setRedirectPath,
            showLogin,
            setShowLogin
        }), [auth, redirectPath, showLogin]); // Зависимости

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

