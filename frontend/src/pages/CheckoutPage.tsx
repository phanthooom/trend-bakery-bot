import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { useSafeArea } from '../context/SafeAreaContext'
import { useTranslation } from '../i18n'

export default function CheckoutPage() {
  const { cart, cartTotal, address, phone, setPhone } = useStore()
  const { top: safeTop, bottom: safeBottom } = useSafeArea()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [payment, setPayment] = useState<'cash' | 'card'>('cash')
  const [comment, setComment] = useState('')

  const formatPrice = (price: number) => price.toLocaleString('ru-RU') + ' ' + t('currency')

  const handleOrder = async () => {
    const tgApp = window.Telegram?.WebApp

    if (!phone) {
      if (tgApp?.showAlert) tgApp.showAlert('Пожалуйста, введите номер телефона')
      else alert('Пожалуйста, введите номер телефона')
      return
    }

    try {
      tgApp?.HapticFeedback?.impactOccurred('medium')
    } catch (e) {}

    const orderData = {
      type: 'order',
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      total: cartTotal(),
      address,
      phone,
      payment,
      comment,
      user: tgApp?.initDataUnsafe?.user || {}
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_URL}/api/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      })

      if (!response.ok) {
        throw new Error('Server returned ' + response.status)
      }

      // Если успешно, закрываем магазин
      tgApp?.close()
    } catch (err: any) {
      if (tgApp?.showAlert) tgApp.showAlert('Ошибка при отправке заказа (API): ' + err.message + '\n\nУбедитесь, что бот запущен и переменная VITE_API_URL прописана в Vercel.')
      else alert('Ошибка при отправке: ' + err.message)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-48">
      {/* Header */}
      <div 
        className="px-4 pb-3 bg-white border-b border-gray-100 flex items-center gap-3 sticky top-0 z-40" 
        style={{ paddingTop: `max(${safeTop + 16}px, calc(env(safe-area-inset-top) + 16px))` }}
      >
        <button 
          onClick={() => navigate('/cart')}
          className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-600"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="font-bold text-xl text-gray-900">{t('checkout')}</h1>
      </div>

      <div className="px-4 mt-4 flex flex-col gap-6">
        
        {/* Phone */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">{t('phone')}</label>
          <input 
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+998"
            className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-base outline-none focus:border-[#C8102E] focus:ring-1 focus:ring-[#C8102E] transition-all"
          />
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">{t('paymentMethod')}</label>
          <div className="flex flex-col gap-2">
            <label className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${payment === 'cash' ? 'border-[#C8102E] bg-red-50/30' : 'border-gray-200 bg-white'}`}>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${payment === 'cash' ? 'border-[#C8102E]' : 'border-gray-300'}`}>
                {payment === 'cash' && <div className="w-2.5 h-2.5 rounded-full bg-[#C8102E]" />}
              </div>
              <input 
                type="radio" 
                name="payment" 
                value="cash" 
                checked={payment === 'cash'} 
                onChange={() => setPayment('cash')}
                className="hidden" 
              />
              <span className="font-medium text-gray-900">{t('cash')}</span>
            </label>
            <label className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${payment === 'card' ? 'border-[#C8102E] bg-red-50/30' : 'border-gray-200 bg-white'}`}>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${payment === 'card' ? 'border-[#C8102E]' : 'border-gray-300'}`}>
                {payment === 'card' && <div className="w-2.5 h-2.5 rounded-full bg-[#C8102E]" />}
              </div>
              <input 
                type="radio" 
                name="payment" 
                value="card" 
                checked={payment === 'card'} 
                onChange={() => setPayment('card')}
                className="hidden" 
              />
              <span className="font-medium text-gray-900">{t('card')} (Payme/Click)</span>
            </label>
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">{t('comment')}</label>
          <textarea 
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('commentPlaceholder')}
            rows={3}
            className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-base outline-none focus:border-[#C8102E] focus:ring-1 focus:ring-[#C8102E] transition-all resize-none"
          />
        </div>

      </div>

      {/* Submit Order */}
      <div
        className="fixed left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 z-50"
        style={{ bottom: `max(${safeBottom + 56}px, calc(env(safe-area-inset-bottom) + 56px))` }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-500">{t('total')}:</span>
          <span className="font-bold text-gray-900 text-lg">{formatPrice(cartTotal())}</span>
        </div>
        <button
          onClick={handleOrder}
          className="w-full bg-[#C8102E] text-white py-4 rounded-xl font-bold text-base active:bg-[#a00c24] transition-colors"
        >
          {t('checkout')}
        </button>
      </div>
    </div>
  )
}
