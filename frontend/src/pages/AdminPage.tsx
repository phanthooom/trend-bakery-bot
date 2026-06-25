import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit2, Image as ImageIcon, Loader2, ShieldX, Users, UserPlus, ChevronRight } from 'lucide-react';
import type { Product } from '../store/useStore';
import { useSafeArea } from '../context/SafeAreaContext';

const BRAND = '#C8102E';

interface Admin {
  telegram_id: number;
  name: string;
  username?: string;
  role: 'super' | 'admin';
}

const getInitData = (): string => {
  try {
    return (window as any).Telegram?.WebApp?.initData || '';
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
  const navigate = useNavigate();
  const [auth, setAuth] = useState<AuthState>('checking');
  const [role, setRole] = useState<'super' | 'admin'>('admin');

  const [products, setProducts] = useState<Product[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'products' | 'admins'>('products');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', price: '', category: 'home', image: '', name_uz: '', name_en: '', description_uz: '', description_en: '' });
  const [showTranslations, setShowTranslations] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newAdminId, setNewAdminId] = useState('');
  const [newAdminName, setNewAdminName] = useState('');

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/admins', { headers: authHeaders() });
        if (res.status === 401 || res.status === 403) { setAuth('denied'); return; }
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
      if (!res.ok) throw new Error('fetch failed');
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

  const handleSeed = async () => {
    setLoading(true);
    try {
      await fetch('/api/seed', { method: 'POST', headers: authHeaders() });
      await fetchProducts();
    } catch {
      alert('Не удалось загрузить стартовые товары');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({ name: '', description: '', price: '', category: 'home', image: '', name_uz: '', name_en: '', description_uz: '', description_en: '' });
    setShowTranslations(false);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({ name: product.name, description: product.description || '', price: product.price.toString(), category: product.category, image: product.image, name_uz: product.name_uz || '', name_en: product.name_en || '', description_uz: product.description_uz || '', description_en: product.description_en || '' });
    setShowTranslations(!!(product.name_uz || product.name_en));
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST', headers: authHeaders(), body: file,
      });
      if (!response.ok) { const d = await response.json().catch(() => ({})); throw new Error(d.error || `${response.status}`); }
      const blob = await response.json();
      setFormData(prev => ({ ...prev, image: blob.url }));
    } catch (err: any) {
      alert('Ошибка загрузки: ' + err.message);
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
        name: formData.name, description: formData.description,
        price: Number(formData.price), category: formData.category,
        image: formData.image || 'https://images.unsplash.com/photo-1555507036-ab1f4022115c?w=500',
        ...(formData.name_uz && { name_uz: formData.name_uz }),
        ...(formData.name_en && { name_en: formData.name_en }),
        ...(formData.description_uz && { description_uz: formData.description_uz }),
        ...(formData.description_en && { description_en: formData.description_en }),
      };
      const res = await fetch('/api/products', { method, headers: authHeaders(true), body: JSON.stringify(body) });
      if (res.status === 401) { setAuth('denied'); return; }
      if (!res.ok) throw new Error('save failed');
      await fetchProducts();
      setIsModalOpen(false);
    } catch {
      alert('Ошибка при сохранении товара');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Удалить этот товар?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE', headers: authHeaders() });
      if (res.status === 401) { setAuth('denied'); return; }
      if (!res.ok) throw new Error('delete failed');
      await fetchProducts();
    } catch {
      alert('Ошибка при удалении');
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
        method: 'POST', headers: authHeaders(true),
        body: JSON.stringify({ telegram_id: Number(newAdminId), name: newAdminName }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Ошибка'); }
      setNewAdminId(''); setNewAdminName('');
      await fetchAdmins();
    } catch (err: any) {
      alert('Не удалось добавить: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAdmin = async (id: number) => {
    if (!window.confirm('Удалить этого администратора?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admins?id=${id}`, { method: 'DELETE', headers: authHeaders() });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Ошибка'); }
      await fetchAdmins();
    } catch (err: any) {
      alert('Не удалось удалить: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const { top: safeTop } = useSafeArea();

  // ─── States ───────────────────────────────────────────────────────────────

  if (auth === 'checking') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: BRAND }}>
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
          <p className="text-sm text-gray-400">Проверка доступа...</p>
        </div>
      </div>
    );
  }

  if (auth === 'denied') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6" style={{ background: '#fff0f0' }}>
          <ShieldX className="w-10 h-10" style={{ color: BRAND }} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Доступ запрещён</h2>
        <p className="mt-2 text-gray-400 text-sm max-w-xs leading-relaxed">
          Панель доступна только администраторам. Откройте приложение в Telegram под нужной учётной записью.
        </p>

      </div>
    );
  }

  // ─── Main ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 px-4 pb-0" style={{ paddingTop: Math.max(safeTop, 16) }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center active:scale-90 transition-transform"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="#374151" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div>
              <p className="font-bold text-gray-900 text-base leading-tight">Панель управления</p>
              <p className="text-xs text-gray-400 leading-tight">Trend Bakery</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: '#fff0f0', color: BRAND }}>
            {role === 'super' ? '👑 Главный' : 'Администратор'}
          </span>
        </div>

        {/* Tabs */}
        {role === 'super' && (
          <div className="flex gap-1">
            {(['products', 'admins'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-2.5 text-sm font-semibold rounded-none border-b-2 transition-colors"
                style={{
                  borderBottomColor: tab === t ? BRAND : 'transparent',
                  color: tab === t ? BRAND : '#9ca3af',
                  background: 'transparent',
                }}
              >
                {t === 'products' ? 'Товары' : 'Администраторы'}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 px-4 py-5 max-w-2xl w-full mx-auto">
        {/* ── Products Tab ─────────────────────────────────────────────────── */}
        {tab === 'products' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-lg font-bold text-gray-900">
                Товары <span className="text-gray-400 font-normal text-sm">({products.length})</span>
              </p>
              <button
                onClick={openAddModal}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm active:scale-95 transition-transform"
                style={{ background: BRAND }}
              >
                <Plus className="w-4 h-4" />
                Добавить
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl text-sm text-red-600 bg-red-50">{error}</div>
            )}

            {products.length === 0 && !loading && (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
                <div className="text-4xl mb-3">🍞</div>
                <p className="text-gray-500 text-sm mb-4">Товаров пока нет</p>
                <button
                  onClick={handleSeed}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: BRAND }}
                >
                  Загрузить стартовые товары
                </button>
              </div>
            )}

            <div className="space-y-2">
              {products.map(product => (
                <div key={product.id} className="bg-white rounded-2xl border border-gray-100 p-3 shadow-sm flex items-center gap-3">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-gray-100"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{product.name}</p>
                    <p className="text-sm font-bold mt-0.5" style={{ color: BRAND }}>
                      {product.price.toLocaleString()} сум
                    </p>
                    <span className="inline-flex mt-1 items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      {product.category === 'home' ? 'Для дома' : 'Розничные сети'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEditModal(product)}
                      className="p-2 rounded-xl bg-gray-50 text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-2 rounded-xl bg-gray-50 transition-colors"
                      style={{ color: BRAND }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Admins Tab ───────────────────────────────────────────────────── */}
        {tab === 'admins' && role === 'super' && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-gray-400" />
              <p className="text-lg font-bold text-gray-900">Администраторы</p>
            </div>

            <div className="space-y-2 mb-4">
              {admins.map(a => (
                <div key={a.telegram_id} className="bg-white rounded-2xl border border-gray-100 px-4 py-3 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 text-sm">{a.name || 'Без имени'}</p>
                      {a.role === 'super' && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#fff0f0', color: BRAND }}>
                          👑 Главный
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">ID: {a.telegram_id}</p>
                  </div>
                  {a.role !== 'super' && (
                    <button
                      onClick={() => handleRemoveAdmin(a.telegram_id)}
                      className="p-2 rounded-xl bg-gray-50"
                      style={{ color: BRAND }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add admin form */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-gray-400" />
                  <p className="font-semibold text-gray-900 text-sm">Добавить администратора</p>
                </div>
              </div>
              <form onSubmit={handleAddAdmin} className="p-4 space-y-3">
                <input
                  type="number"
                  placeholder="Telegram ID"
                  required
                  value={newAdminId}
                  onChange={e => setNewAdminId(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm outline-none border border-transparent focus:border-gray-200 transition-colors"
                />
                <input
                  type="text"
                  placeholder="Имя (необязательно)"
                  value={newAdminName}
                  onChange={e => setNewAdminName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm outline-none border border-transparent focus:border-gray-200 transition-colors"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  style={{ background: BRAND }}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-4 h-4" /> Добавить</>}
                </button>
              </form>
              <div className="px-4 pb-4">
                <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-500">Telegram ID можно узнать через бота <span className="font-medium">@userinfobot</span></p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Product Modal ──────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl animate-slide-up">
            <div className="px-5 pt-5 pb-4 border-b border-gray-100">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden" />
              <h3 className="text-lg font-bold text-gray-900">
                {editingProduct ? 'Редактировать товар' : 'Новый товар'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[70vh]">
              <div className="p-5 space-y-4">
                {/* Image */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Фото</label>
                  <div className="flex items-center gap-3">
                    {formData.image ? (
                      <img src={formData.image} alt="preview" className="w-20 h-20 rounded-2xl object-cover border border-gray-100" />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50">
                        <ImageIcon className="w-6 h-6 text-gray-300" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600"
                    >
                      {uploadingImage ? 'Загрузка...' : 'Выбрать фото'}
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Название</label>
                  <input
                    type="text" required value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm outline-none border border-transparent focus:border-gray-200 transition-colors"
                    placeholder="Мини хлебное ассорти"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Описание</label>
                  <textarea
                    rows={3} value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm outline-none border border-transparent focus:border-gray-200 transition-colors resize-none"
                    placeholder="Состав и количество..."
                  />
                </div>

                {/* Translations toggle */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowTranslations(v => !v)}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-700"
                  >
                    <span>{showTranslations ? '▾' : '▸'}</span>
                    Переводы (UZ / EN)
                    {(formData.name_uz || formData.name_en) && <span className="text-[#C8102E] text-xs">●</span>}
                  </button>
                  {showTranslations && (
                    <div className="mt-3 space-y-3 pl-3 border-l-2 border-gray-100">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Название UZ</label>
                          <input type="text" value={formData.name_uz} onChange={e => setFormData({ ...formData, name_uz: e.target.value })} placeholder="O'zbekcha nomi" className="w-full px-3 py-2 bg-gray-50 rounded-xl text-sm outline-none border border-transparent focus:border-gray-200" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Название EN</label>
                          <input type="text" value={formData.name_en} onChange={e => setFormData({ ...formData, name_en: e.target.value })} placeholder="English name" className="w-full px-3 py-2 bg-gray-50 rounded-xl text-sm outline-none border border-transparent focus:border-gray-200" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Описание UZ</label>
                        <textarea rows={2} value={formData.description_uz} onChange={e => setFormData({ ...formData, description_uz: e.target.value })} placeholder="O'zbekcha tavsif..." className="w-full px-3 py-2 bg-gray-50 rounded-xl text-sm outline-none border border-transparent focus:border-gray-200 resize-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Описание EN</label>
                        <textarea rows={2} value={formData.description_en} onChange={e => setFormData({ ...formData, description_en: e.target.value })} placeholder="English description..." className="w-full px-3 py-2 bg-gray-50 rounded-xl text-sm outline-none border border-transparent focus:border-gray-200 resize-none" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Price + Category */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Цена (сум)</label>
                    <input
                      type="number" required value={formData.price}
                      onChange={e => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm outline-none border border-transparent focus:border-gray-200 transition-colors"
                      placeholder="230000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Категория</label>
                    <select
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm outline-none border border-transparent focus:border-gray-200 transition-colors"
                    >
                      <option value="home">Для дома</option>
                      <option value="retail">Розничные</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="px-5 pb-5 flex gap-3">
                <button
                  type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 bg-white"
                >
                  Отмена
                </button>
                <button
                  type="submit" disabled={loading || uploadingImage}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  style={{ background: BRAND }}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
