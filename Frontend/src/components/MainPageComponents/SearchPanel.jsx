import { useState, useEffect, useCallback, useRef } from 'react';
import { searchPosts } from '../../API/SearchAPI/searchPosts.js';

export default function SearchPanel({ onSearchResults, onSearchLoading, onSearchError, onSearchQueryChange }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isActive, setIsActive] = useState(false);
    const debounceTimer = useRef(null);

    const performSearch = useCallback(async (query) => {
        if (query.trim().length === 0) {
            if (onSearchResults && typeof onSearchResults === 'function') {
                onSearchResults(null);
            }
            return;
        }

        if (onSearchLoading && typeof onSearchLoading === 'function') {
            onSearchLoading(true);
        }

        try {
            const results = await searchPosts(query, 1, 15);
            if (results.success) {
                if (onSearchResults && typeof onSearchResults === 'function') {
                    console.log(results.data);
                    onSearchResults({
                        posts: results.data || [],
                        page: results.page || 1,
                        size: results.size || 15,
                        totalElements: results.totalElements || (results.data?.length || 0),
                        hasMore: results.hasMore || false,
                        query: query
                    });
                }
            } else {
                if (onSearchError && typeof onSearchError === 'function') {
                    onSearchError("Ошибка при поиске");
                }
            }
        } catch (err) {
            console.error("[SearchPanel] Ошибка поиска:", err);
            if (onSearchError && typeof onSearchError === 'function') {
                onSearchError("Ошибка соединения");
            }
        } finally {
            if (onSearchLoading && typeof onSearchLoading === 'function') {
                onSearchLoading(false);
            }
        }
    }, [onSearchResults, onSearchLoading, onSearchError]);

    useEffect(() => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        if (searchQuery.length > 0) {
            debounceTimer.current = setTimeout(() => {
                performSearch(searchQuery);
                if (onSearchQueryChange && typeof onSearchQueryChange === 'function') {
                    onSearchQueryChange(searchQuery);
                }
            }, 300);
        } else {
            if (onSearchResults && typeof onSearchResults === 'function') {
                onSearchResults(null);
            }
        }

        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, [searchQuery, performSearch, onSearchResults, onSearchQueryChange]);

    const handleChange = (e) => {
        const value = e.target.value;
        if (value.length <= 100) {
            setSearchQuery(value);
        }
    };

    const handleFocus = () => setIsActive(true);
    const handleBlur = () => setIsActive(false);

    return (
        <div className={`w-80 h-12 bg-white rounded-[40px] border-2 ${isActive ? 'border-gray-500' : ''}`}>
            <label className="flex justify-center items-center w-full h-12 px-4">
                <input
                    className="w-full h-8 text-xl mr-2 outline-none "
                    type="text"
                    placeholder="Поиск..."
                    value={searchQuery}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    maxLength={100}
                />
                <svg width="28" height="27" viewBox="0 0 28 27" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15.3724 0C8.40972 0 2.74508 5.46233 2.74508 12.1764C2.74508 14.5557 3.45706 16.7774 4.68556 18.6549L0.821668 22.3808C-0.274215 23.4376 -0.274215 25.1508 0.821668 26.2075C1.91755 27.2642 3.69424 27.2642 4.79001 26.2075L8.6539 22.4816C10.6011 23.6662 12.905 24.3527 15.3724 24.3527C22.3351 24.3527 27.9998 18.8904 27.9998 12.1764C27.9998 5.46233 22.3352 0 15.3724 0ZM15.3724 21.6469C9.957 21.6469 5.55115 17.3984 5.55115 12.1764C5.55115 6.95434 9.95694 2.70585 15.3724 2.70585C20.7879 2.70585 25.1937 6.95434 25.1937 12.1764C25.1937 17.3984 20.788 21.6469 15.3724 21.6469Z" fill="black"/>
                </svg>
            </label>
        </div>
    );
}