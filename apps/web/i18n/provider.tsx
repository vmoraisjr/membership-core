"use client";

import {
  createContext,
  useContext,
} from "react";

import type { Messages } from "./messages";
import {
  defaultLocale,
  getTranslations,
} from "./messages";

type TranslationContextValue = {
  locale: string;
  messages: Messages;
};

const TranslationContext =
  createContext<TranslationContextValue>({
    locale: defaultLocale,
    messages: {} as Messages,
  });

type Props = {
  children: React.ReactNode;
  locale?: string;
  messages: Messages;
};

export function TranslationProvider({
  children,
  locale = defaultLocale,
  messages,
}: Props) {
  return (
    <TranslationContext.Provider
      value={{ locale, messages }}
    >
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslations(
  namespace?: string
) {
  useContext(TranslationContext);
  return getTranslations(namespace);
}
