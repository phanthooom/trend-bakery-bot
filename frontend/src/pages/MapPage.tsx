import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { useState } from 'react'

export default function MapPage() {
  const navigate = useNavigate()
  const { setAddress } = useStore()
  const [step, setStep] = useState<'map' | 'form'>('map')
  const [selectedStreet, setSelectedStreet] = useState('улица М. Рахимова')

  const [form, setForm] = useState({
    apartment: '',
    intercom: '',
    entrance: '',
    floor: '',
  })

  const handleSaveAddress = () => {
    setAddress({
      street: selectedStreet,
      apartment: form.apartment,
      intercom: form.intercom,
      entrance: form.entrance,
      floor: form.floor,
    })
    navigate(-1)
  }

  if (step === 'form') {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <div className="px-4 pt-4 pb-3 border-b border-gray-100">
          <h1 className="font-bold text-xl text-gray-900">Добавить новый адрес</h1>
          <p className="text-gray-500 text-sm mt-1">{selectedStreet}</p>
        </div>

        <div className="px-4 pt-6 flex flex-col gap-4 flex-1">
          <input
            value={selectedStreet}
            onChange={(e) => setSelectedStreet(e.target.value)}
            placeholder="улица М. Рахимова"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#C8102E]"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              value={form.apartment}
              onChange={(e) => setForm({ ...form, apartment: e.target.value })}
              placeholder="Кв/Офис"
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#C8102E]"
            />
            <input
              value={form.intercom}
              onChange={(e) => setForm({ ...form, intercom: e.target.value })}
              placeholder="Домофон"
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#C8102E]"
            />
            <input
              value={form.entrance}
              onChange={(e) => setForm({ ...form, entrance: e.target.value })}
              placeholder="Подъезд"
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#C8102E]"
            />
            <input
              value={form.floor}
              onChange={(e) => setForm({ ...form, floor: e.target.value })}
              placeholder="Этаж"
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#C8102E]"
            />
          </div>
        </div>

        <div className="px-4 pb-8">
          <button
            onClick={handleSaveAddress}
            className="w-full bg-[#C8102E] text-white py-4 rounded-xl font-bold text-base"
          >
            Сохранить
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Map placeholder */}
      <div className="relative flex-1">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-md"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <button className="absolute top-4 right-4 z-10 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-md">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {/* Yandex Maps iframe */}
        <iframe
          src="https://yandex.uz/map-widget/v1/?ll=69.279737%2C41.299496&z=14&l=map"
          width="100%"
          height="100%"
          className="w-full h-full min-h-[calc(100vh-120px)]"
          style={{ border: 'none' }}
          title="Яндекс Карты"
        />

        {/* Center pin */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-10 pointer-events-none">
          <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center shadow-lg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <circle cx="12" cy="12" r="4" />
            </svg>
          </div>
          <div className="w-0.5 h-4 bg-gray-900 mx-auto" />
        </div>

        {/* Zoom controls */}
        <div className="absolute right-4 bottom-32 flex flex-col gap-1 z-10">
          <button className="bg-white w-9 h-9 flex items-center justify-center shadow-md rounded text-xl font-light text-gray-700">+</button>
          <button className="bg-white w-9 h-9 flex items-center justify-center shadow-md rounded text-xl font-light text-gray-700">−</button>
        </div>
      </div>

      {/* Save button */}
      <div className="px-4 py-4 bg-white">
        <button
          onClick={() => setStep('form')}
          className="w-full bg-[#C8102E] text-white py-4 rounded-xl font-bold text-base"
        >
          Сохранить
        </button>
      </div>
    </div>
  )
}
