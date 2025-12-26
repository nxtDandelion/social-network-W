import {useContext, useEffect, useState, useCallback} from "react";
import {AuthContext} from "../Contexts/AuthContext.jsx";
import Header from "../components/MainPageComponents/Header.jsx";
import {SearchIcon} from "../components/Icons/SearchIcon.jsx";
import SearchPanel from "../components/MainPageComponents/SearchPanel.jsx";
import CreatePostBtn from "../components/MainPageComponents/CreatePostBtn.jsx";
import Feed from "../components/MainPageComponents/Feed.jsx";
import PopupBg from "../components/PopupComponents/PopupBg.jsx";
import CrossIcon from "../components/Icons/CrossIcon.jsx";

export default function MainPage() {
    const {showLoginMes, setShowLoginMes, auth} = useContext(AuthContext);
    const [searchResults, setSearchResults] = useState(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [currentSearchQuery, setCurrentSearchQuery] = useState('');

    function handleClose() {
        setShowLoginMes(false);
    }

    const handleSearchResults = useCallback((results) => {
        setSearchResults(results);
    }, []);

    const handleSearchLoading = useCallback((isLoading) => {
        setSearchLoading(isLoading);
    }, []);

    const handleSearchError = useCallback((error) => {
        setSearchError(error);
    }, []);

    const handleSearchQueryChange = useCallback((query) => {
        setCurrentSearchQuery(query);
    }, []);

    const handleCloseSearch = useCallback(() => {
        setSearchResults(null);
        setSearchError('');
        setCurrentSearchQuery('');
    }, []);

    useEffect(() => {
        // Любая логика инициализации
    }, []);

    return (
        <div className="flex flex-col max-w-[50rem] relative">
            <Header>
                <SearchIcon/>
                <SearchPanel
                    onSearchResults={handleSearchResults}
                    onSearchLoading={handleSearchLoading}
                    onSearchError={handleSearchError}
                    onSearchQueryChange={handleSearchQueryChange}
                />
                <div className="min-w-44">
                    {auth && <CreatePostBtn></CreatePostBtn>}
                </div>
            </Header>

            <Feed
                searchResults={searchResults}
                searchLoading={searchLoading}
                searchError={searchError}
                onCloseSearch={handleCloseSearch}
            />

            {showLoginMes && (
                <PopupBg>
                    <div className="relative flex flex-col justify-center items-center max-w-md w-fit h-fit px-4 py-8 border-black border-[3px] bg-white rounded-[40px]">
                        <button onClick={handleClose} aria-label="Закрыть" className="absolute top-3 right-3 z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-200 hover:scale-110 transition-transform duration-200">
                            <CrossIcon />
                        </button>
                        <SearchIcon className="my-8"/>
                        <div className="flex align-middle text-center justify-center items-center text-xl"> Для использования запрошенных функций необходима авторизация в профиль.   </div>
                        <a href="/login" className="mt-8 px-5 py-2 text-xl text-black border-black border-2 rounded-full hover:text-gray-600 cursor-pointer">войти</a>
                    </div>
                </PopupBg>
            )}
        </div>
    );
}