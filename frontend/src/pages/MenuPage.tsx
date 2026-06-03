import { useState } from 'react'
import { useStore } from '../store/useStore'
import { useSafeArea } from '../context/SafeAreaContext'
import { products } from '../data/products'
import { type Product } from '../store/useStore'
import ProductCard from '../components/ProductCard'
import ProductBottomSheet from '../components/ProductBottomSheet'
import DeliveryDropdown from '../components/DeliveryDropdown'
import LanguageDropdown from '../components/LanguageDropdown'
import AddressesBottomSheet from '../components/AddressesBottomSheet'
import { useTranslation } from '../i18n'

declare global {
  interface Window {
    Telegram?: any
  }
}

export default function MenuPage() {
  const [category, setCategory] = useState<'home' | 'retail'>('home')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isAddressesOpen, setIsAddressesOpen] = useState(false)
  const { address, deliveryType, setDeliveryType } = useStore()
  const { top: safeTop } = useSafeArea()
  const { t } = useTranslation()

  const filtered = products.filter((p) => {
    const matchesCategory = p.category === category
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="flex flex-col min-h-screen bg-white pb-20">
      {/* Header */}
      <div
        className="px-4 pb-2 bg-white sticky top-0 z-40 border-b border-gray-100"
        style={{ paddingTop: `max(${safeTop + 12}px, calc(env(safe-area-inset-top) + 12px))` }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Trend Bakery"
              className="w-10 h-10 rounded-full object-cover"
              onError={(e) => {
                const t = e.target as HTMLImageElement
                t.style.display = 'none'
              }}
            />
            <span className="font-bold text-gray-900 text-lg">Trend 🥨 Bakery</span>
          </div>
          <div className="flex gap-2">
            <LanguageDropdown />
            <button 
              onClick={() => {
                setIsSearchOpen(!isSearchOpen)
                if (isSearchOpen) setSearchQuery('') // Clear search on close
              }}
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                isSearchOpen 
                  ? 'bg-[#C8102E] text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50 active:bg-gray-100'
              }`}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Animated Search Bar */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isSearchOpen ? 'max-h-16 opacity-100 mb-3' : 'max-h-0 opacity-0 m-0'}`}>
          <div className="relative">
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search')}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-10 text-[15px] outline-none focus:border-[#C8102E] focus:bg-white transition-all shadow-sm"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Delivery row */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsAddressesOpen(true)}
            className="flex items-center gap-1 text-sm text-left max-w-[65%]"
          >
            <div className="w-full">
              <div className="text-gray-500 text-xs truncate">
                {deliveryType === 'delivery' ? t('deliveryTrend') : t('pickup')}
              </div>
              <div className="font-semibold text-gray-900 flex items-center gap-1">
                <span className="truncate">{address?.street ?? t('chooseAddress')}</span>
                <svg className="shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M6 9l6 6 6-6" stroke="#C8102E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </button>

          <DeliveryDropdown
            value={deliveryType}
            onChange={(val) => setDeliveryType(val)}
          />
        </div>
      </div>

      <div className="px-4">
        {/* Banner */}
        <button 
          onClick={() => {
            try {
              window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light')
              navigator.vibrate?.(50)
              if (window.Telegram?.WebApp?.openLink) {
                window.Telegram.WebApp.openLink('https://www.instagram.com/trendbakery.uzb/')
              } else {
                window.open('https://www.instagram.com/trendbakery.uzb/', '_blank')
              }
            } catch (e) {
              window.open('https://www.instagram.com/trendbakery.uzb/', '_blank')
            }
          }}
          className="w-full mt-4 bg-[#C8102E] rounded-xl p-6 flex flex-col items-center justify-center text-white mb-4 active:scale-[0.98] transition-transform shadow-sm"
        >
          <div className="text-3xl mb-1">🥐</div>
          <div className="text-2xl font-bold tracking-wide">Trénd Bakery</div>
          <div className="text-sm opacity-90 italic font-light mt-0.5">With love...</div>
        </button>

        {/* Category tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setCategory('home')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              category === 'home'
                ? 'bg-[#C8102E] text-white'
                : 'bg-white text-gray-700 border border-gray-200'
            }`}
          >
            {t('home')}
          </button>
          <button
            onClick={() => setCategory('retail')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              category === 'retail'
                ? 'bg-[#C8102E] text-white'
                : 'bg-white text-gray-700 border border-gray-200'
            }`}
          >
            {t('retail')}
          </button>
        </div>

        {/* Section title */}
        <h2 className="font-bold text-gray-900 text-lg mb-3">
          {category === 'home' ? t('home') : t('retail')}
        </h2>

        {/* Products */}
        {filtered.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product} 
            onImageClick={(p) => setSelectedProduct(p)}
          />
        ))}
      </div>

      {/* Product Bottom Sheet */}
      {selectedProduct && (
        <ProductBottomSheet 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
        />
      )}

      {/* Addresses Bottom Sheet */}
      {isAddressesOpen && (
        <AddressesBottomSheet onClose={() => setIsAddressesOpen(false)} />
      )}
    </div>
  )
}
