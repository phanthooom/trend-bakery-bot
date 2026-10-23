import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { useSafeArea } from '../context/SafeAreaContext'
import { useTranslation } from '../i18n'
import { haptic } from '../utils/haptic'

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, cartTotal, address, deliveryType, setAddress } = useStore()
  const { top: safeTop, bottom: safeBottom } = useSafeArea()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const formatPrice = (price: number) => price.toLocaleString('ru-RU') + ' ' + t('currency')

  const handleOrder = () => {
    haptic.selection()
    if (deliveryType === 'pickup') {
      if (!address) {
        setAddress({
          street: 'Самовывоз: Trend Bakery',
          apartment: '',
          entrance: '',
          floor: '',
          intercom: '',
        })
      }
      navigate('/checkout')
      return
    }

    if (!address?.street) {
      navigate('/map')
      return
    }
    navigate('/checkout')
  }

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6 pb-20 bg-white">
        <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center text-3xl">
          🥐
        </div>
        <h2 className="text-xl font-bold text-gray-900">{t('cartEmpty')}</h2>
        <p className="text-gray-400 text-sm text-center max-w-xs">
          Добавьте свежую выпечку или хлебные наборы из нашего каталога
        </p>
        <button
          onClick={() => { haptic.light(); navigate('/') }}
          className="bg-[#C8102E] text-white px-8 py-3.5 rounded-2xl font-bold shadow-md active:scale-95 transition-transform"
        >
          {t('goToMenu')}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-44">
      {/* Header */}
      <div 
        className="px-4 pb-3 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-40" 
        style={{ paddingTop: `calc(${safeTop}px + 8px)` }}
      >
        <h1 className="font-bold text-xl text-gray-900">{t('cart')}</h1>
        <span className="text-xs font-semibold px-2.5 py-1 bg-red-50 text-[#C8102E] rounded-full">
          {cart.reduce((s, i) => s + i.quantity, 0)} шт
        </span>
      </div>

      <div className="px-4 mt-3 flex flex-col gap-3">
        {cart.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl p-3.5 flex gap-3 items-center border border-gray-100 shadow-sm">
            <img src={item.image} alt={item.name} className="w-18 h-18 rounded-xl object-cover flex-shrink-0 bg-gray-50" />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-1">{item.name}</h3>
              <p className="text-[#C8102E] font-black text-sm mt-0.5">{formatPrice(item.price)}</p>
              
              <div className="flex items-center gap-2.5 mt-2">
                <button 
                  onClick={() => { haptic.light(); updateQuantity(item.id, -1) }} 
                  className="w-7 h-7 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center text-base font-bold active:bg-gray-200"
                >
                  −
                </button>
                <span className="font-bold text-gray-900 text-sm min-w-5 text-center">{item.quantity}</span>
                <button 
                  onClick={() => { haptic.light(); updateQuantity(item.id, 1) }} 
                  className="w-7 h-7 rounded-lg bg-[#C8102E] text-white flex items-center justify-center text-base font-bold active:scale-95 transition-transform"
                >
                  +
                </button>
              </div>
            </div>

            <button 
              onClick={() => { haptic.light(); removeFromCart(item.id) }} 
              className="text-gray-300 hover:text-gray-500 p-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Delivery / Address Summary Card */}
      <div className="mx-4 mt-3 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1 pr-2">
            <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-0.5">
              {deliveryType === 'delivery' ? t('deliveryAddress') : t('pickup')}
            </div>
            <div className="font-bold text-gray-900 text-sm truncate">
              {deliveryType === 'pickup' 
                ? 'Самовывоз: Trend Bakery' 
                : (address?.street || t('notSelected'))}
            </div>
          </div>
          {deliveryType === 'delivery' && (
            <button 
              onClick={() => { haptic.selection(); navigate('/map') }} 
              className="text-[#C8102E] text-xs font-bold px-3 py-1.5 bg-red-50 rounded-xl shrink-0"
            >
              {address ? t('change') : t('add')}
            </button>
          )}
        </div>
      </div>

      {/* Sticky Bottom Order Bar */}
      <div
        className="fixed left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 px-4 py-3 shadow-lg"
        style={{ bottom: `max(${safeBottom + 58}px, calc(env(safe-area-inset-bottom) + 58px))` }}
      >
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-gray-500 text-sm font-medium">{t('total')}:</span>
          <span className="font-black text-gray-900 text-xl">{formatPrice(cartTotal())}</span>
        </div>
        <button 
          onClick={handleOrder} 
          className="w-full bg-[#C8102E] text-white py-3.5 rounded-2xl font-bold text-base shadow-lg shadow-red-200 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          <span>{t('checkout')}</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
