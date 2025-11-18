import {SearchIcon} from "../components/Icons/SearchIcon.jsx";

export default function NotFoundPage() {
    return (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black">
            <div className=" flex flex-col w-fit h-fit p-10 justify-center items-center bg-white rounded-3xl opacity-95">
                <SearchIcon/>
                <h2 className="text-2xl font-bold mb-4">Страница не найдена</h2>
                <p className="text-gray-600 mb-4">Запрошенная страница не существует.</p>
                <a href="/home" className="text-black underline hover:text-gray-500">
                    Вернуться на главную
                </a>

            </div>
        </div>
    )
}