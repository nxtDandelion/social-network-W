import {useEffect, useState} from "react";

export const usePostTextValidation = (text, maxChar,initText) => {
    const [allowSend, setAllowSend] = useState(false);
    const [symbolLimit, setSymbolLimit] = useState(false);

    useEffect(() => {
        if (text.length === 0) {
            setAllowSend(false);
            setSymbolLimit(false);
        } else if (text.length > maxChar) {
            setAllowSend(false);
            setSymbolLimit(true);
        }else if (initText === text){
            setAllowSend(false);
        } else {
            setSymbolLimit(false);
            setAllowSend(true);
        }

    }, [text, maxChar]);

    return { allowSend, symbolLimit };
};