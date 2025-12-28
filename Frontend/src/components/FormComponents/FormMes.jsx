import { useEffect, useState } from "react";

export default function FormMes({ text, type }) {
    return (
        <div className={`cal w-fit h-8 border-2 py-1 px-2 rounded-2xl  ${type === "error" ? "border-red-800" : "border-green-600"}`}>
            {text}
        </div>
    );
}