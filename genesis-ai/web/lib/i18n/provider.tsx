'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { translations, type Locale, type Translation } from './translations';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translation;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const STORAGE_KEY = 'genesis-ai-locale';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('zh');

  // 初始化语言
  useEffect(() => {
    // 优先从本地存储获取
    const savedLocale = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (savedLocale && ['zh', 'en'].includes(savedLocale)) {
      setLocale(savedLocale);
    } else {
      // 自动检测浏览器语言
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('zh')) {
        setLocale('zh');
      } else {
        setLocale('en');
      }
    }
  }, []);

  // 更新 HTML 标签的 lang 属性
  useEffect(() => {
    document.documentElement.lang = locale;
    localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  const value = {
    locale,
    setLocale,
    t: translations[locale],
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// 语言切换按钮组件
export function LanguageToggle() {
  const { locale, setLocale } = useI18n();

  const toggleLocale = () => {
    setLocale(locale === 'zh' ? 'en' : 'zh');
  };

  return (
    <button
      onClick={toggleLocale}
      className="p-2 rounded-lg border border-[var(--border)] hover:border-[var(--primary)] transition text-sm focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)]"
      aria-label={`切换语言，当前为${locale === 'zh' ? '中文' : 'English'}`}
      title={locale === 'zh' ? '切换到 English' : 'Switch to 中文'}
    >
      <span className="text-lg font-medium">{locale === 'zh' ? 'EN' : '中'}</span>
    </button>
  );
}
