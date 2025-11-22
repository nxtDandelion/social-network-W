import {useState} from "react";
import {DotsIcon} from "../../../Icons/DotsIcon.jsx";
import {comment} from "postcss";
import colors from "tailwindcss/colors.js";

export default function OtherFuncMenu({component}) {

    const [visible, setVisible] = useState(false)

    return (
        <div className="flex flex-col items-end relative ">
            <button
                className="pt-2 "
                onMouseEnter={() => {setVisible(true)}}
                onMouseLeave={() => {setVisible(false)}}
                onClick={() => setVisible(!visible)}
            >
                <DotsIcon className={`${visible ? "opacity-80" : "opacity-100"} `}
                          color={component === "comment" ? "#000000" : "#FAFAFA"}  />
            </button>
            {visible && (
                <div
                    onMouseEnter={() => {setVisible(true)}}
                    onMouseLeave={() => {setVisible(false)}}
                >
                    <MenuCard />
                </div>)}
        </div>
    )
}

function MenuCard() {
    return (
        <div className="absolute top-5 right-0 z-10">
            <div className="bg-white border shadow-lg rounded-lg py-1 min-w-32">
                <button className="w-full text-left px-4 py-2 hover:bg-gray-100">
                    Пожаловаться
                </button>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-100">
                    Редактировать
                </button>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-100">
                    Удалить
                </button>
            </div>
        </div>
    )
}
