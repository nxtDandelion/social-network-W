
export default function PopupBg ({children}){
    return(
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-70 backdrop-blur-sm transition-opacity duration-300">
            {children}
        </div>
    )
}