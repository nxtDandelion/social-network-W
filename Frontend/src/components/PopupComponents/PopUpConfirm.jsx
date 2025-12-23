export default function PopUpConfirm({ confirm, close }) {
    function confirmDelete() {
        confirm();
    }

    function closeModal() {
        close();
    }

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center">
            {/* Затемненный фон */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={closeModal}
            />

            {/* Модальное окно */}
            <div className="relative bg-white rounded-2xl z-[1000] shadow-2xl p-8 w-[90%] max-w-md mx-4 transform transition-all duration-300 scale-100 animate-fadeIn">
                {/* Заголовок */}
                <div className="text-center mb-6">
                    <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                            <svg
                                className="w-6 h-6 text-red-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                                />
                            </svg>
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Вы уверены что хотите удалить этот пост?
                    </h3>
                    <p className="text-gray-600 text-sm">
                        Это действие нельзя отменить
                    </p>
                </div>

                {/* Кнопки */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={closeModal}
                        className="flex-1 px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={confirmDelete}
                        className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                        Удалить
                    </button>
                </div>

                {/* Декоративная линия сверху */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-black to-gray-200 rounded-t-2xl" />
            </div>
        </div>
    );
}