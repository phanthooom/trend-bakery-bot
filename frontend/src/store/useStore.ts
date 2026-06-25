import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Product {
  id: number
  name: string
  name_uz?: string
  name_en?: string
  description: string
  description_uz?: string
  description_en?: string
  price: number
  image: string
  category: 'home' | 'retail'
}

export interface CartItem extends Product {
  quantity: number
}

export interface Address {
  id?: string
  street: string
  apartment: string
  intercom: string
  entrance: string
  floor: string
  lat?: number
  lng?: number
}

interface Store {
  cart: CartItem[]
  address: Address | null
  savedAddresses: Address[]
  deliveryType: 'delivery' | 'pickup'
  language: 'ru' | 'uz' | 'en'
  phone: string
  addToCart: (product: Product) => void
  removeFromCart: (id: number) => void
  updateQuantity: (id: number, delta: number) => void
  setAddress: (address: Address) => void
  addSavedAddress: (address: Address) => void
  removeSavedAddress: (id: string) => void
  setDeliveryType: (type: 'delivery' | 'pickup') => void
  setLanguage: (lang: 'ru' | 'uz' | 'en') => void
  setPhone: (phone: string) => void
  cartTotal: () => number
  cartCount: () => number
  products: Product[]
  isLoadingProducts: boolean
  fetchProducts: () => Promise<void>
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      cart: [],
      address: null,
      savedAddresses: [],
      deliveryType: 'delivery',
      language: 'ru',
      phone: '+998',
      products: [],
      isLoadingProducts: false,

      fetchProducts: async () => {
        set({ isLoadingProducts: true })
        try {
          const res = await fetch('/api/products')
          const data = await res.json()
          set({ products: data, isLoadingProducts: false })
        } catch (error) {
          console.error('Failed to fetch products', error)
          set({ isLoadingProducts: false })
        }
      },

      addToCart: (product) => {
        set((state) => {
          const existing = state.cart.find((i) => i.id === product.id)
          if (existing) {
            return {
              cart: state.cart.map((i) =>
                i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
              ),
            }
          }
          return { cart: [...state.cart, { ...product, quantity: 1 }] }
        })
      },

      removeFromCart: (id) => {
        set((state) => ({ cart: state.cart.filter((i) => i.id !== id) }))
      },

      updateQuantity: (id, delta) => {
        set((state) => {
          const updated = state.cart
            .map((i) => (i.id === id ? { ...i, quantity: i.quantity + delta } : i))
            .filter((i) => i.quantity > 0)
          return { cart: updated }
        })
      },

      setAddress: (address) => set({ address }),
      addSavedAddress: (address) => set((state) => ({ savedAddresses: [address, ...state.savedAddresses] })),
      removeSavedAddress: (id) => set((state) => {
        const newSaved = state.savedAddresses.filter(a => a.id !== id);
        return {
          savedAddresses: newSaved,
          address: state.address?.id === id ? (newSaved[0] || null) : state.address
        }
      }),
      setDeliveryType: (type) => set({ deliveryType: type }),
      setLanguage: (lang) => set({ language: lang }),
      setPhone: (phone) => set({ phone }),

      cartTotal: () => get().cart.reduce((sum, i) => sum + i.price * i.quantity, 0),
      cartCount: () => get().cart.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: 'trend-bakery-storage',
      // Only persist non-sensitive preferences.
      // savedAddresses (GPS coords), address, phone are session-only
      // to avoid storing PII in plaintext localStorage.
      partialize: (state) => ({
        cart: state.cart,
        deliveryType: state.deliveryType,
        language: state.language,
      }),
    }
  )
)
