import { LANGUAGE_VERSIONS } from "../constants";

function LanguageSelector({
  language,
  onSelect,
}: {
  language: string;
  onSelect: (lang: string) => void;
}) {
  return (
    <div>
      <p style={{ marginBottom: "15px", fontSize: "18px", color: "black" }}>
        LANGUAGE :
      </p>

      <select
        value={language}
        onChange={(e) => onSelect(e.target.value)}
        style={{
          marginBottom: "10px",
          padding: "5px",
          fontSize: "12px",
          backgroundColor: "rgba(57, 49, 49, 1)",
          color: "white",
          border: "solid 1px rgba(255, 255, 255, 0.5)",
          borderRadius: "4px",
        }}
      >
        {Object.entries(LANGUAGE_VERSIONS).map(([lang, version]) => (
          <option
            key={lang}
            value={lang}
            style={{
              backgroundColor: lang === language ? "gray" : "blue",
              color: lang === language ? "blue" : "grey",
            }}
          >
            {lang} ({version})
          </option>
        ))}
      </select>
    </div>
  );
}

export default LanguageSelector;
