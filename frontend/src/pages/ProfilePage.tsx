import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import WebApp from '@twa-dev/sdk'

export default function ProfilePage() {
  const { address } = useStore()
  const navigate = useNavigate()
  const user = WebApp.initDataUnsafe?.user

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      <div className="px-4 pt-4 pb-3 bg-white border-b border-gray-100">
        <h1 className="font-bold text-xl text-gray-900">Профиль</h1>
      </div>

      {/* User info */}
      <div className="mx-4 mt-4 bg-white rounded-xl p-4 flex items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-[#C8102E] flex items-center justify-center text-white text-xl font-bold">
          {user?.first_name?.[0] ?? '?'}
        </div>
        <div>
          <div className="font-bold text-gray-900">
            {user ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() : 'Гость'}
          </div>
          {user?.username && (
            <div className="text-gray-500 text-sm">@{user.username}</div>
          )}
        </div>
      </div>

      {/* Address */}
      <div className="mx-4 mt-3 bg-white rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-50">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Адрес доставки</div>
          <div className="flex items-center justify-between">
            <span className="text-gray-900 text-sm font-medium">
              {address?.street ?? 'Не указан'}
            </span>
            <button
              onClick={() => navigate('/map')}
              className="text-[#C8102E] text-sm font-semibold"
            >
              {address ? 'Изменить' : 'Добавить'}
            </button>
          </div>
          {address?.apartment && (
            <div className="text-gray-500 text-xs mt-1">
              Кв. {address.apartment}
              {address.floor && `, эт. ${address.floor}`}
              {address.entrance && `, подъезд ${address.entrance}`}
            </div>
          )}
        </div>
      </div>

      {/* About */}
      <div className="mx-4 mt-3 bg-white rounded-xl overflow-hidden">
        <div className="px-4 py-4 border-b border-gray-50">
          <div className="font-semibold text-gray-900 text-sm mb-1">О нас</div>
          <p className="text-gray-500 text-sm leading-relaxed">
            Trend Bakery — пекарня с любовью. Свежий хлеб и выпечка каждый день, доставка по Ташкенту.
          </p>
        </div>
        <button className="w-full px-4 py-4 text-left text-sm text-gray-700 flex items-center justify-between">
          <span>Условия использования</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
