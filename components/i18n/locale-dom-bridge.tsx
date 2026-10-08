"use client";

import { useLocale } from "next-intl";
import { useEffect } from "react";

import type { Locale } from "@/lib/i18n/locale";
import { defaultLocale } from "@/lib/i18n/locale";
import englishMessages from "@/public/i18n/en.json";
import portugueseMessages from "@/public/i18n/pt.json";

interface TranslationPattern {
  expression: RegExp;
  placeholders: string[];
  target: string;
}

interface TranslationMap {
  values: Map<string, string>;
  patterns: TranslationPattern[];
}

type TrackedText = { source: string; translated: string };
type TrackedAttributes = Map<string, TrackedText>;

const trackedTextNodes = new WeakMap<Text, TrackedText>();
const trackedAttributes = new WeakMap<Element, TrackedAttributes>();
const translatableAttributes = ["aria-label", "aria-description", "aria-roledescription", "aria-valuetext", "alt", "placeholder", "title"];

function addTranslation(source: string, target: string, translations: TranslationMap): void {
  const normalizedSource = source.replace(/\s+/g, " ").trim();
  const normalizedTarget = target.replace(/\s+/g, " ").trim();
  if (normalizedSource === normalizedTarget) return;
  if (!translations.values.has(normalizedSource)) {
    translations.values.set(normalizedSource, normalizedTarget);
  }

  const placeholders = [...normalizedSource.matchAll(/\{([a-zA-Z][\w]*)\}/gu)].map((match) => match[1]);
  if (placeholders.length) {
    const sourcePattern = normalizedSource.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&").replace(/\\\{[a-zA-Z][\w]*\\\}/gu, "(.+?)");
    translations.patterns.push({ expression: new RegExp(`^${sourcePattern}$`, "u"), placeholders, target: normalizedTarget });
  }

  const sourceWithoutPunctuation = normalizedSource.replace(/[.!?…]+$/u, "");
  const targetWithoutPunctuation = normalizedTarget.replace(/[.!?…]+$/u, "");
  if (sourceWithoutPunctuation !== normalizedSource && !translations.values.has(sourceWithoutPunctuation)) {
    translations.values.set(sourceWithoutPunctuation, targetWithoutPunctuation);
  }
}

function collectTranslations(source: unknown, target: unknown, translations: TranslationMap): void {
  if (typeof source === "string" && typeof target === "string") {
    addTranslation(source, target, translations);
    return;
  }

  if (!source || !target || typeof source !== "object" || typeof target !== "object") return;

  for (const [key, sourceValue] of Object.entries(source)) {
    collectTranslations(sourceValue, (target as Record<string, unknown>)[key], translations);
  }
}

function preserveWhitespace(source: string, translated: string): string {
  const match = source.match(/^(\s*)([\s\S]*?)(\s*)$/u);
  if (!match) return translated;
  return `${match[1]}${translated}${match[3]}`;
}

function translateValue(source: string, translations: TranslationMap): string {
  const normalized = source.replace(/\s+/g, " ").trim();
  const translated = translations.values.get(normalized);
  if (translated !== undefined) return preserveWhitespace(source, translated);

  for (const pattern of translations.patterns) {
    const match = normalized.match(pattern.expression);
    if (!match) continue;
    const replacements = new Map(pattern.placeholders.map((placeholder, index) => [placeholder, match[index + 1]]));
    const result = pattern.target.replace(/\{([a-zA-Z][\w]*)\}/gu, (_token, key: string) => replacements.get(key) ?? "");
    return preserveWhitespace(source, result);
  }

  return source;
}

function translateTextNode(node: Text, translations: TranslationMap): void {
  const previous = trackedTextNodes.get(node);
  const source = previous && node.data === previous.translated ? previous.source : node.data;
  const translated = translateValue(source, translations);
  trackedTextNodes.set(node, { source, translated });
  if (node.data !== translated) node.data = translated;
}

function translateElement(element: Element, translations: TranslationMap): void {
  if (element.closest("[data-user-content]")) return;

  const tracked = trackedAttributes.get(element) ?? new Map<string, TrackedText>();
  for (const attribute of translatableAttributes) {
    const current = element.getAttribute(attribute);
    if (current === null) continue;
    const previous = tracked.get(attribute);
    const source = previous && current === previous.translated ? previous.source : current;
    const translated = translateValue(source, translations);
    tracked.set(attribute, { source, translated });
    if (current !== translated) element.setAttribute(attribute, translated);
  }
  trackedAttributes.set(element, tracked);
}

function isUserContent(node: Text): boolean {
  return Boolean(node.parentElement?.closest("[data-user-content], input, textarea, select, [contenteditable='true'], code, pre"));
}

function translateSubtree(root: Node, translations: TranslationMap): void {
  if (root instanceof Text) {
    if (!isUserContent(root)) translateTextNode(root, translations);
    return;
  }

  if (root instanceof Element) translateElement(root, translations);
  root.childNodes.forEach((child) => translateSubtree(child, translations));
}

export function LocaleDomBridge() {
  const locale = useLocale() as Locale;

  useEffect(() => {
    const translations: TranslationMap = { values: new Map(), patterns: [] };
    if (locale !== defaultLocale) {
      collectTranslations(portugueseMessages.ui, englishMessages.ui, translations);
    } else {
      collectTranslations(englishMessages.ui, portugueseMessages.ui, translations);
    }
    document.documentElement.lang = locale === "pt" ? "pt-BR" : "en";
    translateSubtree(document.body, translations);

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "characterData" && record.target instanceof Text) {
          if (!isUserContent(record.target)) translateTextNode(record.target, translations);
        }
        if (record.type === "attributes" && record.target instanceof Element) {
          translateElement(record.target, translations);
        }
        record.addedNodes.forEach((node) => translateSubtree(node, translations));
      }
    });

    observer.observe(document.body, {
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [locale]);

  return null;
}
