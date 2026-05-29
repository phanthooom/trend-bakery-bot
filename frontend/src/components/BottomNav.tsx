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
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="5" width="18" height="2" rx="1" fill={active ? '#C8102E' : '#9ca3af'} />
          <rect x="3" y="11" width="18" height="2" rx="1" fill={active ? '#C8102E' : '#9ca3af'} />
          <rect x="3" y="17" width="18" height="2" rx="1" fill={active ? '#C8102E' : '#9ca3af'} />
        </svg>
      ),
    },
    {
      path: '/cart',
      label: 'Корзина',
      icon: (active: boolean) => (
        <div className="relative">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke={active ? '#C8102E' : '#9ca3af'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="3" y1="6" x2="21" y2="6" stroke={active ? '#C8102E' : '#9ca3af'} strokeWidth="2" strokeLinecap="round" />
            <path d="M16 10a4 4 0 01-8 0" stroke={active ? '#C8102E' : '#9ca3af'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={active ? '#C8102E' : '#9ca3af'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="7" r="4" stroke={active ? '#C8102E' : '#9ca3af'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
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
