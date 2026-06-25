import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { useSafeArea } from '../context/SafeAreaContext'
import { haptic } from '../utils/haptic'
import { useTranslation, type Language } from '../i18n'

const getInitData = () => {
  try { return (window as any).Telegram?.WebApp?.initData || '' } catch { return '' }
}

const LANGS: { code: Language; label: string; flag: string }[] = [
  { code: 'ru', label: 'Рус', flag: '🇷🇺' },
  { code: 'uz', label: "O'zb", flag: '🇺🇿' },
  { code: 'en', label: 'Eng', flag: '🇬🇧' },
]

function SettingsRow({
  icon,
  label,
  sublabel,
  right,
  onClick,
  danger,
}: {
  icon: React.ReactNode
  label: string
  sublabel?: string
  right?: React.ReactNode
  onClick?: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left ${onClick ? 'active:bg-gray-50 transition-colors' : 'cursor-default'}`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${danger ? 'bg-red-50' : 'bg-gray-100'}`}>
        <span className={danger ? 'text-[#C8102E]' : 'text-gray-600'}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${danger ? 'text-[#C8102E]' : 'text-gray-900'}`}>{label}</p>
        {sublabel && <p className="text-xs text-gray-400 mt-0.5 truncate">{sublabel}</p>}
      </div>
      {right && <div className="flex-shrink-0">{right}</div>}
      {onClick && !right && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-gray-300 flex-shrink-0">
          <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  )
}

export default function ProfilePage() {
  const { address, language, setLanguage, deliveryType, setDeliveryType, phone, setPhone } = useStore()
  const { top: safeTop } = useSafeArea()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const tgUser = (() => {
    try { return (window as any).Telegram?.WebApp?.initDataUnsafe?.user } catch { return null }
  })()

  const [isAdmin, setIsAdmin] = useState(false)
  const [adminRole, setAdminRole] = useState<'super' | 'admin' | null>(null)
  const [editPhone, setEditPhone] = useState(false)
  const [phoneDraft, setPhoneDraft] = useState(phone)

  useEffect(() => {
    const id = getInitData()
    if (!id) return
    fetch('/api/admins', { headers: { 'X-Telegram-Init-Data': id } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.me) { setIsAdmin(true); setAdminRole(d.me.role) } })
      .catch(() => {})
  }, [])

  const handleLang = (code: Language) => {
    haptic.selection()
    setLanguage(code)
  }

  const handleDelivery = (type: 'delivery' | 'pickup') => {
    haptic.selection()
    setDeliveryType(type)
  }

  const handlePhoneSave = () => {
    haptic.light()
    setPhone(phoneDraft)
    setEditPhone(false)
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div
        className="px-4 pb-3 bg-white border-b border-gray-100"
        style={{ paddingTop: `max(${safeTop + 16}px, calc(env(safe-area-inset-top) + 16px))` }}
      >
        <h1 className="font-bold text-xl text-gray-900">{t('profile')}</h1>
      </div>

      {/* User card */}
      <div className="mx-4 mt-4 bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm">
        <div className="w-14 h-14 rounded-full bg-[#C8102E] flex items-center justify-center text-white text-xl font-bold flex-shrink-0 select-none">
          {tgUser?.first_name?.[0] ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-gray-900 truncate text-base">
            {tgUser ? `${tgUser.first_name ?? ''} ${tgUser.last_name ?? ''}`.trim() : 'Гость'}
          </div>
          {tgUser?.username && <div className="text-gray-400 text-sm">@{tgUser.username}</div>}
          {!tgUser?.username && <div className="text-gray-400 text-sm">Telegram</div>}
        </div>
        {isAdmin && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
            style={{ background: '#fff0f0', color: '#C8102E' }}>
            {adminRole === 'super' ? '👑 Главный' : 'Админ'}
          </span>
        )}
      </div>

      {/* Admin panel — only for admins */}
      {isAdmin && (
        <div className="mx-4 mt-3">
          <button
            onClick={() => { haptic.medium(); navigate('/admin') }}
            className="w-full bg-[#C8102E] text-white rounded-2xl px-4 py-3.5 flex items-center justify-between active:scale-[0.98] transition-transform shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="white" strokeWidth="1.8" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="white" strokeWidth="1.8" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="white" strokeWidth="1.8" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="white" strokeWidth="1.8" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-bold text-sm">Панель управления</p>
                <p className="text-white/70 text-xs">Товары, цены, администраторы</p>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}

      {/* Settings group */}
      <div className="mx-4 mt-3 bg-white rounded-2xl overflow-hidden shadow-sm divide-y divide-gray-50">

        {/* Language */}
        <SettingsRow
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M3 12h18M12 3c-2.5 3-4 5.5-4 9s1.5 6 4 9M12 3c2.5 3 4 5.5 4 9s-1.5 6-4 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>}
          label="Язык"
          right={
            <div className="flex bg-gray-100 rounded-xl p-0.5 gap-0.5">
              {LANGS.map(l => (
                <button
                  key={l.code}
                  onClick={() => handleLang(l.code)}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${language === l.code ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
                >
                  {l.flag}
                </button>
              ))}
            </div>
          }
        />

        {/* Delivery type */}
        <SettingsRow
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="1" y="10" width="13" height="10" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M14 13h4l3 3v4h-7V13z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><circle cx="6" cy="20" r="2" stroke="currentColor" strokeWidth="1.8"/><circle cx="18" cy="20" r="2" stroke="currentColor" strokeWidth="1.8"/><path d="M1 7h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>}
          label={t('delivery')}
          sublabel={deliveryType === 'delivery' ? 'Курьером до двери' : 'Забрать самостоятельно'}
          right={
            <div className="flex bg-gray-100 rounded-xl p-0.5 gap-0.5">
              <button
                onClick={() => handleDelivery('delivery')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${deliveryType === 'delivery' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
              >
                {t('delivery')}
              </button>
              <button
                onClick={() => handleDelivery('pickup')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${deliveryType === 'pickup' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
              >
                {t('pickup')}
              </button>
            </div>
          }
        />

        {/* Phone */}
        <SettingsRow
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          label="Телефон"
          sublabel={phone || 'Не указан'}
          onClick={editPhone ? undefined : () => { haptic.light(); setPhoneDraft(phone); setEditPhone(true) }}
          right={editPhone ? (
            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
              <input
                autoFocus
                type="tel"
                value={phoneDraft}
                onChange={e => setPhoneDraft(e.target.value)}
                className="w-32 text-sm border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-[#C8102E]"
                placeholder="+998 90 000 00 00"
              />
              <button onClick={handlePhoneSave} className="text-[#C8102E] text-sm font-semibold">OK</button>
            </div>
          ) : undefined}
        />

        {/* Address */}
        <SettingsRow
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8"/></svg>}
          label="Адрес доставки"
          sublabel={address?.street ?? 'Не указан'}
          onClick={() => { haptic.light(); navigate('/map') }}
        />
      </div>

      {/* Info group */}
      <div className="mx-4 mt-3 bg-white rounded-2xl overflow-hidden shadow-sm divide-y divide-gray-50">
        <SettingsRow
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>}
          label="О нас"
          sublabel="Trend Bakery — свежая выпечка по Ташкенту"
          onClick={() => { haptic.light() }}
        />
        <SettingsRow
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 12h6m-6 4h6M17 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V4a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>}
          label="Условия использования"
          onClick={() => { haptic.light() }}
        />
        <SettingsRow
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          label="Политика конфиденциальности"
          onClick={() => { haptic.light() }}
        />
      </div>

      {/* App version */}
      <p className="text-center text-xs text-gray-300 mt-6">Trend Bakery v1.0</p>
    </div>
  )
}
