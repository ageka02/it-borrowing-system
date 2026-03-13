import { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Inbox,
} from 'lucide-react';
import { itemsAPI } from '../../api/client';
import { useToast } from '../../components/Toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmModal from '../../components/ConfirmModal';

function ItemFormModal({ isOpen, onClose, item, onSave }) {
  const isEdit = !!item;
  const [form, setForm] = useState({
    item_name: '',
    total_stock: '',
    available_stock: '',
    category: '',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (item) {
      setForm({
        item_name: item.item_name || '',
        total_stock: item.total_stock?.toString() || '',
        available_stock: item.available_stock?.toString() || '',
        category: item.category || '',
        is_active: item.is_active ?? true,
      });
    } else {
      setForm({ item_name: '', total_stock: '', available_stock: '', category: '', is_active: true });
    }
    setError('');
  }, [item, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.item_name.trim()) {
      setError('Item name is required.');
      return;
    }
    if (!form.total_stock || parseInt(form.total_stock) < 0) {
      setError('Total stock must be 0 or greater.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        item_name: form.item_name.trim(),
        total_stock: parseInt(form.total_stock),
        category: form.category.trim() || undefined,
        is_active: form.is_active,
      };

      if (isEdit) {
        payload.available_stock = parseInt(form.available_stock) || 0;
        await itemsAPI.update(item.id, payload);
        toast.success('Item updated successfully.');
      } else {
        if (form.available_stock !== '') {
          payload.available_stock = parseInt(form.available_stock);
        }
        await itemsAPI.create(payload);
        toast.success('Item created successfully.');
      }
      onSave();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save item.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6"
        style={{ animation: 'scaleIn 0.2s ease-out' }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100">
          <X className="w-5 h-5 text-gray-400" />
        </button>

        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          {isEdit ? 'Edit Item' : 'Add New Item'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Item Name *</label>
            <input
              type="text"
              value={form.item_name}
              onChange={(e) => setForm({ ...form, item_name: e.target.value })}
              className="input-field"
              placeholder="e.g. Laptop Dell Latitude"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Total Stock *</label>
              <input
                type="number"
                min="0"
                value={form.total_stock}
                onChange={(e) => setForm({ ...form, total_stock: e.target.value })}
                className="input-field"
                placeholder="0"
              />
            </div>
            <div>
              <label className="label">Available Stock</label>
              <input
                type="number"
                min="0"
                value={form.available_stock}
                onChange={(e) => setForm({ ...form, available_stock: e.target.value })}
                className="input-field"
                placeholder="Same as total"
              />
            </div>
          </div>

          <div>
            <label className="label">Category</label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="input-field"
              placeholder="e.g. Laptop, Monitor, Cable"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">Active (available for borrowing)</label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? (
                <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Saving...</>
              ) : (
                isEdit ? 'Update Item' : 'Add Item'
              )}
            </button>
          </div>
        </form>

        <style>{`
          @keyframes scaleIn {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await itemsAPI.getAll();
      setItems(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      await itemsAPI.delete(deleteItem.id);
      toast.success(`"${deleteItem.item_name}" has been removed.`);
      setDeleteItem(null);
      fetchItems();
    } catch (err) {
      toast.error(err.message || 'Failed to delete item.');
    } finally {
      setDeleting(false);
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.item_name.toLowerCase().includes(search.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <LoadingSpinner text="Loading inventory..." />;

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <button onClick={fetchItems} className="btn-primary">
          <RefreshCw className="w-4 h-4 mr-1.5" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">{items.length} total items</p>
        </div>
        <button onClick={() => { setEditItem(null); setShowForm(true); }} className="btn-primary">
          <Plus className="w-4 h-4 mr-1.5" />
          Add Item
        </button>
      </div>

      {/* Search */}
      <div className="card p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or category..."
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Table */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-700">
            {search ? 'No items match your search' : 'No items in inventory'}
          </h3>
          {!search && (
            <button onClick={() => setShowForm(true)} className="btn-primary mt-4">
              <Plus className="w-4 h-4 mr-1.5" /> Add First Item
            </button>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-5 font-semibold text-gray-600">Item Name</th>
                  <th className="text-left py-3 px-5 font-semibold text-gray-600 hidden sm:table-cell">Category</th>
                  <th className="text-center py-3 px-5 font-semibold text-gray-600">Total</th>
                  <th className="text-center py-3 px-5 font-semibold text-gray-600">Available</th>
                  <th className="text-center py-3 px-5 font-semibold text-gray-600">Status</th>
                  <th className="text-right py-3 px-5 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const stockPercent = item.total_stock > 0 ? (item.available_stock / item.total_stock) * 100 : 0;
                  const stockColor = stockPercent < 20 ? 'text-red-600' : stockPercent < 50 ? 'text-amber-600' : 'text-emerald-600';

                  return (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="font-medium text-gray-900">{item.item_name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 hidden sm:table-cell">
                        {item.category ? (
                          <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-md">
                            {item.category}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-center font-semibold text-gray-900">{item.total_stock}</td>
                      <td className={`py-3.5 px-5 text-center font-bold ${stockColor}`}>{item.available_stock}</td>
                      <td className="py-3.5 px-5 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            item.is_active
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {item.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setEditItem(item); setShowForm(true); }}
                            className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteItem(item)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <ItemFormModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditItem(null); }}
        item={editItem}
        onSave={fetchItems}
      />

      <ConfirmModal
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Delete Item"
        message={`Are you sure you want to delete "${deleteItem?.item_name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
