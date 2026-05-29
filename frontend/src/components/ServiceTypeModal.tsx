import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'

interface Props {
  onClose: () => void
}

export default function ServiceTypeModal({ onClose }: Props) {
  const navigate = useNavigate()
  const { setDeliveryType } = useStore()

  const handleDelivery = () => {
    setDeliveryType('delivery')
    localStorage.setItem('tb_service_selected', '1')
    onClose()
    navigate('/map')
  }

  const handlePickup = () => {
    setDeliveryType('pickup')
    localStorage.setItem('tb_service_selected', '1')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Card */}
      <div className="relative w-full bg-white rounded-t-3xl px-6 pt-6 pb-10">
        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 22V12h6v10" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-center text-2xl font-bold text-gray-900 mb-2">
          Выберите тип услуги
        </h2>
        <p className="text-center text-gray-500 text-sm mb-6">
          Как вы хотите получить заказ?
        </p>

        {/* Delivery option */}
        <button
          onClick={handleDelivery}
          className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 border-[#C8102E] mb-3"
        >
          <div className="text-gray-600">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <rect x="1" y="8" width="15" height="10" rx="1" stroke="#374151" strokeWidth="1.5" />
              <path d="M16 10h4l3 4v4h-7V10z" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="5.5" cy="18.5" r="1.5" stroke="#374151" strokeWidth="1.5" />
              <circle cx="18.5" cy="18.5" r="1.5" stroke="#374151" strokeWidth="1.5" />
            </svg>
          </div>
          <span className="flex-1 text-left text-gray-700 font-medium text-base">Доставка</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Pickup option */}
        <button
          onClick={handlePickup}
          className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border border-gray-200"
        >
          <div className="text-gray-600">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M13 5.48c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z" fill="#374151" />
            </svg>
          </div>
          <span className="flex-1 text-left text-gray-700 font-medium text-base">Самовывоз</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
