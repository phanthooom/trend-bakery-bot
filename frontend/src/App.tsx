import { useEffect, useState, useCallback, useRef } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SafeAreaContext, type SafeAreaData } from './context/SafeAreaContext'
import MenuPage from './pages/MenuPage'
import CartPage from './pages/CartPage'
import ProfilePage from './pages/ProfilePage'
import MapPage from './pages/MapPage'
import CheckoutPage from './pages/CheckoutPage'
import { AdminPage } from './pages/AdminPage'
import BottomNav from './components/BottomNav'
import ServiceTypeModal from './components/ServiceTypeModal'

type TwaExtended = {
  ready?: () => void
  expand?: () => void
  requestFullscreen?: () => void
  exitFullscreen?: () => void
  disableVerticalSwipes?: () => void
  isFullscreen?: boolean
  version?: string
  isVersionAtLeast?: (v: string) => boolean
  safeAreaInset?: { top?: number; bottom?: number; left?: number; right?: number }
  contentSafeAreaInset?: { top?: number; bottom?: number; left?: number; right?: number }
  setHeaderColor?: (color: string) => void
  setBackgroundColor?: (color: string) => void
  onEvent?: (event: string, cb: (...args: any[]) => void) => void
  offEvent?: (event: string, cb: (...args: any[]) => void) => void
  initData?: string
}

export default function App() {
  const [insets, setInsets] = useState<SafeAreaData>({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    isFullscreen: false,
    canFullscreen: false,
    requestFullscreen: () => {},
  })

  const [showServiceModal, setShowServiceModal] = useState(
    () => !localStorage.getItem('tb_service_selected')
  )

  const hasRequestedFs = useRef(false)

  const calculateInsets = useCallback((): SafeAreaData => {
    const wa = (window as unknown as { Telegram?: { WebApp?: TwaExtended } })?.Telegram?.WebApp
    const isFullscreen = Boolean(wa?.isFullscreen)
    const canFullscreen = typeof wa?.requestFullscreen === 'function'

    const contentTop = Number(wa?.contentSafeAreaInset?.top) || 0
    const systemTop = Number(wa?.safeAreaInset?.top) || 0
    const contentBottom = Number(wa?.contentSafeAreaInset?.bottom) || 0
    const systemBottom = Number(wa?.safeAreaInset?.bottom) || 0
    const contentRight = Number(wa?.contentSafeAreaInset?.right) || 0
    const systemRight = Number(wa?.safeAreaInset?.right) || 0
    const contentLeft = Number(wa?.contentSafeAreaInset?.left) || 0
    const systemLeft = Number(wa?.safeAreaInset?.left) || 0

    // Top inset calculation:
    // When in fullscreen, Telegram capsules (Close/Menu) and the device notch/Dynamic Island
    // require at least 52-58px of top clearance so headers NEVER collide or overlap.
    let top = 0
    if (contentTop > 0) {
      // Content safe area provided by Bot API 8.0 clears both device chrome and Telegram buttons
      top = contentTop
    } else if (systemTop > 0) {
      top = isFullscreen ? Math.max(systemTop + 8, 54) : systemTop
    } else if (isFullscreen) {
      top = 54 // Safe default for dynamic island / notch + floating controls
    } else {
      const isInsideTelegram = Boolean(wa?.initData || wa?.version)
      top = isInsideTelegram ? 14 : 0
    }

    const bottom = Math.max(contentBottom, systemBottom, 0)
    const right = Math.max(contentRight, systemRight, 0)
    const left = Math.max(contentLeft, systemLeft, 0)

    const requestFs = () => {
      if (wa && typeof wa.requestFullscreen === 'function') {
        try {
          wa.requestFullscreen()
        } catch (e) {
          console.warn('requestFullscreen error:', e)
        }
      }
    }

    return {
      top,
      bottom,
      left,
      right,
      isFullscreen,
      canFullscreen,
      requestFullscreen: requestFs,
    }
  }, [])

  useEffect(() => {
    const wa = (window as unknown as { Telegram?: { WebApp?: TwaExtended } })?.Telegram?.WebApp
    if (!wa) return

    try { wa.ready?.() } catch (e) {}
    try { wa.expand?.() } catch (e) {}
    try { wa.disableVerticalSwipes?.() } catch (e) {}
    try { wa.setHeaderColor?.('#ffffff') } catch (e) {}
    try { wa.setBackgroundColor?.('#ffffff') } catch (e) {}

    const applyInsets = () => {
      const data = calculateInsets()
      setInsets(data)
      document.documentElement.style.setProperty('--safe-top', `${data.top}px`)
      document.documentElement.style.setProperty('--safe-bottom', `${data.bottom}px`)
      document.documentElement.style.setProperty('--safe-left', `${data.left}px`)
      document.documentElement.style.setProperty('--safe-right', `${data.right}px`)
    }

    // Attempt fullscreen activation
    const tryEnterFullscreen = () => {
      try {
        wa.expand?.()
        if (typeof wa.requestFullscreen === 'function' && !wa.isFullscreen) {
          wa.requestFullscreen()
        }
      } catch (e) {}
    }

    tryEnterFullscreen()
    const fsTimer1 = setTimeout(tryEnterFullscreen, 200)
    const fsTimer2 = setTimeout(tryEnterFullscreen, 600)
    const fsTimer3 = setTimeout(tryEnterFullscreen, 1200)

    // User gesture fallback: If client enforces user interaction for fullscreen,
    // the very first tap anywhere on screen will enter fullscreen.
    const onUserInteraction = () => {
      if (!hasRequestedFs.current) {
        hasRequestedFs.current = true
        tryEnterFullscreen()
        applyInsets()
      }
    }
    window.addEventListener('pointerdown', onUserInteraction, { passive: true })
    window.addEventListener('touchstart', onUserInteraction, { passive: true })

    applyInsets()
    const t1 = setTimeout(applyInsets, 100)
    const t2 = setTimeout(applyInsets, 350)
    const t3 = setTimeout(applyInsets, 800)
    const t4 = setTimeout(applyInsets, 1500)

    // Event listeners
    wa.onEvent?.('safeAreaChanged', applyInsets)
    wa.onEvent?.('contentSafeAreaChanged', applyInsets)
    wa.onEvent?.('fullscreenChanged', applyInsets)
    wa.onEvent?.('fullscreenFailed', (err: any) => {
      console.warn('Fullscreen failed event:', err)
      applyInsets()
    })
    wa.onEvent?.('viewportChanged', applyInsets)

    return () => {
      clearTimeout(fsTimer1)
      clearTimeout(fsTimer2)
      clearTimeout(fsTimer3)
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
      window.removeEventListener('pointerdown', onUserInteraction)
      window.removeEventListener('touchstart', onUserInteraction)
      try {
        wa.offEvent?.('safeAreaChanged', applyInsets)
        wa.offEvent?.('contentSafeAreaChanged', applyInsets)
        wa.offEvent?.('fullscreenChanged', applyInsets)
        wa.offEvent?.('viewportChanged', applyInsets)
      } catch (e) {}
    }
  }, [calculateInsets])

  return (
    <SafeAreaContext.Provider value={insets}>
      <BrowserRouter>
        {showServiceModal && (
          <ServiceTypeModal onClose={() => setShowServiceModal(false)} />
        )}
        <Routes>
          <Route path="/map" element={<MapPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route
            path="*"
            element={
              <>
                <Routes>
                  <Route path="/" element={<MenuPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                </Routes>
                <BottomNav />
              </>
            }
          />
        </Routes>
      </BrowserRouter>
    </SafeAreaContext.Provider>
  )
}
