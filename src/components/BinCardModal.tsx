import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  FileText, 
  ArrowDownLeft, 
  ArrowUpRight, 
  RotateCcw, 
  Users, 
  UserPlus, 
  ShieldCheck, 
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import { Material, Store, BinCardTransaction, SystemUser } from '../types';

interface BinCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: Material | null;
  store: Store | null;
  transactions: BinCardTransaction[];
  onAddTransaction: (transaction: Omit<BinCardTransaction, 'id' | 'materialId'>) => void;
  onDeleteTransaction: (id: string) => void;
  users: SystemUser[];
  onUpdateSignoffs: (materialId: string, preparedById?: string, checkedById?: string, approvedById?: string) => void;
  onAddUser: (name: string, role: SystemUser['role'], initials: string, email: string) => void;
  allMaterials: Material[];
  onSelectMaterial: (material: Material) => void;
  stores: Store[];
}

export default function BinCardModal({
  isOpen,
  onClose,
  material,
  store,
  transactions,
  onAddTransaction,
  onDeleteTransaction,
  users,
  onUpdateSignoffs,
  onAddUser,
  allMaterials,
  onSelectMaterial,
  stores
}: BinCardModalProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUserRegForm, setShowUserRegForm] = useState(false);
  
  // Transaction type filter / entry state
  const [type, setType] = useState<'RECEIVED' | 'ISSUED' | 'RETURNED' | 'TRANSFERRED'>('RECEIVED');
  const [grnSivNo, setGrnSivNo] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [qty, setQty] = useState<number>(0);
  const [date, setDate] = useState('2026-06-03');
  const [unitPrice, setUnitPrice] = useState<number>(material?.unitPrice || 0);
  const [remark, setRemark] = useState('');
  const [error, setError] = useState('');

  // Local filter states matching screenshot top controllers
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // User input states for team registration form
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<SystemUser['role']>('Store Keeper');
  const [newUserInitials, setNewUserInitials] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [userRegError, setUserRegError] = useState('');
  const [userRegSuccess, setUserRegSuccess] = useState('');

  // Dynamic user resolution (matching logged-in user)
  const currentUser = users.find(u => u.email === 'nahomcondigital@gmail.com') || {
    id: 'usr-1',
    name: 'Nahom Sisay',
    role: 'Store Keeper' as const,
    initials: 'N.S.',
    email: 'nahomcondigital@gmail.com'
  };

  // Local states for sign-offs
  const [checkedBy, setCheckedBy] = useState('');
  const [approvedBy, setApprovedBy] = useState('');

  if (!isOpen || !material) return null;

  // Sync state whenever material changes or opens
  React.useEffect(() => {
    if (material) {
      setUnitPrice(material.unitPrice);
      setQty(0);
      
      // Auto-filled voucher IDs based on types
      let prefix = 'GRN-';
      if (type === 'ISSUED') prefix = 'SIV-';
      if (type === 'RETURNED') prefix = 'RET-';
      if (type === 'TRANSFERRED') prefix = 'TRN-';
      setGrnSivNo(prefix + Math.floor(1000 + Math.random() * 9000));
      setPlateNumber('');
      setRemark('');
      
      // Load current assignments
      setCheckedBy(material.checkedById || '');
      setApprovedBy(material.approvedById || '');
    }
  }, [material, type, isOpen]);

  // Synchronize dynamic Prepared By to the parent state representing current session
  React.useEffect(() => {
    if (material && material.preparedById !== currentUser.id) {
      onUpdateSignoffs(material.id, currentUser.id, material.checkedById, material.approvedById);
    }
  }, [material, currentUser, onUpdateSignoffs]);

  const handleUpdateCheckedBy = (val: string) => {
    setCheckedBy(val);
    onUpdateSignoffs(material.id, currentUser.id, val, approvedBy);
  };

  const handleUpdateApprovedBy = (val: string) => {
    setApprovedBy(val);
    onUpdateSignoffs(material.id, currentUser.id, checkedBy, val);
  };

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!grnSivNo.trim()) return setError('Please enter GRN / SIV number.');
    if (qty <= 0) return setError('Quantity must be greater than 0.');

    // Ensure we do not issue or transfer beyond current stock safety levels
    if ((type === 'ISSUED' || type === 'TRANSFERRED') && qty > material.quantity) {
      return setError(`Insufficient stock! Maximum available quantity is ${material.quantity} ${material.unit}.`);
    }

    onAddTransaction({
      date,
      grnSivNo: grnSivNo.trim(),
      receivedQty: type === 'RECEIVED' ? qty : undefined,
      issuedQty: type === 'ISSUED' ? qty : undefined,
      returnedQty: type === 'RETURNED' ? qty : undefined,
      transferredQty: type === 'TRANSFERRED' ? qty : undefined,
      plateNumber: plateNumber.trim() || undefined,
      balance: 0, 
      unitPrice: unitPrice,
      remark: remark.trim() || undefined,
      signature: currentUser.initials
    });

    // Reset Form
    setQty(0);
    setRemark('');
    setPlateNumber('');
    setError('');
    setShowAddForm(false);
  };

  const handleRegisterUser = (e: React.FormEvent) => {
    e.preventDefault();
    setUserRegError('');
    setUserRegSuccess('');

    if (!newUserName.trim()) return setUserRegError('Please provide a full name.');
    if (!newUserInitials.trim()) return setUserRegError('Initials are required.');
    if (!newUserEmail.trim()) return setUserRegError('Email address is required.');

    // Check duplication of initials
    const duplicate = users.find(u => u.initials.toUpperCase() === newUserInitials.trim().toUpperCase());
    if (duplicate) {
      return setUserRegError(`Initials "${newUserInitials.toUpperCase()}" are already assigned to ${duplicate.name}. Please supply unique initials.`);
    }

    onAddUser(
      newUserName.trim(),
      newUserRole,
      newUserInitials.trim().toUpperCase(),
      newUserEmail.trim()
    );

    setUserRegSuccess(`Successfully registered ${newUserName} in system registry!`);
    
    // Clear registration fields
    setNewUserName('');
    setNewUserInitials('');
    setNewUserEmail('');
    
    setTimeout(() => {
      setShowUserRegForm(false);
      setUserRegSuccess('');
    }, 2000);
  };

  // Handle Export to CSV
  const handleExportCSV = () => {
    const csvRows = [
      ['No', 'Date', 'Unit', 'Voucher No', 'Plate Number', 'Received', 'Issued', 'Returned', 'Transferred', 'Balance']
    ];

    let running = 0;
    const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
    
    sorted.forEach((t, i) => {
      let delta = 0;
      if (t.receivedQty !== undefined) delta = t.receivedQty;
      else if (t.returnedQty !== undefined) delta = t.returnedQty;
      else if (t.issuedQty !== undefined) delta = -t.issuedQty;
      else if (t.transferredQty !== undefined) delta = -t.transferredQty;
      running += delta;

      csvRows.push([
        (i + 2).toString(),
        t.date,
        material.unit,
        t.grnSivNo,
        t.plateNumber || '',
        t.receivedQty !== undefined ? t.receivedQty.toString() : '',
        t.issuedQty !== undefined ? t.issuedQty.toString() : '',
        t.returnedQty !== undefined ? t.returnedQty.toString() : '',
        t.transferredQty !== undefined ? t.transferredQty.toString() : '',
        running.toString()
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + csvRows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(',')).join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BinCard_Ledger_${material.code}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Systems Calculations
  const currentQty = material.quantity;
  const minStock = material.minimumStock ?? 50;

  // Sorting and historical running balance building
  const sortedTxs = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
  
  const txBalancesMap = new Map<string, number>();
  let historicRunning = 0;
  sortedTxs.forEach((t) => {
    let delta = 0;
    if (t.receivedQty !== undefined) delta = t.receivedQty;
    else if (t.returnedQty !== undefined) delta = t.returnedQty;
    else if (t.issuedQty !== undefined) delta = -t.issuedQty;
    else if (t.transferredQty !== undefined) delta = -t.transferredQty;
    historicRunning += delta;
    txBalancesMap.set(t.id, historicRunning);
  });

  // Filter chronologically for rendering
  const filteredTxs = sortedTxs.filter(t => {
    if (startDate && t.date < startDate) return false;
    if (endDate && t.date > endDate) return false;
    return true;
  });

  // Helper to re-format YYYY-MM-DD to DD/MM/YYYY for precise screenshot visual emulation
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none" id="bincard-modal">
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          #bincard-modal-backdrop, .no-print, button, form, .bg-slate-900\\/60, #bincard-modal-header, .interactive-panel {
            display: none !important;
          }
          #bincard-scroll-area {
            max-height: none !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          #printable-bin-card {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }
          #printable-paper {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
        }
      `}</style>

      {/* Dark overlay */}
      <div id="bincard-modal-backdrop" className="fixed inset-0 bg-slate-900/60 transition-opacity duration-300 backdrop-blur-xs" onClick={onClose}></div>

      {/* Sheet Container */}
      <div id="printable-bin-card" className="relative w-full max-w-6xl mx-auto my-6 px-4 z-10 duration-300 transform scale-100">
        <div className="relative flex flex-col w-full bg-white border border-slate-300 rounded-xl shadow-2xl overflow-hidden">
          
          {/* Header Bar */}
          <div id="bincard-modal-header" className="bg-[#033096] text-white px-6 py-4 flex items-center justify-between select-none">
            <div className="flex items-center space-x-2.5">
              <FileText size={18} className="text-blue-100" />
              <div className="text-left">
                <span className="font-bold text-sm tracking-tight block">ConDigital Intelligent Bin Ledger</span>
                <span className="text-[10px] text-blue-200/90 font-mono">CODE: DB-BIN-{material.code} • REALTIME AUDITED BALANCE STATE</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-xs bg-blue-800 text-blue-100 px-3 py-1 rounded-md font-medium border border-blue-700">
                User: {currentUser.name} ({currentUser.role})
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowUserRegForm(!showUserRegForm);
                  setShowAddForm(false);
                }}
                className="flex items-center space-x-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded text-xs font-semibold cursor-pointer transition"
                title="Manage System Staff Registry"
              >
                <Users size={14} />
                <span>Team Panel</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-blue-100 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div id="bincard-scroll-area" className="p-6 md:p-8 max-h-[85vh] overflow-y-auto space-y-6 bg-slate-50/50">
            
            {showUserRegForm && (
              <div className="bg-white border-2 border-blue-600 rounded-xl p-5 shadow-md relative no-print">
                <button
                  onClick={() => setShowUserRegForm(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg font-bold"
                >
                  &times;
                </button>
                
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-1.5">
                  <UserPlus size={16} className="text-[#033096]" />
                  <span>Register System Staff And Actors</span>
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Add site staff, stock controllers, store keepers or supervising managers to check or authorize receipts and issues.
                </p>

                {userRegError && (
                  <div className="mb-3 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md font-medium">
                    {userRegError}
                  </div>
                )}
                {userRegSuccess && (
                  <div className="mb-3 p-2.5 bg-green-50 border border-green-200 text-green-700 text-xs rounded-md font-medium">
                    {userRegSuccess}
                  </div>
                )}

                <form onSubmit={handleRegisterUser} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Kidus Daniel"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded outline-none focus:border-blue-500 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">System Role</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as SystemUser['role'])}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded outline-none focus:border-blue-500 text-slate-800"
                    >
                      <option value="Store Keeper">Store Keeper (Prepared By)</option>
                      <option value="Stock Controller">Stock Controller (Checked By)</option>
                      <option value="Warehouse Manager">Warehouse Manager (Approved By)</option>
                      <option value="Project Manager">Project Manager (Approved By)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Signature Initials</label>
                    <input
                      type="text"
                      placeholder="e.g. K.D."
                      maxLength={5}
                      value={newUserInitials}
                      onChange={(e) => setNewUserInitials(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded outline-none focus:border-blue-500 text-slate-800 placeholder-slate-400"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="grow">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Email</label>
                      <input
                        type="email"
                        placeholder="e.g. kidus.d@allura.com"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded outline-none focus:border-blue-500 text-slate-800 placeholder-slate-400"
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-[#033096] text-white px-4 py-1.5 font-bold hover:bg-blue-800 rounded transition cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                </form>

                {/* Show current list of users registered */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Currently Registered System Actors ({users.length}):</span>
                  <div className="flex flex-wrap gap-2">
                    {users.map(u => (
                      <span 
                        key={u.id}
                        className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200 font-medium"
                      >
                        <UserCheck size={11} className="text-[#033096]" />
                        <span className="font-semibold text-slate-800">{u.name}</span>
                        <span className="text-[9px] bg-slate-200 px-1 rounded text-slate-500 italic font-bold">{u.initials}</span>
                        <span className="text-[9px] text-[#033096] font-medium">&bull; {u.role}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TOP CONTROLLER BAR - Matching the clean visual layout of your screenshot */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-end justify-between no-print select-none">
              
              {/* Central Date filters & Electronic Status Switch */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 justify-start">
                
                <div className="flex flex-col py-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Voucher Posting Intervals</span>
                  <div className="flex items-center space-x-1.5 border border-slate-250 rounded-lg bg-white px-3 h-9 text-slate-700 shadow-2xs">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      title="Start date filter"
                      className="text-xs font-semibold text-slate-700 outline-none cursor-pointer bg-transparent py-0.5"
                    />
                    <span className="text-slate-300 text-xs font-semibold px-1">to</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      title="End date filter"
                      className="text-xs font-semibold text-slate-700 outline-none cursor-pointer bg-transparent py-0.5"
                    />
                  </div>
                </div>

                {/* Status indicator switch */}
                <div className="flex flex-col py-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Electronic Status</span>
                  <button
                    type="button"
                    onClick={() => {
                      const isApproved = !!material.approvedById;
                      const nextApprovedId = isApproved ? '' : 'usr-7'; // Selamawit PM
                      onUpdateSignoffs(material.id, material.preparedById || currentUser.id, material.checkedById, nextApprovedId);
                    }}
                    className={`h-9 px-4 rounded-lg text-xs font-bold border transition flex items-center justify-center shadow-2xs cursor-pointer ${
                      material.approvedById 
                        ? 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600' 
                        : 'bg-slate-100 text-slate-500 border-slate-250 hover:bg-slate-200'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full mr-2 ${material.approvedById ? 'bg-white' : 'bg-slate-400'}`}></span>
                    <span>{material.approvedById ? 'Approved' : 'Pending Approval'}</span>
                  </button>
                </div>

              </div>

              {/* Action buttons (Export, Print, Reset) */}
              <div className="flex flex-col shrink-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Actions</span>
                <div className="flex items-center gap-1.5 bg-slate-50 p-1 border border-slate-200 rounded-lg h-9">
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="px-3.5 h-7 bg-white border border-slate-220 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-3xs"
                    title="Export Ledger transaction table as spreadsheet"
                  >
                    <FileText size={13} className="text-slate-400" />
                    <span>Export</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 h-7 bg-[#033096] hover:bg-blue-800 text-white rounded-md text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-down shadow-blue-900/10"
                  >
                    <FileText size={13} />
                    <span>Print</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                    }}
                    className="w-7 h-7 bg-white border border-slate-220 hover:bg-slate-50 text-slate-400 rounded-md transition cursor-pointer shadow-3xs hover:text-slate-800 flex items-center justify-center shrink-0"
                    title="Clear date range filters"
                  >
                    <RotateCcw size={13} />
                  </button>
                </div>
              </div>

            </div>

            {/* Paper Document Layout Area (The printable Sheet) */}
            <div id="printable-paper" className="border border-slate-300 bg-white p-6 md:p-8 rounded-lg shadow-sm text-slate-800 font-sans relative">
              <div className="absolute top-4 right-4 text-[9px] uppercase font-bold tracking-widest text-slate-300 pointer-events-none font-mono no-print">
                SYSTEM RECORD #ALLURA-BC-{material.code}
              </div>

              {/* Company & Title Header block */}
              <div className="text-center space-y-1 mb-6 border-b border-slate-200 pb-5 select-none">
                <h1 className="text-md font-bold uppercase tracking-wider text-slate-900">
                  ALLURA ENGINEERING & TRADING Plc
                </h1>
                <h2 className="text-xl font-black uppercase tracking-widest text-[#033096]">
                  BIN CARD
                </h2>
              </div>

              {/* Dynamic Metadata Blanks - Grid Form */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-6 text-[13px] border border-slate-250 p-4 rounded-lg bg-[#fafaff] mb-6">
                <div className="space-y-1.5">
                  <div className="flex items-baseline">
                    <span className="text-slate-500 font-semibold whitespace-nowrap mr-2">Material Name:</span>
                    <span className="border-b border-slate-300 font-bold text-slate-900 grow pb-0.5">
                      {material.description}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-baseline">
                    <span className="text-slate-500 font-semibold whitespace-nowrap mr-2">Item Code:</span>
                    <span className="border-b border-slate-300 font-mono font-bold text-slate-900 grow pb-0.5">
                      {material.code}
                    </span>
                  </div>
                  <div className="flex items-baseline">
                    <span className="text-slate-500 font-semibold whitespace-nowrap mr-2">Minimum Stock:</span>
                    <span className="border-b border-slate-300 font-semibold text-slate-700 grow pb-0.5 text-right font-mono">
                      {minStock.toLocaleString()} {material.unit}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-baseline">
                    <span className="text-slate-500 font-semibold whitespace-nowrap mr-2">Unit/Measu.:</span>
                    <span className="border-b border-slate-300 font-bold text-slate-900 grow pb-0.5">
                      {material.unit}
                    </span>
                  </div>
                  <div className="flex items-baseline">
                    <span className="text-slate-500 font-semibold whitespace-nowrap mr-2">Maximum Stock:</span>
                    <span className="border-b border-slate-300 font-semibold text-slate-700 grow pb-0.5 text-right font-mono">
                      {(material.maximumStock ?? 1000).toLocaleString()} {material.unit}
                    </span>
                  </div>
                </div>
              </div>

              {/* Transactions Ledger Table styled exactly like your screenshot */}
              <div className="overflow-x-auto border border-slate-300 rounded-md shadow-2xs">
                <table className="w-full text-left table-auto border-collapse text-[12px] font-sans">
                  <thead>
                    <tr className="bg-[#fcfcff] text-[#2d3043] font-bold border-b border-slate-300 select-none text-[11px] uppercase tracking-wider">
                      <th className="p-3 border-r border-slate-200 text-center w-12">No</th>
                      <th className="p-3 border-r border-slate-200">Date</th>
                      <th className="p-3 border-r border-slate-200 text-center w-16">Unit</th>
                      <th className="p-3 border-r border-slate-200">Voucher No</th>
                      <th className="p-3 border-r border-slate-200 text-center">Plate Number</th>
                      <th className="p-3 border-r border-slate-200 text-right text-green-700 font-sans">Received</th>
                      <th className="p-3 border-r border-slate-200 text-right text-emerald-800 bg-emerald-50/30 font-sans font-extrabold uppercase">Approved Qty</th>
                      <th className="p-3 border-r border-slate-200 text-right text-amber-700">Issued</th>
                      <th className="p-3 border-r border-slate-200 text-right text-rose-700">Returned</th>
                      <th className="p-3 border-r border-slate-200 text-right text-indigo-750">Transferred</th>
                      <th className="p-3 text-right bg-blue-50/15 text-[#033096]">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    
                    {/* Row 1: Historic Starting Balance Row (Mocked exactly matching screenshot) */}
                    <tr className="bg-[#fafaff]/30">
                      <td className="p-3 border-r border-slate-200 text-center font-bold text-slate-400">1</td>
                      <td className="p-3 border-r border-slate-200 font-semibold text-slate-500">Starting Balance</td>
                      <td className="p-3 border-r border-slate-200 text-center text-slate-500 font-mono">{material.unit}</td>
                      <td className="p-3 border-r border-slate-200">
                        <div className="w-16 h-6 border border-dashed border-slate-200 rounded"></div>
                      </td>
                      <td className="p-3 border-r border-slate-200 text-center text-slate-400">-</td>
                      <td className="p-3 border-r border-slate-200 text-right text-slate-400 font-mono">-</td>
                      <td className="p-3 border-r border-slate-200 text-right text-slate-400 font-mono bg-[#fafaff]/30">-</td>
                      <td className="p-3 border-r border-slate-200 text-right text-slate-400 font-mono">-</td>
                      <td className="p-3 border-r border-slate-200 text-right text-slate-400 font-mono">-</td>
                      <td className="p-3 border-r border-slate-200 text-right text-slate-400 font-mono">-</td>
                      <td className="p-3 text-right text-slate-400 font-bold bg-blue-50/5 font-mono">-</td>
                    </tr>

                    {/* Dynamic ledger transactions */}
                    {filteredTxs.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="p-10 text-center text-slate-400 italic font-medium">
                          No transactions found within the filtered range.
                        </td>
                      </tr>
                    ) : (
                      filteredTxs.map((t, idx) => (
                        <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                          {/* index offset because starting balance is row 1 */}
                          <td className="p-3 border-r border-slate-200 text-center font-bold text-slate-500">{idx + 2}</td>
                          <td className="p-3 border-r border-slate-200 text-slate-800 font-semibold">{formatDate(t.date)}</td>
                          <td className="p-3 border-r border-slate-200 text-center font-medium text-slate-550 font-mono">{material.unit}</td>
                          
                          {/* Voucher with neat dashed outline box like screenshot */}
                          <td className="p-3 border-r border-slate-200 font-mono text-slate-800">
                            <div className="inline-block px-2.5 py-1 border border-dashed border-slate-300 rounded font-bold bg-slate-50/50">
                              {t.grnSivNo}
                            </div>
                          </td>

                          <td className="p-3 border-r border-slate-200 text-center font-semibold font-mono text-slate-700">
                            {t.plateNumber || '-'}
                          </td>

                          <td className="p-3 border-r border-slate-200 text-right font-bold text-green-700 font-mono">
                            {t.receivedQty !== undefined ? t.receivedQty.toFixed(2) : '-'}
                          </td>
                          <td className="p-3 border-r border-slate-200 text-right font-semibold text-emerald-800 bg-emerald-50/15 font-mono">
                            {t.approvedQty !== undefined 
                              ? t.approvedQty.toFixed(2) 
                              : (t.receivedQty !== undefined 
                                  ? t.receivedQty.toFixed(2) 
                                  : (t.issuedQty !== undefined 
                                      ? t.issuedQty.toFixed(2) 
                                      : '-'
                                    )
                                )
                            }
                          </td>
                          <td className="p-3 border-r border-slate-200 text-right font-bold text-amber-700 font-mono">
                            {t.issuedQty !== undefined ? t.issuedQty.toFixed(2) : '-'}
                          </td>
                          <td className="p-3 border-r border-slate-200 text-right font-bold text-rose-700 font-mono">
                            {t.returnedQty !== undefined ? t.returnedQty.toFixed(2) : '-'}
                          </td>
                          <td className="p-3 border-r border-slate-200 text-right font-bold text-indigo-750 font-mono">
                            {t.transferredQty !== undefined ? t.transferredQty.toFixed(2) : '-'}
                          </td>
                          
                          {/* Balance from historic map calculations */}
                          <td className="p-3 text-right bg-blue-50/15 text-[#033096] font-extrabold font-mono text-[13px]">
                            {txBalancesMap.get(t.id) !== undefined ? txBalancesMap.get(t.id)!.toFixed(2) : '0.00'}
                          </td>
                        </tr>
                      ))
                    )}

                    {/* Filler blank lines if database transactions are small */}
                    {filteredTxs.length < 4 && Array.from({ length: 4 - filteredTxs.length }).map((_, i) => (
                      <tr key={`blank-${i}`} className="h-10 select-none pointer-events-none text-slate-300">
                        <td className="border-r border-slate-100 text-center font-medium">{filteredTxs.length + i + 2}</td>
                        <td className="border-r border-slate-100">&nbsp;</td>
                        <td className="border-r border-slate-100">&nbsp;</td>
                        <td className="border-r border-slate-100">&nbsp;</td>
                        <td className="border-r border-slate-100">&nbsp;</td>
                        <td className="border-r border-slate-100">&nbsp;</td>
                        <td className="border-r border-slate-100">&nbsp;</td>
                        <td className="border-r border-slate-100">&nbsp;</td>
                        <td className="border-r border-slate-100">&nbsp;</td>
                        <td className="bg-blue-50/5">&nbsp;</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Alerts & Warnings buffer */}
              {currentQty <= minStock && (
                <div className="mt-4 p-3.5 bg-red-50 border border-red-200/80 rounded-xl text-xs text-red-800 flex items-start space-x-2.5 shadow-3xs no-print">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold">SYSTEM THRESHOLD ALERT:</span>
                    <p className="mt-0.5 text-slate-650 font-medium">
                      Active balance ({currentQty.toLocaleString()} {material.unit}) has dropped below the safety stock margin ({minStock.toLocaleString()} {material.unit}). Please submit a procurement requisition.
                    </p>
                  </div>
                </div>
              )}

              {/* Sign-off signatures block footer (All emojis removed) */}
              <div className="mt-10 pt-6 border-t border-slate-300 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-650">
                
                {/* 1. Prepared By - Automatically fetched as the logged in user with initials seal */}
                <div className="space-y-1 bg-slate-50/20 border border-slate-150 p-3 rounded-lg relative">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-450 block select-none">1. Prepared By (Store Keeper)</span>
                  <div className="py-2.5 px-3 border border-slate-200 rounded font-semibold text-slate-800 bg-white shadow-3xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#033096] block text-xs">{currentUser.name}</span>
                      <span className="text-[9px] text-slate-400 italic">Active Logged-In User</span>
                    </div>
                    <span className="px-2 py-0.5 bg-blue-50 text-[#033096] border border-blue-100 text-[10px] font-extrabold uppercase font-mono rounded">
                      Initials: {currentUser.initials}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 italic">Electronic signature verified session</p>
                </div>

                {/* 2. Checked By Select Dropdown */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-450 block select-none">2. Checked By (Stock Auditor)</span>
                  <div className="relative">
                    <select
                      value={checkedBy}
                      onChange={(e) => handleUpdateCheckedBy(e.target.value)}
                      className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-250 rounded font-sans font-semibold text-slate-800 outline-none hover:border-blue-500 focus:border-blue-700 focus:bg-white transition opacity-95 hover:opacity-100 cursor-pointer appearance-none shadow-3xs"
                    >
                      <option value="">-- Assign Stock Controller Signature --</option>
                      {users.filter(u => u.role === 'Stock Controller' || u.role === 'Store Keeper').map(u => (
                        <option key={u.id} value={u.id}>
                          Checked By: {u.name} ({u.initials}) - {u.role}
                        </option>
                      ))}
                    </select>
                    <span className="absolute inset-y-0 right-2 w-4 flex items-center justify-center text-slate-400 pointer-events-none">
                      ▼
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 italic">Assigned balance checker/auditor</p>
                </div>

                {/* 3. Approved By Select Dropdown */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-450 block select-none">3. Approved By (Site Manager)</span>
                  <div className="relative">
                    <select
                      value={approvedBy}
                      onChange={(e) => handleUpdateApprovedBy(e.target.value)}
                      className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-250 rounded font-sans font-semibold text-slate-800 outline-none hover:border-blue-500 focus:border-blue-700 focus:bg-white transition opacity-95 hover:opacity-100 cursor-pointer appearance-none shadow-3xs"
                    >
                      <option value="">-- Apply Site Manager Clearance --</option>
                      {users.filter(u => u.role === 'Warehouse Manager' || u.role === 'Project Manager').map(u => (
                        <option key={u.id} value={u.id}>
                          Approved By: {u.name} ({u.initials}) - {u.role}
                        </option>
                      ))}
                    </select>
                    <span className="absolute inset-y-0 right-2 w-4 flex items-center justify-center text-slate-400 pointer-events-none">
                      ▼
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 italic">Dispatched manager clearance authorization</p>
                </div>

              </div>

            </div>

            {/* Quick Interactive Tool Section: Add New Transaction Entry */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm no-print">
              {!showAddForm ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(true);
                    setShowUserRegForm(false);
                  }}
                  className="w-full flex items-center justify-center space-x-2 border border-dashed border-[#033096]/55 text-[#033096] bg-blue-50/10 hover:bg-blue-50/50 active:bg-blue-50 py-3.5 px-4 rounded-lg text-xs font-bold tracking-wide uppercase transition cursor-pointer"
                >
                  <Plus size={15} />
                  <span>Post Store Voucher (GRN Receive, SIV Issue, Returned, or Transferred)</span>
                </button>
              ) : (
                <form onSubmit={handlePost} className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2">
                    <div className="flex items-center space-x-2">
                      <ShieldCheck size={16} className="text-[#033096]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">New Ledger Entry Posting Wizard</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-650 text-xs rounded-md font-semibold">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    
                    {/* Transaction Mode Option with 4 clear categories */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Entry Type</label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value as 'RECEIVED' | 'ISSUED' | 'RETURNED' | 'TRANSFERRED')}
                        className="w-full px-3 py-2 text-xs text-slate-850 bg-white border border-slate-250 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 cursor-pointer font-bold"
                      >
                        <option value="RECEIVED">GRN - Receive Inward</option>
                        <option value="ISSUED">SIV - Issue Outward</option>
                        <option value="RETURNED">RETURNED - Recieve Back</option>
                        <option value="TRANSFERRED">TRANSFERRED - Dispatch Hub</option>
                      </select>
                    </div>

                    {/* Voucher / Receipt ID */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                        Voucher number (Receipt/SIV No.)
                      </label>
                      <input
                        type="text"
                        value={grnSivNo}
                        onChange={(e) => setGrnSivNo(e.target.value)}
                        placeholder="e.g. GRN-4411 (00018679)"
                        className="w-full px-3 py-2 text-xs text-slate-800 placeholder-slate-400 bg-white border border-slate-200 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                        required
                      />
                    </div>

                    {/* Plate Number (optional, for vehicle dispatches like sand/cement truck plate numbers) */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Plate Number (Optional)</label>
                      <input
                        type="text"
                        value={plateNumber}
                        onChange={(e) => setPlateNumber(e.target.value)}
                        placeholder="e.g. 3-05554"
                        className="w-full px-3 py-2 text-xs text-slate-805 placeholder-slate-400 bg-white border border-slate-200 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 font-mono"
                      />
                    </div>

                    {/* Numeric Quantity */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Quantity ({material.unit})</label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={qty || ''}
                        onChange={(e) => setQty(Number(e.target.value))}
                        placeholder="e.g. 5.41"
                        className="w-full px-3 py-2 text-xs text-slate-800 placeholder-slate-405 bg-white border border-slate-200 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 font-mono"
                        required
                      />
                    </div>

                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Record Date */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Posting Date</label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded outline-none focus:border-[#033096] focus:ring-1 focus:ring-blue-500/20"
                        required
                      />
                    </div>

                    {/* Unit Price (Locked to current or customizable for historic bookkeeping) */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Stock Unit Price (ETB)</label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={unitPrice || ''}
                        onChange={(e) => setUnitPrice(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                        required
                      />
                    </div>

                    {/* Dynamic Signature Initials */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                        Authorizing Store Keeper
                      </label>
                      <div className="px-3 py-2 text-xs text-slate-500 border border-slate-200 bg-slate-50 rounded font-semibold">
                        Signee initials: "{currentUser.initials}"
                      </div>
                    </div>

                    {/* Remarks Input */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Remarks / Note</label>
                      <input
                        type="text"
                        value={remark}
                        onChange={(e) => setRemark(e.target.value)}
                        placeholder="e.g. Dispatched for Foundation footing"
                        className="w-full px-3 py-2 text-xs text-slate-800 placeholder-slate-400 bg-white border border-slate-200 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded transition cursor-pointer"
                    >
                      Close Form
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-bold text-white rounded transition shadow-sm cursor-pointer bg-[#033096] hover:bg-blue-800"
                    >
                      Post Inward / Outward Voucher
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>

          {/* Footer controls */}
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-end select-none no-print">
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded shadow-3xs cursor-pointer transition focus:outline-hidden"
            >
              Close Bin Card Explorer
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
