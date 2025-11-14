export default function FormInput({labelText,formType,formValue,onChange}){
    return (
        <label className="flex flex-col mb-2"> {labelText}
            <input type={formType} value={formValue} onChange={onChange} className="w-64 h-10 my-1 px-4 rounded-[40px] bg-[#D9D9D9] outline-none"></input>
        </label>
    )
}