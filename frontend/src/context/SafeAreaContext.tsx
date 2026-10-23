import { createContext, useContext } from 'react'

export interface SafeAreaData {
  top: number
  bottom: number
  left: number
  right: number
  isFullscreen: boolean
  canFullscreen: boolean
  requestFullscreen: () => void
}

export const SafeAreaContext = createContext<SafeAreaData>({
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  isFullscreen: false,
  canFullscreen: false,
  requestFullscreen: () => {},
})

export const useSafeArea = () => useContext(SafeAreaContext)
