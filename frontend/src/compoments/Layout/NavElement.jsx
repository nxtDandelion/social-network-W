
export default function NavElement({label,icon,isActive}) {
    return (
        <div className={`flex items-end w-36 mb-3 border-b-2 border-black hover:opacity-50 cursor-pointer ${isActive ? 'w-40' : 'text-black'}`}>
            <span className="ext-sm font-bold tracking-wider"> {label}</span>
            {icon}
        </div>
    )
}