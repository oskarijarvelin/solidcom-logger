"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Language, translations, TranslationKey } from "@/lib/translations";
import { KeywordHighlight } from "@/lib/colors";

interface SettingsContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  fontSize: "small" | "medium" | "large";
  setFontSize: (size: "small" | "medium" | "large") => void;
  keywords: KeywordHighlight[];
  setKeywords: (keywords: KeywordHighlight[]) => void;
  addKeyword: (keyword: KeywordHighlight) => void;
  removeKeyword: (keyword: string) => void;
  audioInputDeviceId: string;
  setAudioInputDeviceId: (deviceId: string) => void;
  t: (key: TranslationKey) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [fontSize, setFontSize] = useState<"small" | "medium" | "large">("medium");
  const [keywords, setKeywords] = useState<KeywordHighlight[]>([]);
  const [audioInputDeviceId, setAudioInputDeviceId] = useState<string>("");

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language;
    const savedTheme = localStorage.getItem("theme") as "light" | "dark";
    const savedFontSize = localStorage.getItem("fontSize") as "small" | "medium" | "large";
    const savedKeywords = localStorage.getItem("keywords");
    const savedAudioInputDeviceId = localStorage.getItem("audioInputDeviceId");

    if (savedLanguage) setLanguage(savedLanguage);
    if (savedTheme) setTheme(savedTheme);
    if (savedFontSize) setFontSize(savedFontSize);
    if (savedKeywords) setKeywords(JSON.parse(savedKeywords));
    if (savedAudioInputDeviceId) setAudioInputDeviceId(savedAudioInputDeviceId);
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    // Apply theme to document
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("fontSize", fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem("keywords", JSON.stringify(keywords));
  }, [keywords]);

  useEffect(() => {
    localStorage.setItem("audioInputDeviceId", audioInputDeviceId);
  }, [audioInputDeviceId]);

  const addKeyword = (keyword: KeywordHighlight) => {
    setKeywords([...keywords, keyword]);
  };

  const removeKeyword = (keywordText: string) => {
    setKeywords(keywords.filter((k) => k.keyword !== keywordText));
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key];
  };

  return (
    <SettingsContext.Provider
      value={{
        language,
        setLanguage,
        theme,
        setTheme,
        fontSize,
        setFontSize,
        keywords,
        setKeywords,
        addKeyword,
        removeKeyword,
        audioInputDeviceId,
        setAudioInputDeviceId,
        t,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
