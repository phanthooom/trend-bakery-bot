import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { useTranslation } from '../i18n'

interface Props {
  onClose: () => void
}

export default function AddressesBottomSheet({ onClose }: Props) {
  const { address: activeAddress, savedAddresses, setAddress, removeSavedAddress } = useStore()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isClosing, setIsClosing] = useState(false)

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(onClose, 300)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div 
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`} 
        onClick={handleClose} 
      />
      <div 
        className={`relative bg-white w-full rounded-t-[24px] flex flex-col max-h-[90vh] transition-transform duration-300 ${isClosing ? 'translate-y-full' : 'translate-y-0'}`}
      >
        <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
          <h2 className="text-[22px] font-medium text-gray-900">{t('myAddresses')}</h2>
          <button 
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 active:bg-gray-200 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M1 13L13 1M1 1l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-2">
          {savedAddresses.map((addr) => {
            const isActive = activeAddress?.id === addr.id
            return (
              <div key={addr.id} className="py-4 border-b border-gray-100 flex items-center gap-4">
                <div 
                  className="flex-1 flex items-start gap-3 cursor-pointer"
                  onClick={() => {
                    setAddress(addr)
                    handleClose()
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={`mt-0.5 ${isActive ? 'text-[#C8102E]' : 'text-gray-900'}`}>
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
                  </svg>
                  <div>
                    <h3 className={`text-[17px] leading-tight ${isActive ? 'text-[#C8102E]' : 'text-gray-900'}`}>
                      {addr.street}
                    </h3>
                    <p className="text-sm text-gray-400 mt-0.5 line-clamp-1">
                      {addr.street}{addr.apartment ? `, кв/офис ${addr.apartment}` : ''}
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    removeSavedAddress(addr.id!)
                  }}
                  className="p-2 text-[#C8102E] opacity-80 hover:opacity-100 active:bg-red-50 rounded-lg transition-colors"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            )
          })}
          {savedAddresses.length === 0 && (
            <div className="py-8 text-center text-gray-400">
              Нет сохраненных адресов
            </div>
          )}
        </div>

        <div className="p-5 pb-8 pt-4">
          <button
            onClick={() => {
              handleClose()
              setTimeout(() => navigate('/map'), 300)
            }}
            className="w-full bg-[#C8102E] text-white py-4 rounded-xl font-bold text-base active:bg-[#a00c24] transition-colors"
          >
            {t('addNewAddress')}
          </button>
        </div>
      </div>
    </div>
  )
}
