import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SafeAreaContext } from './context/SafeAreaContext'
import MenuPage from './pages/MenuPage'
import CartPage from './pages/CartPage'
import ProfilePage from './pages/ProfilePage'
import MapPage from './pages/MapPage'
import BottomNav from './components/BottomNav'

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

  useEffect(() => {
    const wa = (window as unknown as { Telegram?: { WebApp?: TwaExtended } })
      ?.Telegram?.WebApp

    if (!wa) return

    wa.ready?.()
    wa.expand?.()
    wa.requestFullscreen?.()
    wa.disableVerticalSwipes?.()

    const updateSafeArea = () => {
      const top = wa.contentSafeAreaInset?.top ?? wa.safeAreaInset?.top ?? 0
      const bottom = wa.safeAreaInset?.bottom ?? 0
      setSafeTop(top)
      setSafeBottom(bottom)
    }

    updateSafeArea()
    wa.onEvent?.('safeAreaChanged', updateSafeArea)
    wa.onEvent?.('fullscreenChanged', updateSafeArea)

    return () => {
      wa.offEvent?.('safeAreaChanged', updateSafeArea)
      wa.offEvent?.('fullscreenChanged', updateSafeArea)
    }
  }, [])

  return (
    <SafeAreaContext.Provider value={{ top: safeTop, bottom: safeBottom }}>
      <BrowserRouter>
        <Routes>
          <Route path="/map" element={<MapPage />} />
          <Route
            path="*"
            element={
              <>
                <Routes>
                  <Route path="/" element={<MenuPage />} />
                  <Route path="/cart" element={<CartPage />} />
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
