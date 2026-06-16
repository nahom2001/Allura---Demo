import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, Dropdown, Menu, Tooltip, Form, Input, Select, InputNumber, Modal, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { PlusOutlined, DeleteOutlined, SyncOutlined, MoreOutlined, EyeOutlined, EditOutlined, PrinterOutlined, ShareAltOutlined, CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
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
import { Store, Material, SystemUser, InterStoreTransfer, InterStoreTransferItem, PurchaseRequisition } from '../types';

interface InterStoreTransferViewProps {
  stores: Store[];
  materials: Material[];
  systemUsers: SystemUser[];
  transfers: InterStoreTransfer[];
  onSaveTransfer: (transfer: InterStoreTransfer) => void;
  onDeleteTransfer: (transferId: string) => void;
  istvRequests: any[];
  setIstvRequests: React.Dispatch<React.SetStateAction<any[]>>;
  purchaseRequisitions?: PurchaseRequisition[];
}

export default function InterStoreTransferView({
  stores,
  materials,
  systemUsers,
  transfers,
  onSaveTransfer,
  onDeleteTransfer,
  istvRequests,
  setIstvRequests,
  purchaseRequisitions = []
}: InterStoreTransferViewProps) {
  
  const [selectedTransferId, setSelectedTransferId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isViewingVoucher, setIsViewingVoucher] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // -------------------------------------------------------------
  // Dynamic ISTV Requests (Flowchart integration logic) state
  // -------------------------------------------------------------
  const [linkedRequestId, setLinkedRequestId] = useState<string | null>(null);


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

  // Compiled MR options from default values and dynamic purchaseRequisitions
  const mrOptions = useMemo(() => {
    const list = [
      { code: 'MR-9473', description: 'Requisition - Standard Site Material' },
      { code: 'MR-4903', description: 'Requisition - Reinforcement Steel 12mm' },
      { code: 'MR-1084', description: 'Requisition - PVC Pipe Conduit 50mm' },
    ];
    
    if (purchaseRequisitions && purchaseRequisitions.length > 0) {
      purchaseRequisitions.forEach(pr => {
        const mrCode = pr.srCode ? pr.srCode.replace('SR-', 'MR-') : pr.code.replace('PR-', 'MR-');
        if (!list.some(item => item.code === mrCode)) {
          list.push({
            code: mrCode,
            description: `Requisition - ${pr.description}`
          });
        }
      });
    }
    return list;
  }, [purchaseRequisitions]);

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
      const qtyInit = Math.min(1, availableMats[0].quantity) || 1;
      setFormItems([{
        materialId: availableMats[0].id,
        code: availableMats[0].code,
        description: availableMats[0].description,
        unit: availableMats[0].unit,
        quantity: qtyInit,
        approvedQty: qtyInit,
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
      approvedQty: 1,
      unitPrice: nextMat.unitPrice,
      remark: 'Site operations'
    }]);
  };

  const handleUpdateFormRow = (index: number, field: keyof Omit<InterStoreTransferItem, 'id'>, value: any) => {
    setFormItems(prev => prev.map((item, idx) => {
      if (idx === index) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity') {
          updated.approvedQty = Number(value);
        }
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
    
    // Mark associated ISTV Request as Converted
    if (linkedRequestId) {
      setIstvRequests(prev => prev.map(req => 
        req.id === linkedRequestId ? { ...req, status: 'Converted' } : req
      ));
      setLinkedRequestId(null);
    }

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

  const handleConvertRequest = (req: any) => {
    setIsCreating(true);
    setSelectedTransferId(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    // Prefill the stores
    setFormFromStoreId(req.fromStoreId);
    setFormToStoreId(req.toStoreId);
    setFormRequisitionNo(req.requisitionNo);
    
    // Auto-compute transfer no
    setFormTransferNo(`STV-0${Math.floor(100 + Math.random() * 899)}`);
    setFormShippedBy('Semere Tesfaye');
    setFormPlateNo('AA-3-B45920');
    setFormTelephoneNo('+251 911 349102');

    const matchedMat = materials.find(m => m.id === req.materialId);
    if (matchedMat) {
      setFormItems([{
        materialId: req.materialId,
        code: matchedMat.code,
        description: matchedMat.description,
        unit: matchedMat.unit,
        quantity: req.quantity,
        approvedQty: req.quantity, // Default to requested quantity, editable!
        unitPrice: matchedMat.unitPrice,
        remark: `ISTV Request conversion for requisition No: ${req.requisitionNo}`
      }]);
    } else {
      setFormItems([]);
    }
    setLinkedRequestId(req.id);
    
    setSuccessMessage(`Request loaded into Transfer Form! Please complete the information and submit.`);
    setTimeout(() => setSuccessMessage(''), 4500);
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
                  <Select 
                    value={formRequisitionNo}
                    onChange={(val) => setFormRequisitionNo(val)}
                    placeholder="Select requisition"
                    className="w-full h-8.5 text-xs font-semibold"
                    showSearch
                    optionFilterProp="label"
                    options={mrOptions.map(mr => ({ value: mr.code, label: `${mr.code} — ${mr.description}` }))}
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
                        <th className="p-2 w-28 text-center text-emerald-800 bg-emerald-50/45 font-sans font-bold">Approved Qty</th>
                        <th className="p-2 w-28 text-center font-sans">Unit Price (ETB)</th>
                        <th className="p-2 w-24 text-right">Total Price</th>
                        <th className="p-2 min-w-[140px]">Remark</th>
                        <th className="p-2 w-12 text-center">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {formItems.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="p-8 text-center text-slate-400 italic">
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
                                  onChange={(val) => handleUpdateFormRow(index, 'quantity', val)}
                                  className="w-24 text-center"
                                />
                              </td>
                              
                              <td className="p-1 text-center bg-emerald-50/20">
                                <InputNumber 
                                  min={0}
                                  required
                                  value={item.approvedQty}
                                  onChange={(val) => handleUpdateFormRow(index, 'approvedQty', val)}
                                  className="w-24 text-center font-bold text-emerald-800"
                                />
                              </td>

                              <td className="p-1 text-center">
                                <InputNumber 
                                  min={0}
                                  prefix="ETB"
                                  value={item.unitPrice}
                                  onChange={(val) => handleUpdateFormRow(index, 'unitPrice', val)}
                                  className="w-28 text-center"
                                />
                              </td>

                              <td className="p-2 text-right font-mono font-bold text-slate-700">
                                {totalRowValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>

                              <td className="p-1">
                                <Input 
                                  value={item.remark}
                                  onChange={(e) => handleUpdateFormRow(index, 'remark', e.target.value)}
                                  className="w-full"
                                />
                              </td>

                              <td className="p-2 text-center">
                                <Button 
                                  danger 
                                  type="text" 
                                  icon={<DeleteOutlined />} 
                                  onClick={() => handleRemoveFormRow(index)} 
                                />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-slate-50 border-t border-[#e8e8e8] flex items-center justify-between">
                  <Button 
                    type="dashed" 
                    icon={<PlusOutlined />} 
                    onClick={handleAddFormRow}
                    className="text-xs font-bold"
                  >
                    Add Material Line
                  </Button>
                  <div className="text-[11px] text-slate-500 uppercase font-bold tracking-tight">
                    Total Value: <span className="text-slate-900 font-mono text-xs">{formItems.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB</span>
                  </div>
                </div>
              </div>
            </div>
            
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 rounded-b-xl">
            <Button onClick={() => setIsCreating(false)}>Cancel</Button>
            <Button onClick={() => handleSaveTransferSubmit('Draft')}>Save as Draft</Button>
            <Button type="primary" className="bg-[#033096]" onClick={() => handleSaveTransferSubmit('Completed')}>Complete & Post Transfer</Button>
          </div>
        </Form>
      ) : (
        /* ... Existing list view logic would follow here ... */
        <div className="p-10 bg-white border border-[#eaeaea] rounded-xl text-center">
            <h2 className="text-xl text-slate-400">Inventory Dashboard</h2>
            <Button type="primary" onClick={() => setIsCreating(true)} className="mt-4">New Transfer</Button>
        </div>
      )}
    </div>
  );
}import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, Dropdown, Menu, Tooltip, Form, Input, Select, InputNumber, Modal, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { PlusOutlined, DeleteOutlined, SyncOutlined, MoreOutlined, EyeOutlined, EditOutlined, PrinterOutlined, ShareAltOutlined, CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
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
import { Store, Material, SystemUser, InterStoreTransfer, InterStoreTransferItem, PurchaseRequisition } from '../types';

interface InterStoreTransferViewProps {
  stores: Store[];
  materials: Material[];
  systemUsers: SystemUser[];
  transfers: InterStoreTransfer[];
  onSaveTransfer: (transfer: InterStoreTransfer) => void;
  onDeleteTransfer: (transferId: string) => void;
  istvRequests: any[];
  setIstvRequests: React.Dispatch<React.SetStateAction<any[]>>;
  purchaseRequisitions?: PurchaseRequisition[];
}

export default function InterStoreTransferView({
  stores,
  materials,
  systemUsers,
  transfers,
  onSaveTransfer,
  onDeleteTransfer,
  istvRequests,
  setIstvRequests,
  purchaseRequisitions = []
}: InterStoreTransferViewProps) {
  
  const [selectedTransferId, setSelectedTransferId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isViewingVoucher, setIsViewingVoucher] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // -------------------------------------------------------------
  // Dynamic ISTV Requests (Flowchart integration logic) state
  // -------------------------------------------------------------
  const [linkedRequestId, setLinkedRequestId] = useState<string | null>(null);


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

  // Compiled MR options from default values and dynamic purchaseRequisitions
  const mrOptions = useMemo(() => {
    const list = [
      { code: 'MR-9473', description: 'Requisition - Standard Site Material' },
      { code: 'MR-4903', description: 'Requisition - Reinforcement Steel 12mm' },
      { code: 'MR-1084', description: 'Requisition - PVC Pipe Conduit 50mm' },
    ];
    
    if (purchaseRequisitions && purchaseRequisitions.length > 0) {
      purchaseRequisitions.forEach(pr => {
        const mrCode = pr.srCode ? pr.srCode.replace('SR-', 'MR-') : pr.code.replace('PR-', 'MR-');
        if (!list.some(item => item.code === mrCode)) {
          list.push({
            code: mrCode,
            description: `Requisition - ${pr.description}`
          });
        }
      });
    }
    return list;
  }, [purchaseRequisitions]);

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
      const qtyInit = Math.min(1, availableMats[0].quantity) || 1;
      setFormItems([{
        materialId: availableMats[0].id,
        code: availableMats[0].code,
        description: availableMats[0].description,
        unit: availableMats[0].unit,
        quantity: qtyInit,
        approvedQty: qtyInit,
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
      approvedQty: 1,
      unitPrice: nextMat.unitPrice,
      remark: 'Site operations'
    }]);
  };

  const handleUpdateFormRow = (index: number, field: keyof Omit<InterStoreTransferItem, 'id'>, value: any) => {
    setFormItems(prev => prev.map((item, idx) => {
      if (idx === index) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity') {
          updated.approvedQty = Number(value);
        }
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
    
    // Mark associated ISTV Request as Converted
    if (linkedRequestId) {
      setIstvRequests(prev => prev.map(req => 
        req.id === linkedRequestId ? { ...req, status: 'Converted' } : req
      ));
      setLinkedRequestId(null);
    }

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

  const handleConvertRequest = (req: any) => {
    setIsCreating(true);
    setSelectedTransferId(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    // Prefill the stores
    setFormFromStoreId(req.fromStoreId);
    setFormToStoreId(req.toStoreId);
    setFormRequisitionNo(req.requisitionNo);
    
    // Auto-compute transfer no
    setFormTransferNo(`STV-0${Math.floor(100 + Math.random() * 899)}`);
    setFormShippedBy('Semere Tesfaye');
    setFormPlateNo('AA-3-B45920');
    setFormTelephoneNo('+251 911 349102');

    const matchedMat = materials.find(m => m.id === req.materialId);
    if (matchedMat) {
      setFormItems([{
        materialId: req.materialId,
        code: matchedMat.code,
        description: matchedMat.description,
        unit: matchedMat.unit,
        quantity: req.quantity,
        approvedQty: req.quantity, // Default to requested quantity, editable!
        unitPrice: matchedMat.unitPrice,
        remark: `ISTV Request conversion for requisition No: ${req.requisitionNo}`
      }]);
    } else {
      setFormItems([]);
    }
    setLinkedRequestId(req.id);
    
    setSuccessMessage(`Request loaded into Transfer Form! Please complete the information and submit.`);
    setTimeout(() => setSuccessMessage(''), 4500);
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
                  <Select 
                    value={formRequisitionNo}
                    onChange={(val) => setFormRequisitionNo(val)}
                    placeholder="Select requisition"
                    className="w-full h-8.5 text-xs font-semibold"
                    showSearch
                    optionFilterProp="label"
                    options={mrOptions.map(mr => ({ value: mr.code, label: `${mr.code} — ${mr.description}` }))}
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
                        <th className="p-2 w-28 text-center text-emerald-800 bg-emerald-50/45 font-sans font-bold">Approved Qty</th>
                        <th className="p-2 w-28 text-center font-sans">Unit Price (ETB)</th>
                        <th className="p-2 w-24 text-right">Total Price</th>
                        <th className="p-2 min-w-[140px]">Remark</th>
                        <th className="p-2 w-12 text-center">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {formItems.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="p-8 text-center text-slate-400 italic">
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
                                  onChange={(val) => handleUpdateFormRow(index, 'quantity', val)}
                                  className="w-24 text-center"
                                />
                              </td>
                              
                              <td className="p-1 text-center bg-emerald-50/20">
                                <InputNumber 
                                  min={0}
                                  required
                                  value={item.approvedQty}
                                  onChange={(val) => handleUpdateFormRow(index, 'approvedQty', val)}
                                  className="w-24 text-center font-bold text-emerald-800"
                                />
                              </td>

                              <td className="p-1 text-center">
                                <InputNumber 
                                  min={0}
                                  prefix="ETB"
                                  value={item.unitPrice}
                                  onChange={(val) => handleUpdateFormRow(index, 'unitPrice', val)}
                                  className="w-28 text-center"
                                />
                              </td>

                              <td className="p-2 text-right font-mono font-bold text-slate-700">
                                {totalRowValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>

                              <td className="p-1">
                                <Input 
                                  value={item.remark}
                                  onChange={(e) => handleUpdateFormRow(index, 'remark', e.target.value)}
                                  className="w-full"
                                />
                              </td>

                              <td className="p-2 text-center">
                                <Button 
                                  danger 
                                  type="text" 
                                  icon={<DeleteOutlined />} 
                                  onClick={() => handleRemoveFormRow(index)} 
                                />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-slate-50 border-t border-[#e8e8e8] flex items-center justify-between">
                  <Button 
                    type="dashed" 
                    icon={<PlusOutlined />} 
                    onClick={handleAddFormRow}
                    className="text-xs font-bold"
                  >
                    Add Material Line
                  </Button>
                  <div className="text-[11px] text-slate-500 uppercase font-bold tracking-tight">
                    Total Value: <span className="text-slate-900 font-mono text-xs">{formItems.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB</span>
                  </div>
                </div>
              </div>
            </div>
            
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 rounded-b-xl">
            <Button onClick={() => setIsCreating(false)}>Cancel</Button>
            <Button onClick={() => handleSaveTransferSubmit('Draft')}>Save as Draft</Button>
            <Button type="primary" className="bg-[#033096]" onClick={() => handleSaveTransferSubmit('Completed')}>Complete & Post Transfer</Button>
          </div>
        </Form>
      ) : (
        /* ... Existing list view logic would follow here ... */
        <div className="p-10 bg-white border border-[#eaeaea] rounded-xl text-center">
            <h2 className="text-xl text-slate-400">Inventory Dashboard</h2>
            <Button type="primary" onClick={() => setIsCreating(true)} className="mt-4">New Transfer</Button>
        </div>
      )}
    </div>
  );
}