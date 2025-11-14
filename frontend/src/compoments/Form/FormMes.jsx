import { useEffect, useState } from "react";

export default function FormMes({ text, type }) {
    // const [timeToClose, setTimeToClose] = useState(false);
    //
    // const [timeToClose,setTimeToClose] = useState(false);
    // useEffect(() => {
    //     setTimeToClose(false);
    //     const timer = setTimeout(() => {
    //         setTimeToClose(true);
    //         const obj=document.getElementsByClassName("cal");
    //         const cal=obj.item(1);
    //         cal.remove();
    //     }, 3000);
    //
    //     return () => clearTimeout(timer); // ✅ Добавьте очистку
    // }, []);




    return (
        <div className={`cal w-fit h-8 border-2 py-1 mb-4 px-2 rounded-2xl  ${type === "error" ? "border-red-800" : "border-green-600"}`}>
            {text}
        </div>
    );
}