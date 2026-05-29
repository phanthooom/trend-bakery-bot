import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import WebApp from '@twa-dev/sdk'
import MenuPage from './pages/MenuPage'
import CartPage from './pages/CartPage'
import ProfilePage from './pages/ProfilePage'
import MapPage from './pages/MapPage'
import BottomNav from './components/BottomNav'

export default function App() {
  useEffect(() => {
    try {
      WebApp.ready()
      WebApp.expand()
      if (WebApp.isVersionAtLeast('8.0')) {
        WebApp.requestFullscreen()
      }
      WebApp.setHeaderColor('#ffffff')
      WebApp.setBackgroundColor('#ffffff')
    } catch {
      // running outside Telegram — ignore SDK calls
    }
  }, [])

  return (
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
  )
}
