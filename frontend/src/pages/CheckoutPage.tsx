import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { useSafeArea } from '../context/SafeAreaContext'
import { useTranslation } from '../i18n'
import { haptic } from '../utils/haptic'

export default function CheckoutPage() {
  const { cart, cartTotal, address, deliveryType, phone, setPhone } = useStore()
  const { top: safeTop, bottom: safeBottom } = useSafeArea()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [payment, setPayment] = useState<'cash' | 'card'>('cash')
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState<{ id: string } | null>(null)

  const formatPrice = (price: number) => price.toLocaleString('ru-RU') + ' ' + t('currency')

  const tgApp = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined

  // Phone number formatter
  const handlePhoneChange = (val: string) => {
    let raw = val.replace(/\D/g, '')
    if (!raw.startsWith('998')) {
      raw = '998' + raw
    }
    raw = raw.slice(0, 12)
    setPhone('+' + raw)
  }

  const handleOrder = async () => {
    if (isSubmitting) return

    // Address validation
    if (deliveryType === 'delivery' && !address?.street) {
      haptic.error()
      if (tgApp?.showAlert) {
        tgApp.showAlert('Пожалуйста, укажите адрес доставки')
      } else {
        alert('Пожалуйста, укажите адрес доставки')
      }
      navigate('/map')
      return
    }

    // Phone validation
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 12) {
      haptic.error()
      if (tgApp?.showAlert) {
        tgApp.showAlert('Пожалуйста, укажите корректный номер телефона: +998 XX XXX XX XX')
      } else {
        alert('Пожалуйста, укажите корректный номер телефона: +998 XX XXX XX XX')
      }
      return
    }

    setIsSubmitting(true)
    haptic.medium()

    const clientUser = tgApp?.initDataUnsafe?.user
    const orderData = {
      type: 'order',
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      total: cartTotal(),
      address: deliveryType === 'pickup' 
        ? { street: 'Самовывоз: Trend Bakery', apartment: '', entrance: '', floor: '', intercom: '' } 
        : address,
      phone,
      payment,
      comment,
      user: clientUser || {}
    }

    try {
      const response = await fetch(`/api/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Init-Data': tgApp?.initData ?? '',
        },
        body: JSON.stringify(orderData)
      })

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}))
        throw new Error(errJson.error || `Server returned ${response.status}`)
      }

      const resData = await response.json().catch(() => ({}))
      const generatedId = resData.orderId || String(Date.now()).slice(-5)

      // Clear cart on success
      useStore.setState({ cart: [] })
      haptic.success()

      setOrderSuccess({ id: generatedId })
    } catch (err: any) {
      haptic.error()
      if (tgApp?.showAlert) {
        tgApp.showAlert('Ошибка при оформлении заказа: ' + err.message)
      } else {
        alert('Ошибка при оформлении: ' + err.message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Success Modal
  if (orderSuccess) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-5 shadow-inner">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Заказ #{orderSuccess.id} принят!</h2>
        <p className="text-gray-500 text-sm max-w-xs mb-8">
          Спасибо за заказ! Наша пекарня уже приступила к выпечке и подготовке.
        </p>

        <div className="w-full max-w-sm bg-gray-50 rounded-2xl p-4 mb-8 text-left text-sm flex flex-col gap-2 border border-gray-100">
          <div className="flex justify-between">
            <span className="text-gray-500">Способ:</span>
            <span className="font-semibold text-gray-900">{deliveryType === 'delivery' ? 'Доставка' : 'Самовывоз'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Оплата:</span>
            <span className="font-semibold text-gray-900">{payment === 'cash' ? 'Наличными' : 'Картой'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Телефон:</span>
            <span className="font-semibold text-gray-900">{phone}</span>
          </div>
        </div>

        <div className="w-full max-w-sm flex flex-col gap-3">
          <button
            onClick={() => {
              navigate('/')
            }}
            className="w-full bg-[#C8102E] text-white py-4 rounded-xl font-bold text-base shadow-lg shadow-red-200 active:scale-98 transition-transform"
          >
            В главное меню
          </button>
          <button
            onClick={() => {
              try { tgApp?.close?.() } catch (e) {}
              navigate('/')
            }}
            className="w-full bg-gray-100 text-gray-700 py-3.5 rounded-xl font-semibold text-sm active:bg-gray-200 transition-colors"
          >
            Закрыть магазин
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50" style={{ paddingBottom: '260px' }}>
      {/* Header */}
      <div 
        className="px-4 pb-3 bg-white border-b border-gray-100 flex items-center gap-3 sticky top-0 z-40" 
        style={{ paddingTop: safeTop > 0 ? `${safeTop}px` : `max(calc(env(safe-area-inset-top) + 28px), 16px)` }}
      >
        <button 
          onClick={() => { haptic.light(); navigate('/cart') }}
          className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-full text-gray-600 active:bg-gray-200"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="font-bold text-xl text-gray-900">{t('checkout')}</h1>
      </div>

      <div className="px-4 mt-4 flex flex-col gap-4">
        
        {/* Address Card */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              {deliveryType === 'delivery' ? t('deliveryAddress') : t('pickup')}
            </span>
            {deliveryType === 'delivery' && (
              <button 
                onClick={() => { haptic.selection(); navigate('/map') }}
                className="text-xs font-bold text-[#C8102E]"
              >
                {address?.street ? t('change') : t('add')}
              </button>
            )}
          </div>

          {deliveryType === 'delivery' ? (
            address?.street ? (
              <div className="flex items-start gap-2.5">
                <svg className="w-5 h-5 text-[#C8102E] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                <div>
                  <div className="font-bold text-gray-900 text-sm leading-snug">{address.street}</div>
                  {(address.apartment || address.entrance || address.floor) && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {[
                        address.apartment ? `кв. ${address.apartment}` : '',
                        address.entrance ? `подъезд ${address.entrance}` : '',
                        address.floor ? `эт. ${address.floor}` : '',
                        address.intercom ? `домофон ${address.intercom}` : '',
                      ].filter(Boolean).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={() => { haptic.selection(); navigate('/map') }}
                className="w-full py-3 px-4 border border-dashed border-[#C8102E] rounded-xl text-[#C8102E] text-sm font-semibold flex items-center justify-center gap-2 bg-red-50/50"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Указать адрес на карте
              </button>
            )
          ) : (
            <div className="text-sm font-medium text-gray-800">
              Самовывоз: Trend Bakery, Ташкент
            </div>
          )}
        </div>

        {/* Phone */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
            {t('phone')}
          </label>
          <div className="relative">
            <input 
              type="tel"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="+998 90 123 45 67"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-base font-semibold text-gray-900 outline-none focus:border-[#C8102E] focus:bg-white transition-all tracking-wider"
            />
          </div>
          <span className="text-[11px] text-gray-400 mt-1 block">На этот номер придёт подтверждение</span>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2.5">
            {t('paymentMethod')}
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => { haptic.selection(); setPayment('cash') }}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                payment === 'cash' 
                  ? 'border-[#C8102E] bg-red-50/40 text-gray-900' 
                  : 'border-gray-200 bg-white text-gray-600'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-xl">💵</span>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  payment === 'cash' ? 'border-[#C8102E]' : 'border-gray-300'
                }`}>
                  {payment === 'cash' && <div className="w-2 h-2 rounded-full bg-[#C8102E]" />}
                </div>
              </div>
              <span className="font-bold text-sm">{t('cash')}</span>
            </button>

            <button
              type="button"
              onClick={() => { haptic.selection(); setPayment('card') }}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                payment === 'card' 
                  ? 'border-[#C8102E] bg-red-50/40 text-gray-900' 
                  : 'border-gray-200 bg-white text-gray-600'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-xl">💳</span>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  payment === 'card' ? 'border-[#C8102E]' : 'border-gray-300'
                }`}>
                  {payment === 'card' && <div className="w-2 h-2 rounded-full bg-[#C8102E]" />}
                </div>
              </div>
              <span className="font-bold text-sm">Картой (Payme/Click)</span>
            </button>
          </div>
        </div>

        {/* Comment */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
            {t('comment')}
          </label>
          <textarea 
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('commentPlaceholder')}
            rows={2}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3.5 text-sm outline-none focus:border-[#C8102E] focus:bg-white transition-all resize-none text-gray-900"
          />
        </div>

      </div>

      {/* Submit Button Sticky Bar */}
      <div
        className="fixed left-0 right-0 bottom-0 bg-white border-t border-gray-100 px-4 pt-3 z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
        style={{ paddingBottom: `max(${safeBottom + 12}px, calc(env(safe-area-inset-bottom) + 12px), 20px)` }}
      >
        <div className="flex items-center justify-between mb-2.5 px-1">
          <span className="text-gray-500 text-sm font-medium">{t('total')}:</span>
          <span className="font-black text-gray-900 text-xl">{formatPrice(cartTotal())}</span>
        </div>
        <button
          onClick={handleOrder}
          disabled={isSubmitting}
          className="w-full bg-[#C8102E] text-white py-3.5 rounded-2xl font-bold text-base shadow-lg shadow-red-200 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{t('checkout')}</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
