export function DotsIcon({
                             size = 24,
                             color = "#FAFAFA",
                             className = "",
                         }) {
    return (
        <svg
            width={size}
            height={size * 0.625} // 24x15 соотношение
            viewBox="0 0 24 15"
            fill={color}
            className={className}
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M3.17 0.09A3.17 3.17 0 0 0 0 3.26a3.17 3.17 0 1 0 6.34 0A3.17 3.17 0 0 0 3.17 0.09zm9 0a3.17 3.17 0 0 0-3.17 3.17 3.17 3.17 0 1 0 6.34 0A3.17 3.17 0 0 0 12.17 0.09zm8.66 0a3.17 3.17 0 0 0-3.17 3.17 3.17 3.17 0 1 0 6.34 0A3.17 3.17 0 0 0 20.83 0.09z"/>
        </svg>
    );
}