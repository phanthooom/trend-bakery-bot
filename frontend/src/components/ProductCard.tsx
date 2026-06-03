import { useState } from 'react'
import { type Product } from '../store/useStore'
import { useStore } from '../store/useStore'

interface Props {
  product: Product
  onImageClick?: (product: Product) => void
}

export default function ProductCard({ product, onImageClick }: Props) {
  const { addToCart, updateQuantity, cart } = useStore()
  const [imgError, setImgError] = useState(false)

  const cartItem = cart.find((i) => i.id === product.id)
  const quantity = cartItem?.quantity ?? 0

  const formatPrice = (price: number) =>
    price.toLocaleString('ru-RU') + ' сум'

  return (
    <div className="bg-white mb-4">
      <img
        src={imgError ? '/bread-placeholder.jpg' : product.image}
        alt={product.name}
        onError={() => setImgError(true)}
        onClick={() => onImageClick?.(product)}
        className="w-full h-52 object-cover rounded-lg cursor-pointer active:opacity-80 transition-opacity"
      />
      <div className="pt-3">
        <h3 className="font-semibold text-gray-900 text-base">{product.name}</h3>
        <p className="text-gray-500 text-sm mt-1 line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="font-bold text-gray-900 text-base">{formatPrice(product.price)}</span>
          {quantity === 0 ? (
            <button
              onClick={() => addToCart(product)}
              className="w-9 h-9 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-500 text-xl font-light hover:border-[#C8102E] hover:text-[#C8102E] transition-colors"
            >
              +
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => updateQuantity(product.id, -1)}
                className="w-9 h-9 rounded-full bg-[#C8102E] text-white flex items-center justify-center text-xl font-light"
              >
                −
              </button>
              <span className="font-bold text-gray-900 w-5 text-center">{quantity}</span>
              <button
                onClick={() => updateQuantity(product.id, 1)}
                className="w-9 h-9 rounded-full bg-[#C8102E] text-white flex items-center justify-center text-xl font-light"
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
