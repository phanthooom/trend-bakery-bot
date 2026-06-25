import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { useTranslation } from '../i18n'
import { haptic } from '../utils/haptic'

interface Props {
  onClose: () => void
}

export default function AddressesBottomSheet({ onClose }: Props) {
  const { address: activeAddress, savedAddresses, setAddress, removeSavedAddress } = useStore()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  // Enter animation
  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Lock body scroll while sheet is open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const handleClose = () => {
    haptic.light()
    setOpen(false)
    setTimeout(onClose, 320)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black"
        style={{ opacity: open ? 0.45 : 0, transition: 'opacity 320ms ease' }}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        className="relative bg-white w-full flex flex-col"
        style={{
          borderRadius: '24px 24px 0 0',
          maxHeight: '70vh',
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 320ms cubic-bezier(0.32, 0.72, 0, 1)',
          willChange: 'transform',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 py-3 flex items-center justify-between border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{t('myAddresses')}</h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 active:bg-gray-200 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M1 13L13 1M1 1l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Address list */}
        <div className="overflow-y-auto flex-1 px-5">
          {savedAddresses.map((addr) => {
            const isActive = activeAddress?.id === addr.id
            return (
              <div key={addr.id} className="py-4 border-b border-gray-100 flex items-center gap-3">
                <div
                  className="flex-1 flex items-start gap-3 cursor-pointer active:opacity-70 transition-opacity"
                  onClick={() => { haptic.selection(); setAddress(addr); handleClose() }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                    className={`mt-0.5 flex-shrink-0 ${isActive ? 'text-[#C8102E]' : 'text-gray-400'}`}>
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor" />
                  </svg>
                  <div>
                    <p className={`text-base leading-tight font-medium ${isActive ? 'text-[#C8102E]' : 'text-gray-900'}`}>
                      {addr.street}
                    </p>
                    {addr.apartment && (
                      <p className="text-sm text-gray-400 mt-0.5">кв/офис {addr.apartment}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); haptic.light(); removeSavedAddress(addr.id!) }}
                  className="p-2 text-[#C8102E] opacity-70 hover:opacity-100 active:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"
                      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            )
          })}
          {savedAddresses.length === 0 && (
            <p className="py-10 text-center text-gray-400 text-sm">Нет сохранённых адресов</p>
          )}
        </div>

        {/* Add button */}
        <div className="p-4 pb-6">
          <button
            onClick={() => { haptic.medium(); handleClose(); setTimeout(() => navigate('/map'), 320) }}
            className="w-full bg-[#C8102E] text-white py-4 rounded-2xl font-bold text-base active:scale-[0.98] transition-transform"
          >
            {t('addNewAddress')}
          </button>
        </div>
      </div>
    </div>
  )
}
