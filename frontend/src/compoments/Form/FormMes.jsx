import { useEffect, useState } from "react";

export default function FormMes({ text, type }) {
    // const [timeToClose, setTimeToClose] = useState(false);
    //
    // useEffect(() => {
    //
    //     const timer = setTimeout(() => {
    //         setTimeToClose(true);
    //     }, 3000);
    //
    //     return () => clearTimeout(timer); // ✅ Добавьте очистку
    // }, []);
    //
    // if (timeToClose) {
    //
    //     return null;
    // }

    return (
        <div className={`w-fit h-8 border-2 py-1 mb-4 px-2 rounded-2xl ${
            type === "error" ? "border-red-800" : "border-green-600"
        }`}>
            {text}
        </div>
    );
}