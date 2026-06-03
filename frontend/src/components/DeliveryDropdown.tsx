import { useState, useRef, useEffect } from 'react'

interface Props {
  value: 'delivery' | 'pickup'
  onChange: (val: 'delivery' | 'pickup') => void
}

export default function DeliveryDropdown({ value, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={ref}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 border border-gray-200 bg-gray-50 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
      >
        {value === 'delivery' ? 'Доставка' : 'Самовывоз'}
        <div className="flex flex-col gap-0.5 text-gray-400">
          <svg width="8" height="5" viewBox="0 0 12 8" fill="none">
            <path d="M1 7L6 2L11 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <svg width="8" height="5" viewBox="0 0 12 8" fill="none">
            <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-44 bg-[#6A2B33] rounded-2xl shadow-xl overflow-hidden z-50 animate-fade-in origin-top-right border border-white/10">
          <button
            onClick={() => { onChange('delivery'); setIsOpen(false) }}
            className="w-full text-left px-4 py-3.5 text-[15px] text-white flex items-center gap-2 transition-colors hover:bg-white/10 active:bg-white/20"
          >
            <span className="w-5 flex justify-center">
              {value === 'delivery' && (
                <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                  <path d="M1 5L5 9L13 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <span className={value === 'delivery' ? 'font-medium' : 'text-white/90'}>
              Доставка
            </span>
          </button>
          
          <div className="h-[1px] bg-white/20 mx-4" />
          
          <button
            onClick={() => { onChange('pickup'); setIsOpen(false) }}
            className="w-full text-left px-4 py-3.5 text-[15px] text-white flex items-center gap-2 transition-colors hover:bg-white/10 active:bg-white/20"
          >
            <span className="w-5 flex justify-center">
              {value === 'pickup' && (
                <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                  <path d="M1 5L5 9L13 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <span className={value === 'pickup' ? 'font-medium' : 'text-white/90'}>
              Самовывоз
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
