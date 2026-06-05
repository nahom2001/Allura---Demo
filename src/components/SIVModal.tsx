import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Store, Material, SystemUser, BinCardTransaction } from '../types';

interface SIVModalProps {
  isOpen: boolean;
  onClose: () => void;
  stores: Store[];
  materials: Material[];
  users: SystemUser[];
  onSave: (transactions: { materialId: string; tx: Omit<BinCardTransaction, 'id' | 'materialId'> }[]) => void;
}

interface SIVLineItem {
  id: string;
  materialId: string;
  issueQty: number;
  remarks: string;
}

export default function SIVModal({
  isOpen,
  onClose,
  stores,
  materials,
  users,
  onSave
}: SIVModalProps) {
  const [date, setDate] = useState('2026-06-03');
  const [warehouseId, setWarehouseId] = useState('');
  const [project, setProject] = useState('Phison Realstate SC site');
  const [storeRequisition, setStoreRequisition] = useState('MR-0010');
  const [padRefNo, setPadRefNo] = useState('');
  const [issuedTo, setIssuedTo] = useState('Block B Tiling Works');
  const [plateNumber, setPlateNumber] = useState('');
  const [department, setDepartment] = useState('Construction');
  const [isVoid, setIsVoid] = useState(false);
  const [purpose, setPurpose] = useState('');

  // Sign-offs dropdown users
  const [preparedBy, setPreparedBy] = useState('Nahom Sisay');
  const [issuedById, setIssuedById] = useState('');
  const [receivedById, setReceivedById] = useState('');
  const [checkedById, setCheckedById] = useState('');
  const [approvedById, setApprovedById] = useState('');

  // Line Items
  const [lineItems, setLineItems] = useState<SIVLineItem[]>([]);
  const [error, setError] = useState('');

  // Initial Seed
  useEffect(() => {
    if (isOpen) {
      setDate(new Date().toISOString().split('T')[0]);
      setWarehouseId(stores[0]?.id || '');
      setProject('Phison Realstate SC site');
      setStoreRequisition('MR-0010');
      setPadRefNo(`PAD-${Math.floor(20000 + Math.random() * 80000)}`);
      setIssuedTo('Block B Tiling Works');
      setPlateNumber('');
      setDepartment('Construction');
      setIsVoid(false);
      setPurpose('For ongoing internal masonry activities.');
      
      // Select defaults for users
      const keepers = users.filter(u => u.role === 'Store Keeper');
      const managers = users.filter(u => u.role === 'Warehouse Manager');
      const controllers = users.filter(u => u.role === 'Stock Controller');
      const pms = users.filter(u => u.role === 'Project Manager');

      setIssuedById(keepers[0]?.id || users[0]?.id || '');
      setReceivedById(pms[0]?.id || users[1]?.id || '');
      setCheckedById(controllers[0]?.id || users[2]?.id || '');
      setApprovedById(managers[0]?.id || users[3]?.id || '');
      
      setLineItems([]);
      setError('');
    }
  }, [isOpen, stores, users]);

  // Handle warehouse changes to load materials corresponding only to that specific store (retaining per-store logic)
  useEffect(() => {
    if (isOpen && warehouseId) {
      const warehouseMaterials = materials.filter(m => m.storeId === warehouseId);
      if (warehouseMaterials.length > 0) {
        setLineItems([
          {
            id: `item-${Date.now()}`,
            materialId: warehouseMaterials[0].id,
            issueQty: 5,
            remarks: 'Standard floor installation'
          }
        ]);
      } else {
        setLineItems([]);
      }
    }
  }, [warehouseId, isOpen, materials]);

  if (!isOpen) return null;

  // Selectable materials inside the chosen warehouse
  const availableMaterials = warehouseId
    ? materials.filter(m => m.storeId === warehouseId)
    : materials;

  const handleAddRow = () => {
    if (availableMaterials.length === 0) {
      setError('No registered materials exist in this store. Please select another warehouse or log starting balances.');
      return;
    }
    setLineItems(prev => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        materialId: availableMaterials[0].id,
        issueQty: 1,
        remarks: ''
      }
    ]);
  };

  const handleRemoveRow = (id: string) => {
    setLineItems(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateLineItem = (id: string, field: keyof SIVLineItem, value: string | number) => {
    setLineItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!warehouseId) return setError('Warehouse store is required.');
    if (lineItems.length === 0) return setError('Please specify at least one item row to issue.');

    // Validate stocks levels prior to completing order
    for (const item of lineItems) {
      if (!item.materialId) return setError('Please select a valid material.');
      const mat = materials.find(m => m.id === item.materialId);
      if (!mat) continue;

      if (!isVoid && item.issueQty > mat.quantity) {
        return setError(`Insufficient Stock! Cannot issue ${item.issueQty} ${mat.unit} of "${mat.description}". Only ${mat.quantity} ${mat.unit} available in stock.`);
      }
    }

    // Save as distinct SIV bin card transactions. 
    // This correctly updates quantities and propagates the SIV changes to their individual bin cards.
    const transactionsToSave = lineItems.map(item => {
      const mat = materials.find(m => m.id === item.materialId)!;
      const signatureUser = users.find(u => u.id === issuedById)?.initials || 'N.S.';
      return {
        materialId: item.materialId,
        tx: {
          date: date,
          grnSivNo: isVoid ? 'VOID-SIV' : padRefNo || `SIV-${Math.floor(1000 + Math.random() * 9000)}`,
          issuedQty: isVoid ? 0 : Number(item.issueQty),
          plateNumber: plateNumber || undefined,
          unitPrice: mat.unitPrice,
          remark: `SIV Registered. To House/Block: ${issuedTo}. Purpose: ${purpose}${item.remarks ? ` [${item.remarks}]` : ''}`,
          signature: signatureUser,
          balance: 0, // Will be evaluated dynamically by save handler
          checkedById: checkedById,
          approvedById: approvedById
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
                Store Issue
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-200/50 rounded-lg text-slate-400 hover:text-slate-600 transition"
              id="close-siv-btn"
            >
              <X size={15} strokeWidth={2.5} />
            </button>
          </div>

          <form onSubmit={handleSaveForm} className="p-6 overflow-y-auto max-h-[80vh] space-y-6 text-left">
            {error && (
              <div className="p-3 bg-red-50 text-red-650 rounded-lg text-xs font-semibold leading-relaxed border border-red-100 animate-pulse">
                {error}
              </div>
            )}

            {/* Layout grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* 1. Date */}
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  <span className="text-red-505 mr-0.5">*</span>Date
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-10 px-3 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 shadow-3xs"
                />
              </div>

              {/* 2. Warehouse select */}
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  <span className="text-red-505 mr-0.5">*</span>Warehouse
                </label>
                <select
                  required
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 outline-none shadow-3xs"
                >
                  <option value="">Select dispatch store</option>
                  {stores.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.city})
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Project/Department */}
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  <span className="text-red-505 mr-0.5">*</span>Project / Department
                </label>
                <input
                  type="text"
                  required
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  placeholder="project"
                  className="h-10 px-3 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 shadow-3xs"
                />
              </div>

              {/* 4. Store Requisition reference */}
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  <span className="text-red-505 mr-0.5">*</span>Store Requisition
                </label>
                <input
                  type="text"
                  required
                  value={storeRequisition}
                  onChange={(e) => setStoreRequisition(e.target.value)}
                  placeholder="MR number"
                  className="h-10 px-3 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 shadow-3xs"
                />
              </div>

              {/* 5. Pad Reference Number */}
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Pad Reference Number</label>
                <input
                  type="text"
                  placeholder="ref"
                  value={padRefNo}
                  onChange={(e) => setPadRefNo(e.target.value)}
                  className="h-10 px-3 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                />
              </div>

              {/* 6. Issued to House/Block */}
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  <span className="text-red-505 mr-0.5">*</span>Issued to House / Block
                </label>
                <input
                  type="text"
                  required
                  placeholder="issued"
                  value={issuedTo}
                  onChange={(e) => setIssuedTo(e.target.value)}
                  className="h-10 px-3 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                />
              </div>

              {/* 7. Vehicle plate */}
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Vehicle / Car Plate Number</label>
                <input
                  type="text"
                  placeholder="plate number"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  className="h-10 px-3 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                />
              </div>

              {/* 8. Department */}
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Department</label>
                <input
                  type="text"
                  placeholder="name of department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="h-10 px-3 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                />
              </div>

            </div>

            {/* Void Checkbox */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Voucher State</span>
              <label className="flex items-center space-x-2 text-xs font-medium text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isVoid}
                  onChange={(e) => setIsVoid(e.target.checked)}
                  className="w-4 h-4 text-blue-650 border-slate-300 rounded focus:ring-blue-500"
                />
                <span>Void</span>
              </label>
            </div>

            {/* Purpose */}
            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Purpose</label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={2}
                placeholder="Explain why materials are being issued..."
                className="w-full p-3 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 outline-none transition"
              />
            </div>

            {/* Dynamic line items spreadsheet */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Distribution specification
                </h4>
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="px-3 py-1.5 border border-[#033096]/20 text-[#033096] bg-[#033096]/5 hover:bg-[#033096]/10 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={12} strokeWidth={2.5} />
                  <span>+ Add Material Row</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-3xs bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                        <th className="p-3 w-12 text-center">No</th>
                        <th className="p-3 min-w-[200px]">Material Descriptor</th>
                        <th className="p-3 w-20">Unit</th>
                        <th className="p-3 w-28">In Stock</th>
                        <th className="p-3 w-32">Issue Qty</th>
                        <th className="p-3">Remarks</th>
                        <th className="p-3 w-12 text-center">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {lineItems.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400">
                            No materials selected. Click "+ Add Material Row" above.
                          </td>
                        </tr>
                      ) : (
                        lineItems.map((item, idx) => {
                          const activeMat = materials.find(m => m.id === item.materialId);
                          return (
                            <tr key={item.id} className="hover:bg-slate-55">
                              <td className="p-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                              
                              {/* Material Select */}
                              <td className="p-2">
                                <select
                                  value={item.materialId}
                                  onChange={(e) => {
                                    handleUpdateLineItem(item.id, 'materialId', e.target.value);
                                  }}
                                  className="w-full h-8 px-2 bg-white border border-slate-200 rounded text-xs outline-none"
                                >
                                  {availableMaterials.length === 0 ? (
                                    <option value="">No materials in this store</option>
                                  ) : (
                                    availableMaterials.map(m => (
                                      <option key={m.id} value={m.id}>
                                        {m.code} - {m.description}
                                      </option>
                                    ))
                                  )}
                                </select>
                              </td>

                              {/* Unit */}
                              <td className="p-3 text-slate-500 font-semibold text-center">
                                {activeMat?.unit || '-'}
                              </td>

                              {/* In Stock */}
                              <td className="p-3 text-slate-600 font-bold text-center">
                                {activeMat ? activeMat.quantity : 0}
                              </td>

                              {/* Issue Qty */}
                              <td className="p-2">
                                <input
                                  type="number"
                                  min={0.1}
                                  step="any"
                                  value={item.issueQty}
                                  onChange={(e) => handleUpdateLineItem(item.id, 'issueQty', Number(e.target.value))}
                                  className="w-full h-8 px-2 border border-slate-200 rounded text-xs text-right font-bold focus:border-red-500"
                                />
                              </td>

                              {/* Remarks */}
                              <td className="p-2">
                                <input
                                  type="text"
                                  placeholder="e.g. wall installation"
                                  value={item.remarks}
                                  onChange={(e) => handleUpdateLineItem(item.id, 'remarks', e.target.value)}
                                  className="w-full h-8 px-2 border border-slate-200 rounded text-xs"
                                />
                              </td>

                              {/* Actions */}
                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveRow(item.id)}
                                  className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-slate-50 cursor-pointer"
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
              </div>
            </div>

            {/* Sign-offs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-slate-50/50 p-4 border border-slate-150 rounded-xl mt-6">
              {/* Prepared By (Automatic current worker) */}
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-slate-450 uppercase mb-1">Prepared By</label>
                <input
                  type="text"
                  readOnly
                  value={preparedBy}
                  className="h-9 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 outline-none"
                />
              </div>

              {/* Issued By */}
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-slate-455 uppercase mb-1">
                  <span className="text-red-505 mr-0.5">*</span>Issued By
                </label>
                <select
                  required
                  value={issuedById}
                  onChange={(e) => setIssuedById(e.target.value)}
                  className="h-9 px-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="">Select issuer</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              {/* Received By */}
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-slate-455 uppercase mb-1">Received By</label>
                <select
                  value={receivedById}
                  onChange={(e) => setReceivedById(e.target.value)}
                  className="h-9 px-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="">Select recipient</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              {/* Checked By */}
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-slate-455 uppercase mb-1">
                  <span className="text-red-505 mr-0.5">*</span>Checked By
                </label>
                <select
                  required
                  value={checkedById}
                  onChange={(e) => setCheckedById(e.target.value)}
                  className="h-9 px-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="">Select reviewer</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              {/* Approved By */}
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-slate-455 uppercase mb-1">
                  <span className="text-red-505 mr-0.5">*</span>Approved By
                </label>
                <select
                  required
                  value={approvedById}
                  onChange={(e) => setApprovedById(e.target.value)}
                  className="h-9 px-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="">Select approver</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Modal footers */}
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
