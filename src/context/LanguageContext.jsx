import { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext();

const LANGUAGES = [
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
    { code: "ta", label: "தமிழ்", flag: "🇮🇳" },
    { code: "te", label: "తెలుగు", flag: "🇮🇳" },
    { code: "kn", label: "ಕನ್ನಡ", flag: "🇮🇳" },
    { code: "bn", label: "বাংলা", flag: "🇮🇳" },
    { code: "ml", label: "മലയാളം", flag: "🇮🇳" },
    { code: "mr", label: "मराठी", flag: "🇮🇳" },
];

export function LanguageProvider({ children }) {
    const [lang, setLang] = useState(() => localStorage.getItem("skillnest_lang") || "en");

    useEffect(() => { localStorage.setItem("skillnest_lang", lang); }, [lang]);

    return (
        <LanguageContext.Provider value={{ lang, setLang, LANGUAGES }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}

export { LANGUAGES };
export default LanguageContext;
