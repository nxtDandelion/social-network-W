import {SearchIcon} from "../Icons/SearchIcon.jsx";
import CrossIcon from "../Icons/CrossIcon.jsx";

export default function FormFrame({ message,children,onClose,submitForm,refMessage,path}) {

    const handleClose = (e) =>{
        e.stopPropagation();
            if (onClose){
                onClose();
            }
    }
    const handleSubmit = (e) => {
        console.log("handleSubmit вызван");
        e.preventDefault();
        submitForm();
    }
    return (
        <form onSubmit={handleSubmit}>
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-70 backdrop-blur-sm transition-opacity duration-300">
            <div>
                <div className={`relative flex items-center justify-center w-full h-fit bg-black rounded-t-[40px]`}>
                    <SearchIcon/>
                    <div className="absolute inset-0 top-5 right-6"> {/* Добавляем relative для позиционирования крестика */}

                        {/* Крестик закрытия */}
                        <button onClick={handleClose} aria-label="Закрыть" className="absolute -top-3 -right-3 z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-200 hover:scale-110 transition-transform duration-200">
                            <CrossIcon/>
                        </button>
                    </div>
                </div>
                <div className={`flex flex-col items-center justify-start w-[400px] h-fit px-3 pb-10 bg-white rounded-b-[40px] border-[3px] border-black `}>
                    <h1 className="my-8 text-3xl font-light"> {message} </h1>

                    {children}

                    <a className="text-black hover:text-black hover:underline" href={path} > {refMessage}</a>
                </div>
            </div>
        </div>
        </form>
    )
}