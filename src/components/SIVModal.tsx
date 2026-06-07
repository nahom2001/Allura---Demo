import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { Store, Material, SystemUser, BinCardTransaction } from '../types';

interface SIVModalProps {
  isOpen: boolean;
  onClose: () => void;
  stores: Store[];
  materials: Material[];
  users: SystemUser[];
  onSave: (transactions: { materialId: string; tx: Omit<BinCardTransaction, 'id' | 'materialId'> }[]) => void;
}

interface SivFormItem {
  id: string;
  materialId: string;
  quantity: number;
  unitPrice: number;
  remark: string;
}

export default function SIVModal({
  isOpen,
  onClose,
  stores,
  materials,
  users,
  onSave
}: SIVModalProps) {
  const [sivFormDate, setSivFormDate] = useState<string>('');
  const [sivFormNo, setSivFormNo] = useState<string>('');
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [sivFormProject, setSivFormProject] = useState<string>('Phison Realstate SC site');
  const [sivFormRequisitionNo, setSivFormRequisitionNo] = useState<string>('MR-1010');
  
  // Sign-offs selectors
  const [sivFormRequestedBy, setSivFormRequestedBy] = useState<string>('');
  const [sivFormApprovedBy, setSivFormApprovedBy] = useState<string>('');
  const [sivFormIssuedBy, setSivFormIssuedBy] = useState<string>('');

  const [sivFormItems, setSivFormItems] = useState<SivFormItem[]>([]);
  const [error, setError] = useState<string>('');

  // Initial Seed when modal opens
  useEffect(() => {
    if (isOpen) {
      setSivFormDate(new Date().toISOString().split('T')[0]);
      setSivFormNo('');
      setWarehouseId(stores[0]?.id || '');
      setSivFormProject('Phison Realstate SC site');
      setSivFormRequisitionNo(`MR-${Math.floor(1000 + Math.random() * 9000)}`);
      
      const keepers = users.filter(u => u.role === 'Store Keeper');
      const managers = users.filter(u => u.role === 'Warehouse Manager' || u.role === 'Stock Controller');
      const pms = users.filter(u => u.role === 'Project Manager');

      setSivFormIssuedBy(keepers[0]?.id || users[0]?.id || '');
      setSivFormRequestedBy(managers[0]?.id || users[2]?.id || users[0]?.id || '');
      setSivFormApprovedBy(pms[0]?.id || users[1]?.id || users[0]?.id || '');

      setSivFormItems([]);
      setError('');
    }
  }, [isOpen, stores, users]);

  // Synchronize available materials with selected warehouse
  useEffect(() => {
    if (isOpen && warehouseId) {
      const warehouseMaterials = materials.filter(m => m.storeId === warehouseId);
      if (warehouseMaterials.length > 0) {
        setSivFormItems([
          {
            id: `siv-row-${Date.now()}`,
            materialId: warehouseMaterials[0].id,
            quantity: 5,
            unitPrice: warehouseMaterials[0].unitPrice || 450,
            remark: 'Ongoing concrete slab formulation installation'
          }
        ]);
      } else {
        setSivFormItems([]);
      }
    }
  }, [warehouseId, isOpen, materials]);

  if (!isOpen) return null;

  const availableMaterials = warehouseId
    ? materials.filter(m => m.storeId === warehouseId)
    : materials;

  const handleAddSivFormRow = () => {
    if (availableMaterials.length === 0) {
      setError('No registered materials exist in this store. Please select another warehouse.');
      return;
    }
    const newItem: SivFormItem = {
      id: `siv-row-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      materialId: availableMaterials[0].id,
      quantity: 1,
      unitPrice: availableMaterials[0].unitPrice || 450,
      remark: 'Issued for site operations'
    };
    setSivFormItems(prev => [...prev, newItem]);
    setError('');
  };

  const handleRemoveSivFormRow = (id: string) => {
    setSivFormItems(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateSivFormRow = (id: string, field: keyof SivFormItem, value: any) => {
    setSivFormItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'materialId') {
          const mat = materials.find(m => m.id === value);
          if (mat) {
            updated.unitPrice = mat.unitPrice || 450;
          }
        }
        return updated;
      }
      return item;
    }));
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!warehouseId) {
      setError('Please select a dispatch warehouse store.');
      return;
    }
    if (sivFormItems.length === 0) {
      setError('Please specify at least one material descriptor row.');
      return;
    }

    // Validate stocks levels prior to completing order
    for (const item of sivFormItems) {
      if (!item.materialId) {
        setError('Please select a valid material.');
        return;
      }
      const mat = materials.find(m => m.id === item.materialId);
      if (!mat) continue;

      if (item.quantity > mat.quantity) {
        setError(`Insufficient Stock! Cannot issue ${item.quantity} ${mat.unit} of "${mat.description}". Only ${mat.quantity} ${mat.unit} available in stock.`);
        return;
      }
    }

    const generatedNo = sivFormNo || `SIV-${Math.floor(Math.random() * 90000) + 10000}`;

    // Convert individual line rows to parent inventory transaction inputs
    const transactionsToSave = sivFormItems.map((item) => {
      const matDetail = materials.find(m => m.id === item.materialId);
      const signatureUser = users.find(u => u.id === sivFormIssuedBy)?.initials || 'SK';
      return {
        materialId: item.materialId,
        tx: {
          date: sivFormDate,
          grnSivNo: generatedNo,
          issuedQty: Number(item.quantity),
          balance: (matDetail?.quantity || 10) - item.quantity, 
          unitPrice: item.unitPrice,
          remark: `Store Issue Voucher | To House/Block: ${sivFormProject}. Requisition: ${sivFormRequisitionNo} | ${item.remark || 'Ongoing construction deployment'}`,
          signature: signatureUser,
          checkedById: sivFormRequestedBy,
          approvedById: sivFormApprovedBy,
          qaStatus: undefined // Initial validation state: Pending
        }
      };
    });

    onSave(transactionsToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none" id="siv-modal">
      <div className="fixed inset-0 bg-slate-900/60 transition-opacity duration-300 backdrop-blur-xs" onClick={onClose}></div>

      <div className="relative w-full max-w-5xl mx-auto my-6 px-4 z-10">
        <div className="relative flex flex-col w-full bg-white border border-slate-100 rounded-xl shadow-2xl outline-none">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-[#f9fafb] rounded-t-xl select-none">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Register Store Issue Voucher (SIV)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Register paper SIVs to route them to standard audit logs and balance tracking.</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-200/50 rounded-lg text-slate-400 hover:text-slate-600 transition cursor-pointer"
              id="close-siv-btn"
            >
              <X size={15} strokeWidth={2.5} />
            </button>
          </div>

          <form onSubmit={handleSaveForm} className="p-6 overflow-y-auto max-h-[80vh] space-y-6 text-left">
            {error && (
              <div className="p-3.5 bg-[#fff1f0] border border-[#ffccc7] text-[#ff4d4f] rounded-lg text-xs font-semibold leading-relaxed animate-pulse flex items-center gap-2">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Classical Board Simulation Header */}
            <div className="p-4 bg-white border border-[#eaeaea] rounded-[8px] space-y-4">
              <div className="text-center pb-2 border-b border-dashed border-slate-150">
                <h3 className="text-xs font-bold text-slate-700 tracking-wider uppercase font-mono">Store Issue Voucher (SIV) Entry</h3>
              </div>

              {/* 2x2 Field input Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-medium">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[#595959] flex items-center gap-1 font-semibold">ቀን/Date <span className="text-red-500">*</span></span>
                  <input
                    type="date"
                    required
                    value={sivFormDate}
                    onChange={(e) => setSivFormDate(e.target.value)}
                    className="h-8 px-3 border border-[#d9d9d9] rounded hover:border-[#033096] focus:border-[#033096] outline-none bg-white font-medium shadow-3xs"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[#595959] flex items-center gap-1 font-semibold">ቁጥር/No <span className="text-slate-400 font-normal italic">(Leave blank to auto-generate)</span></span>
                  <input
                    type="text"
                    placeholder="e.g. SIV-4822"
                    value={sivFormNo}
                    onChange={(e) => setSivFormNo(e.target.value)}
                    className="h-8 px-3 border border-[#d9d9d9] rounded hover:border-[#033096] focus:border-[#033096] outline-none shadow-3xs"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[#595959] flex items-center gap-1 font-semibold">Warehouse / Dispatch Store <span className="text-red-500">*</span></span>
                  <select
                    required
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    className="h-8 px-2 bg-white border border-[#d9d9d9] rounded hover:border-[#033096] focus:border-[#033096] outline-none text-xs shadow-3xs cursor-pointer"
                  >
                    <option value="">Select dispatch store</option>
                    {stores.map(st => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[#595959] flex items-center gap-1 font-semibold">መመሪያ / ክፍል / Project Site <span className="text-red-500">*</span></span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gotera Project Site"
                    value={sivFormProject}
                    onChange={(e) => setSivFormProject(e.target.value)}
                    className="h-8 px-3 border border-[#d9d9d9] rounded hover:border-[#033096] focus:border-[#033096] outline-none shadow-3xs"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[#595959] flex items-center gap-1 font-semibold">Store Requisition No <span className="text-red-500">*</span></span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MR-0010"
                    value={sivFormRequisitionNo}
                    onChange={(e) => setSivFormRequisitionNo(e.target.value)}
                    className="h-8 px-3 border border-[#d9d9d9] rounded hover:border-[#033096] focus:border-[#033096] outline-none shadow-3xs"
                  />
                </div>
              </div>
            </div>

            {/* Layout grid for items */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center bg-white p-3 border border-b-0 border-[#f0f0f0] rounded-t-[8px]">
                <span className="font-bold text-[#1a1a1a] uppercase tracking-wider text-[11px]">Material Items Spreadsheet Specification</span>
              </div>

              <div className="border border-[#e8e8e8] rounded-b-[8px] overflow-hidden bg-white shadow-3xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-[#e8e8e8] text-slate-550 font-bold uppercase tracking-tight text-[10px]">
                        <th className="p-2.5 w-10 text-center">No</th>
                        <th className="p-2.5 min-w-[200px]">የእቃ ስም / መግለጫ (Item Descriptor)</th>
                        <th className="p-2.5 w-16 text-center">Unit</th>
                        <th className="p-2.5 w-24 text-center">In Stock</th>
                        <th className="p-2.5 w-24 text-right">ብዛት/Qty</th>
                        <th className="p-2.5 w-24 text-right">Unit Price</th>
                        <th className="p-2.5 w-28 text-right">Total Price</th>
                        <th className="p-2.5 min-w-[120px]">Remark</th>
                        <th className="p-2.5 w-12 text-center">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {sivFormItems.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-6 text-center text-slate-400 italic">
                            No material rows added. Click "+ Add Material Row" below to insert.
                          </td>
                        </tr>
                      ) : (
                        sivFormItems.map((item, index) => {
                          const selectedMat = materials.find(m => m.id === item.materialId);
                          const itemTotal = item.quantity * item.unitPrice;
                          return (
                            <tr key={item.id} className="hover:bg-slate-50/50">
                              <td className="p-2.5 text-center text-slate-400 font-bold">{index + 1}</td>
                              
                              {/* Material Selection Dropdown */}
                              <td className="p-1.5">
                                <select
                                  value={item.materialId}
                                  onChange={(e) => handleUpdateSivFormRow(item.id, 'materialId', e.target.value)}
                                  className="w-full h-8 pl-1 bg-white border border-[#d9d9d9] hover:border-[#033096] rounded text-xs outline-none cursor-pointer"
                                >
                                  {availableMaterials.length === 0 ? (
                                    <option value="">No materials in selected store</option>
                                  ) : (
                                    availableMaterials.map(m => (
                                      <option key={m.id} value={m.id}>{m.code} - {m.description}</option>
                                    ))
                                  )}
                                </select>
                              </td>

                              {/* Unit column representation */}
                              <td className="p-2.5 text-center text-slate-500 font-semibold uppercase">
                                {selectedMat?.unit || 'Unit'}
                              </td>

                              {/* Instock level dynamically aligned */}
                              <td className="p-2.5 text-center text-slate-600 font-bold bg-[#fafafa]/50">
                                {selectedMat?.quantity ?? 0}
                              </td>

                              {/* Quantity selection input */}
                              <td className="p-1.5 text-right font-semibold">
                                <input
                                  type="number"
                                  min={0.1}
                                  step="any"
                                  value={item.quantity}
                                  onChange={(e) => handleUpdateSivFormRow(item.id, 'quantity', Number(e.target.value))}
                                  className="w-20 h-8 px-2 border border-[#d9d9d9] bg-white text-right focus:border-[#033096] rounded outline-none font-bold"
                                />
                              </td>

                              {/* Active Unit price from bin cards */}
                              <td className="p-1.5 text-right text-slate-500 font-bold">
                                <input
                                  type="number"
                                  step="any"
                                  value={item.unitPrice}
                                  onChange={(e) => handleUpdateSivFormRow(item.id, 'unitPrice', Number(e.target.value))}
                                  className="w-24 h-8 px-2 border border-[#d9d9d9] bg-white text-right focus:border-[#033096] rounded outline-none"
                                />
                              </td>

                              {/* Calculated Total price value */}
                              <td className="p-2.5 text-right font-bold text-slate-800 tracking-tight font-mono">
                                {itemTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>

                              {/* Row custom note remarks */}
                              <td className="p-1.5">
                                <input
                                  type="text"
                                  placeholder="e.g. masonry activity"
                                  value={item.remark}
                                  onChange={(e) => handleUpdateSivFormRow(item.id, 'remark', e.target.value)}
                                  className="w-full h-8 px-2 border border-[#d9d9d9] bg-white rounded text-xs outline-none"
                                />
                              </td>

                              {/* Delete row handler */}
                              <td className="p-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSivFormRow(item.id)}
                                  className="p-1.5 hover:bg-slate-100 rounded text-slate-450 hover:text-red-545 cursor-pointer transition"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Relocated "+" Add Material button to the bottom of the material row list */}
                <div className="p-3 bg-[#fafafa] border-t border-[#e8e8e8] flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddSivFormRow}
                    className="h-8 px-4 bg-white border border-[#d9d9d9] hover:border-[#033096] text-[#033096] hover:text-blue-800 font-semibold text-xs rounded-lg shadow-3xs flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 transition"
                  >
                    <Plus size={13} strokeWidth={2.5} />
                    <span>+ Add Material Row</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Classical Audit flow signatures column layout */}
            <div className="p-4 bg-white border border-[#e8e8e8] rounded-[8px] space-y-4">
              <div className="pb-1 border-b border-[#eaeaea]">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Signatures / Approval Signatures</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[#595959]">Requested By (PM / Supervisor)</span>
                  <select
                    value={sivFormRequestedBy}
                    onChange={(e) => setSivFormRequestedBy(e.target.value)}
                    className="h-8 pl-2 pr-6 bg-white border border-[#d9d9d9] hover:border-[#033096] focus:border-[#033096] rounded text-xs outline-none cursor-pointer"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role.split(' ')[0]})</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[#595959]">Approved By (Finance / Manager)</span>
                  <select
                    value={sivFormApprovedBy}
                    onChange={(e) => setSivFormApprovedBy(e.target.value)}
                    className="h-8 pl-2 pr-6 bg-white border border-[#d9d9d9] hover:border-[#033096] focus:border-[#033096] rounded text-xs outline-none cursor-pointer"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role.split(' ')[0]})</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[#595959]">Issued By (Store Keeper Desk)</span>
                  <select
                    value={sivFormIssuedBy}
                    onChange={(e) => setSivFormIssuedBy(e.target.value)}
                    className="h-8 pl-2 pr-6 bg-white border border-[#d9d9d9] hover:border-[#033096] focus:border-[#033096] rounded text-xs outline-none cursor-pointer"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role.split(' ')[0]})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Form actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-5 h-10 border border-slate-205 hover:bg-slate-50 text-slate-600 hover:text-slate-800 rounded-lg text-xs font-bold transition shadow-3xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 h-10 bg-[#033096] hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition shadow-down shadow-blue-900/10 cursor-pointer"
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
