"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { MY_TRANSLATIONS, type DashboardLanguage } from "@/lib/dashboard-translations";

type LanguageContextValue = {
  language: DashboardLanguage;
  setLanguage: (language: DashboardLanguage) => void;
};

const LanguageContext = createContext<LanguageContextValue>({
  language: "en",
  setLanguage: () => undefined,
});

const originalText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();
const myTextValues = new Set(Object.values(MY_TRANSLATIONS));
const translationPrefixes = Object.entries(MY_TRANSLATIONS)
  .filter(([english]) => english.endsWith(":"))
  .sort(([a], [b]) => b.length - a.length);
const translatedPrefixes = translationPrefixes.map(([, burmese]) => burmese);

function lookupTranslation(text: string) {
  const key = text.replace(/\s+/g, " ").trim();
  if (MY_TRANSLATIONS[key]) return MY_TRANSLATIONS[key];
  const prefix = translationPrefixes.find(([english]) => key.startsWith(english));
  return prefix ? `${prefix[1]}${key.slice(prefix[0].length)}` : undefined;
}

function isMyanmarText(text: string) {
  return myTextValues.has(text) || translatedPrefixes.some((prefix) => text.startsWith(prefix));
}

function translateElement(element: Element, language: DashboardLanguage) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const textNode = node as Text;
    const parent = textNode.parentElement;
    if (!parent || parent.closest("script, style, textarea, [contenteditable='true'], [data-no-translate]")) continue;
    const current = textNode.nodeValue ?? "";
    const leading = current.match(/^\s*/)?.[0] ?? "";
    const trailing = current.match(/\s*$/)?.[0] ?? "";
    const core = current.trim();
    const isMyanmar = isMyanmarText(core);
    if (language === "my") {
      const translated = lookupTranslation(core);
      if (translated) {
        originalText.set(textNode, current);
        textNode.nodeValue = `${leading}${translated}${trailing}`;
      } else if (!isMyanmar && originalText.has(textNode)) {
        // React may reuse a text node for new English content after a render.
        originalText.set(textNode, current);
      }
    } else {
      const source = originalText.get(textNode);
      if (isMyanmar && source !== undefined) textNode.nodeValue = source;
      else if (current !== source) originalText.set(textNode, current);
    }
  }

  const elements = [element, ...Array.from(element.querySelectorAll("[placeholder], [title], [aria-label]"))];
  for (const item of elements) {
    for (const attribute of ["placeholder", "title", "aria-label"]) {
      const value = item.getAttribute(attribute);
      if (!value) continue;
      const originals = originalAttributes.get(item) ?? new Map<string, string>();
      const isMyanmar = isMyanmarText(value);
      const translated = lookupTranslation(value);
      if (language === "my" && translated) {
        originals.set(attribute, value);
        item.setAttribute(attribute, translated);
        originalAttributes.set(item, originals);
      } else if (language === "en" && isMyanmar && originals.has(attribute)) {
        item.setAttribute(attribute, originals.get(attribute)!);
      } else if (language === "en" && originals.get(attribute) !== value) {
        originals.set(attribute, value);
        originalAttributes.set(item, originals);
      } else if (language === "my" && !isMyanmar && originals.has(attribute)) {
        originals.set(attribute, value);
        originalAttributes.set(item, originals);
      }
    }
  }
}

export function useDashboardLanguage() {
  return useContext(LanguageContext);
}

export default function DashboardLanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<DashboardLanguage>("en");
  const languageRef = useRef<DashboardLanguage>("en");
  const observerRef = useRef<MutationObserver | null>(null);

  const setLanguage = useCallback((next: DashboardLanguage) => {
    setLanguageState(next);
    window.localStorage.setItem("dashboardLanguage", next);
    window.dispatchEvent(new CustomEvent("dashboard-language-change", { detail: next }));
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem("dashboardLanguage");
    const initial: DashboardLanguage = saved === "my" ? "my" : "en";
    setLanguageState(initial);
    document.documentElement.lang = initial === "my" ? "my" : "en";

    const observer = new MutationObserver((records) => {
      observer.disconnect();
      try {
        for (const record of records) {
          if (record.type === "characterData" && record.target.parentElement) {
            translateElement(record.target.parentElement, languageRef.current);
          }
          for (const added of Array.from(record.addedNodes)) {
            if (added instanceof Element) translateElement(added, languageRef.current);
            else if (added instanceof Text && added.parentElement) translateElement(added.parentElement, languageRef.current);
          }
          if (record.type === "attributes" && record.target instanceof Element) {
            translateElement(record.target, languageRef.current);
          }
        }
      } finally {
        observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["placeholder", "title", "aria-label"] });
      }
    });
    observerRef.current = observer;
    languageRef.current = initial;
    if (initial === "my") translateElement(document.body, initial);
    observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["placeholder", "title", "aria-label"] });
    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === "my" ? "my" : "en";
    languageRef.current = language;
    observerRef.current?.disconnect();
    translateElement(document.body, language);
    observerRef.current?.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["placeholder", "title", "aria-label"] });
  }, [language]);

  return <LanguageContext.Provider value={{ language, setLanguage }}>{children}</LanguageContext.Provider>;
}
