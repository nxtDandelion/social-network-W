import {useState} from "react";

export default function FormInput({labelText,formType,formValue,onChange,hintText}){
    const[show,setShow]=useState(false);
    const showHint =() =>{
        setShow(true);
    }
    const hideHint = () => {
        setShow(false);
    }

    return (
        <label className="flex flex-col justify-between w-[250px] mb-2"> {labelText} {show ? <span className="text-[#929191] "> {hintText} </span> : ""}
            <input onFocus={showHint} onBlur={hideHint} type={formType} value={formValue} onChange={onChange} className="w-64 h-10 my-1 px-4 rounded-[40px] bg-[#D9D9D9] outline-none"></input>
        </label>
    )
}