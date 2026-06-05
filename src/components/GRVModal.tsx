import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Store, Material, PurchaseRequisition, Supplier, BinCardTransaction, SystemUser } from '../types';

interface GRVModalProps {
  isOpen: boolean;
  onClose: () => void;
  stores: Store[];
  materials: Material[];
  purchaseRequisitions: PurchaseRequisition[];
  suppliers: Supplier[];
  users: SystemUser[];
  onSave: (transactions: { materialId: string; tx: Omit<BinCardTransaction, 'id' | 'materialId'> }[]) => void;
}

interface GRVLineItem {
  id: string;
  materialId: string;
  requestedQty: number;
  receivedQty: number;
  receiveType: string;
  damagedQty: number;
}

export default function GRVModal({
  isOpen,
  onClose,
  stores,
  materials,
  purchaseRequisitions,
  suppliers,
  users,
  onSave
}: GRVModalProps) {
  const [gcDate, setGcDate] = useState('2026-06-03');
  const [type, setType] = useState('Request');
  const [selectedPrId, setSelectedPrId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [supplierInvoice, setSupplierInvoice] = useState('');
  const [driverName, setDriverName] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [padRefNo, setPadRefNo] = useState('');
  const [receivingType, setReceivingType] = useState('Single Complete Order');
  const [donation, setDonation] = useState('');
  const [waybillNo, setWaybillNo] = useState('');
  const [isVoid, setIsVoid] = useState(false);

  // Sign-offs dropdown users
  const [preparedBy, setPreparedBy] = useState('Nahom Sisay');
  const [checkedById, setCheckedById] = useState('');
  const [approvedById, setApprovedById] = useState('');
  const [qaApprovedById, setQaApprovedById] = useState('');
  
  // Line items
  const [lineItems, setLineItems] = useState<GRVLineItem[]>([]);
  const [error, setError] = useState('');

  // Initial Form Seeding
  useEffect(() => {
    if (isOpen) {
      setGcDate(new Date().toISOString().split('T')[0]);
      setType('Request');
      setSelectedPrId(purchaseRequisitions[0]?.id || '');
      setLocationId(stores[0]?.id || '');
      setSupplierId(suppliers[0]?.id || '');
      setSupplierInvoice('');
      setDriverName('');
      setPlateNumber('');
      
      // Auto-filled Pad Reference No
      setPadRefNo(`PAD-${Math.floor(10000 + Math.random() * 90000)}`);
      setReceivingType('Single Complete Order');
      setDonation('');
      setWaybillNo('');
      setIsVoid(false);

      // Select defaults for users
      const controllers = users.filter(u => u.role === 'Stock Controller');
      const managers = users.filter(u => u.role === 'Warehouse Manager');
      const pmUsers = users.filter(u => u.role === 'Project Manager');
      setCheckedById(controllers[0]?.id || users[2]?.id || '');
      setApprovedById(managers[0]?.id || users[3]?.id || '');
      setQaApprovedById(pmUsers[0]?.id || managers[0]?.id || '');
      
      // Default line item
      setLineItems([]);
      setError('');
    }
  }, [isOpen, stores, purchaseRequisitions, suppliers, users]);

  // Adjust default line item when locationId changes
  useEffect(() => {
    if (isOpen && locationId) {
      const locationMaterials = materials.filter(m => m.storeId === locationId);
      if (locationMaterials.length > 0) {
        setLineItems([
          {
            id: `item-${Date.now()}`,
            materialId: locationMaterials[0].id,
            requestedQty: 100,
            receivedQty: 100,
            receiveType: 'Full Complete Order',
            damagedQty: 0
          }
        ]);
      } else {
        setLineItems([]);
      }
    }
  }, [locationId, isOpen, materials]);

  if (!isOpen) return null;

  // Filter materials based on selected Location (retianing per-store logic)
  const availableMaterials = locationId 
    ? materials.filter(m => m.storeId === locationId)
    : materials;

  const handleAddRow = () => {
    if (availableMaterials.length === 0) {
      setError('No registered materials exist in this store yet. Change store location or add a material first.');
      return;
    }
    setLineItems(prev => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        materialId: availableMaterials[0].id,
        requestedQty: 100,
        receivedQty: 100,
        receiveType: 'Full Complete Order',
        damagedQty: 0
      }
    ]);
  };

  const handleRemoveRow = (id: string) => {
    setLineItems(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateLineItem = (id: string, field: keyof GRVLineItem, value: string | number) => {
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

    if (!locationId) return setError('Location store is required.');
    if (lineItems.length === 0) return setError('Please add at least one material voucher line.');
    
    // Check if any line has an invalid material
    const hasInvalidLine = lineItems.some(item => !item.materialId);
    if (hasInvalidLine) return setError('Please select a valid material for all lines.');

    // Save as distinct bin card transactions
    const transactionsToSave = lineItems.map(item => {
      const mat = materials.find(m => m.id === item.materialId)!;
      return {
        materialId: item.materialId,
        tx: {
          date: gcDate,
          grnSivNo: isVoid ? 'VOID-GRN' : padRefNo || `GRN-${Math.floor(1000 + Math.random() * 9000)}`,
          receivedQty: isVoid ? 0 : Number(item.receivedQty),
          plateNumber: plateNumber || undefined,
          unitPrice: mat.unitPrice,
          remark: `GRV Registered. Type: ${type}, Supplier Invoice: ${supplierInvoice || 'N/A'}${item.damagedQty > 0 ? `, Damaged Qty: ${item.damagedQty}` : ''}`,
          signature: 'N.S.', // Initials of keeper
          balance: 0, // Will be evaluated dynamically by save handler
          checkedById: checkedById,
          approvedById: approvedById,
          qaApprovedById: qaApprovedById
        }
      };
    });

    onSave(transactionsToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none" id="grv-modal">
      <div className="fixed inset-0 bg-slate-900/60 transition-opacity duration-300 backdrop-blur-xs" onClick={onClose}></div>

      {/* Extreme modal container stretching wide */}
      <div className="relative w-full max-w-5xl mx-auto my-6 px-4 z-10">
        <div className="relative flex flex-col w-full bg-white border border-slate-100 rounded-xl shadow-2xl outline-none">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-[#f9fafb] rounded-t-xl select-none">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Good-Received
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-200/50 rounded-lg text-slate-400 hover:text-slate-600 transition"
              id="close-grv-btn"
            >
              <X size={15} strokeWidth={2.5} />
            </button>
          </div>

          <form onSubmit={handleSaveForm} className="p-6 overflow-y-auto max-h-[80vh] space-y-6 text-left">
            {error && (
              <div className="p-3 bg-red-50 text-red-650 rounded-lg text-xs font-semibold leading-relaxed border border-red-100">
                {error}
              </div>
            )}

            {/* Form grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* 1. Date */}
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  <span className="text-red-505 mr-0.5">*</span>GC Date
                </label>
                <input
                  type="date"
                  required
                  value={gcDate}
                  onChange={(e) => setGcDate(e.target.value)}
                  className="h-10 px-3 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 shadow-3xs"
                />
              </div>

              {/* 2. Type */}
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 outline-none shadow-3xs"
                >
                  <option value="Request">Request</option>
                  <option value="Direct Receipt">Direct Receipt</option>
                  <option value="Donation">Donation</option>
                  <option value="Transfer In">Transfer In</option>
                </select>
              </div>

              {/* 3. PR */}
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">PR</label>
                <select
                  value={selectedPrId}
                  onChange={(e) => setSelectedPrId(e.target.value)}
                  className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 outline-none shadow-3xs"
                >
                  <option value="">Select Requisition reference</option>
                  {purchaseRequisitions.map(pr => (
                    <option key={pr.id} value={pr.id}>
                      {pr.code} - {pr.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Location */}
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  <span className="text-red-505 mr-0.5">*</span>Location
                </label>
                <select
                  required
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 outline-none shadow-3xs"
                >
                  <option value="">Select target physical store</option>
                  {stores.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.city})
                    </option>
                  ))}
                </select>
              </div>

              {/* 5. Supplier */}
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Supplier</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 outline-none shadow-3xs"
                >
                  <option value="">Select vendor</option>
                  {suppliers.map(sup => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 6. Supplier Invoice */}
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Supplier Invoice</label>
                <input
                  type="text"
                  placeholder="Invoice number"
                  value={supplierInvoice}
                  onChange={(e) => setSupplierInvoice(e.target.value)}
                  className="h-10 px-3 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 outline-none shadow-3xs"
                />
              </div>

              {/* 7. Driver Name */}
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Driver Name</label>
                <input
                  type="text"
                  placeholder="name"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="h-10 px-3 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                />
              </div>

              {/* 8. Plate Number */}
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Plate Number</label>
                <input
                  type="text"
                  placeholder="plate no"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  className="h-10 px-3 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                />
              </div>

              {/* 9. Pad Reference Number */}
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

              {/* 10. Receiving Type */}
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  <span className="text-red-505 mr-0.5">*</span>Receiving Type
                </label>
                <select
                  value={receivingType}
                  onChange={(e) => setReceivingType(e.target.value)}
                  className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none outline-none shadow-3xs"
                >
                  <option value="Single Complete Order">Single Complete Order</option>
                  <option value="Partial Delivery">Partial Delivery</option>
                  <option value="Bulk Stage">Bulk Stage</option>
                </select>
              </div>

              {/* 11. Donation */}
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Donation</label>
                <input
                  type="text"
                  placeholder="N/A"
                  value={donation}
                  onChange={(e) => setDonation(e.target.value)}
                  className="h-10 px-3 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                />
              </div>

              {/* 12. Waybill No */}
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Waybill No</label>
                <input
                  type="text"
                  placeholder="Waybill reference"
                  value={waybillNo}
                  onChange={(e) => setWaybillNo(e.target.value)}
                  className="h-10 px-3 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                />
              </div>

            </div>

            {/* Void Checkbox wrapper block */}
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

            {/* Dynamic line items spreadsheet */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Line Items Specification
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
                        <th className="p-3 min-w-[180px]">Material Descriptor</th>
                        <th className="p-3">Material Class</th>
                        <th className="p-3 w-20">Unit</th>
                        <th className="p-3 w-28">Requested Qty</th>
                        <th className="p-3 w-28">Received Qty</th>
                        <th className="p-3">Receive Type</th>
                        <th className="p-3 w-28">Damaged Qty</th>
                        <th className="p-3 w-12 text-center">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {lineItems.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-slate-400">
                            No active voucher specifications. Click "+ Add Material Row" above.
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
                                    const selectedId = e.target.value;
                                    const matched = materials.find(m => m.id === selectedId);
                                    handleUpdateLineItem(item.id, 'materialId', selectedId);
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

                              {/* Material Class */}
                              <td className="p-3 text-slate-505 font-semibold">
                                {activeMat?.category.toUpperCase() || 'N/A'}
                              </td>

                              {/* Unit */}
                              <td className="p-3 text-slate-500 font-semibold text-center">
                                {activeMat?.unit || '-'}
                              </td>

                              {/* Requested Qty */}
                              <td className="p-2">
                                <input
                                  type="number"
                                  min={0.1}
                                  step="any"
                                  value={item.requestedQty}
                                  onChange={(e) => handleUpdateLineItem(item.id, 'requestedQty', Number(e.target.value))}
                                  className="w-full h-8 px-2 border border-slate-200 rounded text-xs text-right"
                                />
                              </td>

                              {/* Received Qty */}
                              <td className="p-2">
                                <input
                                  type="number"
                                  min={0.1}
                                  step="any"
                                  value={item.receivedQty}
                                  onChange={(e) => handleUpdateLineItem(item.id, 'receivedQty', Number(e.target.value))}
                                  className="w-full h-8 px-2 border border-slate-200 rounded text-xs text-right font-bold focus:border-blue-650"
                                />
                              </td>

                              {/* Receive Type */}
                              <td className="p-2">
                                <select
                                  value={item.receiveType}
                                  onChange={(e) => handleUpdateLineItem(item.id, 'receiveType', e.target.value)}
                                  className="w-full h-8 px-2 bg-white border border-slate-200 rounded text-xs outline-none"
                                >
                                  <option value="Full Complete Order">Full Complete Order</option>
                                  <option value="Partial Stage">Partial Stage</option>
                                  <option value="Substituted item">Substituted item</option>
                                </select>
                              </td>

                              {/* Damaged Qty */}
                              <td className="p-2">
                                <input
                                  type="number"
                                  min={0}
                                  value={item.damagedQty}
                                  onChange={(e) => handleUpdateLineItem(item.id, 'damagedQty', Number(e.target.value))}
                                  className="w-full h-8 px-2 border border-slate-200 rounded text-xs text-right focus:border-red-400"
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50/50 p-4 border border-slate-150 rounded-xl mt-6">
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

              {/* QA Approved By */}
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-slate-455 uppercase mb-1">
                  QA Approved By
                </label>
                <select
                  value={qaApprovedById}
                  onChange={(e) => setQaApprovedById(e.target.value)}
                  className="h-9 px-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="">Pending QA (Not Approved)</option>
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
