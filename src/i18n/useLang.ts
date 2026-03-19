import { create } from 'zustand'
import { translations, type Lang, type TranslationKey } from './translations'

interface LangState {
  lang: Lang
  setLang: (lang: Lang) => void
  toggle: () => void
}

export const useLangStore = create<LangState>((set) => ({
  lang: 'fr',
  setLang: (lang) => set({ lang }),
  toggle: () => set((s) => ({ lang: s.lang === 'fr' ? 'en' : 'fr' })),
}))

export function useT() {
  const lang = useLangStore((s) => s.lang)

  function t(key: TranslationKey): string {
    const val = translations[lang][key]
    if (Array.isArray(val)) return (val as string[]).join(' ')
    return val as string
  }

  function tArr(key: TranslationKey): string[] {
    const val = translations[lang][key]
    if (Array.isArray(val)) return [...(val as string[])]
    return [val as string]
  }

  return { t, tArr, lang }
}
