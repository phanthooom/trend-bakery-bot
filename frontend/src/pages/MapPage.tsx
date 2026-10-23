import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { useSafeArea } from '../context/SafeAreaContext'
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from '../i18n'
import { haptic } from '../utils/haptic'

declare global {
  interface Window {
    ymaps: any
    Telegram?: any
  }
}

const YANDEX_API_KEY = '50b9437f-9dfc-41e7-b94f-d4003982c4c4'
const TASHKENT: [number, number] = [41.299496, 69.279737]

export default function MapPage() {
  const navigate = useNavigate()
  const { address: existingAddress, setAddress, addSavedAddress } = useStore()
  const { top: safeTop, bottom: safeBottom } = useSafeArea()
  const { t } = useTranslation()

  const [detectedAddress, setDetectedAddress] = useState(existingAddress?.street || '')
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [coords, setCoords] = useState<[number, number]>(
    existingAddress?.lat && existingAddress?.lng
      ? [existingAddress.lat, existingAddress.lng]
      : TASHKENT
  )
  const [form, setForm] = useState({
    apartment: existingAddress?.apartment || '',
    intercom: existingAddress?.intercom || '',
    entrance: existingAddress?.entrance || '',
    floor: existingAddress?.floor || '',
  })

  const mapRef = useRef<HTMLDivElement>(null)
  const ymapsRef = useRef<any>(null)
  const reverseGeocodeRef = useRef<((c: [number, number]) => void) | null>(null)

  const btnTop = safeTop > 0 ? `${safeTop}px` : `max(calc(env(safe-area-inset-top) + 28px), 16px)`

  // Clean address parser from Nominatim data
  const formatNominatim = (data: any): string => {
    if (!data?.address) return data?.display_name || ''
    const a = data.address
    const road = a.road || a.pedestrian || a.street || a.neighbourhood || a.suburb || ''
    const house = a.house_number ? ` ${a.house_number}` : ''
    const district = a.city_district || a.district || a.suburb || ''
    const city = a.city || a.town || a.village || 'Ташкент'
    
    if (road) {
      return `${road}${house}${district ? ', ' + district : ''}, ${city}`
    }
    return data.display_name || city
  }

  // Reverse Geocoding
  const reverseGeocode = async (center: [number, number]) => {
    const [lat, lon] = center
    setCoords([lat, lon])
    setIsGeocoding(true)

    // 1. Try Yandex JS API Geocoder (most accurate for Tashkent)
    if (window.ymaps?.geocode) {
      try {
        const res = await window.ymaps.geocode([lat, lon], { results: 1 })
        const obj = res.geoObjects.get(0)
        if (obj) {
          const text = obj.getAddressLine?.() || obj.properties?.get('text') || obj.properties?.get('name')
          if (text) {
            setDetectedAddress(text)
            setIsGeocoding(false)
            return
          }
        }
      } catch (err) {
        console.warn('Ymaps geocode error:', err)
      }
    }

    // 2. Try Nominatim reverse geocode with Accept-Language ru
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'ru' } }
      )
      if (resp.ok) {
        const data = await resp.json()
        const text = formatNominatim(data)
        if (text) {
          setDetectedAddress(text)
          setIsGeocoding(false)
          return
        }
      }
    } catch (err) {
      console.warn('Nominatim reverse error:', err)
    }

    // 3. Fallback
    setIsGeocoding(false)
    if (!detectedAddress) {
      setDetectedAddress(`Ташкент (${lat.toFixed(4)}, ${lon.toFixed(4)})`)
    }
  }

  reverseGeocodeRef.current = reverseGeocode

  // Geolocation trigger
  const locateUser = () => {
    haptic.selection()
    const wa = window.Telegram?.WebApp

    // Telegram Bot API LocationManager
    if (wa?.LocationManager) {
      try {
        wa.LocationManager.init(() => {
          wa.LocationManager.getLocation((data: any) => {
            if (data?.latitude && data?.longitude) {
              const c: [number, number] = [data.latitude, data.longitude]
              setCoords(c)
              ymapsRef.current?.setCenter(c, 16, { duration: 300 })
              reverseGeocode(c)
            }
          })
        })
        return
      } catch (e) {
        console.warn('Telegram LocationManager init error:', e)
      }
    }

    // Browser Geolocation API
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const c: [number, number] = [pos.coords.latitude, pos.coords.longitude]
          setCoords(c)
          ymapsRef.current?.setCenter(c, 16, { duration: 300 })
          reverseGeocode(c)
        },
        (err) => {
          console.warn('Browser geolocation denied or failed:', err)
        },
        { enableHighAccuracy: true, timeout: 8000 }
      )
    }
  }

  // Initialize Map
  useEffect(() => {
    const scriptId = 'yandex-maps-script'
    const existing = document.getElementById(scriptId)

    const initMap = () => {
      if (!window.ymaps) return
      window.ymaps.ready(() => {
        if (!mapRef.current) return

        const initialCenter = coords || TASHKENT

        const map = new window.ymaps.Map(mapRef.current, {
          center: initialCenter,
          zoom: 16,
          controls: [],
        })

        ymapsRef.current = map

        // Hide ugly watermarks
        const hideStyle = document.createElement('style')
        hideStyle.textContent = `
          .ymaps-2-1-79-copyright,
          [class*="ymaps-"][class*="-copyright"],
          [class*="ymaps-"][class*="-logo"],
          [class*="ymaps-"][class*="-gotoymaps"] { display: none !important; }
        `
        document.head.appendChild(hideStyle)

        // Initial geocode
        reverseGeocode(initialCenter)

        // Try getting real location on start if not previously saved
        if (!existingAddress?.street) {
          locateUser()
        }

        // Debounced move end
        let debounceTimer: ReturnType<typeof setTimeout>
        map.events.add('actionend', () => {
          clearTimeout(debounceTimer)
          debounceTimer = setTimeout(() => {
            const center = map.getCenter() as [number, number]
            reverseGeocodeRef.current?.(center)
          }, 350)
        })
      })
    }

    if (existing) {
      if (window.ymaps) initMap()
      else existing.addEventListener('load', initMap)
    } else {
      const script = document.createElement('script')
      script.id = scriptId
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${YANDEX_API_KEY}&lang=ru_RU&load=Map,package.standard,geocode`
      script.async = true
      script.onload = initMap
      document.head.appendChild(script)
    }

    return () => {
      ymapsRef.current?.destroy?.()
      ymapsRef.current = null
    }
  }, [])

  const handleSave = () => {
    haptic.medium()
    const street = (detectedAddress || '').trim() || 'Ташкент'
    const newAddr = {
      id: Date.now().toString(),
      street,
      apartment: form.apartment.trim(),
      intercom: form.intercom.trim(),
      entrance: form.entrance.trim(),
      floor: form.floor.trim(),
      lat: coords[0],
      lng: coords[1],
    }
    setAddress(newAddr)
    addSavedAddress(newAddr)
    navigate(-1)
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white select-none">
      {/* Top Map Viewport */}
      <div className="relative flex-1 w-full overflow-hidden">
        {/* Back Button */}
        <button
          onClick={() => { haptic.light(); navigate(-1) }}
          style={{ top: btnTop }}
          className="absolute left-4 z-20 bg-white/95 backdrop-blur-md rounded-2xl w-11 h-11 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="#1f2937" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Geolocation Button */}
        <button
          onClick={locateUser}
          style={{ top: btnTop }}
          className="absolute right-4 z-20 bg-white/95 backdrop-blur-md rounded-2xl w-11 h-11 flex items-center justify-center shadow-lg active:scale-95 transition-transform text-[#C8102E]"
          title="Моё местоположение"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="4" fill="currentColor" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </button>

        {/* Map Container */}
        <div ref={mapRef} className="w-full h-full bg-gray-100" />

        {/* Center Target Pin */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-10 pointer-events-none flex flex-col items-center">
          <div className="bg-[#C8102E] text-white p-2.5 rounded-2xl shadow-2xl animate-bounce">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </div>
          <div className="w-2 h-2 bg-black/40 rounded-full blur-[1px] mt-0.5" />
        </div>
      </div>

      {/* Floating Bottom Card: Address and Inputs */}
      <div 
        className="bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] px-5 pt-4 z-30 border-t border-gray-100 flex flex-col gap-3"
        style={{ paddingBottom: `max(${safeBottom + 12}px, calc(env(safe-area-inset-bottom) + 12px))` }}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto" />

        {/* Address Header */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              {t('deliveryAddress')}
            </span>
            {isGeocoding && (
              <span className="text-xs text-[#C8102E] font-medium animate-pulse flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-[#C8102E] rounded-full animate-ping" />
                {t('detectingAddress')}
              </span>
            )}
          </div>

          {/* Editable Street Input */}
          <div className="relative">
            <input
              type="text"
              value={detectedAddress}
              onChange={(e) => setDetectedAddress(e.target.value)}
              placeholder="Укажите улицу и дом..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-base font-semibold text-gray-900 outline-none focus:border-[#C8102E] focus:bg-white transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Apt / Floor / Entrance / Intercom */}
        <div className="grid grid-cols-4 gap-2">
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-0.5">{t('apartment')}</label>
            <input
              type="text"
              value={form.apartment}
              onChange={(e) => setForm({ ...form, apartment: e.target.value })}
              placeholder="12"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-gray-900 outline-none focus:border-[#C8102E] text-center"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-0.5">{t('entrance')}</label>
            <input
              type="text"
              value={form.entrance}
              onChange={(e) => setForm({ ...form, entrance: e.target.value })}
              placeholder="1"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-gray-900 outline-none focus:border-[#C8102E] text-center"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-0.5">{t('floor')}</label>
            <input
              type="text"
              value={form.floor}
              onChange={(e) => setForm({ ...form, floor: e.target.value })}
              placeholder="3"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-gray-900 outline-none focus:border-[#C8102E] text-center"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-0.5">{t('intercom')}</label>
            <input
              type="text"
              value={form.intercom}
              onChange={(e) => setForm({ ...form, intercom: e.target.value })}
              placeholder="12K"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-gray-900 outline-none focus:border-[#C8102E] text-center"
            />
          </div>
        </div>

        {/* Confirm Address Button */}
        <button
          onClick={handleSave}
          className="w-full bg-[#C8102E] text-white py-3.5 rounded-2xl font-bold text-base shadow-lg shadow-red-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t('selectThisAddress')}
        </button>
      </div>
    </div>
  )
}
