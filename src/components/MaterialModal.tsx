import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { Material, MaterialCategory, Store } from '../types';

interface MaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (material: Omit<Material, 'id' | 'createdAt'> & { id?: string }) => void;
  editingMaterial?: Material | null;
  stores: Store[];
  defaultStoreId?: string; // The store selected currently in the sidebar
}

const CATEGORIES: MaterialCategory[] = ['Construction Equipment', 'Construction Material', 'Vehicle', 'Fixed Asset'];
const ALLOWED_UNITS = ['M', 'M²', 'M³', 'KM', 'KG', 'Lt.', 'ML', 'PCS', 'Berga', 'N°', 'Quintal', 'Ton'];

export default function MaterialModal({ isOpen, onClose, onSave, editingMaterial, stores, defaultStoreId }: MaterialModalProps) {
  const [code, setCode] = useState('');
  const [category, setCategory] = useState<MaterialCategory>('Construction Material');
  const [subCategory, setSubCategory] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('M');
  const [quantity, setQuantity] = useState<number>(0);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [storeId, setStoreId] = useState('');
  const [minimumStock, setMinimumStock] = useState<number>(50);
  const [maximumStock, setMaximumStock] = useState<number>(1000);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingMaterial) {
      setCode(editingMaterial.code);
      setCategory(editingMaterial.category);
      setSubCategory(editingMaterial.subCategory || editingMaterial.remarks || '');
      setDescription(editingMaterial.description);
      setUnit(editingMaterial.unit);
      setQuantity(editingMaterial.quantity);
      setUnitPrice(editingMaterial.unitPrice);
      setStoreId(editingMaterial.storeId);
      setMinimumStock(editingMaterial.minimumStock ?? 50);
      setMaximumStock(editingMaterial.maximumStock ?? 1000);
    } else {
      // Generate a nice sequential looking item code
      setCode(Math.floor(1000 + Math.random() * 9000).toString());
      setCategory('Construction Material');
      setSubCategory('');
      setDescription('');
      setUnit('M');
      
      // Seed realistic starting balance
      setQuantity(100);
      setUnitPrice(100);
      setStoreId(defaultStoreId || (stores.length > 0 ? stores[0].id : ''));
      setMinimumStock(50);
      setMaximumStock(1000);
    }
    setError('');
  }, [editingMaterial, isOpen, defaultStoreId, stores]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return setError('Item Code is required');
    if (!description.trim()) return setError('Description is required');
    if (!unit.trim()) return setError('Unit is required');
    if (!storeId) return setError('Please select a target store or category');

    onSave({
      ...(editingMaterial && { id: editingMaterial.id }),
      code: code.trim(),
      category,
      subCategory: subCategory.trim(),
      remarks: subCategory.trim(),
      description: description.trim(),
      unit: unit.trim(),
      quantity: Number(quantity),
      unitPrice: Number(unitPrice),
      storeId,
      minimumStock: Number(minimumStock),
      maximumStock: Number(maximumStock),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none" id="material-modal">
      {/* Overlay Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 transition-opacity duration-300 backdrop-blur-xs" onClick={onClose}></div>

      {/* Main Content Modal Container */}
      <div className="relative w-full max-w-xl mx-auto my-6 px-4 z-10 transition-transform duration-300 transform scale-100">
        <div className="relative flex flex-col w-full bg-white border border-slate-100 rounded-xl shadow-2xl outline-none">
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-slate-100 select-none">
            <h3 className="text-lg font-semibold text-slate-800">
              {editingMaterial ? 'Edit Material specifications' : 'New Material'}
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-left">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-md font-medium border border-red-100">
                {error}
              </div>
            )}

            {/* Item Code Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-500 mb-1.5">
                Item Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="0045"
                className="w-full px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 bg-slate-50/50 border border-slate-200 rounded focus:border-blue-600 focus:ring-1 focus:ring-blue-600/10 outline-none transition"
              />
            </div>

            {/* Item Category selector */}
            <div>
              <label className="block text-sm font-semibold text-slate-500 mb-1.5">
                Item Category
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as MaterialCategory)}
                  className="w-full px-3.5 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded focus:border-blue-600 focus:ring-1 focus:ring-blue-600/10 outline-none transition cursor-pointer appearance-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <span className="absolute inset-y-0 right-3.5 flex items-center text-slate-400 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </div>
            </div>

            {/* Sub Category Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-500 mb-1.5">
                Sub Category
              </label>
              <input
                type="text"
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                placeholder="sub category"
                className="w-full px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 bg-white border border-slate-200 rounded focus:border-blue-600 focus:ring-1 focus:ring-blue-600/10 outline-none transition"
              />
            </div>

            {/* Description Text Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-500 mb-1.5">
                Material Name
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Material Name"
                className="w-full px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 bg-white border border-slate-200 rounded focus:border-blue-600 focus:ring-1 focus:ring-blue-600/10 outline-none transition"
              />
            </div>

            {/* Unit Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-500 mb-1.5">
                Unit
              </label>
              <div className="relative">
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded focus:border-blue-600 focus:ring-1 focus:ring-blue-600/10 outline-none transition cursor-pointer appearance-none"
                >
                  {ALLOWED_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                <span className="absolute inset-y-0 right-3.5 flex items-center text-slate-400 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </div>
            </div>

            {/* Minimum and Maximum Stock thresholds */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-500 mb-1.5">
                  Minimum Stock
                </label>
                <input
                  type="number"
                  min="0"
                  value={minimumStock}
                  onChange={(e) => setMinimumStock(Number(e.target.value))}
                  placeholder="e.g. 50"
                  className="w-full px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 bg-white border border-slate-200 rounded focus:border-blue-600 focus:ring-1 focus:ring-blue-600/10 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-500 mb-1.5">
                  Maximum Stock
                </label>
                <input
                  type="number"
                  min="0"
                  value={maximumStock}
                  onChange={(e) => setMaximumStock(Number(e.target.value))}
                  placeholder="e.g. 1000"
                  className="w-full px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 bg-white border border-slate-200 rounded focus:border-blue-600 focus:ring-1 focus:ring-blue-600/10 outline-none transition"
                />
              </div>
            </div>

            {/* Footer Buttons strictly matching screenshot */}
            <div className="flex items-center justify-end pt-5 border-t border-slate-100 mt-6 select-none">
              <button
                type="submit"
                className="px-6 py-2.5 text-sm font-bold text-white bg-[#033096] hover:bg-[#022573] active:bg-[#011c58] rounded transition shadow-sm cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
