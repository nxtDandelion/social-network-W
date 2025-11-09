export default function NotFoundPage() {
    return (
        <div className="flex items-center justify-center w-full">
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">Страница не найдена</h2>
                <p className="text-gray-600 mb-4">Запрошенная страница не существует.</p>
                <a href="/home" className="text-blue-500 hover:underline">
                    Вернуться на главную
                </a>
            </div>
        </div>
    )
}