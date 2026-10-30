const JUDGE0_LANGUAGE_IDS = Object.freeze({
  c: 50,
  cpp: 54,
  csharp: 51,
  go: 60,
  java: 62,
  javascript: 63,
  php: 68,
  python: 71,
  ruby: 72,
  rust: 73,
  typescript: 74,
});

export const SUPPORTED_LANGUAGES = Object.freeze(Object.keys(JUDGE0_LANGUAGE_IDS));

export function getJudge0LanguageId(language) {
  return Object.hasOwn(JUDGE0_LANGUAGE_IDS, language) ? JUDGE0_LANGUAGE_IDS[language] : null;
}
