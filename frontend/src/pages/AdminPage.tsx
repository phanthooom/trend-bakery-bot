import React, { useState, useEffect, useRef } from 'react';
import { Package, Plus, Trash2, Edit2, Image as ImageIcon, Loader2, ShieldX, Users, UserPlus } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import type { Product } from '../store/useStore';

interface Admin {
  telegram_id: number;
  name: string;
  username?: string;
  role: 'super' | 'admin';
}

// Read initData lazily at call time — it may not be populated at module load.
const getInitData = (): string => {
  try {
    return WebApp.initData || '';
  } catch {
    return '';
  }
};

const authHeaders = (json = false): Record<string, string> => ({
  ...(json ? { 'Content-Type': 'application/json' } : {}),
  'X-Telegram-Init-Data': getInitData(),
});

export function AdminPage() {
  type AuthState = 'checking' | 'authorized' | 'denied';
  const [auth, setAuth] = useState<AuthState>('checking');
  const [role, setRole] = useState<'super' | 'admin'>('admin');

  const [products, setProducts] = useState<Product[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Product modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', price: '', category: 'home', image: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Admin form state
  const [newAdminId, setNewAdminId] = useState('');
  const [newAdminName, setNewAdminName] = useState('');

  // On mount: verify the caller is an admin (GET /api/admins also returns role + list).
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/admins', { headers: authHeaders() });
        if (res.status === 401 || res.status === 403) {
          setAuth('denied');
          return;
        }
        if (!res.ok) throw new Error('auth check failed');
        const data = await res.json();
        setRole(data.me?.role || 'admin');
        setAdmins(data.admins || []);
        setAuth('authorized');
        await fetchProducts();
      } catch {
        setAuth('denied');
      }
    };
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Failed to fetch products');
      setProducts(await res.json());
    } catch {
      setError('Не удалось загрузить товары');
    }
  };

  const fetchAdmins = async () => {
    try {
      const res = await fetch('/api/admins', { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      setAdmins(data.admins || []);
    } catch {}
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
      image: product.image,
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
        headers: authHeaders(),
        body: file,
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Upload failed with status ${response.status}`);
      }
      const blob = await response.json();
      setFormData((prev) => ({ ...prev, image: blob.url }));
    } catch (err: any) {
      alert('Ошибка при загрузке фото: ' + err.message);
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
        image: formData.image || 'https://images.unsplash.com/photo-1555507036-ab1f4022115c?w=500',
      };
      const res = await fetch('/api/products', {
        method,
        headers: authHeaders(true),
        body: JSON.stringify(body),
      });
      if (res.status === 401) {
        setAuth('denied');
        return;
      }
      if (!res.ok) throw new Error('Ошибка при сохранении');
      await fetchProducts();
      setIsModalOpen(false);
    } catch {
      alert('Произошла ошибка при сохранении товара');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот товар?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE', headers: authHeaders() });
      if (res.status === 401) {
        setAuth('denied');
        return;
      }
      if (!res.ok) throw new Error('Delete failed');
      await fetchProducts();
    } catch {
      alert('Ошибка при удалении');
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/seed', { method: 'POST', headers: authHeaders() });
      if (!res.ok) throw new Error('seed failed');
      await fetchProducts();
    } catch {
      alert('Не удалось загрузить стартовые товары');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminId.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admins', {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify({ telegram_id: Number(newAdminId), name: newAdminName }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Ошибка');
      }
      setNewAdminId('');
      setNewAdminName('');
      await fetchAdmins();
    } catch (err: any) {
      alert('Не удалось добавить админа: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAdmin = async (id: number) => {
    if (!window.confirm('Удалить этого админа?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admins?id=${id}`, { method: 'DELETE', headers: authHeaders() });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Ошибка');
      }
      await fetchAdmins();
    } catch (err: any) {
      alert('Не удалось удалить: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (auth === 'checking') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#ff6b00]" />
      </div>
    );
  }

  if (auth === 'denied') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
          <ShieldX className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900">Доступ запрещён</h2>
        <p className="mt-2 text-gray-500 max-w-sm">
          Эта панель доступна только администраторам. Откройте мини-приложение в Telegram под учётной записью администратора.
        </p>
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4 text-left w-full max-w-sm">
          <p className="text-xs font-mono text-gray-500 break-all">initData length: {getInitData().length}</p>
          <button
            onClick={async () => {
              const id = getInitData();
              const res = await fetch('/api/me', { headers: { 'X-Telegram-Init-Data': id } });
              const d = await res.json();
              alert(JSON.stringify(d, null, 2));
            }}
            className="mt-3 w-full py-2 px-3 bg-gray-100 rounded-lg text-xs font-medium text-gray-700"
          >
            Показать debug info
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#ff6b00] rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">Админка</span>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-orange-100 text-orange-800">
              {role === 'super' ? 'Главный админ' : 'Админ'}
            </span>
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
          <div className="mb-6 bg-red-50 p-4 rounded-xl border border-red-100 text-red-600">{error}</div>
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
                <p>Товаров пока нет.</p>
                <button
                  onClick={handleSeed}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Загрузить стартовые товары
                </button>
              </li>
            )}
          </ul>
        </div>

        {/* Admins management — super-admin only */}
        {role === 'super' && (
          <div className="mt-10">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-gray-700" />
              <h2 className="text-xl font-bold text-gray-900">Администраторы</h2>
            </div>

            <div className="bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {admins.map((a) => (
                  <li key={a.telegram_id} className="p-4 sm:px-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {a.name || 'Без имени'}{' '}
                        {a.role === 'super' && (
                          <span className="text-xs text-orange-600 font-medium">(главный)</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">ID: {a.telegram_id}</p>
                    </div>
                    {a.role !== 'super' && (
                      <button
                        onClick={() => handleRemoveAdmin(a.telegram_id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>

              <form onSubmit={handleAddAdmin} className="p-4 sm:px-6 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
                <input
                  type="number"
                  placeholder="Telegram ID"
                  required
                  value={newAdminId}
                  onChange={(e) => setNewAdminId(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-[#ff6b00] focus:border-[#ff6b00] sm:text-sm"
                />
                <input
                  type="text"
                  placeholder="Имя (необязательно)"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-[#ff6b00] focus:border-[#ff6b00] sm:text-sm"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#ff6b00] text-white text-sm font-medium rounded-lg hover:bg-[#e66000] shadow-sm transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Добавить
                </button>
              </form>
            </div>
            <p className="mt-2 text-xs text-gray-400">
              Новый человек узнаёт свой Telegram ID через бота @userinfobot.
            </p>
          </div>
        )}
      </div>

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setIsModalOpen(false)}>
              <div className="absolute inset-0 bg-gray-900 opacity-50"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="relative z-10 inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-xl leading-6 font-bold text-gray-900 mb-6">
                    {editingProduct ? 'Редактировать товар' : 'Новый товар'}
                  </h3>

                  <div className="space-y-4">
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
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Название</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-[#ff6b00] focus:border-[#ff6b00] sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Описание</label>
                      <textarea
                        rows={2}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-[#ff6b00] focus:border-[#ff6b00] sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Категория</label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
