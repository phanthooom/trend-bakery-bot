import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { useSafeArea } from '../context/SafeAreaContext'
import { products } from '../data/products'
import { type Product } from '../store/useStore'
import ProductCard from '../components/ProductCard'
import ProductBottomSheet from '../components/ProductBottomSheet'

export default function MenuPage() {
  const [category, setCategory] = useState<'home' | 'retail'>('home')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const { address, deliveryType, setDeliveryType } = useStore()
  const { top: safeTop } = useSafeArea()
  const navigate = useNavigate()

  const filtered = products.filter((p) => p.category === category)

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
            <span className="font-bold text-gray-900 text-lg">Trend Bakery</span>
          </div>
          <div className="flex gap-3">
            <button className="text-gray-600">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M5 3l14 9-14 9V3z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <text x="4" y="17" fontSize="8" fill="currentColor">A</text>
              </svg>
            </button>
            <button className="text-gray-600">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Delivery row */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/map')}
            className="flex items-center gap-1 text-sm"
          >
            <div>
              <div className="text-gray-500 text-xs">
                {deliveryType === 'delivery' ? 'Доставка (Trend Bakery)' : 'Самовывоз'}
              </div>
              <div className="font-semibold text-gray-900 flex items-center gap-1">
                {address?.street ?? 'Выберите адрес'}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M6 9l6 6 6-6" stroke="#C8102E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </button>

          <select
            value={deliveryType}
            onChange={(e) => setDeliveryType(e.target.value as 'delivery' | 'pickup')}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white"
          >
            <option value="delivery">Доставка</option>
            <option value="pickup">Самовывоз</option>
          </select>
        </div>
      </div>

      <div className="px-4">
        {/* Banner */}
        <div className="mt-4 bg-[#C8102E] rounded-xl p-6 flex flex-col items-center justify-center text-white mb-4">
          <div className="text-2xl font-bold tracking-wide">Trénd Bakery</div>
          <div className="text-sm opacity-80 italic">With love...</div>
        </div>

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
            Для дома
          </button>
          <button
            onClick={() => setCategory('retail')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              category === 'retail'
                ? 'bg-[#C8102E] text-white'
                : 'bg-white text-gray-700 border border-gray-200'
            }`}
          >
            Розничные сети
          </button>
        </div>

        {/* Section title */}
        <h2 className="font-bold text-gray-900 text-lg mb-3">
          {category === 'home' ? 'Для дома' : 'Розничные сети'}
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

      {/* Bottom Sheet Modal */}
      {selectedProduct && (
        <ProductBottomSheet 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
        />
      )}
    </div>
  )
}
