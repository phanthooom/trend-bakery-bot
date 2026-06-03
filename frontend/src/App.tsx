import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SafeAreaContext } from './context/SafeAreaContext'
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
  disableVerticalSwipes?: () => void
  isFullscreen?: boolean
  safeAreaInset?: { top?: number; bottom?: number }
  contentSafeAreaInset?: { top?: number; bottom?: number }
  onEvent?: (event: string, cb: () => void) => void
  offEvent?: (event: string, cb: () => void) => void
}

export default function App() {
  const [safeTop, setSafeTop] = useState(0)
  const [safeBottom, setSafeBottom] = useState(0)
  const [showServiceModal, setShowServiceModal] = useState(
    () => !localStorage.getItem('tb_service_selected')
  )

  useEffect(() => {
    const wa = (window as unknown as { Telegram?: { WebApp?: TwaExtended } })
      ?.Telegram?.WebApp

    if (!wa) return

    try {
      wa.ready?.()
      wa.expand?.()
    } catch (e) {}

    try {
      wa.requestFullscreen?.()
    } catch (e) {}

    try {
      wa.disableVerticalSwipes?.()
    } catch (e) {}

    const updateSafeArea = () => {
      try {
        const contentTop = wa.contentSafeAreaInset?.top ?? 0
        const systemTop = wa.safeAreaInset?.top ?? 0
        const top = contentTop + systemTop
        const bottom = wa.safeAreaInset?.bottom ?? 0
        setSafeTop(top)
        setSafeBottom(bottom)
        document.documentElement.style.setProperty('--safe-top', `${top}px`)
        document.documentElement.style.setProperty('--safe-bottom', `${bottom}px`)
      } catch (e) {}
    }

    updateSafeArea()
    const t1 = setTimeout(updateSafeArea, 150)
    const t2 = setTimeout(updateSafeArea, 500)
    const t3 = setTimeout(updateSafeArea, 1200)

    try {
      wa.onEvent?.('safeAreaChanged', updateSafeArea)
      wa.onEvent?.('fullscreenChanged', updateSafeArea)
    } catch (e) {}

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      try {
        wa.offEvent?.('safeAreaChanged', updateSafeArea)
        wa.offEvent?.('fullscreenChanged', updateSafeArea)
      } catch (e) {}
    }
  }, [])

  return (
    <SafeAreaContext.Provider value={{ top: safeTop, bottom: safeBottom }}>
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
