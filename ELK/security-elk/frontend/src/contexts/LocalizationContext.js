import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  apiMessageKeyMap,
  DEFAULT_LOCALE,
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
  translations
} from '../localization';

const LocalizationContext = createContext(null);
const STORAGE_KEY = 'dashboardLocale';
const LOCALE_FORMATS = {
  en: 'en-US',
  vi: 'vi-VN'
};

const getNestedValue = (target, path) => {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), target);
};

const interpolate = (template, params = {}) => {
  if (typeof template !== 'string') {
    return template;
  }

  return template.replace(/\{\{(.*?)\}\}/g, (_, rawKey) => {
    const key = rawKey.trim();
    return params[key] ?? '';
  });
};

const isSupportedLocale = (value) => SUPPORTED_LOCALES.includes(value);

export const LocalizationProvider = ({ children }) => {
  const [locale, setLocale] = useState(() => {
    const storedLocale = localStorage.getItem(STORAGE_KEY);
    return isSupportedLocale(storedLocale) ? storedLocale : DEFAULT_LOCALE;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(() => {
    const t = (key, params) => {
      const localizedValue =
        getNestedValue(translations[locale], key) ??
        getNestedValue(translations[DEFAULT_LOCALE], key) ??
        key;

      return interpolate(localizedValue, params);
    };

    const getLocaleCode = () => LOCALE_FORMATS[locale] || LOCALE_FORMATS[DEFAULT_LOCALE];

    const formatDateTime = (valueToFormat, options = {}) => {
      if (!valueToFormat) {
        return '--';
      }

      const date = new Date(valueToFormat);
      if (Number.isNaN(date.getTime())) {
        return '--';
      }

      return new Intl.DateTimeFormat(getLocaleCode(), {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: options.includeSeconds ? '2-digit' : undefined,
        ...options
      }).format(date);
    };

    const formatTime = (valueToFormat, options = {}) => {
      if (!valueToFormat) {
        return '--';
      }

      const date = new Date(valueToFormat);
      if (Number.isNaN(date.getTime())) {
        return '--';
      }

      return new Intl.DateTimeFormat(getLocaleCode(), {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        ...options
      }).format(date);
    };

    const localizeApiMessage = (message, fallbackKey = 'common.errors.generic') => {
      const normalizedMessage = typeof message === 'string' ? message.trim() : '';
      const mappedKey = normalizedMessage ? apiMessageKeyMap[normalizedMessage] : null;
      return t(mappedKey || fallbackKey);
    };

    return {
      locale,
      setLocale: (nextLocale) => {
        if (isSupportedLocale(nextLocale)) {
          setLocale(nextLocale);
        }
      },
      locales: SUPPORTED_LOCALES,
      localeLabels: LOCALE_LABELS,
      t,
      formatDateTime,
      formatTime,
      localizeApiMessage
    };
  }, [locale]);

  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
};

export const useLocalization = () => {
  const context = useContext(LocalizationContext);

  if (!context) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }

  return context;
};
