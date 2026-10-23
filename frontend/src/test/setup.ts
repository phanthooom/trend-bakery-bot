import '@testing-library/jest-dom'

const createStorageMock = () => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = String(value) },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
    length: 0,
    key: (i: number) => Object.keys(store)[i] ?? null,
  }
}

const mockStorage = createStorageMock()
Object.defineProperty(globalThis, 'localStorage', { value: mockStorage, writable: true })
Object.defineProperty(window, 'localStorage', { value: mockStorage, writable: true })
