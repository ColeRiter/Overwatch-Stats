import { useState } from "react";

export default function SearchInput({
    value,
    onChange,
    suggestions = [],
    placeholder,
    onKeyPress,
    width = "220px",
    onSelect,
    className = "",
    suggestionLimit = 6,
}) {
    const [showSuggestions, setShowSuggestions] = useState(false);

    function handleFocus() {
        setShowSuggestions(true);
    }

    function handleBlur() {
        setTimeout(() => {
            setShowSuggestions(false);
        }, 100);
    }

    function handleSuggestionClick(query) {
        onChange(query);
        if (typeof onSelect === "function") onSelect(query);
        setShowSuggestions(false);
    }

    return (
        <div style={{ position: "relative", display: "inline-block" }}>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyPress={onKeyPress}
                placeholder={placeholder}
                style={{
                    padding: "8px",
                    width,
                }}
            />

            {showSuggestions && suggestions.length > 0 && (
                <div
                    style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        width,
                        background: "#fff",
                        border: "1px solid #ccc",
                        borderRadius: 6,
                        boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
                        zIndex: 9999,
                        marginTop: 6,
                    }}
                    className={className}
                >
                    <div style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                        <strong style={{ display: "block", marginBottom: 6 }}>Popular Players</strong>
                        {suggestions.slice(0, Math.min(3, suggestionLimit)).map((suggestion) => (
                            <button
                                key={suggestion.query}
                                type="button"
                                onMouseDown={() => handleSuggestionClick(suggestion.query)}
                                style={{
                                    width: "100%",
                                    textAlign: "left",
                                    padding: "6px 8px",
                                    border: "none",
                                    background: "transparent",
                                    color: "#000",
                                    cursor: "pointer",
                                }}
                            >
                                {suggestion.label}
                            </button>
                        ))}
                    </div>
                    {suggestions.length > Math.min(suggestionLimit, 3) && (
                        <div style={{ padding: 8 }}>
                            <strong style={{ display: "block", marginBottom: 6 }}>History</strong>
                            {suggestions.slice(Math.min(3, suggestionLimit), suggestionLimit).map((suggestion) => (
                                <button
                                    key={suggestion.query}
                                    type="button"
                                    onMouseDown={() => handleSuggestionClick(suggestion.query)}
                                    style={{
                                        width: "100%",
                                        textAlign: "left",
                                        padding: "6px 8px",
                                        border: "none",
                                        background: "transparent",
                                        color: "#000",
                                        cursor: "pointer",
                                    }}
                                >
                                    {suggestion.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}