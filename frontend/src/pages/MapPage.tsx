import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { useSafeArea } from '../context/SafeAreaContext'
import { useState, useEffect, useRef } from 'react'

declare global {
  interface Window {
    ymaps: any
  }
}

const YANDEX_API_KEY = '50b9437f-9dfc-41e7-b94f-d4003982c4c4'
const TASHKENT = [41.299496, 69.279737]

export default function MapPage() {
  const navigate = useNavigate()
  const { setAddress } = useStore()
  const { top: safeTop } = useSafeArea()
  const [step, setStep] = useState<'map' | 'form'>('map')
  const [detectedAddress, setDetectedAddress] = useState('Определяем адрес...')
  const [coords, setCoords] = useState<[number, number]>(TASHKENT as [number, number])
  const mapRef = useRef<HTMLDivElement>(null)
  const ymapsRef = useRef<any>(null)

  const [form, setForm] = useState({
    apartment: '',
    intercom: '',
    entrance: '',
    floor: '',
  })

  const btnTop = `max(${safeTop + 12}px, calc(env(safe-area-inset-top) + 12px))`

  useEffect(() => {
    if (step !== 'map') return

    const scriptId = 'yandex-maps-script'
    const existing = document.getElementById(scriptId)

    const initMap = () => {
      window.ymaps.ready(() => {
        if (!mapRef.current) return

        const map = new window.ymaps.Map(mapRef.current, {
          center: TASHKENT,
          zoom: 15,
          controls: ['geolocationControl', 'zoomControl'],
        })

        ymapsRef.current = map

        const reverseGeocode = (center: number[]) => {
          window.ymaps
            .geocode(center, { results: 1, kind: 'house' })
            .then((res: any) => {
              const obj = res.geoObjects.get(0)
              if (obj) {
                const name = obj.getAddressLine()
                setDetectedAddress(name)
                setCoords(center as [number, number])
              }
            })
        }

        // Initial geocode
        reverseGeocode(TASHKENT)

        // On every map move end — geocode center
        map.events.add('actionend', () => {
          const center = map.getCenter()
          reverseGeocode(center)
        })
      })
    }

    if (existing) {
      if (window.ymaps) initMap()
      else existing.addEventListener('load', initMap)
    } else {
      const script = document.createElement('script')
      script.id = scriptId
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${YANDEX_API_KEY}&lang=ru_RU`
      script.async = true
      script.onload = initMap
      document.head.appendChild(script)
    }

    return () => {
      ymapsRef.current?.destroy?.()
      ymapsRef.current = null
    }
  }, [step])

  const handleSaveMap = () => {
    setStep('form')
  }

  const handleSaveAddress = () => {
    setAddress({
      street: detectedAddress,
      apartment: form.apartment,
      intercom: form.intercom,
      entrance: form.entrance,
      floor: form.floor,
      lat: coords[0],
      lng: coords[1],
    })
    navigate(-1)
  }

  if (step === 'form') {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <div
          className="px-4 pb-3 border-b border-gray-100"
          style={{ paddingTop: `max(${safeTop + 16}px, calc(env(safe-area-inset-top) + 16px))` }}
        >
          <h1 className="font-bold text-xl text-gray-900">Добавить новый адрес</h1>
          <p className="text-gray-500 text-sm mt-1 truncate">{detectedAddress}</p>
        </div>

        <div className="px-4 pt-6 flex flex-col gap-3 flex-1">
          <input
            value={detectedAddress}
            onChange={(e) => setDetectedAddress(e.target.value)}
            placeholder="Адрес"
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
      <div className="relative flex-1">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          style={{ top: btnTop }}
          className="absolute left-4 z-20 bg-white rounded-xl w-12 h-12 flex items-center justify-center shadow-md"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Search button */}
        <button
          style={{ top: btnTop }}
          className="absolute right-4 z-20 bg-white rounded-xl w-12 h-12 flex items-center justify-center shadow-md"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {/* Map container */}
        <div ref={mapRef} className="w-full h-full min-h-[calc(100vh-90px)]" />

        {/* Fixed center pin (decorative, map moves under it) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-10 pointer-events-none">
          <div className="w-8 h-8 bg-[#C8102E] rounded-full flex items-center justify-center shadow-lg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </div>
          <div className="w-1 h-3 bg-[#C8102E] mx-auto rounded-b" />
        </div>
      </div>

      {/* Save button */}
      <div className="px-4 pt-3 pb-6 bg-white">
        <button
          onClick={handleSaveMap}
          className="w-full bg-[#C8102E] text-white py-5 rounded-2xl font-bold text-base"
        >
          Сохранить
        </button>
      </div>
    </div>
  )
}
