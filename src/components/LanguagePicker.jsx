import { useState, useRef, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { Globe } from "lucide-react";

function LanguagePicker({ compact = false }) {
    const { lang, setLang, LANGUAGES } = useLanguage();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

    useEffect(() => {
        const handleClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className={`flex items-center gap-2 rounded-xl transition-all ${compact
                    ? "px-3 py-2 text-sm text-gray-600 hover:text-orange-500 hover:bg-orange-50"
                    : "px-4 py-2.5 bg-white/80 backdrop-blur border border-gray-200 shadow-sm hover:border-orange-300 text-sm"
                    }`}
            >
                <Globe size={16} />
                <span>{current.flag} {current.label}</span>
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden overflow-y-auto max-h-[320px] z-50 min-w-[180px]">
                    {LANGUAGES.map((l) => (
                        <button
                            key={l.code}
                            onClick={() => { setLang(l.code); setOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all hover:bg-orange-50 ${lang === l.code ? "bg-orange-50 text-orange-600 font-medium" : "text-gray-700"
                                }`}
                        >
                            <span className="text-base">{l.flag}</span>
                            <span>{l.label}</span>
                            {lang === l.code && <span className="ml-auto text-orange-400">✓</span>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default LanguagePicker;
