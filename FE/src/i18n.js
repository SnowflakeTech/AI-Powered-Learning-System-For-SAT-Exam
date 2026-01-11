import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  vi: {
    translation: {
      helloAdmin: "Xin chào, Admin",
      createTest: "Tạo đề thi",
      section: "Section",
      skill: "Skill",
      difficulty: "Độ khó",
      // ... các text UI khác
    },
  },
  en: {
    translation: {
      helloAdmin: "Hello, Admin",
      createTest: "Create test",
      section: "Section",
      skill: "Skill",
      difficulty: "Difficulty",
    },
  },
  ja: {
    translation: {
      helloAdmin: "こんにちは、Admin",
      createTest: "テスト作成",
      section: "セクション",
      skill: "スキル",
      difficulty: "難易度",
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "vi",
    interpolation: { escapeValue: false },
  });

export default i18n;
