import { useNavigate, useLocation } from 'react-router-dom'
import { useStore } from '../store/useStore'

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const cartCount = useStore((s) => s.cartCount())

  const tabs = [
    {
      path: '/',
      label: 'Меню',
      icon: (active: boolean) => (
        // Receipt / menu-card icon
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M6 2h12a1 1 0 011 1v16.5l-1.5-.75-1.5.75-1.5-.75-1.5.75-1.5-.75-1.5.75-1.5-.75-1.5.75V3a1 1 0 011-1z"
            stroke={active ? '#C8102E' : '#9ca3af'}
            strokeWidth="1.5"
            strokeLinejoin="round"
            fill={active ? '#C8102E' : 'none'}
            fillOpacity={active ? 0.08 : 0}
          />
          <line x1="9" y1="8" x2="15" y2="8" stroke={active ? '#C8102E' : '#9ca3af'} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="9" y1="12" x2="15" y2="12" stroke={active ? '#C8102E' : '#9ca3af'} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="9" y1="16" x2="12" y2="16" stroke={active ? '#C8102E' : '#9ca3af'} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      path: '/cart',
      label: 'Корзина',
      icon: (active: boolean) => (
        <div className="relative">
          {/* Shopping cart icon */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
              stroke={active ? '#C8102E' : '#9ca3af'}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line x1="3" y1="6" x2="21" y2="6" stroke={active ? '#C8102E' : '#9ca3af'} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M16 10a4 4 0 01-8 0" stroke={active ? '#C8102E' : '#9ca3af'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#C8102E] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </div>
      ),
    },
    {
      path: '/profile',
      label: 'Профиль',
      icon: (active: boolean) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="4" stroke={active ? '#C8102E' : '#9ca3af'} strokeWidth="1.5" />
          <path
            d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
            stroke={active ? '#C8102E' : '#9ca3af'}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-1"
            >
              {tab.icon(active)}
              <span className={`text-xs font-medium ${active ? 'text-[#C8102E]' : 'text-gray-400'}`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
