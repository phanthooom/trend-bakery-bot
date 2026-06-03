import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store/useStore'
import type { Language } from '../i18n'

export default function LanguageDropdown() {
  const { language, setLanguage } = useStore()
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
    { code: 'uz', label: "O'zbek", flag: '🇺🇿' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
  ]

  const activeLang = languages.find((l) => l.code === language) || languages[0]

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100"
      >
        <span className="text-[22px] leading-none">{activeLang.flag}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-40 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 overflow-hidden z-50 animate-fade-in origin-top-right">
          {languages.map((lang, index) => (
            <div key={lang.code}>
              <button
                onClick={() => {
                  setLanguage(lang.code)
                  setIsOpen(false)
                }}
                className="w-full text-left px-4 py-3 flex items-center gap-3 transition-colors hover:bg-gray-50 active:bg-gray-100"
              >
                <span className="text-[20px] leading-none">{lang.flag}</span>
                <span className={`text-[15px] ${language === lang.code ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                  {lang.label}
                </span>
                {language === lang.code && (
                  <svg className="ml-auto text-[#C8102E]" width="14" height="10" viewBox="0 0 14 10" fill="none">
                    <path d="M1 5L5 9L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              {index < languages.length - 1 && <div className="h-[1px] bg-gray-100 mx-4" />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
