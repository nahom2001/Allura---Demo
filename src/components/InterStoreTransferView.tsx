import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, Dropdown, Menu, Tooltip, Form, Input, Select, InputNumber, Modal, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { PlusOutlined, DeleteOutlined, SyncOutlined, MoreOutlined, EyeOutlined, EditOutlined, PrinterOutlined, ShareAltOutlined } from '@ant-design/icons';
import { 
  Check, 
  X, 
  Search, 
  AlertTriangle, 
  RefreshCw,
  Printer,
  ArrowRight,
  MapPin,
  Truck,
  Phone,
  User,
  FileText,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  ArrowUpDown,
  Share2,
  Eye,
  Trash2,
  FileSpreadsheet
} from 'lucide-react';
import { Store, Material, SystemUser, InterStoreTransfer, InterStoreTransferItem } from '../types';

interface InterStoreTransferViewProps {
  stores: Store[];
  materials: Material[];
  systemUsers: SystemUser[];
  transfers: InterStoreTransfer[];
  onSaveTransfer: (transfer: InterStoreTransfer) => void;
  onDeleteTransfer: (transferId: string) => void;
}

export default function InterStoreTransferView({
  stores,
  materials,
  systemUsers,
  transfers,
  onSaveTransfer,
  onDeleteTransfer
}: InterStoreTransferViewProps) {
  
  const [selectedTransferId, setSelectedTransferId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isViewingVoucher, setIsViewingVoucher] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Search/Filters State
  const [searchText, setSearchText] = useState('');
  const [fromStoreFilter, setFromStoreFilter] = useState('all');
  const [toStoreFilter, setToStoreFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Draft' | 'Completed'>('All');
  const [sortField, setSortField] = useState<'date' | 'transferNo'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // New/Edit Voucher Form State
  const [formDate, setFormDate] = useState('');
  const [formTransferNo, setFormTransferNo] = useState('');
  const [formFromStoreId, setFormFromStoreId] = useState('');
  const [formToStoreId, setFormToStoreId] = useState('');
  const [formProject, setFormProject] = useState('Allura Head Office Site');
  const [formRequisitionNo, setFormRequisitionNo] = useState('PR-1002');
  const [formShippedBy, setFormShippedBy] = useState('');
  const [formPlateNo, setFormPlateNo] = useState('');
  const [formTelephoneNo, setFormTelephoneNo] = useState('');
  const [formItems, setFormItems] = useState<Omit<InterStoreTransferItem, 'id'>[]>([]);
  const [formRequestedById, setFormRequestedById] = useState('');
  const [formApprovedById, setFormApprovedById] = useState('');
  const [formIssuedById, setFormIssuedById] = useState('');

  // Handle auto fill on form changes or initialization
  useEffect(() => {
    if (isCreating && !formTransferNo) {
      setFormDate(new Date().toISOString().split('T')[0]);
      setFormTransferNo(`GTO-0${Math.floor(100 + Math.random() * 899)}`);
      
      const firstSrcStore = stores[0]?.id || '';
      const firstDestStore = stores[1]?.id || stores[0]?.id || '';
      setFormFromStoreId(firstSrcStore);
      setFormToStoreId(firstDestStore);
      
      setFormProject('Gotera Branch layout development');
      setFormRequisitionNo(`MR-${Math.floor(1000 + Math.random() * 9000)}`);
      setFormShippedBy('Semere Tesfaye');
      setFormPlateNo('AA-3-B45920');
      setFormTelephoneNo('+251 911 349102');
      
      // Default initial line item from source store if exists
      const availableMats = firstSrcStore ? materials.filter(m => m.storeId === firstSrcStore) : [];
      if (availableMats.length > 0) {
        setFormItems([{
          materialId: availableMats[0].id,
          code: availableMats[0].code,
          description: availableMats[0].description,
          unit: availableMats[0].unit,
          quantity: Math.min(5, availableMats[0].quantity),
          unitPrice: availableMats[0].unitPrice,
          remark: 'Dispatched for mechanical assemblies layout'
        }]);
      } else {
        setFormItems([]);
      }

      setFormRequestedById(systemUsers.find(u => u.role === 'Project Manager' || u.role === 'Warehouse Manager')?.id || systemUsers[0]?.id || '');
      setFormApprovedById(systemUsers.find(u => u.role === 'Project Manager')?.id || systemUsers[1]?.id || systemUsers[0]?.id || '');
      setFormIssuedById(systemUsers.find(u => u.role === 'Store Keeper')?.id || systemUsers[0]?.id || '');
    }
  }, [isCreating, stores, systemUsers]);

  // Format STV or any numeric code into exactly matching GTO-XXXX format from screenshot
  const formatGtoNo = (no: string) => {
    if (!no) return 'GTO-0000';
    // If it starts with STV-, replace with GTO-
    if (no.toUpperCase().startsWith('STV-')) {
      return `GTO-${no.substring(4).padStart(4, '0').slice(-4)}`;
    }
    if (!no.toUpperCase().startsWith('GTO-')) {
      return `GTO-${no.padStart(4, '0').slice(-4)}`;
    }
    return no;
  };

  // Automatically sync available materials when source store in form changes
  const handleFromStoreChange = (val: string) => {
    setFormFromStoreId(val);
    const availableMats = val ? materials.filter(m => m.storeId === val) : [];
    if (availableMats.length > 0) {
      setFormItems([{
        materialId: availableMats[0].id,
        code: availableMats[0].code,
        description: availableMats[0].description,
        unit: availableMats[0].unit,
        quantity: Math.min(1, availableMats[0].quantity),
        unitPrice: availableMats[0].unitPrice,
        remark: 'Transfer request operation deployment'
      }]);
    } else {
      setFormItems([]);
    }
  };

  const handleAddFormRow = () => {
    const availableMats = materials.filter(m => m.storeId === formFromStoreId);
    if (availableMats.length === 0) {
      setErrorMessage('No registered materials exist in this source store. Add items to stock first.');
      setTimeout(() => setErrorMessage(''), 4500);
      return;
    }

    // Pick first material that is not already in the row list to prevent duplicates
    const selectedIds = new Set(formItems.map(f => f.materialId));
    const nextMat = availableMats.find(m => !selectedIds.has(m.id)) || availableMats[0];

    setFormItems(prev => [...prev, {
      materialId: nextMat.id,
      code: nextMat.code,
      description: nextMat.description,
      unit: nextMat.unit,
      quantity: 1,
      unitPrice: nextMat.unitPrice,
      remark: 'Site operations'
    }]);
  };

  const handleUpdateFormRow = (index: number, field: keyof Omit<InterStoreTransferItem, 'id'>, value: any) => {
    setFormItems(prev => prev.map((item, idx) => {
      if (idx === index) {
        const updated = { ...item, [field]: value };
        if (field === 'materialId') {
          const matchedMat = materials.find(m => m.id === value);
          if (matchedMat) {
            updated.code = matchedMat.code;
            updated.description = matchedMat.description;
            updated.unit = matchedMat.unit;
            updated.unitPrice = matchedMat.unitPrice;
          }
        }
        return updated;
      }
      return item;
    }));
  };

  const handleRemoveFormRow = (index: number) => {
    setFormItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveTransferSubmit = (status: 'Draft' | 'Completed') => {
    setErrorMessage('');

    if (!formFromStoreId) return setErrorMessage('Please specify the departing (From) store.');
    if (!formToStoreId) return setErrorMessage('Please specify the destination (To) store.');
    if (formFromStoreId === formToStoreId) return setErrorMessage('Origin (From) and destination (To) stores must be different locations.');
    if (formItems.length === 0) return setErrorMessage('Please specify at least one material item to transfer.');

    // Validate quantities
    for (const item of formItems) {
      const sourceMat = materials.find(m => m.id === item.materialId);
      if (!sourceMat) return setErrorMessage('Invalid material selection.');
      if (item.quantity <= 0) return setErrorMessage(`Quantities must be positive numbers. Check item ${sourceMat.code}.`);
      
      // Stock check applies immediately for 'Completed' postings
      if (status === 'Completed' && item.quantity > sourceMat.quantity) {
        return setErrorMessage(`Insufficient stock for "${sourceMat.description}" at the source store! Current balance is ${sourceMat.quantity} but requested transfer quantity is ${item.quantity}.`);
      }
    }

    const uniqueItems: InterStoreTransferItem[] = formItems.map((item, idx) => ({
      id: `ist-item-${Date.now()}-${idx}`,
      ...item
    }));

    const cleanNo = formTransferNo.replace('GTO-', 'STV-');

    const newTransfer: InterStoreTransfer = {
      id: `ist-${Date.now()}`,
      transferNo: cleanNo || `STV-${Math.floor(100000 + Math.random() * 900000)}`,
      date: formDate || new Date().toISOString().split('T')[0],
      fromStoreId: formFromStoreId,
      toStoreId: formToStoreId,
      project: formProject || 'Allura Development Sites',
      requisitionNo: formRequisitionNo || 'MR-Transfer',
      shippedBy: formShippedBy,
      plateNo: formPlateNo,
      telephoneNo: formTelephoneNo,
      items: uniqueItems,
      requestedById: formRequestedById,
      approvedById: formApprovedById,
      issuedById: formIssuedById,
      status: status,
      createdAt: new Date().toISOString()
    };

    onSaveTransfer(newTransfer);
    setIsCreating(false);
    setSelectedTransferId(newTransfer.id);
    
    // Reset state for registration form
    setFormTransferNo('');
    setFormItems([]);

    setSuccessMessage(status === 'Completed' ? `Transfer ${formatGtoNo(newTransfer.transferNo)} posted successfully! Store inventory records updated.` : `Transfer ${formatGtoNo(newTransfer.transferNo)} saved as draft.`);
    setTimeout(() => setSuccessMessage(''), 4500);
  };

  const handleDeleteTransferItem = (id: string, transferNo: string) => {
    if (window.confirm(`Are you sure you want to permanently delete store transfer sheet: ${formatGtoNo(transferNo)}?`)) {
      onDeleteTransfer(id);
      if (selectedTransferId === id) {
        setSelectedTransferId(null);
      }
      setSuccessMessage(`Transfer record ${formatGtoNo(transferNo)} deleted successfully.`);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleEditTransfer = (record: InterStoreTransfer) => {
    setFormDate(record.date);
    setFormTransferNo(formatGtoNo(record.transferNo));
    setFormFromStoreId(record.fromStoreId);
    setFormToStoreId(record.toStoreId);
    setFormProject(record.project);
    setFormRequisitionNo(record.requisitionNo);
    setFormShippedBy(record.shippedBy);
    setFormPlateNo(record.plateNo);
    setFormTelephoneNo(record.telephoneNo);
    setFormItems(record.items.map(it => ({
      materialId: it.materialId,
      code: it.code,
      description: it.description,
      unit: it.unit,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      remark: it.remark
    })));
    setFormRequestedById(record.requestedById);
    setFormApprovedById(record.approvedById);
    setFormIssuedById(record.issuedById);
    setIsCreating(true);
  };

  const handleCopyShareLink = (record: InterStoreTransfer) => {
    const fStore = stores.find(s => s.id === record.fromStoreId)?.name || 'Origin';
    const tStore = stores.find(s => s.id === record.toStoreId)?.name || 'Destination';
    const shareText = `Allura GTO Transfer Voucher: ${formatGtoNo(record.transferNo)}\nDate: ${record.date}\nDispatcher: ${fStore}\nRecipient: ${tStore}\nItems: ${record.items.map(it => `${it.description} (${it.quantity} ${it.unit})`).join(', ')}`;
    
    navigator.clipboard.writeText(shareText).then(() => {
      setSuccessMessage(`Core metadata of ${formatGtoNo(record.transferNo)} copied to clipboard for direct messaging share.`);
      setTimeout(() => setSuccessMessage(''), 3500);
    }).catch(() => {
      alert(shareText);
    });
  };

  // Filter and sort core transfer logs list
  const filteredTransfers = useMemo(() => {
    return transfers.filter(tx => {
      const query = searchText.toLowerCase().trim();
      const fromStoreObj = stores.find(s => s.id === tx.fromStoreId);
      const toStoreObj = stores.find(s => s.id === tx.toStoreId);
      const fromStoreName = fromStoreObj ? fromStoreObj.name.toLowerCase() : '';
      const toStoreName = toStoreObj ? toStoreObj.name.toLowerCase() : '';

      const searchMatches = 
        tx.transferNo.toLowerCase().includes(query) || 
        tx.project.toLowerCase().includes(query) ||
        tx.requisitionNo.toLowerCase().includes(query) || 
        tx.shippedBy.toLowerCase().includes(query) ||
        fromStoreName.includes(query) ||
        toStoreName.includes(query);

      let fromStoreMatches = true;
      if (fromStoreFilter !== 'all') {
        fromStoreMatches = tx.fromStoreId === fromStoreFilter;
      }

      let toStoreMatches = true;
      if (toStoreFilter !== 'all') {
        toStoreMatches = tx.toStoreId === toStoreFilter;
      }

      let statusMatches = true;
      if (statusFilter !== 'All') {
        statusMatches = tx.status === statusFilter;
      }

      let dateMatches = true;
      if (startDate) {
        dateMatches = dateMatches && tx.date >= startDate;
      }
      if (endDate) {
        dateMatches = dateMatches && tx.date <= endDate;
      }

      return searchMatches && fromStoreMatches && toStoreMatches && statusMatches && dateMatches;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortField === 'transferNo') {
        comparison = a.transferNo.localeCompare(b.transferNo);
      } else {
        comparison = a.date.localeCompare(b.date);
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [transfers, searchText, fromStoreFilter, toStoreFilter, statusFilter, sortField, sortOrder, stores, startDate, endDate]);

  const activeTransfer = transfers.find(tx => tx.id === selectedTransferId) || null;
  const activeFromStore = activeTransfer ? stores.find(s => s.id === activeTransfer.fromStoreId) : null;
  const activeToStore = activeTransfer ? stores.find(s => s.id === activeTransfer.toStoreId) : null;

  // Render elegant custom 2-line Store description matched from the screenshot:
  // e.g. "Unity" in bold, then "Store" in thin text below.
  const renderStoreCell = (storeId: string) => {
    const storeObj = stores.find(s => s.id === storeId);
    if (!storeObj) return <span className="font-mono text-slate-400">Not Assigned</span>;
    const storeName = storeObj.name;
    const parts = storeName.split(' ');
    
    if (parts.length > 1 && parts[parts.length - 1].toLowerCase() === 'store') {
      const boldPart = parts.slice(0, -1).join(' ');
      return (
        <div className="flex flex-col leading-tight select-text">
          <span className="font-bold text-[#1D1C24] text-[13px]">{boldPart}</span>
          <span className="text-slate-400 text-[11px] font-sans">Store</span>
        </div>
      );
    }
    
    return (
      <div className="flex flex-col leading-tight select-text">
        <span className="font-bold text-[#1D1C24] text-[13px]">{storeName}</span>
      </div>
    );
  };

  // Renders concatenated item list with a trailing comma exactly matching screenshot
  const formatItemsList = (items: InterStoreTransferItem[]) => {
    if (!items || items.length === 0) return '';
    return items.map(it => it.description).join(', ') + ',';
  };

  // Convert Date from "YYYY-MM-DD" to "DD/MM/YYYY"
  const parseDisplayDate = (dStr: string) => {
    if (!dStr) return '';
    const parts = dStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dStr;
  };

  return (
    <div className="space-y-4 font-sans text-left" id="ist-workspace">
      
      {/* 1. SUCCESS & ERROR NOTIFICATIONS BANNER */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-normal flex items-center justify-between shadow-3xs transition duration-300 no-print">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="bg-transparent border-0 text-slate-450 hover:text-slate-700 cursor-pointer p-0 transition">
            <X size={14} />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-650 rounded-lg text-xs font-normal flex items-center justify-between shadow-3xs transition duration-300 no-print">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle size={14} className="text-red-500" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')} className="bg-transparent border-0 text-slate-450 hover:text-slate-700 cursor-pointer p-0 transition">
            <X size={14} />
          </button>
        </div>
      )}

      {/* RENDER NEW OR EDIT FORM IF 'isCreating' */}
      {isCreating ? (
        <Form 
          layout="vertical"
          onSubmitCapture={(e) => { e.preventDefault(); }} 
          className="bg-white border border-[#eaeaea] rounded-xl flex flex-col justify-between select-none font-medium text-xs text-[#262626] text-left shadow-xs transition duration-300"
        >
          
          <div className="p-4.5 border-b border-slate-100 bg-slate-50/60 shrink-0 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Register Physical Inter-Store Transfer Voucher</h3>
              <p className="text-[11px] text-slate-450 mt-0.5 font-sans">Configure corporate double-entry stockyard transfers with Ant Design elements.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setFormTransferNo('');
                setFormItems([]);
              }}
              className="p-1.5 hover:bg-slate-200/50 text-slate-400 hover:text-slate-600 rounded transition cursor-pointer"
            >
              <X size={15} strokeWidth={2.5} />
            </button>
          </div>

          <div className="p-5.5 space-y-5 leading-normal max-h-[70vh] overflow-y-auto">
            
            {/* Step 1: Document Metadata */}
            <div className="p-5.5 bg-[#fafafa] border border-[#f0f0f0] rounded-lg space-y-4">
              <div className="text-center pb-2 border-b border-dashed border-slate-200">
                <span className="text-xs font-bold font-mono tracking-wider text-slate-500 uppercase">Step 1: Document Metadata Specifications</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4.5 gap-y-1">
                
                <Form.Item label={<span className="text-[#595959] font-bold text-xs">ቀን/Voucher Date</span>} required className="mb-3">
                  <Input 
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="h-8.5 rounded focus:border-[#033096] font-sans"
                  />
                </Form.Item>

                <Form.Item label={<span className="text-[#595959] font-bold text-xs">ቁጥር/Voucher No <span className="text-slate-400 font-normal italic font-sans">(Auto-Generated)</span></span>} className="mb-3">
                  <Input 
                    placeholder="e.g. STV-4820"
                    value={formTransferNo}
                    onChange={(e) => setFormTransferNo(e.target.value)}
                    className="h-8.5 rounded font-mono font-bold focus:border-[#033096]"
                  />
                </Form.Item>

                <Form.Item label={<span className="text-[#595959] font-bold text-xs">መመሪያ/ክፍል/Project Site</span>} required className="mb-3">
                  <Input 
                    required
                    placeholder="e.g. Gotera Branch layout"
                    value={formProject}
                    onChange={(e) => setFormProject(e.target.value)}
                    className="h-8.5 rounded focus:border-[#033096]"
                  />
                </Form.Item>

                <Form.Item label={<span className="text-[#595959] font-bold text-xs">Material Requisition No</span>} required className="mb-3">
                  <Input 
                    required
                    placeholder="e.g. MR-0994"
                    value={formRequisitionNo}
                    onChange={(e) => setFormRequisitionNo(e.target.value)}
                    className="h-8.5 rounded font-mono focus:border-[#033096]"
                  />
                </Form.Item>

                <Form.Item label={<span className="text-[#595959] font-bold text-xs">Origin Stockyard (From)</span>} required className="mb-3">
                  <Select 
                    value={formFromStoreId}
                    onChange={handleFromStoreChange}
                    placeholder="Select source store"
                    className="w-full h-8.5 text-xs font-semibold"
                    showSearch
                    optionFilterProp="label"
                    options={stores.map(s => ({ value: s.id, label: `${s.name} (${s.city})` }))}
                  />
                </Form.Item>

                <Form.Item label={<span className="text-[#595959] font-bold text-xs">Destination Stockyard (To)</span>} required className="mb-3">
                  <Select 
                    value={formToStoreId}
                    onChange={(val) => setFormToStoreId(val)}
                    placeholder="Select destination store"
                    className="w-full h-8.5 text-xs font-semibold"
                    showSearch
                    optionFilterProp="label"
                    options={stores.map(s => ({ value: s.id, label: `${s.name} (${s.city})` }))}
                  />
                </Form.Item>

              </div>
            </div>

            {/* Step 2: Shipping Logistics */}
            <div className="p-5.5 bg-[#fafafa] border border-[#f0f0f0] rounded-lg space-y-4">
              <div className="text-center pb-2 border-b border-dashed border-slate-200">
                <span className="text-xs font-bold font-mono tracking-wider text-slate-500 uppercase">Step 2: Courier & Shipping Logistics</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4.5 gap-y-1">
                <Form.Item label={<span className="text-[#595959] font-bold text-xs">Shipped By (Courier Name)</span>} className="mb-3">
                  <Input 
                    placeholder="e.g. Samuel Ayele"
                    value={formShippedBy}
                    onChange={(e) => setFormShippedBy(e.target.value)}
                    className="h-8.5 rounded focus:border-[#033096]"
                  />
                </Form.Item>

                <Form.Item label={<span className="text-[#595959] font-bold text-xs">Plate No (Vehicle No)</span>} className="mb-3">
                  <Input 
                    placeholder="e.g. AA 3 45811"
                    value={formPlateNo}
                    onChange={(e) => setFormPlateNo(e.target.value)}
                    className="h-8.5 rounded font-mono uppercase focus:border-[#033096]"
                  />
                </Form.Item>

                <Form.Item label={<span className="text-[#595959] font-bold text-xs">Courier Telephone No</span>} className="mb-3">
                  <Input 
                    placeholder="e.g. +251 911 34091"
                    value={formTelephoneNo}
                    onChange={(e) => setFormTelephoneNo(e.target.value)}
                    className="h-8.5 rounded focus:border-[#033096] font-sans"
                  />
                </Form.Item>
              </div>
            </div>

            {/* Step 3: Material Specification Lines */}
            <div className="space-y-2">
              <div className="flex justify-between items-center select-none bg-slate-50 p-2.5 border border-b-0 border-[#f0f0f0] rounded-t-lg">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] font-sans">Specification Spreadsheet of Material Transfers</span>
              </div>
              
              <div className="border border-[#e8e8e8] rounded-b-lg overflow-hidden shadow-3xs bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-[#e8e8e8] text-slate-500 font-bold uppercase tracking-tight text-[10px] font-sans">
                        <th className="p-2 w-10 text-center">No</th>
                        <th className="p-2 min-w-[200px]">የእቃ ስም / መግለጫ (Item Description)</th>
                        <th className="p-2 w-16 text-center">Unit</th>
                        <th className="p-2 w-20 text-center font-sans">In Stock</th>
                        <th className="p-2 w-28 text-center font-sans">ብዛት/Qty</th>
                        <th className="p-2 w-28 text-center font-sans">Unit Price (ETB)</th>
                        <th className="p-2 w-24 text-right">Total Price</th>
                        <th className="p-2 min-w-[140px]">Remark</th>
                        <th className="p-2 w-12 text-center">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {formItems.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-slate-400 italic">
                            No material transfer rows specified. Click "+ Add Material" below to append.
                          </td>
                        </tr>
                      ) : (
                        formItems.map((item, index) => {
                          const availableMats = materials.filter(m => m.storeId === formFromStoreId);
                          const selectedMat = materials.find(m => m.id === item.materialId);
                          const totalRowValue = item.quantity * item.unitPrice;
                          
                          return (
                            <tr key={index} className="hover:bg-slate-50/40">
                              <td className="p-2 text-center text-slate-400 font-bold font-mono">{index + 1}</td>
                              
                              <td className="p-1">
                                <Select
                                  value={item.materialId}
                                  onChange={(val) => handleUpdateFormRow(index, 'materialId', val)}
                                  className="w-full text-xs"
                                  showSearch
                                  optionFilterProp="label"
                                  options={availableMats.length === 0 ? [{ value: '', label: 'No stock in Origin' }] : availableMats.map(m => ({ value: m.id, label: `${m.code} - ${m.description}` }))}
                                />
                              </td>

                              <td className="p-2 text-center font-bold text-slate-500 uppercase">{item.unit || 'PCS'}</td>

                              <td className="p-2 text-center font-bold text-slate-600 bg-slate-50/50">
                                {selectedMat ? selectedMat.quantity : 0}
                              </td>

                              <td className="p-1 text-center">
                                <InputNumber 
                                  min={0.01}
                                  step={1}
                                  required
                                  value={item.quantity}
                                  onChange={(val) => handleUpdateFormRow(index, 'quantity', val || 0)}
                                  className="w-full max-w-[90px] font-bold rounded"
                                />
                              </td>

                              <td className="p-1 text-center">
                                <InputNumber 
                                  min={0}
                                  step={0.1}
                                  required
                                  value={item.unitPrice}
                                  onChange={(val) => handleUpdateFormRow(index, 'unitPrice', val || 0)}
                                  className="w-full max-w-[95px] rounded"
                                />
                              </td>

                              <td className="p-2 text-right font-bold text-slate-800 font-mono">
                                {totalRowValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>

                              <td className="p-1">
                                <Input 
                                  placeholder="Remarks"
                                  value={item.remark || ''}
                                  onChange={(e) => handleUpdateFormRow(index, 'remark', e.target.value)}
                                  className="w-full h-8"
                                />
                              </td>

                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFormRow(index)}
                                  className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-red-500 transition cursor-pointer"
                                >
                                  <DeleteOutlined style={{ fontSize: '12px' }} />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-[#fafafa] border-t border-[#e8e8e8] flex justify-between items-center select-none font-sans">
                  <span className="text-[11px] font-bold text-slate-450 uppercase font-mono">
                    Cumulative Value: {formItems.reduce((acc, f) => acc + (f.quantity * f.unitPrice), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB
                  </span>
                  <button
                    type="button"
                    onClick={handleAddFormRow}
                    className="h-8 px-3.5 bg-white border border-[#d9d9d9] hover:border-[#033096] text-[#033096] rounded font-bold text-xs shadow-3xs flex items-center gap-1 transition select-none cursor-pointer"
                  >
                    <PlusOutlined style={{ strokeWidth: 2.5 }} />
                    <span>+ Add Material Line</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Step 4: Verification & Approval matrix */}
            <div className="p-5.5 bg-[#fafafa] border border-[#f0f0f0] rounded-lg space-y-4">
              <div className="text-center pb-2 border-b border-dashed border-slate-200">
                <span className="text-xs font-bold font-mono tracking-wider text-slate-500 uppercase">Step 4: Verification & Approval matrix</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5 text-xs">
                
                <Form.Item label={<span className="text-[#595959] font-bold text-xs">Requested By (Site Supervisor)</span>} className="mb-2">
                  <Select 
                    value={formRequestedById}
                    onChange={(val) => setFormRequestedById(val)}
                    className="w-full text-xs"
                    showSearch
                    optionFilterProp="label"
                    options={systemUsers.map(u => ({ value: u.id, label: `${u.name} (${u.role.split(' ')[0]})` }))}
                  />
                </Form.Item>

                <Form.Item label={<span className="text-[#595959] font-bold text-xs">Approved By (Site / Project Manager)</span>} className="mb-2">
                  <Select 
                    value={formApprovedById}
                    onChange={(val) => setFormApprovedById(val)}
                    className="w-full text-xs"
                    showSearch
                    optionFilterProp="label"
                    options={systemUsers.map(u => ({ value: u.id, label: `${u.name} (${u.role.split(' ')[0]})` }))}
                  />
                </Form.Item>

                <Form.Item label={<span className="text-[#595959] font-bold text-xs">Issued By (Warehouse Controller)</span>} className="mb-2">
                  <Select 
                    value={formIssuedById}
                    onChange={(val) => setFormIssuedById(val)}
                    className="w-full text-xs"
                    showSearch
                    optionFilterProp="label"
                    options={systemUsers.map(u => ({ value: u.id, label: `${u.name} (${u.role.split(' ')[0]})` }))}
                  />
                </Form.Item>

              </div>
            </div>

          </div>

          {/* Action Buttons footer */}
          <div className="p-4 bg-[#fafafa] border-t border-[#f0f0f0] flex items-center justify-between shrink-0 font-sans">
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setFormTransferNo('');
                setFormItems([]);
              }}
              className="px-4.5 h-9 border border-slate-205 hover:bg-slate-100 text-slate-605 rounded font-bold transition cursor-pointer select-none text-xs"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2 select-none">
              <button
                type="button"
                onClick={() => handleSaveTransferSubmit('Draft')}
                className="px-4 h-9 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded font-bold transition cursor-pointer shadow-3xs text-xs"
              >
                Save as Draft (Pending)
              </button>
              <button
                type="button"
                onClick={() => handleSaveTransferSubmit('Completed')}
                className="px-5.5 h-9 bg-[#033096] hover:bg-blue-800 text-white rounded font-bold transition cursor-pointer shadow-down text-xs"
              >
                Post & Complete Transfer
              </button>
            </div>
          </div>

        </Form>
      ) : (
        
        /* ========================================================= */
        /* RENDER DASHBOARD DIRECTLY FITTING THE SCREENSHOT THEME    */
        /* ========================================================= */
        <div className="space-y-4 no-print select-none">
          
          {/* Header Action Section */}
          <div className="bg-white p-4 pb-1 border border-[#eaeaea] rounded-xl shadow-3xs select-none">
            
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-base font-bold text-[#1a1a1a] flex items-center gap-2">
                  <Layers size={18} className="text-[#033096]" />
                  <span>Inter-Store Stock Transfers</span>
                </h2>
                <span className="text-[11px] text-[#8c8c8c]">Double-entry logistics tracking between Allura warehousing centers</span>
              </div>

              {/* REGISTER BUTTON STYLED TO PERFECTION */}
              <button
                onClick={() => {
                  setIsCreating(true);
                  setSelectedTransferId(null);
                }}
                className="h-8.5 px-4 bg-white hover:bg-slate-50 text-[12px] font-bold text-[#444] border border-[#d2d2d2] rounded-[6px] shadow-3xs hover:border-[#1677ff] active:scale-98 transition duration-150 flex items-center gap-1 cursor-pointer pointer-events-auto"
              >
                <PlusOutlined style={{ fontSize: '10px', strokeWidth: 3 }} />
                <span>Register</span>
              </button>
            </div>

            {/* Quick Filters panel */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 py-3 border-t border-[#f5f5f5]">
              
              {/* Start Date to End Date filter */}
              <div className="flex items-center gap-1.5 h-8">
                <DatePicker
                  placeholder="Start Date"
                  value={startDate ? dayjs(startDate) : null}
                  onChange={(date) => setStartDate(date ? date.format('YYYY-MM-DD') : '')}
                  className="h-8 text-xs font-semibold w-28"
                  allowClear
                />
                <span className="text-slate-300 font-medium select-none">→</span>
                <DatePicker
                  placeholder="End Date"
                  value={endDate ? dayjs(endDate) : null}
                  onChange={(date) => setEndDate(date ? date.format('YYYY-MM-DD') : '')}
                  className="h-8 text-xs font-semibold w-28"
                  allowClear
                />
              </div>

              {/* Keyword query Search */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400 pointer-events-none">
                  <Search size={13} />
                </span>
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Filter GTO / Spec requisitions..."
                  className="w-full h-8 px-2.5 pl-8 border border-[#d9d9d9] bg-white rounded-[4px] outline-none hover:border-[#4096ff] focus:border-[#4096ff] text-xs font-medium transition"
                />
              </div>

              {/* Depart From */}
              <div>
                <Select
                  value={fromStoreFilter}
                  onChange={setFromStoreFilter}
                  className="w-full h-8 text-xs font-semibold custom-select-ledger"
                  options={[{ value: 'all', label: 'All Dispatch Yards' }, ...stores.map(s => ({ value: s.id, label: s.name }))]}
                />
              </div>

              {/* Destination To */}
              <div>
                <Select
                  value={toStoreFilter}
                  onChange={setToStoreFilter}
                  className="w-full h-8 text-xs font-semibold custom-select-ledger"
                  options={[{ value: 'all', label: 'All Recipient Yards' }, ...stores.map(s => ({ value: s.id, label: s.name }))]}
                />
              </div>

              {/* Status Tabs Select style directly resembling "Pending" in the upper screenshot layout */}
              <div>
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  className="w-full h-8 text-xs font-bold"
                  options={[
                    { value: 'All', label: 'All Ledger Statuses' },
                    { value: 'Draft', label: 'Pending (1) State Only' },
                    { value: 'Completed', label: 'Completed Posted Only' }
                  ]}
                />
              </div>

            </div>

          </div>

          {/* CHOSEN LEDGER DATA TABLE REPRESENTATION */}
          <div className="bg-white border border-[#eaeaea] rounded-[6px] overflow-hidden shadow-xs">
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse select-text">
                
                {/* 1. Header Styling matches lilac screenshot backdrop */}
                <thead>
                  <tr className="bg-[#FDE4DA] text-[#4f4f92] border-b border-[#eaeaea] text-[11px] font-bold uppercase tracking-wide select-none">
                    <th className="p-4 pl-5 w-24 text-left font-serif">GTO <span className="text-slate-350 pr-1 select-none">↕</span></th>
                    <th className="p-4 w-28 text-left font-serif">Date <span className="text-slate-350 pr-1 select-none">↕</span></th>
                    <th className="p-4 min-w-[140px] text-left">Receiving Store</th>
                    <th className="p-4 min-w-[140px] text-left">Dispatch Store</th>
                    <th className="p-4 min-w-[200px] text-left">Item</th>
                    <th className="p-4 w-16 text-center">Share</th>
                    <th className="p-4 w-28 text-center">Status</th>
                    <th className="p-4 w-44 text-center">Action</th>
                  </tr>
                </thead>

                {/* 2. Ledger rows exactly matching the row design inside screenshot */}
                <tbody className="divide-y divide-[#efeff3] text-xs font-normal text-[#1a1a1a]">
                  {filteredTransfers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-16 text-center text-slate-400 italic">
                        No inter-store transfer voucher registrations discovered for specified criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredTransfers.map((tx) => {
                      const listStr = formatItemsList(tx.items);
                      
                      return (
                        <tr 
                          key={tx.id} 
                          className="hover:bg-slate-50/60 transition-colors duration-150 relative h-16"
                        >
                          {/* GTO */}
                          <td className="p-4 pl-5 font-bold font-mono text-[#1a1a1a] text-[12px] whitespace-nowrap">
                            {formatGtoNo(tx.transferNo)}
                          </td>

                          {/* Date */}
                          <td className="p-4 font-bold text-[#1a1a19] text-[11px] font-sans whitespace-nowrap">
                            {parseDisplayDate(tx.date)}
                          </td>

                          {/* Receiving Store (split names bold/thin) */}
                          <td className="p-4">
                            {renderStoreCell(tx.toStoreId)}
                          </td>

                          {/* Dispatch Store (split names bold/thin) */}
                          <td className="p-4">
                            {renderStoreCell(tx.fromStoreId)}
                          </td>

                          {/* Item (Concatenated materials descriptions) */}
                          <td className="p-4 text-slate-650 font-medium text-[11px] max-w-sm truncate leading-snug select-text">
                            <Tooltip title={tx.items.map(it => `${it.description} (${it.quantity} ${it.unit})`).join(' | ')}>
                              <span className="cursor-help">{listStr}</span>
                            </Tooltip>
                          </td>

                          {/* Share button */}
                          <td className="p-4 text-center">
                            <Tooltip title="Copy">
                              <button 
                                onClick={() => handleCopyShareLink(tx)}
                                className="p-1.5 bg-transparent border-0 text-[#8B879B] hover:text-[#033096] rounded hover:bg-slate-100 cursor-pointer transition active:scale-90"
                              >
                                <Share2 size={13} strokeWidth={2.4} />
                              </button>
                            </Tooltip>
                          </td>

                          {/* Status - styled similarly to yellow Pending (1) */}
                          <td className="p-4 text-center whitespace-nowrap">
                            {tx.status === 'Draft' ? (
                              <span className="inline-flex items-center px-2.5 py-1 text-[10px] font-bold bg-[#fffad2] text-[#856404] border border-[#ffeeba] rounded-full shadow-3xs select-none">
                                Pending (1)
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 text-[10px] font-bold bg-[#e6ffea] text-[#155724] border border-[#c3e6cb] rounded-full shadow-3xs select-none">
                                Posted
                              </span>
                            )}
                          </td>

                          {/* Action - exact 5 button slots layout */}
                          <td className="p-4 text-center select-none">
                            <div className="flex items-center justify-center gap-1.5">
                              
                              {/* 1. Preview (Eye icon) */}
                              <Tooltip title="View">
                                <button
                                  onClick={() => {
                                    setSelectedTransferId(tx.id);
                                    setIsViewingVoucher(true);
                                  }}
                                  className="p-1.5 bg-transparent border-0 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition cursor-pointer select-none"
                                >
                                  <Eye size={13} strokeWidth={2.2} />
                                </button>
                              </Tooltip>

                              {/* 2. Direct edit (Black pencil) */}
                              <Tooltip title="Edit">
                                <button
                                  onClick={() => handleEditTransfer(tx)}
                                  style={{ color: '#2C2C2C' }}
                                  className="p-1.5 bg-transparent border-0 hover:text-black hover:bg-slate-100 rounded transition cursor-pointer select-none"
                                >
                                  <EditOutlined style={{ fontSize: '13px' }} />
                                </button>
                              </Tooltip>

                              {/* 3. Detailed spreadsheet representation (Blue edit) */}
                              <Tooltip title="View">
                                <button
                                  onClick={() => handleEditTransfer(tx)}
                                  className="p-1.5 bg-transparent border-0 text-[#177ff3] hover:text-[#033096] hover:bg-slate-100 rounded transition cursor-pointer select-none"
                                >
                                  <FileSpreadsheet size={13} strokeWidth={2.2} />
                                </button>
                              </Tooltip>

                              {/* 4. Print (Printer) */}
                              <Tooltip title="Print">
                                <button
                                  onClick={() => {
                                    setSelectedTransferId(tx.id);
                                    setTimeout(() => window.print(), 100);
                                  }}
                                  className="p-1.5 bg-transparent border-0 text-slate-550 hover:text-slate-800 hover:bg-slate-100 rounded transition cursor-pointer select-none"
                                >
                                  <Printer size={13} strokeWidth={2.2} />
                                </button>
                              </Tooltip>

                              {/* 5. Delete (Red Trash) */}
                              <Tooltip title="Delete">
                                <button
                                  onClick={() => handleDeleteTransferItem(tx.id, tx.transferNo)}
                                  className="p-1.5 bg-transparent border-0 text-red-500 hover:text-red-700 hover:bg-red-50/50 rounded transition cursor-pointer select-none"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </Tooltip>

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

        </div>
      )}

      {/* ========================================================= */}
      {/* 3. MODAL FOR THE DETAILED VOUCHER PRINT VIEWER            */}
      {/* ========================================================= */}
      {activeTransfer && (
        <Modal
          open={isViewingVoucher}
          onCancel={() => setIsViewingVoucher(false)}
          title={
            <div className="flex items-center gap-1.5 select-none py-1 border-b border-dashed border-slate-100 font-sans">
              <Layers size={14} className="text-[#033096]" />
              <span className="font-bold text-slate-800 text-sm">Material Transfer Voucher Manifesto</span>
              <span className="ml-1 text-xs px-2 py-0.5 bg-slate-100 font-mono text-slate-500 rounded font-bold uppercase">
                {formatGtoNo(activeTransfer.transferNo)}
              </span>
            </div>
          }
          width={810}
          footer={[
            <Button key="close" onClick={() => setIsViewingVoucher(false)} className="font-sans">
              Close Preview
            </Button>,
            <Button 
              key="print" 
              type="primary" 
              icon={<Printer size={13} style={{ marginRight: '2px' }} />} 
              onClick={() => {
                window.print();
              }}
              style={{ backgroundColor: '#033096', borderColor: '#033096' }}
              className="font-sans font-bold"
            >
              Print Slip Paper
            </Button>
          ]}
          bodyStyle={{ maxHeight: '72vh', overflowY: 'auto', backgroundColor: '#fdfdfd', padding: '16px' }}
        >
          
          {/* Print voucher layout */}
          <div 
            id="grv-print-sheet" 
            className="bg-white border border-[#eaeaea] rounded-[4px] p-6.5 mx-auto max-w-[760px] space-y-6 font-serif relative transition duration-200 select-text"
          >
            
            {/* Status indicator badge */}
            <div className="absolute right-6 top-6 no-print font-sans">
              {activeTransfer.status === 'Draft' ? (
                <span className="inline-flex text-[10px] bg-[#fffad2] text-[#856404] border border-[#ffeeba] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Draft
                </span>
              ) : (
                <span className="inline-flex text-[10px] bg-[#e6ffea] text-[#155724] border border-[#c3e6cb] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Posted & Accounted
                </span>
              )}
            </div>

            {/* Voucher Header Title */}
            <div className="text-center space-y-1">
              <h1 className="text-base font-bold font-serif tracking-wide text-black uppercase">
                Allura Engineering & Trading Plc
              </h1>
              <h2 className="text-xs font-bold font-serif underline tracking-wider text-black">
                Inter Store Transfer Voucher (GTO)
              </h2>
            </div>

            {/* Date and No Alignment right-hand side */}
            <div className="flex justify-end font-serif select-text pt-1">
              <div className="w-52 text-[10px] text-black space-y-1.5">
                <div className="flex items-end gap-1">
                  <span className="font-bold text-black tracking-wider text-[10px] shrink-0">ቀን/Date:</span>
                  <div className="border-b border-black pb-0.5 grow text-left pl-3 text-[10px] font-mono font-bold min-h-[18px]">
                    {activeTransfer.date}
                  </div>
                </div>
                <div className="flex items-end gap-1">
                  <span className="font-bold text-black tracking-wider text-[10px] shrink-0">ቁጥር/No:</span>
                  <div className="border-b border-black pb-0.5 grow text-left pl-3 text-[10px] font-mono font-bold min-h-[18px]">
                    {formatGtoNo(activeTransfer.transferNo)}
                  </div>
                </div>
              </div>
            </div>

            {/* Classical form key points layout exactly matching physical document paper */}
            <div className="space-y-3.5 text-[10px] text-black font-serif pt-3 select-text leading-tight">
              
              <div className="flex items-end flex-wrap gap-x-2 gap-y-2.5">
                <span className="font-bold text-black shrink-0">Material Transfer From:</span>
                <div className="border-b border-black pb-0.5 grow min-w-[180px] pl-3 text-black text-[10px] font-bold">
                  {stores.find(s => s.id === activeTransfer.fromStoreId)?.name || ''}
                </div>
                <span className="font-bold text-black shrink-0 pl-3">To:</span>
                <div className="border-b border-black pb-0.5 grow min-w-[180px] pl-3 text-black text-[10px] font-bold">
                  {stores.find(s => s.id === activeTransfer.toStoreId)?.name || ''}
                </div>
              </div>

              <div className="flex items-end flex-wrap gap-x-2 gap-y-2.5">
                <span className="font-bold text-black shrink-0">Shipped By:</span>
                <div className="border-b border-black pb-0.5 grow min-w-[130px] pl-3 text-black text-[10px] font-bold">
                  {activeTransfer.shippedBy || ''}
                </div>
                <span className="font-bold text-black shrink-0 pl-2">Plate No:</span>
                <div className="border-b border-black pb-0.5 w-36 pl-3 text-black text-[10px] font-bold font-mono uppercase">
                  {activeTransfer.plateNo || ''}
                </div>
                <span className="font-bold text-black shrink-0 pl-2">Telephone No:</span>
                <div className="border-b border-black pb-0.5 w-42 pl-3 text-black text-[10px] font-bold">
                  {activeTransfer.telephoneNo || ''}
                </div>
              </div>

              <div className="flex items-end flex-wrap gap-x-2 gap-y-2.5">
                <span className="font-bold text-black shrink-0">መመሪያ / ክፍል/Project:</span>
                <div className="border-b border-black pb-0.5 grow min-w-[180px] pl-3 text-black text-[10px] font-bold">
                  {activeTransfer.project || ''}
                </div>
                <span className="font-bold text-black shrink-0 pl-3">Material Requisition No:</span>
                <div className="border-b border-black pb-0.5 w-42 pl-3 text-black text-[10px] font-bold font-mono">
                  {activeTransfer.requisitionNo || ''}
                </div>
              </div>

            </div>

            {/* Classical Table representing Voucher list */}
            <div className="pt-2">
              <table className="w-full text-center border-collapse border border-black text-[9px] font-serif text-black uppercase">
                <thead>
                  <tr className="border-b border-black text-black text-center font-bold">
                    <th className="border-r border-black p-1 w-8 text-center font-serif">No</th>
                    <th className="border-r border-black p-1 text-left">የእቃ ስም / መግለጫ (Item Description)</th>
                    <th className="border-r border-black p-1 w-12 text-center">Unit</th>
                    <th className="border-r border-black p-1 w-14 text-center">ብዛት/Qty</th>
                    <th className="border-r border-black p-1 w-20 text-right">Unit Price</th>
                    <th className="border-r border-black p-1 w-24 text-right">Total Price</th>
                    <th className="p-1 text-left">Remark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/60 text-black">
                  {/* Active Item Rows */}
                  {activeTransfer.items.map((item, index) => {
                    const rowTotal = item.quantity * item.unitPrice;
                    return (
                      <tr key={item.id} className="min-h-[22px] h-[22px] text-center">
                        <td className="border-r border-black p-1 font-bold text-center">{index + 1}</td>
                        <td className="border-r border-black p-1 text-left font-bold">{item.description}</td>
                        <td className="border-r border-black p-1 uppercase font-bold text-center">{item.unit || 'PCS'}</td>
                        <td className="border-r border-black p-1 text-center font-bold">{item.quantity.toLocaleString()}</td>
                        <td className="border-r border-black p-1 text-right font-semibold">{item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="border-r border-black p-1 text-right font-bold">{rowTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="p-1 text-left italic">{item.remark || ''}</td>
                      </tr>
                    );
                  })}

                  {/* Filler lines to pad layout up to exactly 10 rows, matching the paper slip */}
                  {Array.from({ length: Math.max(0, 10 - activeTransfer.items.length) }).map((_, spacerIdx) => {
                    const itemNumber = activeTransfer.items.length + spacerIdx + 1;
                    return (
                      <tr key={`spacer-${spacerIdx}`} className="min-h-[22px] h-[22px] select-none text-transparent">
                        <td className="border-r border-black p-1 text-center font-bold">{itemNumber}</td>
                        <td className="border-r border-black p-1"></td>
                        <td className="border-r border-black p-1"></td>
                        <td className="border-r border-black p-1"></td>
                        <td className="border-r border-black p-1"></td>
                        <td className="border-r border-black p-1"></td>
                        <td className="p-1"></td>
                      </tr>
                    );
                  })}

                  {/* Total calculation row */}
                  <tr className="border-t border-black font-bold">
                    <td colSpan={3} className="border-r border-black p-1 text-center font-bold">Cumulative Outlay:</td>
                    <td className="border-r border-black p-1 text-center">{activeTransfer.items.reduce((acc, f) => acc + f.quantity, 0).toLocaleString()}</td>
                    <td className="border-r border-black p-1"></td>
                    <td className="border-r border-black p-1 text-right font-bold font-mono">
                      {activeTransfer.items.reduce((acc, f) => acc + (f.quantity * f.unitPrice), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-1 text-left text-[8px] text-slate-450 lowercase italic font-sans font-normal leading-tight">Auto-Calculated system values</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Classical Signature Sign-offs representation blocks exactly like bottom of screenshot */}
            <div className="grid grid-cols-3 gap-6 pt-12 select-none text-black text-center font-serif text-[10px] leading-tight">
              
              <div className="flex flex-col items-center space-y-1">
                <span className="block font-bold">Requested By</span>
                <div className="w-full space-y-1.5 pt-1.5">
                  <div className="border-b border-black w-4/5 mx-auto"></div>
                  <div className="border-b border-black w-4/5 mx-auto"></div>
                  <div className="border-b border-black w-4/5 mx-auto"></div>
                </div>
              </div>

              <div className="flex flex-col items-center space-y-1">
                <span className="block font-bold">Approved By</span>
                <div className="w-full space-y-1.5 pt-1.5">
                  <div className="border-b border-black w-4/5 mx-auto"></div>
                  <div className="border-b border-black w-4/5 mx-auto"></div>
                  <div className="border-b border-black w-4/5 mx-auto"></div>
                </div>
              </div>

              <div className="flex flex-col items-center space-y-1">
                <span className="block font-bold">Issued By</span>
                <div className="w-full space-y-1.5 pt-1.5">
                  <div className="border-b border-black w-4/5 mx-auto"></div>
                  <div className="border-b border-black w-4/5 mx-auto"></div>
                  <div className="border-b border-black w-4/5 mx-auto"></div>
                </div>
              </div>

            </div>

          </div>

        </Modal>
      )}

    </div>
  );
}
