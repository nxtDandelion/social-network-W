// components/TextWithTags.jsx
import { useState, useEffect, useMemo } from "react";
import { getUserProfile } from "../API/ProfileAPI/getUserProfile.js";
import { useLocation, useNavigate } from "react-router-dom"; // Добавляем хуки для навигации

const TextWithTags = ({ text, className = "", onHashtagSearch }) => {
    const [parsedContent, setParsedContent] = useState([]);
    const location = useLocation(); // Получаем текущий путь
    const navigate = useNavigate(); // Для навигации

    useMemo(() => {
        // ... остальной код парсинга (без изменений)
        if (!text) {
            setParsedContent([]);
            return;
        }

        const parts = [];
        const regex = /(@[\wа-яА-ЯёЁ]+)|(#[\wа-яА-ЯёЁ]+)/g;
        let lastIndex = 0;
        let match;
        let indexCounter = 0;

        while ((match = regex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                parts.push({
                    type: 'text',
                    content: text.substring(lastIndex, match.index),
                    key: `text-${indexCounter++}`
                });
            }

            if (match[0].startsWith('@')) {
                const username = match[0].substring(1);
                parts.push({
                    type: 'mention',
                    content: username,
                    key: `mention-${indexCounter++}`
                });
            }
            else if (match[0].startsWith('#')) {
                const hashtag = match[0].substring(1);
                parts.push({
                    type: 'hashtag',
                    content: hashtag,
                    key: `hashtag-${indexCounter++}`
                });
            }

            lastIndex = match.index + match[0].length;
        }

        if (lastIndex < text.length) {
            parts.push({
                type: 'text',
                content: text.substring(lastIndex),
                key: `text-${indexCounter++}`
            });
        }

        setParsedContent(parts);
    }, [text]);

    // Обработчик клика на хэштег
    const handleHashtagClick = (hashtag, e) => {
        e.preventDefault();
        e.stopPropagation();

        // Проверяем, находимся ли мы на главной странице
        const isOnMainPage = location.pathname === "/" || location.pathname === "/main";

        if (isOnMainPage) {
            // Если на главной - вызываем переданный обработчик
            if (onHashtagSearch) {
                onHashtagSearch(hashtag);
            }
        } else {
            // Если не на главной - навигация на главную с параметром
            navigate("/", {
                state: {
                    hashtagToSearch: hashtag,
                    fromPage: location.pathname
                }
            });
        }
    };

    const Hashtag = ({ hashtag, onClick }) => (
        <button
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onClick) {
                    onClick(hashtag, e);
                }
            }}
            className="text-purple-600 hover:text-purple-800 hover:underline font-medium bg-transparent border-none p-0 cursor-pointer"
        >
            #{hashtag}
        </button>
    );

    const Mention = ({ username }) => {
        const [userExists, setUserExists] = useState(null);

        useEffect(() => {
            const checkUser = async () => {
                try {
                    const response = await getUserProfile(username);
                    setUserExists(response.success);
                } catch (error) {
                    setUserExists(false);
                }
            };

            checkUser();
        }, [username]);

        if (userExists === true) {
            return (
                <a
                    href={`/profile/${username}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                    onClick={(e) => e.stopPropagation()}
                >
                    @{username}
                </a>
            );
        }

        return <span>@{username}</span>;
    };

    if (parsedContent.length === 0 && text) {
        return <span className={className}>{text}</span>;
    }

    return (
        <span className={className}>
            {parsedContent.map((item) => {
                if (item.type === 'text') {
                    return <span key={item.key}>{item.content}</span>;
                }

                if (item.type === 'mention') {
                    return <Mention key={item.key} username={item.content} />;
                }

                if (item.type === 'hashtag') {
                    return (
                        <Hashtag
                            key={item.key}
                            hashtag={item.content}
                            onClick={handleHashtagClick}
                        />
                    );
                }

                return null;
            })}
        </span>
    );
};

export default TextWithTags;