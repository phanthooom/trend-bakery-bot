import React, { useState, useEffect, useRef } from 'react';
import { Package, Plus, Trash2, Edit2, LogOut, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Product } from '../store/useStore';

export function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'home',
    image: ''
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if we have password in localStorage
  useEffect(() => {
    const savedPassword = localStorage.getItem('admin_password');
    if (savedPassword) {
      setPassword(savedPassword);
      checkAuth(savedPassword);
    }
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setProducts(data);
    } catch (err: any) {
      setError('Не удалось загрузить товары');
    }
  };

  const checkAuth = async (pass: string) => {
    setLoading(true);
    try {
      // Just do a dummy request to check password or we can just fetch and verify later.
      // But Vercel env variable is not available in frontend directly unless VITE_ prefixed.
      // Since we verify on the backend, let's just save it.
      setIsAuthenticated(true);
      localStorage.setItem('admin_password', pass);
      await fetchProducts();
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password) {
      checkAuth(password);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_password');
    setIsAuthenticated(false);
    setPassword('');
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({ name: '', description: '', price: '', category: 'home', image: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      category: product.category,
      image: product.image
    });
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        headers: {
          'Authorization': password,
        },
        body: file,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const blob = await response.json();
      setFormData(prev => ({ ...prev, image: blob.url }));
    } catch (err) {
      alert('Ошибка при загрузке фото');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const method = editingProduct ? 'PUT' : 'POST';
      const body = {
        ...(editingProduct && { id: editingProduct.id }),
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        category: formData.category,
        image: formData.image || 'https://images.unsplash.com/photo-1555507036-ab1f4022115c?w=500'
      };

      const res = await fetch('/api/products', {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': password
        },
        body: JSON.stringify(body)
      });

      if (res.status === 401) {
        handleLogout();
        alert('Неверный пароль');
        return;
      }

      if (!res.ok) throw new Error('Ошибка при сохранении');
      
      await fetchProducts();
      setIsModalOpen(false);
    } catch (err) {
      alert('Произошла ошибка при сохранении товара');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот товар?')) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/products?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': password
        }
      });
      
      if (res.status === 401) {
        handleLogout();
        alert('Неверный пароль');
        return;
      }
      
      if (!res.ok) throw new Error('Delete failed');
      
      await fetchProducts();
    } catch (err) {
      alert('Ошибка при удалении');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-[#ff6b00] rounded-2xl flex items-center justify-center shadow-lg">
              <Package className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Вход в Панель Управления
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-gray-100">
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Секретный пароль
                </label>
                <div className="mt-1">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#ff6b00] focus:border-[#ff6b00] sm:text-sm transition-colors"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-[#ff6b00] hover:bg-[#e66000] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff6b00] transition-colors"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Войти'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-2">
                <div className="w-8 h-8 bg-[#ff6b00] rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl text-gray-900">Админка</span>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-gray-700 focus:outline-none transition"
              >
                <LogOut className="w-4 h-4" />
                Выйти
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Ваши товары</h1>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#ff6b00] text-white text-sm font-medium rounded-xl hover:bg-[#e66000] shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Добавить
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 p-4 rounded-xl border border-red-100 text-red-600">
            {error}
          </div>
        )}

        <div className="bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {products.map((product) => (
              <li key={product.id} className="p-4 sm:px-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-16 h-16 rounded-xl object-cover border border-gray-100 shadow-sm"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                      <p className="text-sm text-gray-500 mt-1">{product.price.toLocaleString()} сум</p>
                      <span className="inline-flex mt-1 items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        {product.category === 'home' ? 'Хлеб' : 'Сдоба'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => openEditModal(product)}
                      className="p-2 text-gray-400 hover:text-[#ff6b00] hover:bg-orange-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
            
            {products.length === 0 && !loading && (
              <li className="p-12 text-center text-gray-500">
                У вас пока нет товаров. Нажмите "Добавить", чтобы создать первый!
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setIsModalOpen(false)}>
              <div className="absolute inset-0 bg-gray-900 opacity-50"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-xl leading-6 font-bold text-gray-900 mb-6">
                    {editingProduct ? 'Редактировать товар' : 'Новый товар'}
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Image Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Фотография</label>
                      <div className="mt-1 flex items-center gap-4">
                        {formData.image ? (
                          <img src={formData.image} alt="Preview" className="w-20 h-20 rounded-xl object-cover shadow-sm border border-gray-200" />
                        ) : (
                          <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingImage}
                          className="bg-white py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none transition-colors"
                        >
                          {uploadingImage ? 'Загрузка...' : 'Выбрать фото'}
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          accept="image/*"
                          className="hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Название</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-[#ff6b00] focus:border-[#ff6b00] sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Описание</label>
                      <textarea
                        rows={2}
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-[#ff6b00] focus:border-[#ff6b00] sm:text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Цена (сум)</label>
                        <input
                          type="number"
                          required
                          value={formData.price}
                          onChange={(e) => setFormData({...formData, price: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-[#ff6b00] focus:border-[#ff6b00] sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Категория</label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({...formData, category: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-[#ff6b00] focus:border-[#ff6b00] sm:text-sm"
                        >
                          <option value="home">Хлеб</option>
                          <option value="retail">Сдоба</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-4 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={loading || uploadingImage}
                    className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-2 bg-[#ff6b00] text-base font-medium text-white hover:bg-[#e66000] focus:outline-none sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                  >
                    {loading ? 'Сохранение...' : 'Сохранить'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-xl border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
