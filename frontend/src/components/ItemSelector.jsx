import { useState, useEffect } from 'react';
import { Plus, Minus, X, Package, Search } from 'lucide-react';
import { itemsAPI } from '../api/client';
import LoadingSpinner from './LoadingSpinner';

export default function ItemSelector({ selectedItems, onItemsChange }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    itemsAPI
      .getAll()
      .then((res) => {
        const available = (res.data || []).filter(
          (item) => item.is_active && item.available_stock > 0
        );
        setItems(available);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredItems = items.filter(
    (item) =>
      item.item_name.toLowerCase().includes(search.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(search.toLowerCase()))
  );

  const getSelectedQty = (itemId) => {
    const found = selectedItems.find((si) => si.item_id === itemId);
    return found ? found.quantity : 0;
  };

  const addItem = (item) => {
    const existing = selectedItems.find((si) => si.item_id === item.id);
    if (existing) {
      if (existing.quantity < item.available_stock) {
        onItemsChange(
          selectedItems.map((si) =>
            si.item_id === item.id ? { ...si, quantity: si.quantity + 1 } : si
          )
        );
      }
    } else {
      onItemsChange([
        ...selectedItems,
        { item_id: item.id, item_name: item.item_name, quantity: 1, available_stock: item.available_stock },
      ]);
    }
  };

  const decreaseItem = (itemId) => {
    const existing = selectedItems.find((si) => si.item_id === itemId);
    if (existing && existing.quantity > 1) {
      onItemsChange(
        selectedItems.map((si) =>
          si.item_id === itemId ? { ...si, quantity: si.quantity - 1 } : si
        )
      );
    } else {
      onItemsChange(selectedItems.filter((si) => si.item_id !== itemId));
    }
  };

  const removeItem = (itemId) => {
    onItemsChange(selectedItems.filter((si) => si.item_id !== itemId));
  };

  if (loading) return <LoadingSpinner text="Loading available items..." />;
  if (error) return <div className="text-center py-8 text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search items by name or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {/* Item Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredItems.map((item) => {
          const qty = getSelectedQty(item.id);
          const isSelected = qty > 0;
          const stockPercent = (item.available_stock / item.total_stock) * 100;

          return (
            <div
              key={item.id}
              className={`relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer
                ${isSelected
                  ? 'border-primary-500 bg-primary-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
              onClick={() => !isSelected && addItem(item)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Package className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-primary-600' : 'text-gray-400'}`} />
                    <h4 className="text-sm font-semibold text-gray-900 truncate">{item.item_name}</h4>
                  </div>
                  {item.category && (
                    <span className="inline-block mt-1.5 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-md">
                      {item.category}
                    </span>
                  )}
                </div>
              </div>

              {/* Stock Bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-500">Available</span>
                  <span className={`font-semibold ${stockPercent < 20 ? 'text-red-600' : 'text-gray-700'}`}>
                    {item.available_stock} / {item.total_stock}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      stockPercent < 20 ? 'bg-red-500' : stockPercent < 50 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${stockPercent}%` }}
                  />
                </div>
              </div>

              {/* Quantity Controls */}
              {isSelected && (
                <div className="mt-3 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="Remove item"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => decreaseItem(item.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-primary-700">{qty}</span>
                    <button
                      onClick={() => addItem(item)}
                      disabled={qty >= item.available_stock}
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Add hint if not selected */}
              {!isSelected && (
                <div className="mt-3 flex items-center justify-center">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Click to add
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-8">
          <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            {search ? 'No items match your search.' : 'No items available for borrowing.'}
          </p>
        </div>
      )}

      {/* Selection Summary */}
      {selectedItems.length > 0 && (
        <div className="bg-primary-50 rounded-xl p-4 border border-primary-200">
          <h4 className="text-sm font-semibold text-primary-900 mb-2">
            Selected Items ({selectedItems.length})
          </h4>
          <div className="space-y-1.5">
            {selectedItems.map((si) => (
              <div key={si.item_id} className="flex items-center justify-between text-sm">
                <span className="text-primary-800">{si.item_name}</span>
                <span className="font-medium text-primary-700">x{si.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
