import { useState, useEffect } from 'react'
import { type Product, useStore } from '../store/useStore'
import { useTranslation } from '../i18n'
import { haptic } from '../utils/haptic'

interface Props {
  product: Product
  onClose: () => void
}

export default function ProductBottomSheet({ product, onClose }: Props) {
  const { addToCart, updateQuantity, cart } = useStore()
  const { t } = useTranslation()
  const [imgError, setImgError] = useState(false)
  // Controls CSS transition: false = off-screen, true = on-screen
  const [open, setOpen] = useState(false)

  const cartItem = cart.find((i) => i.id === product.id)
  const quantity = cartItem?.quantity ?? 0

  const formatPrice = (p: number) => p.toLocaleString('ru-RU') + ' сум'

  // Trigger enter animation on next frame after mount
  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const handleClose = () => {
    haptic.light()
    setOpen(false)
    setTimeout(onClose, 320)
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
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black"
        style={{
          opacity: open ? 0.45 : 0,
          transition: 'opacity 320ms ease',
        }}
        onClick={handleClose}
      />

      {/* Sheet — ~60% screen height */}
      <div
        className="relative w-full max-w-lg bg-white flex flex-col"
        style={{
          height: '62vh',
          borderRadius: '24px 24px 0 0',
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 320ms cubic-bezier(0.32, 0.72, 0, 1)',
          willChange: 'transform',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex-shrink-0 flex flex-col items-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 z-10"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 pb-2 min-h-0">
          {/* Image */}
          <img
            src={imgError ? '/bread-placeholder.jpg' : product.image}
            alt={product.name}
            onError={() => setImgError(true)}
            className="w-full h-44 object-cover rounded-2xl mb-4"
          />

          {/* Name */}
          <h2 className="font-bold text-gray-900 text-xl mb-3 leading-snug">{product.name}</h2>

          {/* Description */}
          <div className="text-sm leading-relaxed space-y-1 text-left">
            {product.description.split('\n').map((line, i) => {
              const s = line.trim()
              if (!s) return null
              if (s.toLowerCase().includes('общее количество') || s.toLowerCase().includes('итого')) {
                return <p key={i} className="font-bold text-[#C8102E] mt-3 uppercase text-xs tracking-wide">{s}</p>
              }
              if (/^\d+\./.test(s)) {
                const dot = s.indexOf('.')
                return (
                  <p key={i} className="flex gap-2 text-sm font-medium text-[#C8102E]">
                    <span className="font-bold shrink-0">{s.slice(0, dot + 1)}</span>
                    <span>{s.slice(dot + 1).trim()}</span>
                  </p>
                )
              }
              return <p key={i} className="text-gray-500">{s}</p>
            })}
          </div>
        </div>

        {/* Price + Cart — pinned bottom */}
        <div className="flex-shrink-0 px-5 py-4 border-t border-gray-100 bg-white flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400">Стоимость</span>
            <p className="font-bold text-gray-900 text-xl leading-tight">{formatPrice(product.price)}</p>
          </div>

          {quantity === 0 ? (
            <button
              onClick={handleAdd}
              className="bg-[#C8102E] text-white font-semibold py-3 px-7 rounded-2xl active:scale-95 transition-transform shadow-sm"
            >
              {t('addToCart')}
            </button>
          ) : (
            <div className="flex items-center gap-3 bg-gray-100 p-1.5 rounded-2xl">
              <button
                onClick={handleDec}
                className="w-10 h-10 rounded-xl bg-white text-[#C8102E] shadow-sm flex items-center justify-center text-2xl font-medium active:scale-90 transition-transform"
              >
                −
              </button>
              <span className="font-bold text-gray-900 w-6 text-center text-lg">{quantity}</span>
              <button
                onClick={handleInc}
                className="w-10 h-10 rounded-xl bg-[#C8102E] text-white shadow-sm flex items-center justify-center text-2xl font-medium active:scale-90 transition-transform"
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
