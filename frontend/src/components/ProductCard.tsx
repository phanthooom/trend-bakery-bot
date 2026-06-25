import { useState } from 'react'
import { useTranslation } from '../i18n'
import { type Product, useStore } from '../store/useStore'
import { haptic } from '../utils/haptic'

interface Props {
  product: Product
  onImageClick?: (product: Product) => void
}

export default function ProductCard({ product, onImageClick }: Props) {
  const { addToCart, updateQuantity, cart } = useStore()
  const [imgError, setImgError] = useState(false)
  const { t } = useTranslation()

  const cartItem = cart.find((i) => i.id === product.id)
  const quantity = cartItem?.quantity ?? 0

  const formatPrice = (price: number) =>
    price.toLocaleString('ru-RU') + ' ' + t('currency')

  const handleImageClick = () => {
    haptic.light()
    onImageClick?.(product)
  }

  const handleAdd = () => {
    haptic.medium()
    addToCart(product)
  }

  const handleInc = () => {
    haptic.light()
    updateQuantity(product.id, 1)
  }

  const handleDec = () => {
    haptic.light()
    updateQuantity(product.id, -1)
  }

  return (
    <div className="bg-white mb-4">
      <img
        src={imgError ? 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80' : product.image}
        alt={product.name}
        onError={() => setImgError(true)}
        onClick={handleImageClick}
        className="w-full h-52 object-cover rounded-lg cursor-pointer active:opacity-75 transition-opacity"
      />
      <div className="pt-3">
        <h3 className="font-semibold text-gray-900 text-base">{product.name}</h3>
        <p className="text-gray-500 text-sm mt-1 line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="font-bold text-gray-900 text-base">{formatPrice(product.price)}</span>
          {quantity === 0 ? (
            <button
              onClick={handleAdd}
              className="bg-[#C8102E] text-white text-sm font-semibold py-1.5 px-4 rounded-full active:scale-95 transition-transform shadow-sm"
            >
              {t('add')}
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={handleDec}
                className="w-9 h-9 rounded-full bg-[#C8102E] text-white flex items-center justify-center text-xl font-light active:scale-90 transition-transform"
              >
                −
              </button>
              <span className="font-bold text-gray-900 w-5 text-center">{quantity}</span>
              <button
                onClick={handleInc}
                className="w-9 h-9 rounded-full bg-[#C8102E] text-white flex items-center justify-center text-xl font-light active:scale-90 transition-transform"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
