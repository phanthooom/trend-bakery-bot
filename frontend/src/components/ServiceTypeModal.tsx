import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'

interface Props {
  onClose: () => void
}

const PICKUP_LAT = 41.373585
const PICKUP_LON = 69.489162

export default function ServiceTypeModal({ onClose }: Props) {
  const navigate = useNavigate()
  const { setDeliveryType, setAddress } = useStore()
  const [step, setStep] = useState<'select' | 'pickup'>('select')
  const [pickupAddress, setPickupAddress] = useState('Загружаем адрес...')

  useEffect(() => {
    // Fetch pickup address via Nominatim
    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${PICKUP_LAT}&lon=${PICKUP_LON}&zoom=18&addressdetails=1`,
      { headers: { 'Accept-Language': 'ru' } }
    )
      .then((r) => r.json())
      .then((data) => {
        const a = data?.address
        if (a) {
          const road = a.road || a.pedestrian || a.neighbourhood || a.suburb || ''
          const house = a.house_number ? ` ${a.house_number}` : ''
          const city = a.city || a.town || a.village || 'Ташкент'
          const text = road ? `${road}${house}, ${city}` : (data.display_name || '')
          if (text) setPickupAddress(text)
        }
      })
      .catch(() => setPickupAddress('Trend Bakery, Ташкент'))
  }, [])

  const handleDelivery = () => {
    setDeliveryType('delivery')
    localStorage.setItem('tb_service_selected', '1')
    onClose()
    navigate('/map')
  }

  const handlePickupConfirm = () => {
    setDeliveryType('pickup')
    setAddress({
      street: pickupAddress,
      apartment: '',
      intercom: '',
      entrance: '',
      floor: '',
      lat: PICKUP_LAT,
      lng: PICKUP_LON,
    })
    localStorage.setItem('tb_service_selected', '1')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Card */}
      <div className="relative w-full bg-white rounded-t-3xl px-6 pt-6 pb-10">

        {step === 'select' && (
          <>
            {/* Icon */}
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9 22V12h6v10" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            <h2 className="text-center text-2xl font-bold text-gray-900 mb-2">
              Выберите тип услуги
            </h2>
            <p className="text-center text-gray-500 text-sm mb-6">
              Как вы хотите получить заказ?
            </p>

            {/* Delivery */}
            <button
              onClick={handleDelivery}
              className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 border-[#C8102E] mb-3"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <rect x="1" y="8" width="15" height="10" rx="1" stroke="#374151" strokeWidth="1.5" />
                <path d="M16 10h4l3 4v4h-7V10z" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="5.5" cy="18.5" r="1.5" stroke="#374151" strokeWidth="1.5" />
                <circle cx="18.5" cy="18.5" r="1.5" stroke="#374151" strokeWidth="1.5" />
              </svg>
              <span className="flex-1 text-left text-gray-700 font-medium text-base">Доставка</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Pickup */}
            <button
              onClick={() => setStep('pickup')}
              className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border border-gray-200"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M13 5.48c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z" fill="#374151" />
              </svg>
              <span className="flex-1 text-left text-gray-700 font-medium text-base">Самовывоз</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </>
        )}

        {step === 'pickup' && (
          <>
            {/* Back */}
            <button
              onClick={() => setStep('select')}
              className="flex items-center gap-2 text-gray-500 text-sm mb-5"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Назад
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#C8102E" />
                </svg>
              </div>
            </div>

            <h2 className="text-center text-2xl font-bold text-gray-900 mb-2">
              Самовывоз
            </h2>
            <p className="text-center text-gray-500 text-sm mb-5">
              Адрес нашей пекарни
            </p>

            {/* Map preview */}
            <a
              href={`https://yandex.uz/maps/?ll=${PICKUP_LON},${PICKUP_LAT}&z=16&pt=${PICKUP_LON},${PICKUP_LAT},pm2rdm`}
              target="_blank"
              rel="noreferrer"
              className="block w-full rounded-2xl overflow-hidden border border-gray-200 mb-4"
            >
              <img
                src={`https://static-maps.yandex.ru/1.x/?ll=${PICKUP_LON},${PICKUP_LAT}&z=15&size=600,200&l=map&pt=${PICKUP_LON},${PICKUP_LAT},pm2rdm`}
                alt="Карта"
                className="w-full h-40 object-cover"
              />
            </a>

            {/* Address */}
            <div className="flex items-start gap-3 bg-gray-50 rounded-2xl p-4 mb-5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="mt-0.5 flex-shrink-0">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#C8102E" />
              </svg>
              <p className="text-gray-800 text-sm font-medium leading-snug">{pickupAddress}</p>
            </div>

            <button
              onClick={handlePickupConfirm}
              className="w-full bg-[#C8102E] text-white py-4 rounded-2xl font-bold text-base"
            >
              Выбрать этот адрес
            </button>
          </>
        )}
      </div>
    </div>
  )
}
