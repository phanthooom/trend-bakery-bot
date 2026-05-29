import { createContext, useContext } from 'react'

export const SafeAreaContext = createContext({ top: 0, bottom: 0 })
export const useSafeArea = () => useContext(SafeAreaContext)
