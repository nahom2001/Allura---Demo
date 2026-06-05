import React, { useState } from 'react';
import { Plus, Search, Trash2, Edit3, X, User } from 'lucide-react';
import { Supplier } from '../types';

interface SupplierViewProps {
  suppliers: Supplier[];
  onAddSupplier: (supplier: { name: string; phone?: string; address?: string; email?: string; tin?: string; }) => void;
  onDeleteSupplier: (id: string) => void;
}

export default function SupplierView({
  suppliers,
  onAddSupplier,
  onDeleteSupplier
}: SupplierViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Registration Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [tin, setTin] = useState('');

  const handleOpenRegister = () => {
    setName('');
    setPhone('');
    setAddress('');
    setEmail('');
    setTin('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddSupplier({
      name: name.trim(),
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      email: email.trim() || undefined,
      tin: tin.trim() || undefined
    });

    setIsModalOpen(false);
  };

  const filtered = suppliers.filter(s => {
    const q = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || 
           (s.tin && s.tin.toLowerCase().includes(q)) ||
           (s.address && s.address.toLowerCase().includes(q));
  });

  return (
    <div className="flex flex-col gap-5 w-full text-slate-800" id="supplier-view-canvas">
      
      {/* Top action bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="relative max-w-xs w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Search suppliers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 h-9 bg-white border border-slate-200 rounded-lg text-xs font-semibold placeholder-slate-450 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        <button
          onClick={handleOpenRegister}
          className="h-9 px-4 bg-[#033096] hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition flex items-center space-x-2 cursor-pointer shadow-down shadow-blue-900/10"
        >
          <Plus size={14} strokeWidth={2.5} />
          <span>+ Register Supplier</span>
        </button>
      </div>

      {/* Directory Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left table-auto border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold tracking-wide">
                <th className="p-3.5 w-16 text-center">No</th>
                <th className="p-3.5">Supplier Name</th>
                <th className="p-3.5">Phone Number</th>
                <th className="p-3.5">Contact Email</th>
                <th className="p-3.5">Address</th>
                <th className="p-3.5">Tax registration / TIN Code</th>
                <th className="p-3.5 w-28">Registered Date</th>
                <th className="p-3.5 w-20 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400 italic">
                    No registered suppliers found.
                  </td>
                </tr>
              ) : (
                filtered.map((sup, index) => (
                  <tr key={sup.id} className="hover:bg-slate-50/50 transition duration-150 align-middle">
                    <td className="p-3.5 text-center font-bold text-slate-400">{index + 1}</td>
                    
                    {/* Supplier Name */}
                    <td className="p-3.5">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 bg-blue-100 text-blue-700 font-bold rounded-full flex items-center justify-center text-[10px] uppercase shrink-0 select-none">
                          {sup.name.substring(0, 2)}
                        </div>
                        <span className="font-bold text-slate-900">{sup.name}</span>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="p-3.5 font-mono text-slate-500">{sup.phone || '-'}</td>

                    {/* Email */}
                    <td className="p-3.5 text-slate-600">{sup.email || '-'}</td>

                    {/* Address */}
                    <td className="p-3.5 text-slate-500">{sup.address || '-'}</td>

                    {/* TIN */}
                    <td className="p-3.5">
                      {sup.tin ? (
                        <span className="font-mono text-[10px] bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded leading-none font-bold">
                          {sup.tin}
                        </span>
                      ) : '-'}
                    </td>

                    {/* Registered Date */}
                    <td className="p-3.5 text-slate-450 text-[11px]">{sup.createdAt}</td>

                    {/* Action delete button */}
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete supplier "${sup.name}"?`)) {
                            onDeleteSupplier(sup.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded transition cursor-pointer"
                        title="Delete Supplier"
                      >
                        <Trash2 size={13} strokeWidth={2.5} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reg Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-3xs z-50 flex items-center justify-center p-4 select-none">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-[#033096] text-white px-5 py-3.5 flex items-center justify-between">
              <span className="text-sm font-bold">Register New Supplier</span>
              <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white p-1 rounded">
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-left">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Supplier Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ethio Trading PLC"
                  className="h-9 px-3 bg-white border border-slate-200 focus:border-blue-500 focus:outline-none rounded-lg text-xs font-semibold"
                  required
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +251 11 123456"
                  className="h-9 px-3 bg-white border border-slate-200 focus:border-blue-500 focus:outline-none rounded-lg text-xs font-semibold"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. sales@ethiotrading.com"
                  className="h-9 px-3 bg-white border border-slate-200 focus:border-blue-500 focus:outline-none rounded-lg text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Address Location</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Addis Ababa"
                    className="h-9 px-3 bg-white border border-slate-200 focus:border-blue-500 focus:outline-none rounded-lg text-xs font-semibold"
                  />
                </div>
                
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">TIN Code</label>
                  <input
                    type="text"
                    value={tin}
                    onChange={(e) => setTin(e.target.value)}
                    placeholder="e.g. TIN-445892"
                    className="h-9 px-3 bg-white border border-slate-200 focus:border-blue-500 focus:outline-none rounded-lg text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 h-9 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 h-9 bg-[#033096] hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition shadow-sm"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
