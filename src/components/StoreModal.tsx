import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Store } from '../types';

interface StoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (store: Omit<Store, 'id' | 'createdAt'> & { id?: string }) => void;
  editingStore?: Store | null;
}

const STORE_TYPES = ['Main Store', 'Sub Store', 'Site Store', 'Warehouse'];

export default function StoreModal({ isOpen, onClose, onSave, editingStore }: StoreModalProps) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [wereda, setWereda] = useState('');
  const [type, setType] = useState('Main Store');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingStore) {
      setName(editingStore.name);
      setCity(editingStore.city);
      setWereda(editingStore.wereda);
      setType(editingStore.type);
    } else {
      setName('');
      setCity('');
      setWereda('');
      setType('Main Store');
    }
    setError('');
  }, [editingStore, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Store name is required');
    if (!city.trim()) return setError('City is required');
    if (!wereda.trim()) return setError('Wereda is required');

    onSave({
      ...(editingStore && { id: editingStore.id }),
      name: name.trim(),
      city: city.trim(),
      wereda: wereda.trim(),
      type,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none" id="store-modal">
      {/* Overlay Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 transition-opacity duration-300 backdrop-blur-xs" onClick={onClose}></div>

      {/* Main Content Modal Container */}
      <div className="relative w-full max-w-lg mx-auto my-6 px-4 z-10 transition-transform duration-300 transform scale-100">
        <div className="relative flex flex-col w-full bg-white border border-slate-100 rounded-xl shadow-2xl outline-none">
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-slate-100 select-none">
            <h3 className="text-lg font-semibold text-slate-800">
              {editingStore ? 'Edit Store' : 'Register Store'}
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

            {/* Store Name Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter store name"
                className="w-full px-3 py-2 text-sm text-slate-800 placeholder-slate-400 bg-white border border-slate-200 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 outline-none transition"
              />
            </div>

            {/* City Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter city"
                className="w-full px-3 py-2 text-sm text-slate-800 placeholder-slate-400 bg-white border border-slate-200 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 outline-none transition"
              />
            </div>

            {/* Wereda Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Wereda
              </label>
              <input
                type="text"
                value={wereda}
                onChange={(e) => setWereda(e.target.value)}
                placeholder="Enter wereda"
                className="w-full px-3 py-2 text-sm text-slate-800 placeholder-slate-400 bg-white border border-slate-200 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 outline-none transition"
              />
            </div>

            {/* Store Type Dropdown selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-200 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 outline-none transition cursor-pointer"
              >
                {STORE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 mt-6 select-none">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-md transition border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 active:bg-blue-900 rounded-md transition shadow-sm"
              >
                {editingStore ? 'Save Changes' : 'Register Store'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
