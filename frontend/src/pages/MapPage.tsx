import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { useSafeArea } from '../context/SafeAreaContext'
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from '../i18n'

declare global {
  interface Window {
    ymaps: any
  }
}

const YANDEX_API_KEY = '50b9437f-9dfc-41e7-b94f-d4003982c4c4'
const TASHKENT = [41.299496, 69.279737]

export default function MapPage() {
  const navigate = useNavigate()
  const { setAddress, addSavedAddress } = useStore()
  const { top: safeTop } = useSafeArea()
  const { t } = useTranslation()
  const [step, setStep] = useState<'map' | 'form'>('map')
  const [detectedAddress, setDetectedAddress] = useState('')
  const [coords, setCoords] = useState<[number, number]>(TASHKENT as [number, number])
  const mapRef = useRef<HTMLDivElement>(null)
  const ymapsRef = useRef<any>(null)

  const [form, setForm] = useState({ apartment: '', intercom: '', entrance: '', floor: '' })

  const btnTop = `max(${safeTop + 12}px, calc(env(safe-area-inset-top) + 12px))`

  useEffect(() => {
    if (step !== 'map') return

    setDetectedAddress(t('detectingAddress'))

    const scriptId = 'yandex-maps-script'
    const existing = document.getElementById(scriptId)

    const initMap = () => {
      window.ymaps.ready(() => {
        if (!mapRef.current) return

        const map = new window.ymaps.Map(mapRef.current, {
          center: TASHKENT,
          zoom: 15,
          controls: [],
        })

        ymapsRef.current = map

        const hideStyle = document.createElement('style')
        hideStyle.textContent = `
          .ymaps-2-1-79-copyright,
          [class*="ymaps-"][class*="-copyright"],
          [class*="ymaps-"][class*="-logo"],
          [class*="ymaps-"][class*="-gotoymaps"] { display: none !important; }
        `
        document.head.appendChild(hideStyle)

        const reverseGeocode = async (center: number[]) => {
          const [lat, lon] = center
          setCoords([lat, lon])

          try {
            const resp = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
              { headers: { 'Accept-Language': 'ru' } }
            )
            if (resp.ok) {
              const data = await resp.json()
              const a = data?.address
              if (a) {
                const road = a.road || a.pedestrian || a.neighbourhood || a.suburb || ''
                const house = a.house_number ? ` ${a.house_number}` : ''
                const city = a.city || a.town || a.village || 'Ташкент'
                const text = road ? `${road}${house}, ${city}` : (data.display_name || '')
                if (text) { setDetectedAddress(text); return }
              }
            }
          } catch {}

          try {
            const url = new URL('https://geocode-maps.yandex.ru/v1/')
            url.searchParams.set('apikey', YANDEX_API_KEY)
            url.searchParams.set('geocode', `${lon},${lat}`)
            url.searchParams.set('lang', 'ru_RU')
            url.searchParams.set('format', 'json')
            url.searchParams.set('results', '1')
            const resp = await fetch(url.toString(), { cache: 'no-store' })
            if (resp.ok) {
              const data = await resp.json()
              const item = data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject
              const text = item?.metaDataProperty?.GeocoderMetaData?.text || item?.name
              if (text) { setDetectedAddress(text); return }
            }
          } catch {}

          try {
            const res = await window.ymaps.geocode(center, { results: 1 })
            const obj = res.geoObjects.get(0)
            const name = obj?.getAddressLine?.() || obj?.properties?.get('text')
            if (name) setDetectedAddress(name)
          } catch {}
        }

        reverseGeocode(TASHKENT)

        let debounceTimer: ReturnType<typeof setTimeout>
        map.events.add('actionend', () => {
          clearTimeout(debounceTimer)
          debounceTimer = setTimeout(() => reverseGeocode(map.getCenter()), 380)
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

  const handleSaveAddress = () => {
    const newAddr = {
      id: Date.now().toString(),
      street: detectedAddress,
      apartment: form.apartment,
      intercom: form.intercom,
      entrance: form.entrance,
      floor: form.floor,
      lat: coords[0],
      lng: coords[1],
    }
    setAddress(newAddr)
    addSavedAddress(newAddr)
    navigate(-1)
  }

  if (step === 'form') {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <div
          className="px-4 pb-3 border-b border-gray-100"
          style={{ paddingTop: `max(${safeTop + 16}px, calc(env(safe-area-inset-top) + 16px))` }}
        >
          <h1 className="font-bold text-xl text-gray-900">{t('addNewAddress')}</h1>
          <p className="text-gray-500 text-sm mt-1 truncate">{detectedAddress}</p>
        </div>

        <div className="px-4 pt-6 flex flex-col gap-3 flex-1">
          <input
            value={detectedAddress}
            onChange={(e) => setDetectedAddress(e.target.value)}
            placeholder={t('address')}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#C8102E]"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              value={form.apartment}
              onChange={(e) => setForm({ ...form, apartment: e.target.value })}
              placeholder={t('apartment')}
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#C8102E]"
            />
            <input
              value={form.intercom}
              onChange={(e) => setForm({ ...form, intercom: e.target.value })}
              placeholder={t('intercom')}
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#C8102E]"
            />
            <input
              value={form.entrance}
              onChange={(e) => setForm({ ...form, entrance: e.target.value })}
              placeholder={t('entrance')}
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#C8102E]"
            />
            <input
              value={form.floor}
              onChange={(e) => setForm({ ...form, floor: e.target.value })}
              placeholder={t('floor')}
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#C8102E]"
            />
          </div>
        </div>

        <div className="px-4 pb-8">
          <button onClick={handleSaveAddress} className="w-full bg-[#C8102E] text-white py-4 rounded-xl font-bold text-base">
            {t('save')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="relative flex-1">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          style={{ top: btnTop }}
          className="absolute left-4 z-20 bg-white rounded-xl w-12 h-12 flex items-center justify-center shadow-md"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Search */}
        <button
          style={{ top: btnTop }}
          className="absolute right-4 z-20 bg-white rounded-xl w-12 h-12 flex items-center justify-center shadow-md"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {/* Map */}
        <div ref={mapRef} className="w-full h-full min-h-[calc(100vh-90px)]" />

        {/* Zoom */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col bg-white rounded-xl shadow-md overflow-hidden">
          <button
            onClick={() => ymapsRef.current?.setZoom(ymapsRef.current.getZoom() + 1, { duration: 200 })}
            className="w-12 h-12 flex items-center justify-center text-2xl text-gray-700 border-b border-gray-100 active:bg-gray-50"
          >+</button>
          <button
            onClick={() => ymapsRef.current?.setZoom(ymapsRef.current.getZoom() - 1, { duration: 200 })}
            className="w-12 h-12 flex items-center justify-center text-2xl text-gray-700 active:bg-gray-50"
          >−</button>
        </div>

        {/* Geolocation */}
        <button
          onClick={() => {
            navigator.geolocation.getCurrentPosition((pos) => {
              const c: [number, number] = [pos.coords.latitude, pos.coords.longitude]
              ymapsRef.current?.setCenter(c, 16, { duration: 300 })
            })
          }}
          className="absolute bottom-4 right-4 z-20 bg-white rounded-xl w-12 h-12 flex items-center justify-center shadow-md"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#1a1a1a">
            <path d="M12 8l-4 8 4-2 4 2-4-8z"/>
            <path d="M12 2v2M12 20v2M2 12h2M20 12h2" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="12" cy="12" r="3" stroke="#1a1a1a" strokeWidth="1.5" fill="none"/>
          </svg>
        </button>

        {/* Open Yandex Maps */}
        <a
          href={`https://yandex.uz/maps/?ll=${coords[1]},${coords[0]}&z=15`}
          target="_blank"
          rel="noreferrer"
          className="absolute bottom-4 left-4 z-20 bg-white rounded-xl px-3 h-10 flex items-center gap-2 shadow-md text-sm font-medium text-gray-900"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#C8102E">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          {t('openYandexMaps')}
        </a>

        {/* Center pin */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-10 pointer-events-none">
          <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center shadow-lg">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
              <path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z"/>
            </svg>
          </div>
          <div className="w-1.5 h-3 bg-gray-900 mx-auto rounded-b" />
        </div>
      </div>

      {/* Save button */}
      <div className="px-4 pt-3 pb-6 bg-white">
        <button onClick={() => setStep('form')} className="w-full bg-[#C8102E] text-white py-5 rounded-2xl font-bold text-base">
          {t('save')}
        </button>
      </div>
    </div>
  )
}
