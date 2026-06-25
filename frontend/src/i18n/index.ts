import { useStore, type Product } from '../store/useStore'

const translations = {
  ru: {
    // Categories
    home: 'Для дома',
    retail: 'Розничные сети',
    // Delivery
    delivery: 'Доставка',
    pickup: 'Самовывоз',
    deliveryTrend: 'Доставка (Trend Bakery)',
    deliveryCourier: 'Курьером до двери',
    chooseAddress: 'Выберите адрес',
    deliveryAddress: 'Адрес доставки',
    addressNotSet: 'Не указан',
    notSelected: 'Не выбран',
    change: 'Изменить',
    // Search
    search: 'Поиск...',
    notFound: 'Ничего не найдено',
    // Products
    add: 'Добавить',
    addToCart: 'В корзину',
    cost: 'Стоимость',
    // Navigation
    menu: 'Меню',
    cart: 'Корзина',
    profile: 'Профиль',
    // Cart
    cartEmpty: 'Корзина пуста',
    goToMenu: 'Перейти в меню',
    total: 'Итого',
    checkout: 'Оформить заказ',
    currency: 'сум',
    // Checkout
    phone: 'Номер телефона',
    paymentMethod: 'Способ оплаты',
    cash: 'Наличными',
    card: 'Картой',
    comment: 'Комментарий к заказу',
    commentPlaceholder: 'Например: не звонить в дверь, спит ребенок...',
    // Addresses
    myAddresses: 'Мои адреса',
    addNewAddress: 'Добавить новый адрес',
    noSavedAddresses: 'Нет сохранённых адресов',
    // Map
    detectingAddress: 'Определяем адрес...',
    save: 'Сохранить',
    address: 'Адрес',
    apartment: 'Кв/Офис',
    intercom: 'Домофон',
    entrance: 'Подъезд',
    floor: 'Этаж',
    openYandexMaps: 'Открыть в Яндекс Картах',
    // Profile
    guest: 'Гость',
    language: 'Язык',
    phoneNotSet: 'Не указан',
    aboutUs: 'О нас',
    aboutUsDesc: 'Trend Bakery — пекарня с любовью. Свежий хлеб и выпечка каждый день, доставка по Ташкенту.',
    termsOfUse: 'Условия использования',
    privacyPolicy: 'Политика конфиденциальности',
    appVersion: 'Trend Bakery v1.0',
    // Admin
    controlPanel: 'Панель управления',
    controlPanelDesc: 'Товары, цены, администраторы',
    // Service type modal
    selectServiceType: 'Выберите тип услуги',
    howToGetOrder: 'Как вы хотите получить заказ?',
    pickupTitle: 'Самовывоз',
    pickupDesc: 'Адрес нашей пекарни',
    selectThisAddress: 'Выбрать этот адрес',
    back: 'Назад',
    loadingAddress: 'Загружаем адрес...',
  },
  uz: {
    home: 'Uy uchun',
    retail: 'Chakana savdo',
    delivery: 'Yetkazib berish',
    pickup: 'Olib ketish',
    deliveryTrend: 'Yetkazib berish (Trend Bakery)',
    deliveryCourier: 'Kuryer bilan eshikgacha',
    chooseAddress: 'Manzilni tanlang',
    deliveryAddress: 'Yetkazib berish manzili',
    addressNotSet: 'Ko\'rsatilmagan',
    notSelected: 'Tanlanmagan',
    change: 'O\'zgartirish',
    search: 'Qidirish...',
    notFound: 'Hech narsa topilmadi',
    add: 'Qo\'shish',
    addToCart: 'Savatga',
    cost: 'Narxi',
    menu: 'Menyu',
    cart: 'Savat',
    profile: 'Profil',
    cartEmpty: 'Savat bo\'sh',
    goToMenu: 'Menyuga o\'tish',
    total: 'Jami',
    checkout: 'Buyurtma berish',
    currency: "so'm",
    phone: 'Telefon raqami',
    paymentMethod: 'To\'lov usuli',
    cash: 'Naqd pul',
    card: 'Karta orqali',
    comment: 'Buyurtmaga izoh',
    commentPlaceholder: 'Masalan: eshikni qo\'ng\'iroq qilmang...',
    myAddresses: 'Mening manzillarim',
    addNewAddress: 'Yangi manzil qo\'shish',
    noSavedAddresses: 'Saqlangan manzillar yo\'q',
    detectingAddress: 'Manzil aniqlanmoqda...',
    save: 'Saqlash',
    address: 'Manzil',
    apartment: 'Xonadon/Ofis',
    intercom: 'Domofon',
    entrance: 'Kirish',
    floor: 'Qavat',
    openYandexMaps: 'Yandex Xaritada ochish',
    guest: 'Mehmon',
    language: 'Til',
    phoneNotSet: 'Ko\'rsatilmagan',
    aboutUs: 'Biz haqimizda',
    aboutUsDesc: 'Trend Bakery — muhabbat bilan non. Har kuni yangi non va pishiriqlar, Toshkent bo\'ylab yetkazib berish.',
    termsOfUse: 'Foydalanish shartlari',
    privacyPolicy: 'Maxfiylik siyosati',
    appVersion: 'Trend Bakery v1.0',
    controlPanel: 'Boshqaruv paneli',
    controlPanelDesc: 'Mahsulotlar, narxlar, adminlar',
    selectServiceType: 'Xizmat turini tanlang',
    howToGetOrder: 'Buyurtmani qanday olmoqchisiz?',
    pickupTitle: 'Olib ketish',
    pickupDesc: 'Bizning nonvoyxonamiz manzili',
    selectThisAddress: 'Ushbu manzilni tanlash',
    back: 'Orqaga',
    loadingAddress: 'Manzil yuklanmoqda...',
  },
  en: {
    home: 'For Home',
    retail: 'Retail',
    delivery: 'Delivery',
    pickup: 'Pickup',
    deliveryTrend: 'Delivery (Trend Bakery)',
    deliveryCourier: 'Courier to door',
    chooseAddress: 'Choose address',
    deliveryAddress: 'Delivery address',
    addressNotSet: 'Not set',
    notSelected: 'Not selected',
    change: 'Change',
    search: 'Search...',
    notFound: 'Nothing found',
    add: 'Add',
    addToCart: 'Add to cart',
    cost: 'Price',
    menu: 'Menu',
    cart: 'Cart',
    profile: 'Profile',
    cartEmpty: 'Cart is empty',
    goToMenu: 'Go to menu',
    total: 'Total',
    checkout: 'Checkout',
    currency: 'sum',
    phone: 'Phone number',
    paymentMethod: 'Payment method',
    cash: 'Cash',
    card: 'Card',
    comment: 'Order comment',
    commentPlaceholder: 'E.g. do not ring the doorbell...',
    myAddresses: 'My Addresses',
    addNewAddress: 'Add new address',
    noSavedAddresses: 'No saved addresses',
    detectingAddress: 'Detecting address...',
    save: 'Save',
    address: 'Address',
    apartment: 'Apt/Office',
    intercom: 'Intercom',
    entrance: 'Entrance',
    floor: 'Floor',
    openYandexMaps: 'Open in Yandex Maps',
    guest: 'Guest',
    language: 'Language',
    phoneNotSet: 'Not set',
    aboutUs: 'About us',
    aboutUsDesc: 'Trend Bakery — bakery with love. Fresh bread and pastries daily, delivery across Tashkent.',
    termsOfUse: 'Terms of use',
    privacyPolicy: 'Privacy policy',
    appVersion: 'Trend Bakery v1.0',
    controlPanel: 'Control panel',
    controlPanelDesc: 'Products, prices, administrators',
    selectServiceType: 'Select service type',
    howToGetOrder: 'How do you want to receive your order?',
    pickupTitle: 'Pickup',
    pickupDesc: 'Our bakery address',
    selectThisAddress: 'Select this address',
    back: 'Back',
    loadingAddress: 'Loading address...',
  }
} as const

type Language = keyof typeof translations
type TranslationKey = keyof typeof translations['ru']

export function localizeProduct(product: Product, language: Language) {
  const name = (language === 'uz' && product.name_uz) ? product.name_uz
    : (language === 'en' && product.name_en) ? product.name_en
    : product.name
  const description = (language === 'uz' && product.description_uz) ? product.description_uz
    : (language === 'en' && product.description_en) ? product.description_en
    : product.description
  return { name, description }
}

export function useTranslation() {
  const language = useStore((s) => s.language) as Language

  const t = (key: TranslationKey) => translations[language][key]

  return { t, language, setLanguage: useStore.getState().setLanguage }
}

export type { Language }
