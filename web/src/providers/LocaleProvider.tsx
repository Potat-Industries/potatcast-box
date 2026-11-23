import React, { useEffect, useMemo } from "react";
import { useStoredValue } from "../hooks/useStoredValue";
import locale_da from "../locale/da";
import locale_en from "../locale/en";
import { localeInterface } from "../locale/localeInterface";

const LOCALE_STORAGE_KEY = "locale";

export interface LocaleOption {
  /** The value saved in the browser. "dk" predates the correct language code and is kept so saved choices survive. */
  id: string;
  name: string;
  content: localeInterface;
}

export const LOCALE_OPTIONS: LocaleOption[] = [
  { id: "en", name: "English", content: locale_en },
  { id: "dk", name: "Dansk", content: locale_da },
];

const DEFAULT_LOCALE_OPTION = LOCALE_OPTIONS[0];

interface LocaleContextValue {
  locale: localeInterface;
  localeId: string;
  setLocaleId: (localeId: string) => void;
}

export const LocaleContext = React.createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE_OPTION.content,
  localeId: DEFAULT_LOCALE_OPTION.id,
  setLocaleId: () => {},
});

export function LocaleProvider(props: { children: React.ReactNode }) {
  const [storedLocaleId, setLocaleId] = useStoredValue(
    LOCALE_STORAGE_KEY,
    DEFAULT_LOCALE_OPTION.id,
  );
  const option =
    LOCALE_OPTIONS.find((candidate) => candidate.id === storedLocaleId) ?? DEFAULT_LOCALE_OPTION;

  useEffect(() => {
    document.documentElement.lang = option.content.locale;
  }, [option]);

  const value = useMemo<LocaleContextValue>(
    () => ({ locale: option.content, localeId: option.id, setLocaleId }),
    [option, setLocaleId],
  );

  return <LocaleContext.Provider value={value}>{props.children}</LocaleContext.Provider>;
}
