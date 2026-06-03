import { useState } from 'react'
import { type Product } from '../store/useStore'
import { useStore } from '../store/useStore'

interface Props {
  product: Product
  onClose: () => void
}

export default function ProductBottomSheet({ product, onClose }: Props) {
  const { addToCart, updateQuantity, cart } = useStore()
  const [imgError, setImgError] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  const cartItem = cart.find((i) => i.id === product.id)
  const quantity = cartItem?.quantity ?? 0

  const formatPrice = (price: number) => price.toLocaleString('ru-RU') + ' сум'

  // Handle closing with animation
  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
    }, 300) // matches animation duration
  }

  // Handle click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  return (
    <div 
      className={`fixed inset-0 z-[60] flex items-end justify-center ${isClosing ? 'opacity-0 transition-opacity duration-300' : 'animate-fade-in'}`}
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Sheet Content */}
      <div 
        className={`relative w-full max-w-md bg-white rounded-t-3xl pt-2 pb-8 flex flex-col max-h-[90vh] ${isClosing ? 'translate-y-full transition-transform duration-300' : 'animate-slide-up'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar for swiping (visual only) */}
        <div className="w-full flex justify-center py-2" onClick={handleClose}>
          <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
        </div>

        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 z-10"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="overflow-y-auto px-5 pb-5 min-h-0 shrink">
          {/* Product Image */}
          <img
            src={imgError ? '/bread-placeholder.jpg' : product.image}
            alt={product.name}
            onError={() => setImgError(true)}
            className="w-full h-64 object-cover rounded-2xl mb-5"
          />

          {/* Product Info */}
          <h2 className="font-bold text-gray-900 text-2xl mb-4">{product.name}</h2>
          <div className="text-gray-600 text-sm leading-relaxed mb-6 space-y-1">
            {product.description.split('\n').map((line, i) => {
              const trimmed = line.trim();
              if (!trimmed) return null;
              
              // Total count logic
              if (trimmed.toLowerCase().includes('общее количество') || trimmed.toLowerCase().includes('итого')) {
                return <p key={i} className="font-bold text-[#C8102E] mt-4 uppercase text-center text-sm">{trimmed}</p>
              }
              
              // List items logic
              if (/^\d+\./.test(trimmed)) {
                const dotIndex = trimmed.indexOf('.');
                const number = trimmed.substring(0, dotIndex + 1);
                const text = trimmed.substring(dotIndex + 1).trim();
                return (
                  <p key={i} className="flex gap-2 text-[15px] font-medium text-[#C8102E]">
                    <span className="font-bold shrink-0">{number}</span> 
                    <span>{text}</span>
                  </p>
                )
              }
              
              // Default paragraph
              return <p key={i} className="text-base text-gray-500">{trimmed}</p>
            })}
          </div>

          {/* Price and Cart Controls */}
          <div className="flex items-center justify-between mt-auto pt-2">
            <div className="flex flex-col">
              <span className="text-sm text-gray-500">Стоимость</span>
              <span className="font-bold text-gray-900 text-2xl">{formatPrice(product.price)}</span>
            </div>
            
            {quantity === 0 ? (
              <button
                onClick={() => addToCart(product)}
                className="bg-[#C8102E] text-white px-8 py-3 rounded-2xl font-bold text-base hover:bg-[#a00d24] transition-colors"
              >
                В корзину
              </button>
            ) : (
              <div className="flex items-center gap-4 bg-gray-100 p-1.5 rounded-2xl">
                <button
                  onClick={() => updateQuantity(product.id, -1)}
                  className="w-10 h-10 rounded-xl bg-white text-[#C8102E] shadow-sm flex items-center justify-center text-2xl font-medium"
                >
                  −
                </button>
                <span className="font-bold text-gray-900 w-6 text-center text-lg">{quantity}</span>
                <button
                  onClick={() => updateQuantity(product.id, 1)}
                  className="w-10 h-10 rounded-xl bg-[#C8102E] text-white shadow-sm flex items-center justify-center text-2xl font-medium"
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
