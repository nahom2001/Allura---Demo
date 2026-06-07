import React, { useState, useEffect } from 'react';
import { Layout, Button, Table, Dropdown, Menu, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined, EyeOutlined, SyncOutlined, MoreOutlined } from '@ant-design/icons';
import { 
  Check, 
  X, 
  Search, 
  AlertTriangle, 
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  User,
  MessageSquare,
  Printer,
  SlidersHorizontal,
  ArrowUpDown,
  Filter,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { BinCardTransaction, Material, Store, PurchaseOrder, SystemUser } from '../types';

const { Sider } = Layout;

interface VoucherValidationViewProps {
  binTransactions: BinCardTransaction[];
  materials: Material[];
  stores: Store[];
  purchaseOrders: PurchaseOrder[];
  systemUsers: SystemUser[];
  onUpdateTransaction: (transaction: BinCardTransaction) => void;
}

export default function VoucherValidationView({
  binTransactions,
  materials,
  stores,
  purchaseOrders,
  systemUsers,
  onUpdateTransaction
}: VoucherValidationViewProps) {
  
  // Simulation of logged-in user context & role matrix
  const [activeUserId, setActiveUserId] = useState<string>('usr-7'); // Defaults to Selamawit Dawit (PM)
  const [isSuperUser, setIsSuperUser] = useState<boolean>(true); // Super Users bypass limits
  const [userStatuses, setUserStatuses] = useState<Record<string, 'Activated' | 'Terminated'>>({
    'usr-1': 'Activated',
    'usr-2': 'Activated',
    'usr-3': 'Activated',
    'usr-4': 'Activated',
    'usr-5': 'Activated',
    'usr-6': 'Activated',
    'usr-7': 'Activated'
  });

  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({
    'Project Manager': ['Read Only', 'Write', 'Edit', 'Delete', 'Check', 'Approve', 'Full Access'],
    'Stock Controller': ['Read Only', 'Write', 'Edit', 'Check', 'Approve'],
    'Warehouse Manager': ['Read Only', 'Write', 'Edit', 'Delete', 'Check'],
    'Store Keeper': ['Read Only', 'Write', 'Edit']
  });

  // Local vouchers cached layer to handle real-time simulation updates
  const [localVouchers, setLocalVouchers] = useState<BinCardTransaction[]>([]);

  // GRV Selection and Filters
  const [selectedGrvId, setSelectedGrvId] = useState<string | null>(null);
  const [selectedPoId, setSelectedPoId] = useState<string | null>(null);
  const [grvSearch, setGrvSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Revision Required' | 'Rejected'>('All');
  const [durationStart, setDurationStart] = useState('');
  const [durationEnd, setDurationEnd] = useState('');
  const [sortField, setSortField] = useState<'code' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Action Inputs for Reconciliation/Audit panel
  const [remarksText, setRemarksText] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const triggerError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => {
      setErrorMessage(prev => prev === msg ? '' : prev);
    }, 4500);
  };

  // Sync prop changes with local vouchers cache
  useEffect(() => {
    const defaultTxIds = new Set(binTransactions.map(t => t.id));
    const uniqueLocal = localVouchers.filter(v => !defaultTxIds.has(v.id));
    setLocalVouchers([...binTransactions, ...uniqueLocal]);
  }, [binTransactions]);

  // Derived properties of the active user context
  const currentUserObj = systemUsers.find(u => u.id === activeUserId);
  const isTerminated = currentUserObj ? userStatuses[currentUserObj.id] === 'Terminated' : false;
  const userAccessList = currentUserObj ? rolePermissions[currentUserObj.role] || [] : [];

  const canPerformAction = (action: 'Read Only' | 'Write' | 'Edit' | 'Delete' | 'Check' | 'Approve' | 'Full Access') => {
    if (isSuperUser) return true;
    if (isTerminated) return false;
    return userAccessList.includes(action);
  };

  // ------ GOODS RECEIVED NOTE (GRV) DATA PROCESSING ------
  const grvTransactions = localVouchers.filter(
    t => t.receivedQty !== undefined && t.receivedQty > 0
  );

  const filteredGrvs = grvTransactions.filter(grv => {
    const mat = materials.find(m => m.id === grv.materialId);
    const matName = mat ? mat.description : '';
    const query = grvSearch.toLowerCase().trim();
    
    const searchMatches = 
      grv.grnSivNo.toLowerCase().includes(query) || 
      matName.toLowerCase().includes(query) ||
      (grv.remark || '').toLowerCase().includes(query) ||
      (grv.plateNumber || '').toLowerCase().includes(query);
    
    let dateMatches = true;
    if (durationStart) {
      dateMatches = dateMatches && grv.date >= durationStart;
    }
    if (durationEnd) {
      dateMatches = dateMatches && grv.date <= durationEnd;
    }

    const status = grv.qaStatus || (grv.qaApprovedById ? 'Approved' : 'Pending');
    let statusMatches = true;
    if (statusFilter !== 'All') {
      statusMatches = status === statusFilter;
    }

    return searchMatches && dateMatches && statusMatches;
  }).sort((a, b) => {
    let comparison = 0;
    if (sortField === 'code') {
      comparison = a.grnSivNo.localeCompare(b.grnSivNo);
    } else {
      comparison = a.date.localeCompare(b.date);
    }
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  // Autoselect corresponding PO when a GRV is chosen
  useEffect(() => {
    if (selectedGrvId) {
      const currentGrv = localVouchers.find(t => t.id === selectedGrvId);
      if (currentGrv) {
        const material = materials.find(m => m.id === currentGrv.materialId);
        if (material) {
          const matchingPo = purchaseOrders.find(po => 
            po.items.some(item => 
              item.description.toLowerCase().includes(material.description.toLowerCase()) ||
              material.description.toLowerCase().includes(item.description.toLowerCase()) ||
              item.code === material.code
            )
          );
          if (matchingPo) {
            setSelectedPoId(matchingPo.id);
          } else if (purchaseOrders.length > 0) {
            setSelectedPoId(purchaseOrders[0].id);
          } else {
            setSelectedPoId(null);
          }
        }
      }
      setRemarksText('');
    } else {
      setSelectedPoId(null);
    }
  }, [selectedGrvId, localVouchers, purchaseOrders, materials]);

  const activeGrv = localVouchers.find(t => t.id === selectedGrvId) || null;
  const activePo = purchaseOrders.find(po => po.id === selectedPoId) || null;
  const grvMaterial = activeGrv ? materials.find(m => m.id === activeGrv.materialId) || null : null;
  
  const matchingPoItem = activePo && grvMaterial 
    ? activePo.items.find(item => 
        item.description.toLowerCase().includes(grvMaterial.description.toLowerCase()) ||
        grvMaterial.description.toLowerCase().includes(item.description.toLowerCase()) ||
        item.code === grvMaterial.code
      ) || activePo.items[0]
    : null;

  const grvQty = activeGrv?.receivedQty || 0;
  const grvPrice = activeGrv?.unitPrice || 0;
  const grvTotal = grvQty * grvPrice;

  const poQty = matchingPoItem?.quantity || 0;
  const poPrice = matchingPoItem?.unitPrice || 0;
  const poTotal = poQty * poPrice;

  const qtyMismatch = grvQty !== poQty;
  const priceMismatch = grvPrice !== poPrice;
  const qtyDiff = grvQty - poQty;
  const priceDiff = grvPrice - poPrice;
  const totalDiff = grvTotal - poTotal;

  // ------ GENERAL HANDLERS ------
  const handleApprove = () => {
    if (!activeGrv) return;
    if (isTerminated) {
      triggerError('Your user account is Terminated. Access denied.');
      return;
    }
    if (!canPerformAction('Approve')) {
      triggerError('Authorized role check error. Your current role lacks Approve permissions.');
      return;
    }

    const updated: BinCardTransaction = {
      ...activeGrv,
      qaApprovedById: activeUserId,
      qaStatus: 'Approved',
      qaApprovedDate: new Date().toISOString().split('T')[0],
      qaRemark: remarksText || 'Matched with Purchase Order & approved for posting.'
    };

    onUpdateTransaction(updated);
    setLocalVouchers(prev => prev.map(t => t.id === updated.id ? updated : t));
    
    setSuccessMessage(`Voucher ${activeGrv.grnSivNo} has been verified & approved. Balance ledger posted.`);
    setRemarksText('');
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleReject = () => {
    if (!activeGrv) return;
    if (isTerminated) {
      triggerError('Your user account is Terminated. Access denied.');
      return;
    }
    if (!canPerformAction('Approve')) {
      triggerError('Role check error: Rejections require Check/Approve authorization privileges.');
      return;
    }
    if (!remarksText) {
      triggerError('Rejection justification remarks are mandatory.');
      return;
    }

    const updated: BinCardTransaction = {
      ...activeGrv,
      qaApprovedById: undefined,
      qaStatus: 'Rejected',
      qaApprovedDate: new Date().toISOString().split('T')[0],
      qaRemark: remarksText
    };

    onUpdateTransaction(updated);
    setLocalVouchers(prev => prev.map(t => t.id === updated.id ? updated : t));
    setSuccessMessage(`Voucher ${activeGrv.grnSivNo} marked as Rejected.`);
    setRemarksText('');
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleRequestRevision = () => {
    if (!activeGrv) return;
    if (isTerminated) {
      triggerError('Your user account is Terminated. Access denied.');
      return;
    }
    if (!canPerformAction('Check')) {
      triggerError('Role check error: Revisions require custom Check privileges.');
      return;
    }
    if (!remarksText) {
      triggerError('Correction / revision requirements must be documented in comments.');
      return;
    }

    const updated: BinCardTransaction = {
      ...activeGrv,
      qaApprovedById: undefined,
      qaStatus: 'Revision Required',
      qaApprovedDate: new Date().toISOString().split('T')[0],
      qaRemark: remarksText
    };

    onUpdateTransaction(updated);
    setLocalVouchers(prev => prev.map(t => t.id === updated.id ? updated : t));
    setSuccessMessage(`Voucher ${activeGrv.grnSivNo} flagged for Revision.`);
    setRemarksText('');
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleRevertStatus = (txObj: BinCardTransaction) => {
    if (isTerminated) return triggerError('Access Denied. Account is Terminated.');
    if (!isSuperUser && currentUserObj?.role !== 'Project Manager') {
      return triggerError('Action restricted to PMs / Supervisors.');
    }

    const updated: BinCardTransaction = {
      ...txObj,
      qaStatus: undefined,
      qaApprovedById: undefined,
      qaApprovedDate: undefined,
      qaRemark: undefined
    };

    onUpdateTransaction(updated);
    setLocalVouchers(prev => prev.map(t => t.id === updated.id ? updated : t));
    setSuccessMessage(`Ledger status for ${txObj.grnSivNo} has been reverted to Pending state.`);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleDeleteVoucher = (txId: string) => {
    if (isTerminated) return triggerError('Access Denied. Account is Terminated.');
    if (!canPerformAction('Delete')) {
      return triggerError('Designated user lacks Delete credential privileges.');
    }

    const targeted = localVouchers.find(t => t.id === txId);
    if (!targeted) return;

    if (window.confirm(`Are you sure you want to delete Voucher ${targeted.grnSivNo} permanently from ledger records?`)) {
      setLocalVouchers(prev => prev.filter(t => t.id !== txId));
      onUpdateTransaction({
        ...targeted,
        receivedQty: 0,
        remark: 'VOUCHER DELETED'
      });
      setSuccessMessage(`Voucher deleted successfully.`);
      if (selectedGrvId === txId) setSelectedGrvId(null);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleRefreshTable = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setSuccessMessage('Voucher validation tables synced with active store database profiles.');
      setTimeout(() => setSuccessMessage(''), 3000);
    }, 1200);
  };

  // ------ TABLE COLUMNS SETUP FOR SIDEBARS ------
  const voucherTableColumns = [
    {
      title: 'Voucher',
      dataIndex: 'grnSivNo',
      key: 'grnSivNo',
      render: (text: string, record: BinCardTransaction) => {
        const mat = materials.find(m => m.id === record.materialId);
        const st = stores.find(s => s.id === mat?.storeId);
        const status = record.qaStatus || (record.qaApprovedById ? 'Approved' : 'Pending');
        
        let statusBadge = (
          <span className="inline-flex items-center text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200/50">
            Pending
          </span>
        );
        if (status === 'Approved') {
          statusBadge = (
            <span className="inline-flex items-center text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200/50 font-bold">
              Cleared
            </span>
          );
        } else if (status === 'Revision Required') {
          statusBadge = (
            <span className="inline-flex items-center text-[10px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded border border-red-200/50 font-semibold">
              Revision
            </span>
          );
        } else if (status === 'Rejected') {
          statusBadge = (
            <span className="inline-flex items-center text-[10px] bg-[#fff1f0] text-[#cf1322] px-1.5 py-0.5 rounded border border-[#ffccc7]">
              Rejected
            </span>
          );
        }

        return (
          <div className="py-2.5 px-3 hover:bg-[#fafafa] flex flex-col gap-1.5 leading-tight rounded text-left">
            <div className="flex justify-between items-center gap-1.5">
              <span className="font-bold text-[#1f1f1f] text-xs uppercase tracking-tight">{text}</span>
              <span className="text-[10px] text-slate-400 font-medium font-mono">{record.date}</span>
            </div>
            <div className="text-slate-500 font-medium text-[11px] truncate w-[220px]">
              {mat ? mat.description : 'Uncoded Item Descriptor'}
            </div>
            <div className="flex justify-between items-center gap-1 text-[10px] pt-0.5">
              <span className="text-slate-400 italic">Qty: <b className="text-slate-650 font-mono font-bold">{record.receivedQty || 0}</b></span>
              {statusBadge}
            </div>
          </div>
        );
      }
    },
    {
      title: 'Action',
      key: 'action',
      width: 44,
      render: (_: any, record: BinCardTransaction) => {
        const menuItems = [];
        const status = record.qaStatus || (record.qaApprovedById ? 'Approved' : 'Pending');

        if (status !== 'Pending') {
          menuItems.push({
            key: 'revert',
            label: 'Revert to Pending',
            icon: <SyncOutlined />,
            onClick: () => handleRevertStatus(record)
          });
        }
        
        menuItems.push({
          key: 'delete',
          label: 'Delete Voucher',
          icon: <DeleteOutlined />,
          danger: true,
          onClick: () => handleDeleteVoucher(record.id)
        });

        return (
          <div onClick={(e) => { e.stopPropagation(); }} className="flex justify-center items-center h-full pr-1.5 pt-4">
            <Dropdown menu={{ items: menuItems }} trigger={['click']}>
              <Button type="text" size="small" icon={<MoreOutlined className="text-slate-500" />} />
            </Dropdown>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-4 font-sans text-left" id="voucher-validation-view">

      {/* Embedded dynamic print CSS inside component to isolate print streams elegantly */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #grv-print-sheet, #grv-print-sheet * {
            visibility: visible !important;
          }
          #grv-print-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            padding: 2.5rem !important;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* SUCCESS TOAST ALERT BANNER */}
      {successMessage && (
        <div className="p-3 bg-[#f6ffed] border border-[#b7eb8f] text-[#389e0d] rounded-[6px] text-xs font-normal flex items-center justify-between shadow-3xs transition duration-300 no-print">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 size={14} className="text-[#52c41a]" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="bg-transparent border-0 text-slate-450 hover:text-slate-705 cursor-pointer p-0 transition">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ERROR TOAST ALERT BANNER */}
      {errorMessage && (
        <div className="p-3 bg-[#fff1f0] border border-[#ffccc7] text-[#ff4d4f] rounded-[6px] text-xs font-normal flex items-center justify-between shadow-3xs transition duration-300 no-print">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle size={14} className="text-[#ff4d4f]" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')} className="bg-transparent border-0 text-slate-450 hover:text-slate-705 cursor-pointer p-0 transition">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header and User Matrix Simulation context */}
      <div className="p-4 bg-white border border-[#eaeaea] rounded-xl flex flex-wrap items-center justify-between gap-4 no-print select-none shadow-3xs">
        <div>
          <h2 className="text-base font-bold text-[#1a1a1a]">Voucher Verification & Audit Center</h2>
          <p className="text-xs text-[#595959] mt-0.5">Validate physical GRVs (Goods Received Notes) against purchase receipts before posting balances.</p>
        </div>

        {/* Dynamic Simulation User Profiles Context */}
        <div className="flex items-center gap-3.5 bg-slate-50 border border-slate-200/50 rounded-lg p-2.5 text-xs font-medium">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Simulation Operator Context</span>
            <div className="flex items-center gap-1.5">
              <User size={12} className="text-[#033096]" />
              <select 
                value={activeUserId} 
                onChange={(e) => setActiveUserId(e.target.value)}
                className="h-6 pr-5 pl-1 rounded border border-[#d9d9d9] bg-white text-xs font-semibold cursor-pointer outline-none focus:border-[#033096]"
              >
                {systemUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200" />

          {/* Super User and Account Activation toggles */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 cursor-pointer">
              <input 
                type="checkbox" 
                checked={isSuperUser} 
                onChange={(e) => setIsSuperUser(e.target.checked)}
                className="rounded text-[#033096] focus:ring-[#033096]"
              />
              <span className="text-[10px] text-slate-550 font-bold">Admin Override</span>
            </label>
            <div className="h-4 w-px bg-slate-200" />
            <button
              onClick={() => {
                setUserStatuses(prev => ({
                  ...prev,
                  [activeUserId]: prev[activeUserId] === 'Activated' ? 'Terminated' : 'Activated'
                }));
              }}
              className={`h-5 px-2 text-[10px] font-bold rounded cursor-pointer transition ${
                isTerminated 
                  ? 'bg-red-100 text-red-700 border border-red-200' 
                  : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              }`}
            >
              Mock Status: {isTerminated ? 'Terminated' : 'Active'}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. GOODS RECEIVED NOTE (GRV) SECTION WORKSPACE            */}
      {/* ========================================================= */}
      <Layout style={{ background: 'transparent' }} className="flex flex-col lg:flex-row gap-5 no-print">
          
          {/* GRV Sidebar Selector */}
          <Sider
            width={380}
            breakpoint="lg"
            collapsedWidth="100%"
            style={{ background: '#fff' }}
            className="flex flex-col border border-[#f0f0f0] rounded-[6px] shadow-sm overflow-hidden h-[620px]"
          >
            <div className="p-3.5 bg-[#fafafa] border-b border-[#f0f0f0] flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#262626]">Filter & Search GRV Vouchers</span>
                <button 
                  onClick={handleRefreshTable}
                  disabled={isRefreshing}
                  className="p-1.5 text-[#1677ff] hover:bg-[#e6f4ff] rounded transition cursor-pointer flex items-center gap-1 text-[11px]"
                >
                  <RefreshCw size={11} className={isRefreshing ? 'animate-spin' : ''} />
                  <span>Sync</span>
                </button>
              </div>

              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                  <Search size={12} />
                </span>
                <input
                  type="text"
                  value={grvSearch}
                  onChange={(e) => setGrvSearch(e.target.value)}
                  placeholder="Search raw description, GRV No, Plate..."
                  className="w-full h-8 pl-8 pr-3 text-xs text-[#262626] bg-white border border-[#d9d9d9] rounded-[4px] hover:border-[#4096ff] focus:border-[#4096ff] focus:shadow-[0_0_0_2px_rgba(22,119,255,0.08)] outline-none transition duration-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block mb-0.5 font-medium">Start Date</span>
                  <input 
                    type="date"
                    value={durationStart}
                    onChange={(e) => setDurationStart(e.target.value)}
                    className="w-full text-xs h-7 px-1.5 border border-[#d9d9d9] rounded hover:border-[#4096ff] focus:outline-none bg-white"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 font-medium">End Date</span>
                  <input 
                    type="date"
                    value={durationEnd}
                    onChange={(e) => setDurationEnd(e.target.value)}
                    className="w-full text-xs h-7 px-1.5 border border-[#d9d9d9] rounded hover:border-[#4096ff] focus:outline-none bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 text-[11px] pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[#8c8c8c]">Sort Field:</span>
                  <button 
                    onClick={() => setSortField(sortField === 'code' ? 'date' : 'code')}
                    className="text-[#1677ff] font-medium border-b border-dashed border-[#1677ff] leading-none"
                  >
                    {sortField === 'code' ? 'Voucher No' : 'Voucher Date'}
                  </button>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <span className="text-[#8c8c8c]">Order:</span>
                  <button 
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="text-[#1677ff] font-medium flex items-center gap-0.5 h-4"
                  >
                    <ArrowUpDown size={10} />
                    <span>{sortOrder === 'desc' ? 'Latest' : 'Oldest'}</span>
                  </button>
                </div>
              </div>

              <div className="flex bg-[#f5f5f5] p-0.5 rounded-[4px] gap-0.5 text-[10px] w-full shrink-0 overflow-x-auto scrollbar-none">
                {(['All', 'Pending', 'Approved', 'Revision Required', 'Rejected'] as const).map((tab) => {
                  const isActive = statusFilter === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setStatusFilter(tab)}
                      className={`flex-1 text-center py-1 px-1 rounded-[3px] font-medium transition duration-200 whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'bg-white text-[#1677ff] shadow-[0_1px_3px_rgba(0,0,0,0.09)] font-semibold'
                          : 'text-[#595959] hover:text-[#262626]'
                      }`}
                    >
                      {tab === 'Revision Required' ? 'Revision' : tab}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* GRV Table Grid list */}
            <div className="flex-1 bg-white overflow-hidden">
              <Table
                dataSource={filteredGrvs.map(t => ({ ...t, key: t.id }))}
                columns={voucherTableColumns}
                pagination={{
                  defaultPageSize: 4,
                  size: 'small',
                  showSizeChanger: false,
                  showTotal: (total) => `${total} items`
                }}
                onRow={(record) => ({
                  onClick: () => setSelectedGrvId(record.id),
                })}
                showHeader={false}
                rowClassName={(record) => `cursor-pointer transition select-none ${selectedGrvId === record.id ? 'bg-[#e6f4ff]' : ''}`}
                locale={{
                  emptyText: (
                    <div className="p-12 text-center text-[#8c8c8c] text-xs font-normal">
                      <AlertTriangle className="mx-auto text-slate-350 mb-2" size={18} />
                      <span>No registered elements found in this category.</span>
                    </div>
                  )
                }}
                className="custom-antd-table font-sans text-xs"
              />
            </div>
          </Sider>

          {/* GRV Audit panel */}
          <div className="flex-1 flex flex-col bg-white border border-[#f0f0f0] rounded-[6px] shadow-sm overflow-hidden h-[620px]">
            {selectedGrvId ? (
              <div className="h-full flex flex-col justify-between text-left">
                
                {/* Header panel descriptor */}
                <div className="p-4 border-b border-[#f0f0f0] bg-white flex flex-wrap items-center justify-between gap-3 text-left">
                  <div>
                    <h4 className="text-sm font-bold text-[#1f1f1f]">Warehouse Delivery Verification Desk</h4>
                    <p className="text-xs text-[#8c8c8c] mt-0.5">Physical sheet presentation matched with purchase orders.</p>
                  </div>
                  <div>
                    <button
                      onClick={() => window.print()}
                      className="px-3.5 h-7.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded shadow-3xs flex items-center justify-center gap-1.5 cursor-pointer select-none transition"
                    >
                      <Printer size={12} strokeWidth={2.5} />
                      <span>Print Sheet Document</span>
                    </button>
                  </div>
                </div>

                {/* Main panel scroll view */}
                <div id="grv-print-sheet" className="p-6 flex-1 overflow-y-auto space-y-6">
                  
                  {/* Ledger header */}
                  <div className="p-5 border border-[#eaeaea] rounded-[8px] bg-slate-50/40 relative">
                    <div className="absolute right-4 top-4">
                      {activeGrv?.qaStatus === 'Approved' ? (
                        <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-3 py-1 border border-emerald-200 rounded-[4px] text-[10px] font-bold uppercase tracking-wider">
                          <CheckCircle size={14} />
                          <span>Cleared & Posted</span>
                        </div>
                      ) : activeGrv?.qaStatus === 'Revision Required' ? (
                        <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-3 py-1 border border-amber-200 rounded-[4px] text-[10px] font-semibold uppercase tracking-wider">
                          <Clock size={14} />
                          <span>Review Requested</span>
                        </div>
                      ) : activeGrv?.qaStatus === 'Rejected' ? (
                        <div className="flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1 border border-red-200 rounded-[4px] text-[10px] font-bold uppercase tracking-wider">
                          <XCircle size={14} />
                          <span>Rejected</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-3 py-1 border border-blue-200 rounded-[4px] text-[10px] font-semibold uppercase tracking-wider">
                          <SlidersHorizontal size={14} />
                          <span>Pending Verification</span>
                        </div>
                      )}
                    </div>

                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-4">Voucher Metadata</h5>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-medium">
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-400">Voucher Number</span>
                        <span className="text-slate-800 font-bold font-mono text-sm">{activeGrv?.grnSivNo}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-400">Date Logged</span>
                        <span className="text-slate-800 font-bold font-mono">{activeGrv?.date}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-400">Assigned Dispatcher</span>
                        <span className="text-slate-800 font-bold">{activeGrv?.signature || 'SK-Desk'}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-400">Linked PO</span>
                        <span className="text-[#033096] font-bold font-mono underline decoration-dashed">
                          {activePo ? activePo.poNumber : 'No Matching PO Found'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dual side-by-side verification block */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 select-none">
                    
                    {/* Left block (Physical delivery voucher) */}
                    <div className="p-4 bg-white border border-slate-200 rounded-[6px] space-y-4">
                      <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
                        <FileText size={14} className="text-blue-650" />
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Warehouse Delivery Receipt</span>
                      </div>

                      <div className="space-y-3.5 text-xs font-medium">
                        <div className="flex justify-between items-center py-1 border-b border-slate-50">
                          <span className="text-slate-400">Registered Material:</span>
                          <span className="text-slate-800 font-bold max-w-[150px] truncate">{grvMaterial?.description || 'Uncoded'}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-50">
                          <span className="text-slate-400">Dispatch Unit:</span>
                          <span className="text-slate-800 font-bold uppercase">{grvMaterial?.unit || 'Pcs'}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-50">
                          <span className="text-slate-400">Physical Received Qty:</span>
                          <span className="text-[#033096] font-extrabold text-sm font-mono">{grvQty.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-50">
                          <span className="text-slate-400">Voucher Unit Price:</span>
                          <span className="text-slate-800 font-bold font-mono">{grvPrice.toLocaleString()} ETB</span>
                        </div>
                        <div className="flex justify-between items-center pt-1.5 text-[#1a1a1a]">
                          <span className="font-semibold text-slate-500">Gross Received Outlay:</span>
                          <span className="font-extrabold font-mono text-base">{grvTotal.toLocaleString()} ETB</span>
                        </div>
                      </div>
                    </div>

                    {/* Right block (Linked PO spec sheet) */}
                    <div className="p-4 bg-white border border-slate-200 rounded-[6px] space-y-4">
                      <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
                        <CheckCircle className="text-slate-400" size={14} />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Purchase Order Sheet (Spec)</span>
                      </div>

                      {activePo ? (
                        <div className="space-y-3.5 text-xs font-medium">
                          <div className="flex justify-between items-center py-1 border-b border-slate-50">
                            <span className="text-slate-400">Commercial Vendor:</span>
                            <span className="text-slate-800 font-semibold max-w-[150px] truncate">{activePo.supplierName}</span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-b border-slate-50">
                            <span className="text-slate-400">PO Spec Descriptor:</span>
                            <span className="text-slate-800 font-semibold max-w-[150px] truncate">{matchingPoItem?.description || 'Uncoded'}</span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-b border-slate-50">
                            <span className="text-slate-400">Authorized PO Target Qty:</span>
                            <span className={`font-mono font-bold ${qtyMismatch ? 'text-amber-600' : 'text-slate-700'}`}>
                              {poQty.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-b border-slate-50">
                            <span className="text-slate-400">PO Agreed Price:</span>
                            <span className={`font-mono font-bold ${priceMismatch ? 'text-amber-600' : 'text-slate-700'}`}>
                              {poPrice.toLocaleString()} ETB
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-1.5 text-slate-500">
                            <span>PO Promised Outlay:</span>
                            <span className="font-bold font-mono text-slate-800">{poTotal.toLocaleString()} ETB</span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-[150px] flex items-center justify-center text-center p-4">
                          <p className="text-xs text-slate-400 italic">No corresponding purchase order matches this delivery ticket.</p>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Discrepancy indicator panels */}
                  {activePo && (qtyMismatch || priceMismatch) && (
                    <div className="p-3.5 bg-amber-50 rounded-lg border border-amber-200/60 font-medium text-xs text-amber-800 leading-relaxed flex items-start gap-2.5">
                      <AlertTriangle size={15} className="shrink-0 text-amber-600 mt-0.5" />
                      <div className="space-y-1">
                        <span className="block font-bold text-[11px] uppercase tracking-wider text-amber-700">Audit Alert: Commercial Discrepancy Detected</span>
                        <span className="block text-slate-650">
                          The delivery voucher values differ from the commercial purchase order targets. Review details:
                        </span>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 pt-1.5">
                          {qtyMismatch && (
                            <div className="flex flex-col">
                              <span className="text-[10px] text-slate-400 uppercase tracking-tight">Quantity Shortfall:</span>
                              <span className="font-extrabold font-mono text-sm leading-none pt-1">
                                {qtyDiff > 0 ? `+${qtyDiff}` : qtyDiff} {grvMaterial?.unit}
                              </span>
                            </div>
                          )}
                          {priceMismatch && (
                            <div className="flex flex-col">
                              <span className="text-[10px] text-slate-400 uppercase tracking-tight">Agreed Price Delta:</span>
                              <span className="font-extrabold font-mono text-sm leading-none pt-1">
                                {priceDiff > 0 ? `+${priceDiff.toLocaleString()}` : priceDiff.toLocaleString()} ETB
                              </span>
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 uppercase tracking-tight">Financial Imbalance:</span>
                            <span className={`font-extrabold font-mono text-sm leading-none pt-1 ${totalDiff > 0 ? 'text-red-650' : 'text-emerald-750'}`}>
                              {totalDiff > 0 ? `+${totalDiff.toLocaleString()}` : totalDiff.toLocaleString()} ETB
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* QA AUDIT SUMMARY REPORT BANNER */}
                  {activeGrv?.qaStatus && (
                    <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-lg text-xs space-y-2 select-text font-medium text-slate-800">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">QA Verification Review Ledger</span>
                        <span className="inline-flex items-center text-[10.5px] font-bold bg-white px-2 py-0.5 border rounded">
                          Signed: {systemUsers.find(u => u.id === activeGrv.qaApprovedById)?.name || 'QA Auditor'}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-400">Auditor Status Notes:</span>
                        <span className="text-slate-700 italic">"{activeGrv.qaRemark || 'Verified for inventory card posting.'}"</span>
                      </div>
                    </div>
                  )}

                  {/* Verification comments input block */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center select-none">
                      <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">Auditor Validation Comments</span>
                      <span className="text-[10px] text-slate-400 italic">Comments required for rejections or corrections.</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-3.5 text-slate-400">
                        <MessageSquare size={13} />
                      </span>
                      <textarea
                        value={remarksText}
                        onChange={(e) => setRemarksText(e.target.value)}
                        placeholder="Type verification notes (e.g. quantity shortfall notes, packing seal verification logs, matching OK...)"
                        rows={3}
                        className="w-full text-xs p-3 pl-8.5 text-slate-750 bg-white border border-[#d3d3d3] rounded-[6px] hover:border-[#4096ff] focus:border-[#4096ff] focus:shadow-[0_0_0_2px_rgba(22,119,255,0.06)] outline-none resize-none transition"
                      />
                    </div>
                  </div>

                </div>

                {/* Footnotes and actions */}
                <div className="p-4 bg-[#fafafa] border-t border-[#f0f0f0] flex flex-wrap items-center justify-between gap-3 no-print">
                  <div className="text-[11px] text-slate-400 select-none">
                    Session User: <b>{currentUserObj?.name}</b> (Role: <span className="font-semibold text-slate-450">{currentUserObj?.role}</span>)
                  </div>
                  
                  <div className="flex items-center gap-2 select-none">
                    <button
                      type="button"
                      onClick={handleRequestRevision}
                      className="h-8 px-4 border border-amber-300 hover:bg-amber-50 text-amber-700 rounded-[4px] text-xs font-semibold flex items-center gap-1 cursor-pointer transition active:scale-95 bg-white shadow-3xs"
                    >
                      <Clock size={13} strokeWidth={2.5} />
                      <span>Request Revision</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleReject}
                      className="h-8 px-4 border border-red-200 hover:bg-red-50 text-red-600 rounded-[4px] text-xs font-semibold flex items-center gap-1 cursor-pointer transition active:scale-95 bg-white shadow-3xs"
                    >
                      <X size={13} strokeWidth={2.5} />
                      <span>Reject Voucher</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleApprove}
                      style={{ backgroundColor: '#2f8132', borderColor: '#2f8132' }}
                      className="h-8 px-5 bg-emerald-650 hover:bg-emerald-700 text-white rounded-[4px] text-xs font-bold flex items-center gap-1 cursor-pointer transition active:scale-95 shadow-down"
                    >
                      <Check size={13} strokeWidth={2.5} />
                      <span>Approve & Post GRV</span>
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              
              /* NO SELECTED STATE (Initial Greeting desk) */
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white no-print">
                <FileText size={44} className="text-slate-200 mb-4 animate-pulse" />
                <h4 className="font-semibold text-[#262626] text-sm">Goods Received Note Verification Desk</h4>
                <p className="text-xs text-[#8c8c8c] mt-1 max-w-sm leading-normal">
                  Select a Goods Received Note (GRV) from the grouped navigational ledger on the left to verify signatures, audit physical quantities, or match purchase orders.
                </p>
                
                <div className="mt-6 flex gap-2 select-none">
                  <button 
                    onClick={() => {
                      if (filteredGrvs.length > 0) {
                        setSelectedGrvId(filteredGrvs[0].id);
                      }
                    }}
                    className="h-8.5 px-4 bg-slate-50 hover:bg-slate-100 border border-[#d9d9d9] text-[#262626] text-xs font-semibold rounded-lg transition cursor-pointer"
                  >
                    Quick Select First
                  </button>
                </div>
              </div>
            )}

         </div>

      </Layout>

    </div>
  );
}
