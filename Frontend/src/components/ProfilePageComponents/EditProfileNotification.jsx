import {useEffect, useState} from "react";

export default function EditProfileNotification({ message, onClose }) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        setIsVisible(true);

        const timer = setTimeout(() => {
            setIsVisible(false);
            if (onClose) onClose();
        }, 2000);

        return () => clearTimeout(timer);
    }, [message, onClose]);

    if (!isVisible) return null;

    return (
        <div className="w-full max-w-xs">
            <div className="relative bg-white rounded-xl shadow-lg border border-red-200 overflow-hidden animate-fade-in">
                <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />

                <div className="flex items-start p-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                        <svg
                            className="w-5 h-5 text-red-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>

                    <div className="ml-3 flex-1">
                        <h3 className="text-sm font-semibold text-red-800">
                            Ошибка валидации
                        </h3>
                        <p className="text-sm text-red-600 mt-1">
                            {message}
                        </p>
                    </div>

                    <button
                        onClick={() => {
                            setIsVisible(false);
                            if (onClose) onClose();
                        }}
                        className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-600"
                        aria-label="Закрыть"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}