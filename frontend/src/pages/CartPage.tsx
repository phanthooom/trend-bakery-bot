import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { useSafeArea } from '../context/SafeAreaContext'
import WebApp from '@twa-dev/sdk'

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, cartTotal, address } = useStore()
  const { top: safeTop, bottom: safeBottom } = useSafeArea()
  const navigate = useNavigate()

  const formatPrice = (price: number) => price.toLocaleString('ru-RU') + ' сум'

  const handleOrder = () => {
    if (!address) {
      navigate('/map')
      return
    }
    WebApp.sendData(
      JSON.stringify({
        type: 'order',
        items: cart,
        total: cartTotal(),
        address,
      })
    )
  }

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 pb-20">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" className="text-gray-200">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="1.5" />
          <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="1.5" />
          <path d="M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <p className="text-gray-400 text-lg">Корзина пуста</p>
        <button
          onClick={() => navigate('/')}
          className="bg-[#C8102E] text-white px-6 py-3 rounded-xl font-semibold"
        >
          Перейти в меню
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-48">
      <div className="px-4 pb-3 bg-white border-b border-gray-100" style={{ paddingTop: `max(${safeTop + 16}px, calc(env(safe-area-inset-top) + 16px))` }}>
        <h1 className="font-bold text-xl text-gray-900">Корзина</h1>
      </div>

      <div className="px-4 mt-3 flex flex-col gap-3">
        {cart.map((item) => (
          <div key={item.id} className="bg-white rounded-xl p-4 flex gap-3 items-start">
            <img
              src={item.image}
              alt={item.name}
              className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm leading-tight">{item.name}</h3>
              <p className="text-[#C8102E] font-bold text-sm mt-1">{formatPrice(item.price)}</p>
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => updateQuantity(item.id, -1)}
                  className="w-8 h-8 rounded-full bg-[#C8102E] text-white flex items-center justify-center text-lg font-light"
                >
                  −
                </button>
                <span className="font-bold text-gray-900">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, 1)}
                  className="w-8 h-8 rounded-full bg-[#C8102E] text-white flex items-center justify-center text-lg font-light"
                >
                  +
                </button>
              </div>
            </div>
            <button
              onClick={() => removeFromCart(item.id)}
              className="text-gray-300 hover:text-gray-500 mt-1"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Address block */}
      <div className="mx-4 mt-4 bg-white rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-gray-500 text-xs mb-1">Адрес доставки</div>
            <div className="font-semibold text-gray-900 text-sm">
              {address?.street ?? 'Не выбран'}
            </div>
          </div>
          <button
            onClick={() => navigate('/map')}
            className="text-[#C8102E] text-sm font-semibold"
          >
            {address ? 'Изменить' : 'Добавить'}
          </button>
        </div>
      </div>

      {/* Total + Order button */}
      <div
        className="fixed left-0 right-0 bg-white border-t border-gray-100 px-4 py-3"
        style={{ bottom: `max(${safeBottom + 56}px, calc(env(safe-area-inset-bottom) + 56px))` }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-500">Итого:</span>
          <span className="font-bold text-gray-900 text-lg">{formatPrice(cartTotal())}</span>
        </div>
        <button
          onClick={handleOrder}
          className="w-full bg-[#C8102E] text-white py-4 rounded-xl font-bold text-base"
        >
          Оформить заказ
        </button>
      </div>
    </div>
  )
}
