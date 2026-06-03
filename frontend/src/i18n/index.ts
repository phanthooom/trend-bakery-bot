import { useStore } from '../store/useStore'

const translations = {
  ru: {
    home: 'Для дома',
    retail: 'Розничные сети',
    delivery: 'Доставка',
    pickup: 'Самовывоз',
    deliveryTrend: 'Доставка (Trend Bakery)',
    chooseAddress: 'Выберите адрес',
    search: 'Поиск...',
    add: 'Добавить',
    addToCart: 'В корзину',
    menu: 'Меню',
    cart: 'Корзина',
    profile: 'Профиль',
    total: 'Итого',
    checkout: 'Оформить заказ',
    currency: 'сум',
    myAddresses: 'Мои адреса',
    addNewAddress: 'Добавить новый адрес',
    phone: 'Номер телефона',
    paymentMethod: 'Способ оплаты',
    cash: 'Наличными',
    card: 'Картой',
    comment: 'Комментарий к заказу',
    commentPlaceholder: 'Например: не звонить в дверь, спит ребенок...',
  },
  uz: {
    home: 'Uy uchun',
    retail: 'Chakana savdo',
    delivery: 'Yetkazib berish',
    pickup: 'Olib ketish',
    deliveryTrend: 'Yetkazib berish (Trend Bakery)',
    chooseAddress: 'Manzilni tanlang',
    search: 'Qidirish...',
    add: 'Qo\'shish',
    addToCart: 'Savatga',
    menu: 'Menyu',
    cart: 'Savat',
    profile: 'Profil',
    total: 'Jami',
    checkout: 'Buyurtma berish',
    currency: "so'm",
    myAddresses: 'Mening manzillarim',
    addNewAddress: 'Yangi manzil qo\'shish',
    phone: 'Telefon raqami',
    paymentMethod: 'To\'lov usuli',
    cash: 'Naqd pul',
    card: 'Karta orqali',
    comment: 'Buyurtmaga izoh',
    commentPlaceholder: 'Masalan: eshikni qo\'ng\'iroq qilmang...',
  },
  en: {
    home: 'For Home',
    retail: 'Retail',
    delivery: 'Delivery',
    pickup: 'Pickup',
    deliveryTrend: 'Delivery (Trend Bakery)',
    chooseAddress: 'Choose address',
    search: 'Search...',
    add: 'Add',
    addToCart: 'Add to cart',
    menu: 'Menu',
    cart: 'Cart',
    profile: 'Profile',
    total: 'Total',
    checkout: 'Checkout',
    currency: 'sum',
    myAddresses: 'My Addresses',
    addNewAddress: 'Add new address',
    phone: 'Phone number',
    paymentMethod: 'Payment method',
    cash: 'Cash',
    card: 'Card',
    comment: 'Order comment',
    commentPlaceholder: 'E.g. do not ring the doorbell...',
  }
} as const

type Language = keyof typeof translations
type TranslationKey = keyof typeof translations['ru']

export function useTranslation() {
  const language = useStore((s) => s.language) as Language
  
  const t = (key: TranslationKey) => {
    return translations[language][key]
  }

  return { t, language, setLanguage: useStore.getState().setLanguage }
}

export type { Language }
