import { describe, it, expect, beforeEach } from 'vitest'
import { useStore } from '../store/useStore'
import type { Product } from '../store/useStore'

const mockProduct: Product = {
  id: 1,
  name: 'Сет "Белый"',
  description: 'Тестовый продукт',
  price: 230000,
  image: 'https://example.com/bread.jpg',
  category: 'home',
}

const mockProduct2: Product = {
  id: 2,
  name: 'Багет классический',
  description: 'Тестовый продукт 2',
  price: 12000,
  image: 'https://example.com/baguette.jpg',
  category: 'home',
}

beforeEach(() => {
  useStore.setState({ cart: [], address: null, deliveryType: 'delivery' })
})

describe('cart — addToCart', () => {
  it('добавляет товар в корзину', () => {
    useStore.getState().addToCart(mockProduct)
    const { cart } = useStore.getState()
    expect(cart).toHaveLength(1)
    expect(cart[0].id).toBe(1)
    expect(cart[0].quantity).toBe(1)
  })

  it('увеличивает quantity при повторном добавлении', () => {
    useStore.getState().addToCart(mockProduct)
    useStore.getState().addToCart(mockProduct)
    const { cart } = useStore.getState()
    expect(cart).toHaveLength(1)
    expect(cart[0].quantity).toBe(2)
  })

  it('добавляет несколько разных товаров', () => {
    useStore.getState().addToCart(mockProduct)
    useStore.getState().addToCart(mockProduct2)
    expect(useStore.getState().cart).toHaveLength(2)
  })
})

describe('cart — removeFromCart', () => {
  it('удаляет товар из корзины', () => {
    useStore.getState().addToCart(mockProduct)
    useStore.getState().removeFromCart(1)
    expect(useStore.getState().cart).toHaveLength(0)
  })

  it('не трогает другие товары при удалении', () => {
    useStore.getState().addToCart(mockProduct)
    useStore.getState().addToCart(mockProduct2)
    useStore.getState().removeFromCart(1)
    const { cart } = useStore.getState()
    expect(cart).toHaveLength(1)
    expect(cart[0].id).toBe(2)
  })
})

describe('cart — updateQuantity', () => {
  it('увеличивает quantity на +1', () => {
    useStore.getState().addToCart(mockProduct)
    useStore.getState().updateQuantity(1, 1)
    expect(useStore.getState().cart[0].quantity).toBe(2)
  })

  it('уменьшает quantity на -1', () => {
    useStore.getState().addToCart(mockProduct)
    useStore.getState().addToCart(mockProduct)
    useStore.getState().updateQuantity(1, -1)
    expect(useStore.getState().cart[0].quantity).toBe(1)
  })

  it('удаляет товар когда quantity доходит до 0', () => {
    useStore.getState().addToCart(mockProduct)
    useStore.getState().updateQuantity(1, -1)
    expect(useStore.getState().cart).toHaveLength(0)
  })
})

describe('cart — cartTotal / cartCount', () => {
  it('считает сумму корзины правильно', () => {
    useStore.getState().addToCart(mockProduct)   // 230000 × 1
    useStore.getState().addToCart(mockProduct2)  // 12000 × 1
    expect(useStore.getState().cartTotal()).toBe(242000)
  })

  it('считает количество товаров', () => {
    useStore.getState().addToCart(mockProduct)
    useStore.getState().addToCart(mockProduct)
    useStore.getState().addToCart(mockProduct2)
    expect(useStore.getState().cartCount()).toBe(3)
  })

  it('возвращает 0 для пустой корзины', () => {
    expect(useStore.getState().cartTotal()).toBe(0)
    expect(useStore.getState().cartCount()).toBe(0)
  })
})

describe('address', () => {
  it('сохраняет адрес', () => {
    const address = {
      street: 'улица М. Рахимова',
      apartment: '12',
      intercom: '12',
      entrance: '1',
      floor: '3',
    }
    useStore.getState().setAddress(address)
    expect(useStore.getState().address).toEqual(address)
  })
})

describe('deliveryType', () => {
  it('переключает тип доставки', () => {
    useStore.getState().setDeliveryType('pickup')
    expect(useStore.getState().deliveryType).toBe('pickup')
    useStore.getState().setDeliveryType('delivery')
    expect(useStore.getState().deliveryType).toBe('delivery')
  })
})
