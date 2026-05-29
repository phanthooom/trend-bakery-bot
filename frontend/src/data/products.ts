import { type Product } from '../store/useStore'

export const products: Product[] = [
  {
    id: 1,
    name: 'Сет "Белый"',
    description: 'Батончик «Молочный 60 гр» - 11 шт, Багет «С луком 60 гр» - 11 шт',
    price: 230000,
    image: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=400&q=80',
    category: 'home',
  },
  {
    id: 2,
    name: 'Сет "Медиум"',
    description: 'Хлеб «Молочный» - 4 шт, Хлеб «Злаковый» - 4 шт, Хлеб «Пшеничный» - 4 шт',
    price: 185000,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
    category: 'home',
  },
  {
    id: 3,
    name: 'Хлеб "Злаковый"',
    description: 'Ароматный злаковый хлеб из цельнозерновой муки с семенами',
    price: 18000,
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&q=80',
    category: 'home',
  },
  {
    id: 4,
    name: 'Багет классический',
    description: 'Французский багет с хрустящей корочкой, 250 гр',
    price: 12000,
    image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc7b?w=400&q=80',
    category: 'home',
  },
  {
    id: 5,
    name: 'Круассан масляный',
    description: 'Слоёный круассан из сливочного масла высшего качества',
    price: 22000,
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80',
    category: 'retail',
  },
  {
    id: 6,
    name: 'Сет "Розничный"',
    description: 'Ассорти для розничных точек: 20 батонов разных сортов',
    price: 350000,
    image: 'https://images.unsplash.com/photo-1601379327928-bedfaf9da2d0?w=400&q=80',
    category: 'retail',
  },
]
