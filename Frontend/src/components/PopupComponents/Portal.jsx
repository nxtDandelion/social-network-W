import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function Portal({ children }) {
    const [container, setContainer] = useState(null);

    useEffect(() => {
        // Создаем контейнер для портала
        const portalContainer = document.createElement('div');
        document.body.appendChild(portalContainer);
        setContainer(portalContainer);

        return () => {
            document.body.removeChild(portalContainer);
        };
    }, []);

    if (!container) return null;

    return createPortal(children, container);
}