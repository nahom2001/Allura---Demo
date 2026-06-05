import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Trash2, 
  RotateCcw, 
  Plus, 
  Edit, 
  Eye, 
  X, 
  Search, 
  CheckCircle, 
  Clock, 
  ArrowLeft, 
  AlertCircle 
} from 'lucide-react';
import { PurchaseOrder, Supplier, PurchaseRequisition, PurchaseEvaluation, SystemUser, PurchaseOrderItem } from '../types';

interface PurchaseOrderViewProps {
  suppliers: Supplier[];
  purchaseRequisitions: PurchaseRequisition[];
  evaluations: PurchaseEvaluation[];
  purchaseOrders: PurchaseOrder[];
  onSavePurchaseOrder: (po: PurchaseOrder) => void;
  onDeletePurchaseOrder: (id: string) => void;
  systemUsers: SystemUser[];
}

export default function PurchaseOrderView({
  suppliers,
  purchaseRequisitions,
  evaluations,
  purchaseOrders,
  onSavePurchaseOrder,
  onDeletePurchaseOrder,
  systemUsers
}: PurchaseOrderViewProps) {
  
  // App filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyRequested, setShowOnlyRequested] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal active state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPo, setEditingPo] = useState<PurchaseOrder | null>(null);

  // Print Statement dialog state
  const [activePrintPo, setActivePrintPo] = useState<PurchaseOrder | null>(null);

  // Form fields inside Modal
  const [poNumber, setPoNumber] = useState('');
  const [gcDate, setGcDate] = useState('2026-06-03');
  const [poType, setPoType] = useState('Requested');
  const [selectedEvaluationId, setSelectedEvaluationId] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [tinNumber, setTinNumber] = useState('');
  const [address, setAddress] = useState('');
  const [purchaserName, setPurchaserName] = useState('');
  const [currency, setCurrency] = useState('ETB');
  const [remark, setRemark] = useState('');
  const [deliverySite, setDeliverySite] = useState('Lideta site');
  const [deliveryDate, setDeliveryDate] = useState('2026-06-15');
  const [additionalComments, setAdditionalComments] = useState('');
  
  // Dynamic line items grid
  const [items, setItems] = useState<Omit<PurchaseOrderItem, 'id'>[]>([]);

  // Additional signature/footer parameters
  const [shipmentType, setShipmentType] = useState('Land Freight');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [freightChargeType, setFreightChargeType] = useState('No');
  const [freightChargeAmount, setFreightChargeAmount] = useState<number>(0);
  const [vatRate, setVatRate] = useState<number>(15);
  const [withholdRate, setWithholdRate] = useState<number>(3); // Default 3% from paper

  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);

  // Auto-set supplier details (TIN, Address) when supplier changes
  useEffect(() => {
    if (selectedSupplier) {
      setTinNumber(selectedSupplier.tin || '');
      setAddress(selectedSupplier.address || '');
    }
  }, [selectedSupplierId, suppliers]);

  // Auto-fill lines from Proforma Comparison/Evaluation if selected
  useEffect(() => {
    if (selectedEvaluationId) {
      const evaluation = evaluations.find(e => e.id === selectedEvaluationId);
      if (evaluation) {
        // Auto-fill supplier if there is a winner
        const winningComparison = evaluation.comparisons.find(c => c.status === 'Winner');
        if (winningComparison) {
          setSelectedSupplierId(winningComparison.supplierId);
          
          // Seed item grid with the evaluation's material info
          setItems([
            {
              prNo: evaluation.code,
              description: evaluation.description,
              code: evaluation.srCode,
              unit: evaluation.unit,
              quantity: evaluation.orderedQty,
              unitPrice: winningComparison.price,
              remark: winningComparison.remark || 'Winner from evaluation'
            }
          ]);
        }
      }
    }
  }, [selectedEvaluationId, evaluations]);

  // Calculations
  const calculatedSubTotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const calculatedVatAmount = Number(((calculatedSubTotal * vatRate) / 100).toFixed(2));
  const calculatedAmountWithVat = Number((calculatedSubTotal + calculatedVatAmount).toFixed(2));
  const calculatedWithholdAmount = Number(((calculatedSubTotal * withholdRate) / 100).toFixed(2)); // Withhold is calculated on the pre-VAT sub-total
  const calculatedNetPayableAmount = Number((calculatedAmountWithVat + (freightChargeType === 'Yes' ? freightChargeAmount : 0) - calculatedWithholdAmount).toFixed(2));

  // Handle open creation form
  const handleOpenNewForm = () => {
    setEditingPo(null);
    
    // Suggest sequential PO Number
    const numericCodes = purchaseOrders.map(p => parseInt(p.poNumber.replace(/[^\d]/g, ''), 10)).filter(n => !isNaN(n));
    const nextCode = numericCodes.length > 0 ? Math.max(...numericCodes) + 1 : 97;
    const paddedCode = String(nextCode).padStart(5, '0');
    
    setPoNumber(paddedCode);
    setGcDate('2026-06-03');
    setPoType('Requested');
    setSelectedEvaluationId('');
    setSelectedSupplierId(suppliers[0]?.id || '');
    setTinNumber(suppliers[0]?.tin || '');
    setAddress(suppliers[0]?.address || '');
    setPurchaserName(systemUsers.find(u => u.role === 'Stock Controller' || u.role === 'Store Keeper')?.name || 'Nahom Sisay');
    setCurrency('ETB');
    setRemark('');
    setDeliverySite('Lideta site');
    setDeliveryDate('2026-06-15');
    setAdditionalComments('Please supply/deliver in good order and condition to the specified site in accordance with our conditions.');
    setShipmentType('Land Freight');
    setPaymentMethod('Bank Transfer');
    setFreightChargeType('No');
    setFreightChargeAmount(0);
    setVatRate(15);
    setWithholdRate(3);

    // Initial empty row
    setItems([
      {
        prNo: purchaseRequisitions[0]?.code || '00097',
        description: 'U-head',
        code: '00097',
        unit: 'pcs',
        quantity: 143,
        unitPrice: 60.00,
        remark: ''
      }
    ]);

    setIsFormOpen(true);
  };

  // Handle Edit form
  const handleOpenEditForm = (po: PurchaseOrder) => {
    setEditingPo(po);
    setPoNumber(po.poNumber);
    setGcDate(po.date);
    setPoType(po.type);
    setSelectedEvaluationId(po.evaluationId || '');
    setSelectedSupplierId(po.supplierId);
    setTinNumber(po.tinNumber || '');
    setAddress(po.address || '');
    setPurchaserName(po.purchaserName || '');
    setCurrency(po.currency);
    setRemark(po.remark || '');
    setDeliverySite(po.deliverySite);
    setDeliveryDate(po.deliveryDate);
    setAdditionalComments(po.additionalComments || '');
    setItems(po.items.map(i => ({
      prNo: i.prNo,
      description: i.description,
      code: i.code,
      unit: i.unit,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      remark: i.remark || ''
    })));
    setShipmentType(po.shipmentType);
    setPaymentMethod(po.paymentMethod);
    setFreightChargeType(po.freightChargeType);
    setFreightChargeAmount(po.freightChargeAmount);
    setVatRate(po.vatRate);
    setWithholdRate(po.withholdRate);
    setIsFormOpen(true);
  };

  // Handle Add Item row
  const handleAddItemRow = () => {
    setItems([
      ...items,
      {
        prNo: purchaseRequisitions[0]?.code || '',
        description: '',
        code: '',
        unit: 'pcs',
        quantity: 1,
        unitPrice: 0,
        remark: ''
      }
    ]);
  };

  // Handle Delete row
  const handleDeleteItemRow = (index: number) => {
    if (items.length <= 1) return; // Must have at least one line item
    setItems(items.filter((_, i) => i !== index));
  };

  // Update item fields
  const handleUpdateItemField = (index: number, field: keyof Omit<PurchaseOrderItem, 'id'>, value: any) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    
    // Auto-fill description & code if PR dropdown changes
    if (field === 'prNo') {
      const relativePr = purchaseRequisitions.find(pr => pr.code === value);
      if (relativePr) {
        updated[index].description = relativePr.description;
        updated[index].unit = relativePr.unit;
      }
    }
    setItems(updated);
  };

  // Handle Submit Save Form
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poNumber) return;

    const chosenSupplier = suppliers.find(s => s.id === selectedSupplierId);

    const poData: PurchaseOrder = {
      id: editingPo ? editingPo.id : `po-${Date.now()}`,
      poNumber: poNumber,
      date: gcDate,
      type: poType,
      evaluationId: selectedEvaluationId || undefined,
      supplierId: selectedSupplierId,
      supplierName: chosenSupplier ? chosenSupplier.name : 'Unknown Supplier',
      tinNumber: tinNumber,
      address: address,
      purchaserName: purchaserName,
      currency: currency,
      remark: remark,
      deliverySite: deliverySite,
      deliveryDate: deliveryDate,
      additionalComments: additionalComments,
      
      items: items.map((itm, index) => ({
        id: editingPo?.items[index]?.id || `poi-${Date.now()}-${index}`,
        ...itm
      })),
      
      subTotal: calculatedSubTotal,
      vatRate: vatRate,
      vatAmount: calculatedVatAmount,
      amountWithVat: calculatedAmountWithVat,
      freightChargeType: freightChargeType,
      freightChargeAmount: freightChargeAmount,
      withholdRate: withholdRate,
      withholdAmount: calculatedWithholdAmount,
      netPayableAmount: calculatedNetPayableAmount,
      
      shipmentType: shipmentType,
      paymentMethod: paymentMethod,
      preparedBy: purchaserName,
      checkedBy: 'Abebe Bekele',
      approvedBy: 'Selamawit Dawit',
      createdAt: editingPo ? editingPo.createdAt : new Date().toISOString().split('T')[0]
    };

    onSavePurchaseOrder(poData);
    setIsFormOpen(false);
  };

  // Reset to default
  const handleResetToDefault = () => {
    if (window.confirm("Are you sure you want to reset all custom Purchase Orders? This restores default values.")) {
      // Direct action to call delete/save will be handled in container App.tsx reset button but we clear local states
      setIsFormOpen(false);
      setActivePrintPo(null);
    }
  };

  // Filter Purchase Orders
  const filteredPOs = purchaseOrders.filter(po => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      po.poNumber.toLowerCase().includes(q) ||
      po.supplierName.toLowerCase().includes(q) ||
      po.deliverySite.toLowerCase().includes(q) ||
      po.items.some(item => item.description.toLowerCase().includes(q));

    const matchesType = !showOnlyRequested || po.type.toLowerCase() === 'requested';

    let matchesDates = true;
    if (startDate) {
      matchesDates = matchesDates && po.date >= startDate;
    }
    if (endDate) {
      matchesDates = matchesDates && po.date <= endDate;
    }

    return matchesSearch && matchesType && matchesDates;
  });

  return (
    <div className="flex flex-col gap-5 w-full text-slate-800" id="purchase-order-workspace">
      
      {/* HEADER BAR CONTROLLER */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between no-print">
        
        {/* Left Search input */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 grow max-w-2xl">
          <div className="relative grow">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Search by PO No, Supplier, Description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 h-9 bg-white border border-slate-200 rounded-lg text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 transition"
              id="search-po-input"
            />
          </div>

          {/* Quick requested type filter toggle */}
          <button
            onClick={() => setShowOnlyRequested(!showOnlyRequested)}
            className={`h-9 px-4 rounded-lg border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer select-none ${
              showOnlyRequested
                ? 'bg-blue-50 border-blue-200 text-[#033096]'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${showOnlyRequested ? 'bg-blue-600' : 'bg-slate-400'}`}></span>
            Show Only "Requested" Type
          </button>
        </div>

        {/* Action Controls right */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Back date limits */}
          <div className="flex items-center space-x-1.5">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 px-2.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 focus:outline-none shadow-3xs"
              title="Start Date"
            />
            <span className="text-slate-300 text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 px-2.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 focus:outline-none shadow-3xs"
              title="End Date"
            />
            
            {(startDate || endDate) && (
              <button 
                onClick={() => { setStartDate(''); setEndDate(''); }} 
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-lg transition"
                title="Clear date filter"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <span className="h-4 w-px bg-slate-200 mx-1"></span>

          {/* New Purchase Order registration button */}
          <button
            onClick={handleOpenNewForm}
            className="h-9 px-4 bg-[#033096] hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition flex items-center space-x-2 cursor-pointer shadow-down shadow-blue-900/10"
            id="register-po-cta"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>Register Purchase Order</span>
          </button>
        </div>
      </div>

      {/* CORE PURCHASE ORDERS LIST TABLE */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left table-auto border-collapse text-xs select-none">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                <th className="p-3.5 pl-4 w-20">PO No.</th>
                <th className="p-3.5 w-24">Date</th>
                <th className="p-3.5">Supplier Name</th>
                <th className="p-3.5">Delivery Site</th>
                <th className="p-3.5">Items Ordered</th>
                <th className="p-3.5">Sub-Total</th>
                <th className="p-3.5 text-right">Net Payable</th>
                <th className="p-3.5 text-center">Type</th>
                <th className="p-3.5 text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans text-slate-600">
              {filteredPOs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <AlertCircle size={24} className="text-slate-300" />
                      <p className="font-bold text-slate-500 text-xs">No Purchase Orders found</p>
                      <p className="text-[10px] text-slate-400 max-w-sm">
                        Click "+ Register Purchase Order" to generate a physical/digital PO or change your filters!
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPOs.map((po) => {
                  return (
                    <tr key={po.id} className="hover:bg-slate-50/50 transition duration-150 align-middle">
                      <td className="p-3.5 pl-4 font-bold text-slate-950">
                        {po.poNumber}
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {po.date.split('-').reverse().join('/')}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-900">
                        {po.supplierName}
                      </td>
                      <td className="p-3.5 text-slate-700">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-600">
                          {po.deliverySite}
                        </span>
                      </td>
                      <td className="p-3.5 max-w-xs">
                        <div className="flex flex-col gap-0.5">
                          {po.items.map((it, idx) => (
                            <div key={idx} className="truncate text-slate-700 font-medium">
                              • {it.description} <span className="text-slate-400 font-mono text-[10px]">({it.quantity} {po.currency === 'ETB' ? 'pcs' : it.unit})</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5 font-mono font-semibold text-slate-600">
                        {po.subTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {po.currency}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-slate-900 text-right text-sm">
                        {po.netPayableAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {po.currency}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          po.type === 'Requested' 
                            ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {po.type}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Print layouts */}
                          <button
                            onClick={() => setActivePrintPo(po)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-50 rounded-md transition cursor-pointer"
                            title="Print Statement (Company Spreadsheet)"
                          >
                            <Printer size={13.5} strokeWidth={2.5} />
                          </button>
                          
                          {/* Edit Details */}
                          <button
                            onClick={() => handleOpenEditForm(po)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-md transition cursor-pointer"
                            title="Edit Details Form"
                          >
                            <Edit size={13.5} strokeWidth={2.5} />
                          </button>

                          {/* Delete Item */}
                          <button
                            onClick={() => {
                              if (window.confirm("Are you sure you want to delete this purchase order?")) {
                                onDeletePurchaseOrder(po.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-md transition cursor-pointer"
                            title="Delete Purchase Order"
                          >
                            <Trash2 size={13.5} strokeWidth={2.5} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DUAL MODE MODAL FORM REGISTRATION (Image 2 & 3 Combined) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-xs select-none no-print">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-[#033096] text-white">
              <div className="flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-blue-300 animate-pulse"></span>
                <span className="text-sm font-bold tracking-tight">
                  {editingPo ? `Edit Purchase Order registration - ${poNumber}` : `New Purchase Order & Financial Allocation`}
                </span>
              </div>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Form Area */}
            <form onSubmit={handleSubmitForm} className="overflow-y-auto p-6 font-sans text-xs space-y-6">
              
              {/* Form segment - Image 2 matching */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* GC Date */}
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    * GC Date
                  </span>
                  <input
                    type="date"
                    required
                    value={gcDate}
                    onChange={(e) => setGcDate(e.target.value)}
                    className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 shadow-3xs"
                  />
                </div>

                {/* PO Number */}
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    PO Number
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 00097"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 shadow-3xs"
                  />
                </div>

                {/* Type */}
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    * Type
                  </span>
                  <select
                    value={poType}
                    onChange={(e) => setPoType(e.target.value)}
                    className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 shadow-3xs"
                  >
                    <option value="Requested">Requested</option>
                    <option value="Direct">Direct</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                {/* Proforma Comparison (link to evaluations) */}
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Proforma Comparison
                  </span>
                  <select
                    value={selectedEvaluationId}
                    onChange={(e) => setSelectedEvaluationId(e.target.value)}
                    className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 shadow-3xs"
                  >
                    <option value="">-- Direct Manual Input (Optional Link) --</option>
                    {evaluations.map(ev => (
                      <option key={ev.id} value={ev.id}>
                        {ev.code} - {ev.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Supplier */}
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    * Supplier
                  </span>
                  <select
                    value={selectedSupplierId}
                    required
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 shadow-3xs bg-gradient-to-r"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Tin Number (Auto-populated or editable) */}
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Tin Number
                  </span>
                  <input
                    type="text"
                    value={tinNumber}
                    onChange={(e) => setTinNumber(e.target.value)}
                    placeholder="TIN designation"
                    className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 shadow-3xs"
                  />
                </div>

                {/* Address */}
                <div className="col-span-1 md:col-span-2 flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Address
                  </span>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Supplier physical/business address"
                    className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 shadow-3xs"
                  />
                </div>

                {/* Currency */}
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    * Currency
                  </span>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 shadow-3xs"
                  >
                    <option value="ETB">ETB (Ethiopian Birr)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>

                {/* Remark Textarea */}
                <div className="col-span-1 md:col-span-3 flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Remark
                  </span>
                  <textarea
                    rows={2}
                    placeholder="General remark"
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    className="p-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-3xs transition resize-none"
                  />
                </div>

              </div>

              {/* Middle formal prose notice - Image 2 */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-2 text-slate-700 leading-relaxed shrink-0">
                <span>Please supply/deliver in good order and condition to Phison Realstate SC</span>
                <input
                  type="text"
                  value={deliverySite}
                  onChange={(e) => setDeliverySite(e.target.value)}
                  placeholder="Lideta site"
                  className="px-2.5 h-7 w-36 bg-white border border-slate-200 rounded font-bold text-slate-900 text-[11px] focus:outline-none"
                />
                <span>on/before</span>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="px-2 h-7 w-32 bg-white border border-slate-200 rounded font-bold text-[11px] focus:outline-none"
                />
                <span>in accordance with our conditions, the goods listed as follows:</span>
              </div>

              {/* Items Table details - Image 3 Layout */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white border border-slate-200 px-2.5 py-1 rounded shadow-3xs">
                    Designated Procurement Line Items
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-[11px] font-bold text-blue-700 cursor-pointer flex items-center space-x-1.5 hover:underline"
                  >
                    <Plus size={12} strokeWidth={2.5} />
                    <span>Add Item Line</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-3xs">
                  <table className="w-full text-left table-auto border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                        <th className="p-3 w-32">PR-No</th>
                        <th className="p-3">Description</th>
                        <th className="p-3 w-28">Ref/Item Code</th>
                        <th className="p-3 w-16">Unit</th>
                        <th className="p-3 w-24">Quantity</th>
                        <th className="p-3 w-28">Unit Price</th>
                        <th className="p-3 w-28 text-right">Total ({currency})</th>
                        <th className="p-3 text-center w-12">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans text-slate-700">
                      {items.map((item, index) => {
                        const lineTotal = item.quantity * item.unitPrice;
                        return (
                          <tr key={index} className="align-middle">
                            {/* PR No selection */}
                            <td className="p-2">
                              <select
                                value={item.prNo}
                                onChange={(e) => handleUpdateItemField(index, 'prNo', e.target.value)}
                                className="w-full h-8 px-1.5 bg-white border border-slate-200 rounded focus:outline-none font-bold text-slate-800"
                              >
                                {purchaseRequisitions.map(pr => (
                                  <option key={pr.id} value={pr.code}>{pr.code}</option>
                                ))}
                                <option value="00097">00097 (custom)</option>
                              </select>
                            </td>

                            {/* Description */}
                            <td className="p-2">
                              <input
                                type="text"
                                required
                                value={item.description}
                                onChange={(e) => handleUpdateItemField(index, 'description', e.target.value)}
                                placeholder="e.g. U-head"
                                className="w-full h-8 px-2 bg-white border border-slate-200 rounded focus:outline-none font-semibold"
                              />
                            </td>

                            {/* Item Code */}
                            <td className="p-2">
                              <input
                                type="text"
                                value={item.code}
                                onChange={(e) => handleUpdateItemField(index, 'code', e.target.value)}
                                placeholder="Ref/Code No"
                                className="w-full h-8 px-2 bg-white border border-slate-200 rounded focus:outline-none font-mono text-[10px]"
                              />
                            </td>

                            {/* Unit (UOM) */}
                            <td className="p-2">
                              <input
                                type="text"
                                value={item.unit}
                                onChange={(e) => handleUpdateItemField(index, 'unit', e.target.value)}
                                placeholder="pcs"
                                className="w-full h-8 px-2 bg-white border border-slate-200 rounded text-center focus:outline-none font-medium"
                              />
                            </td>

                            {/* Quantity */}
                            <td className="p-2">
                              <input
                                type="number"
                                required
                                min="1"
                                value={item.quantity || ''}
                                onChange={(e) => handleUpdateItemField(index, 'quantity', parseFloat(e.target.value) || 0)}
                                className="w-full h-8 px-2 bg-white border border-slate-200 rounded focus:outline-none font-bold font-mono text-center"
                              />
                            </td>

                            {/* Unit Price */}
                            <td className="p-2">
                              <input
                                type="number"
                                required
                                min="0"
                                step="any"
                                value={item.unitPrice || ''}
                                onChange={(e) => handleUpdateItemField(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                className="w-full h-8 px-2 bg-white border border-slate-200 rounded focus:outline-none font-bold font-mono text-right text-blue-800"
                              />
                            </td>

                            {/* Line dynamic totals */}
                            <td className="p-2 text-right font-bold text-slate-900 font-mono">
                              {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>

                            {/* Action delete button */}
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                disabled={items.length <= 1}
                                onClick={() => handleDeleteItemRow(index)}
                                className="p-1 text-slate-400 hover:text-red-500 disabled:opacity-30 rounded transition"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Calculations Block - Alignment EXACTLY matching Image 3 layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Comments block Left */}
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Additional Comments
                    </span>
                    <textarea
                      rows={5}
                      value={additionalComments}
                      onChange={(e) => setAdditionalComments(e.target.value)}
                      placeholder="Specify additional contract agreements..."
                      className="p-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-3xs justify-stretch h-full resize-none"
                    />
                  </div>
                </div>

                {/* Totals computation table alignment Right */}
                <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 space-y-3 font-mono">
                  
                  {/* Subtotal */}
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-dashed border-slate-200 text-slate-600 font-bold">
                    <span>Sub-Total:</span>
                    <span>{calculatedSubTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}</span>
                  </div>

                  {/* VAT */}
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-dashed border-slate-200">
                    <div className="flex items-center space-x-1 font-sans">
                      <span className="font-bold text-slate-600 font-mono">VAT Selection:</span>
                      <select
                        value={vatRate}
                        onChange={(e) => setVatRate(parseInt(e.target.value, 10))}
                        className="h-6 px-1.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-700"
                      >
                        <option value="15">15% VAT</option>
                        <option value="10">10% VAT</option>
                        <option value="0">No VAT</option>
                      </select>
                    </div>
                    <span className="font-bold font-mono text-slate-900">
                      {calculatedVatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                    </span>
                  </div>

                  {/* Freight Charge details (dynamic toggle) */}
                  <div className="flex flex-col space-y-1.5 pb-2 border-b border-dashed border-slate-200 text-xs">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-1 font-sans">
                        <span className="font-bold text-slate-600 font-mono">Freight Charge:</span>
                        <select
                          value={freightChargeType}
                          onChange={(e) => setFreightChargeType(e.target.value)}
                          className="h-6 px-1.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-700"
                        >
                          <option value="No">No Freight</option>
                          <option value="Yes">Include Custom</option>
                        </select>
                      </div>
                      {freightChargeType === 'Yes' && (
                        <input
                          type="number"
                          value={freightChargeAmount || ''}
                          onChange={(e) => setFreightChargeAmount(parseFloat(e.target.value) || 0)}
                          placeholder="Amount"
                          className="w-20 h-6 px-1 bg-white border border-slate-200 rounded text-right font-mono font-bold text-[10px] text-blue-800"
                        />
                      )}
                    </div>
                  </div>

                  {/* Withhold selection 2% or 3% */}
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-dashed border-slate-200">
                    <div className="flex items-center space-x-1.5 font-sans">
                      <span className="text-slate-600 font-bold font-mono">Withhold Tax Ratio:</span>
                      <select
                        value={withholdRate}
                        onChange={(e) => setWithholdRate(parseInt(e.target.value, 10))}
                        className="h-6 px-1.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-700"
                      >
                        <option value="3">With Hold 3%</option>
                        <option value="2">With Hold 2%</option>
                        <option value="0">None</option>
                      </select>
                    </div>
                    <span className="text-red-700 font-bold font-mono">
                      -{calculatedWithholdAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                    </span>
                  </div>

                  {/* Grand total */}
                  <div className="flex justify-between items-center text-[#033096] font-bold text-sm bg-blue-50/50 px-2 py-1.5 rounded-lg border border-blue-100">
                    <span className="font-sans uppercase text-[10px] tracking-widest font-extrabold text-[#033096]">Grand Total / Net Payable:</span>
                    <span className="text-base text-blue-900">
                      {calculatedNetPayableAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                    </span>
                  </div>
                </div>

              </div>

              {/* Lower Details Alignment (Shipment, payment, freight select) - Image 3 Layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 border border-slate-200 p-4 rounded-xl leading-normal">
                
                {/* Shipment Type */}
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    * Shipment
                  </span>
                  <select
                    value={shipmentType}
                    onChange={(e) => setShipmentType(e.target.value)}
                    className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                  >
                    <option value="Land Freight">Land Freight</option>
                    <option value="Air Freight">Air Freight</option>
                    <option value="Sea Cargo">Sea Cargo</option>
                    <option value="In-Store pickup">In-Store pickup</option>
                  </select>
                </div>

                {/* Payment Method */}
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    * Payment Method
                  </span>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash Deposit">Cash Deposit</option>
                    <option value="Letter of Credit">Letter of Credit</option>
                    <option value="Check">Check Delivery</option>
                    <option value="Cash Payment">Cash Payment</option>
                  </select>
                </div>

                {/* Freight charge type indicator display */}
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    * Freight Charge
                  </span>
                  <select
                    value={freightChargeType}
                    onChange={(e) => setFreightChargeType(e.target.value)}
                    className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>

                {/* Signature Prepared By user reference */}
                <div className="flex flex-col col-span-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    * Prepared By
                  </span>
                  <input
                    type="text"
                    required
                    value={purchaserName}
                    onChange={(e) => setPurchaserName(e.target.value)}
                    className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                    placeholder="Signature Name"
                  />
                </div>

                {/* Checked By user reference */}
                <div className="flex flex-col col-span-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    * Checked By
                  </span>
                  <select
                    className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                    defaultValue="Abebe Bekele"
                  >
                    <option value="Abebe Bekele">Abebe Bekele (Warehouse Manager)</option>
                    <option value="Nebiyu Samuel">Nebiyu Samuel (Stock Controller)</option>
                    <option value="Kidus Daniel">Kidus Daniel (Store Keeper)</option>
                  </select>
                </div>

                {/* Approved By user reference */}
                <div className="flex flex-col col-span-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    * Approved By
                  </span>
                  <select
                    className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                    defaultValue="Selamawit Dawit"
                  >
                    <option value="Selamawit Dawit">Selamawit Dawit (Project Manager)</option>
                    <option value="Company CEO">Company CEO</option>
                  </select>
                </div>

              </div>

            </form>

            {/* Footer Form CTA */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-2 shrink-0">
              <button 
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="h-9 px-4 border border-slate-200 hover:bg-slate-100 bg-white rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitForm}
                className="h-9 px-5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-down shadow-blue-800/15"
              >
                Save Changes
              </button>
            </div>

          </div>
        </div>
      )}

      {/* DETAILED pixel-perfect PAPER PRINT FORMAT OVERLAY (Replicating Image 1 layout) */}
      {activePrintPo && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-xs select-none">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[95vh]">
            
            {/* Control Bar */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between no-print shrink-0 uppercase">
              <div className="flex items-center space-x-2">
                <Printer size={15} className="text-[#033096]" />
                <span className="text-xs font-bold text-slate-800 tracking-tight">
                  Allura Sheet Print Preview - PO No: {activePrintPo.poNumber}
                </span>
              </div>
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => window.print()}
                  className="px-4 h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[11px] shadow-down flex items-center space-x-1 cursor-pointer transition"
                >
                  <Printer size={12} />
                  <span>Execute Print</span>
                </button>
                <button
                  onClick={() => setActivePrintPo(null)}
                  className="px-3 h-8 border border-slate-200 hover:bg-slate-100 bg-white text-slate-600 font-bold rounded text-[11px] cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </div>

            {/* PRINT VIEWPORT AREA - Optimized for A4 paper and designed EXACTLY like Image 1 */}
            <div className="overflow-y-auto p-8 bg-white flex justify-center print:p-0" id="purchase-order-print-area">
              <div className="w-full max-w-[800px] bg-white text-black font-sans print:m-0" style={{ letterSpacing: '0.02em' }}>
                
                {/* Company Title Header */}
                <div className="border border-black p-2.5 text-center bg-white">
                  <h1 className="text-xl font-bold font-serif underline tracking-wide uppercase">
                    Allura Engineering & Trading Plc
                  </h1>
                </div>

                {/* Subtitle / Document designation */}
                <div className="text-center font-bold text-lg mt-1 mb-1 font-serif underline uppercase bg-slate-50 border-x border-b border-black py-1">
                  Purchase Order
                </div>

                {/* PO Metadata Grid - Exact replica border layout of Image 1 */}
                <div className="grid grid-cols-2 text-xs border border-black divide-x divide-black">
                  
                  {/* Left Metadata list */}
                  <div className="p-3 space-y-2 border-r border-black relative">
                    <div className="flex items-baseline">
                      <span className="font-bold min-w-[100px] shrink-0">Supplier Name</span>
                      <span className="border-b border-black font-bold text-black grow pb-0.5 truncate tracking-wide">
                        {activePrintPo.supplierName}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="font-bold min-w-[100px] shrink-0">Terms of Payment</span>
                      <span className="border-b border-black font-semibold text-black grow pb-0.5 tracking-wide">
                        {activePrintPo.paymentMethod} Acc No,1000
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="font-bold min-w-[100px] shrink-0">Term of Delivery</span>
                      <span className="border-b border-black font-semibold text-black grow pb-0.5 tracking-wide">
                        From Stock
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="font-bold min-w-[100px] shrink-0">Project ;-</span>
                      <span className="border-b border-black font-bold text-black grow pb-0.5 tracking-wide text-indigo-900 font-serif">
                        {activePrintPo.deliverySite}
                      </span>
                    </div>
                  </div>

                  {/* Right metadata block containing Date / PO Numbers / Telephone */}
                  <div className="p-3 flex flex-col justify-between font-mono divide-y divide-black/40">
                    <div className="flex items-center justify-between pb-1.5. text-[11px] font-bold">
                      <span className="font-semibold uppercase font-sans">PO No;</span>
                      <span className="font-extrabold text-[#033096] text-sm tracking-widest">{activePrintPo.poNumber}</span>
                    </div>
                    
                    <div className="flex items-center justify-between py-1.5 text-[11px] font-bold">
                      <span className="font-semibold uppercase font-sans">Date;</span>
                      <span>{activePrintPo.date.split('-').reverse().join('/')}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 text-[11px] font-bold">
                      <span className="font-semibold uppercase font-sans">Telephon No :</span>
                      <span className="underline decoration-dotted text-black">09</span>
                    </div>

                    {activePrintPo.tinNumber && (
                      <div className="flex items-center justify-between pt-1 text-[10px]">
                        <span className="font-semibold font-sans">Supplier TIN:</span>
                        <span>{activePrintPo.tinNumber}</span>
                      </div>
                    )}
                  </div>

                </div>

                {/* Main Items dynamic Grid - styled EXACTLY like an Excel grid (image 1) */}
                <div className="mt-4 border-t border-l border-r border-black overflow-hidden bg-white">
                  <table className="w-full text-xs text-left border-collapse border-b border-black table-fixed">
                    <thead>
                      <tr className="bg-slate-200 border-b border-black text-black font-bold h-9">
                        <th className="border-r border-black p-2 text-center w-8">No.</th>
                        <th className="border-r border-black p-2 text-center w-18">Ref.No</th>
                        <th className="border-r border-black p-2 text-left">Description</th>
                        <th className="border-r border-black p-2 text-center w-12">UOM</th>
                        <th className="border-r border-black p-2 text-center w-16">Quantity</th>
                        <th className="border-r border-black p-2 text-right w-20">unit</th>
                        <th className="border-r border-black p-2 text-right w-24">total</th>
                        <th className="p-2 text-left w-18">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black font-semibold text-black md:font-medium">
                      {activePrintPo.items.map((item, idx) => {
                        const lineTotal = item.quantity * item.unitPrice;
                        return (
                          <tr key={item.id} className="h-9">
                            {/* Line sequence index count */}
                            <td className="border-r border-black p-2 text-center font-bold">
                              {idx + 1}
                            </td>
                            {/* Ref PO No code designation */}
                            <td className="border-r border-black p-2 text-center font-mono text-[10px]">
                              {activePrintPo.poNumber}
                            </td>
                            {/* Item Description representation */}
                            <td className="border-r border-black p-2 font-bold uppercase truncate">
                              {item.description}
                            </td>
                            {/* Measure designation */}
                            <td className="border-r border-black p-2 text-center uppercase font-mono text-[10px]">
                              {item.unit || 'pcs'}
                            </td>
                            {/* Quantity Ordered count */}
                            <td className="border-r border-black p-2 text-center font-mono">
                              {item.quantity}
                            </td>
                            {/* Item Price details */}
                            <td className="border-r border-black p-2 text-right font-mono">
                              {item.unitPrice.toFixed(2)}
                            </td>
                            {/* Multiplied values output */}
                            <td className="border-r border-black p-2 text-right font-mono font-bold">
                              {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            {/* Item level comments statement */}
                            <td className="p-2 truncate text-[10px] text-slate-500 font-normal">
                              {item.remark || '-'}
                            </td>
                          </tr>
                        );
                      })}

                      {/* Spreadsheet totals layout representation */}
                      
                      {/* Sub-total */}
                      <tr className="bg-slate-50/50">
                        <td colSpan={4} className="border-r border-black"></td>
                        <td colSpan={2} className="border-r border-black p-2 font-bold text-center uppercase font-serif">
                          Total sum
                        </td>
                        <td className="border-r border-black p-2 text-right font-mono font-bold">
                          {activePrintPo.subTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td></td>
                      </tr>

                      {/* VAT */}
                      {activePrintPo.vatRate > 0 && (
                        <tr className="bg-white">
                          <td colSpan={4} className="border-r border-black"></td>
                          <td colSpan={2} className="border-r border-black p-2 font-bold text-center uppercase font-serif">
                            VAT ({activePrintPo.vatRate}%)
                          </td>
                          <td className="border-r border-black p-2 text-right font-mono font-bold">
                            {activePrintPo.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td></td>
                        </tr>
                      )}

                      {/* Amount with VAT sum representation */}
                      {activePrintPo.vatRate > 0 && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={4} className="border-r border-black"></td>
                          <td colSpan={2} className="border-r border-black p-2 font-bold text-center uppercase font-serif text-[11px]">
                            Amount with vat
                          </td>
                          <td className="border-r border-black p-2 text-right font-mono font-bold">
                            {activePrintPo.amountWithVat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td></td>
                        </tr>
                      )}

                      {/* Withhold amount subtraction row */}
                      {activePrintPo.withholdRate > 0 && (
                        <tr className="bg-white">
                          <td colSpan={4} className="border-r border-black"></td>
                          <td colSpan={2} className="border-r border-black p-2 font-bold text-center uppercase font-serif text-slate-700">
                            Withhold {activePrintPo.withholdRate}%
                          </td>
                          <td className="border-r border-black p-2 text-right font-mono font-bold text-red-700">
                            {activePrintPo.withholdAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td></td>
                        </tr>
                      )}

                      {/* Net Payable Amount */}
                      <tr className="bg-[#033096]/5 border-t border-black font-extrabold text-sm h-11">
                        <td colSpan={4} className="border-r border-black"></td>
                        <td colSpan={2} className="border-r border-black p-2.5 font-bold text-center uppercase font-serif text-blue-900">
                          Net payable amount
                        </td>
                        <td className="border-r border-black p-2.5 text-right font-mono text-blue-900 text-sm">
                          {activePrintPo.netPayableAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="font-mono text-[9px] text-center font-bold text-indigo-700">{activePrintPo.currency}</td>
                      </tr>

                    </tbody>
                  </table>
                </div>

                {/* Additional clauses statement */}
                {activePrintPo.additionalComments && (
                  <div className="mt-4 border border-black p-3 text-xs bg-slate-50 leading-relaxed font-sans rounded">
                    <p className="font-bold underline mb-1 uppercase text-[10px] text-slate-600">Additional Instructions / Terms & Conditions:</p>
                    <p className="text-slate-800 italic">"{activePrintPo.additionalComments}"</p>
                  </div>
                )}

                {/* Signature Board - Exact matching of Prepared with/Approved by */}
                <div className="mt-12 flex justify-between items-end text-xs font-serif px-8">
                  
                  {/* Prepared by signature alignment */}
                  <div className="text-center w-52 space-y-7">
                    <p className="font-bold text-black border-b border-black/60 pb-1 uppercase italic tracking-wider">
                      {activePrintPo.preparedBy || 'Nahom Sisay'}
                    </p>
                    <p className="font-bold text-slate-800 underline uppercase">Prepared by</p>
                  </div>

                  {/* Approved by signature alignment */}
                  <div className="text-center w-52 space-y-7">
                    <p className="font-bold text-black border-b border-black/60 pb-1 uppercase italic tracking-wider">
                      {activePrintPo.approvedBy || 'Selamawit Dawit'}
                    </p>
                    <p className="font-bold text-slate-800 underline uppercase">Approved by</p>
                  </div>

                </div>

                {/* Small disclaimer bottom margin */}
                <div className="mt-10 pt-4 border-t border-slate-200 text-center font-mono text-[8.5px] text-slate-400 no-print select-none">
                  ConDigital Construction Procurement Suite • Internal Document Reference Index: PO-{activePrintPo.poNumber}-LD
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end no-print shrink-0">
              <button 
                onClick={() => setActivePrintPo(null)}
                className="h-9 px-5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
