import {SearchIcon} from "../Icons/SearchIcon.jsx";
import CrossIcon from "../Icons/CrossIcon.jsx";
import PopupBg from "../PopupComponents/PopupBg.jsx";
import PopupHeader from "../PopupComponents/PopupHeader.jsx";
import {useNavigate} from "react-router-dom";

export default function FormFrame({ message,children,onClose,submitForm,refMessage,path,frameFor}) {
     const navigate  = useNavigate()
    const handleClose = (e) =>{
        e.preventDefault();
        onClose();
    }
    const handleSubmit = (e) => {
        console.log("handleSubmit вызван");
        e.preventDefault();
        submitForm();
    }
    const handleNavigate = () =>{
        navigate(path);
    }
    return (
        <form onSubmit={handleSubmit}>
           <PopupBg>
                <div className="">
                    <PopupHeader>
                        <div className="absolute inset-0 top-5 right-6">
                            <button onClick={handleClose} aria-label="Закрыть" className="absolute -top-3 -right-3 z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-200 hover:scale-110 transition-transform duration-200">
                                <CrossIcon/>
                            </button>
                        </div>
                    </PopupHeader>
                    <div className={`flex flex-col items-center justify-start w-[400px] ${frameFor==="login"? "min-h-fit":"min-h-[700px]"} h-fit px-3 pb-10 bg-white rounded-b-[40px] border-[3px] border-black `}>
                        <h1 className="my-8 text-3xl font-light"> {message} </h1>

                        {children}

                        <p className="text-black hover:text-black hover:underline cursor-pointer" onClick={handleNavigate} > {refMessage}</p>
                    </div>
                </div>
           </PopupBg>
        </form>
    )
}