// components/Notification/NotificationCard.jsx
import { useEffect, useState } from "react";
import CrossIcon from "../Icons/CrossIcon.jsx";
import { SearchIcon } from "../Icons/SearchIcon.jsx";

export default function NotificationCard({message, type, duration, onClose, isVisible}) {
    const [visible, setVisible] = useState(isVisible);
    const [closing, setClosing] = useState(false);

    useEffect(() => {
        if (duration > 0 && visible) {
            const timer = setTimeout(() => {
                startCloseAnimation();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [duration, onClose, visible]);

    const startCloseAnimation = () => {
        setClosing(true);
        setTimeout(() => {
            setVisible(false);
            if (onClose) onClose();
        }, 100);
    };

    const handleClose = () => {
        startCloseAnimation();
    };

    if (!visible) return null;

    const typeStyles = {
        success: {
            bg: "bg-green-50",
            border: "border-green-200",
            text: "text-green-800",
            progressColor: "bg-green-500",
            icon: ""
        },
        error: {
            bg: "bg-red-50",
            border: "border-red-200",
            text: "text-red-800",
            progressColor: "bg-red-500",
            icon: ""
        },
        warning: {
            bg: "bg-yellow-50",
            border: "border-yellow-200",
            text: "text-yellow-800",
            progressColor: "bg-yellow-500",
            icon: ""
        },
        info: {
            bg: "bg-blue-50",
            border: "border-blue-200",
            text: "text-blue-800",
            progressColor: "bg-blue-500",
            icon: ""
        }
    };

    const styles = typeStyles[type] || typeStyles.info;

    return (
        <div className={`fixed bottom-4 right-4 z-[1000] ${closing ? 'animate-fade-out' : 'animate-fade-in'}`}>
            <div className={`flex items-center justify-between p-4 rounded-[30px] shadow-lg bg-gray-50 border-black border min-w-64 max-w-md`}>
                <div className="flex items-center gap-3 w-full">
                    <SearchIcon/>
                    <span className="text-xl">{styles.icon}</span>
                    <div className="flex-1">
                        <p className={`font-medium ${styles.text}`}>{message}</p>
                        <div className="w-full h-1 mt-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${styles.progressColor}`}
                                style={{
                                    width: '100%',
                                    animation: `shrink ${duration}ms linear forwards`,
                                    transformOrigin: 'left center'
                                }}
                            />
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleClose}
                    className="ml-4 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                    aria-label="Закрыть уведомление"
                >
                    <CrossIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}