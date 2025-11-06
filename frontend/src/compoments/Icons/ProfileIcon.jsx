export function ProfileIcon({
                                size = 24,
                                strokeColor = "black",
                                className = "",
                                fill = "none"
                            }) {
    return (
        <svg
            width={size}
            height={size + 1} // 24x25 соотношение
            viewBox="0 0 24 25"
            fill={fill}
            className={className}
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M12 12.4999C14.7614 12.4999 17 10.1681 17 7.29158C17 4.4151 14.7614 2.08325 12 2.08325C9.23858 2.08325 7 4.4151 7 7.29158C7 10.1681 9.23858 12.4999 12 12.4999Z"
                stroke={strokeColor}
                strokeWidth="2"
            />
            <path
                d="M17.0001 14.8438H17.3518C18.8647 14.8438 20.1409 16.0173 20.3286 17.5811L20.7191 20.8353C20.8683 22.0787 19.9375 23.1771 18.7345 23.1771H5.26567C4.06268 23.1771 3.13191 22.0787 3.28112 20.8353L3.67162 17.5811C3.85928 16.0173 5.13549 14.8438 6.64846 14.8438H7.00011"
                stroke={strokeColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}