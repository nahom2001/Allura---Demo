import React, { useState, useEffect } from 'react';
import { Layout, Button, Table, Dropdown, Menu } from 'antd';
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
  Plus,
  Trash2,
  Eye,
  Printer,
  Share2,
  FileDown,
  Lock,
  Unlock,
  Users,
  SlidersHorizontal,
  ArrowUpDown,
  Filter,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { BinCardTransaction, Material, Store, PurchaseOrder, SystemUser } from '../types';

const { Sider, Content } = Layout;

interface VoucherValidationViewProps {
  binTransactions: BinCardTransaction[];
  materials: Material[];
  stores: Store[];
  purchaseOrders: PurchaseOrder[];
  systemUsers: SystemUser[];
  onUpdateTransaction: (updatedTx: BinCardTransaction) => void;
}

// Internal structures to simulate Page 2 Form multiple materials registration
interface NewVoucherItem {
  id: string;
  materialId: string;
  quantity: number;
  spec: string;
}

export default function VoucherValidationView({
  binTransactions,
  materials,
  stores,
  purchaseOrders,
  systemUsers,
  onUpdateTransaction
}: VoucherValidationViewProps) {
  
  // Tab view controller matching ConDigital PDF Tabs
  const [activeTab, setActiveTab] = useState<'ledger' | 'register' | 'reports' | 'access'>('ledger');

  // Simulation of logged-in user context & role matrix (as pictured in Page 4 & 5)
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

  // State to custom edit access rights matrix on-the-fly (Page 4)
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({
    'Project Manager': ['Read Only', 'Write', 'Edit', 'Delete', 'Check', 'Approve', 'Full Access'],
    'Stock Controller': ['Read Only', 'Write', 'Edit', 'Check', 'Approve'],
    'Warehouse Manager': ['Read Only', 'Write', 'Edit', 'Delete', 'Check'],
    'Store Keeper': ['Read Only', 'Write', 'Edit']
  });

  // In-memory extension layer of receipts / vouchers to support registering brand new entries on the fly!
  const [localVouchers, setLocalVouchers] = useState<BinCardTransaction[]>([]);

  // Selection states
  const [selectedGrvId, setSelectedGrvId] = useState<string | null>(null);
  const [selectedPoId, setSelectedPoId] = useState<string | null>(null);
  
  // UX Enhancing Filters & Search (Page 1 - Mandatory)
  const [grvSearch, setGrvSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Revision Required' | 'Rejected'>('All');
  const [durationStart, setDurationStart] = useState('');
  const [durationEnd, setDurationEnd] = useState('');
  const [sortField, setSortField] = useState<'code' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // Default to latest first
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form Fields for new Registration (Page 2)
  const [newVoucherType, setNewVoucherType] = useState<'Store Requisition' | 'Goods Received' | 'Daily Report'>('Goods Received');
  const [newVoucherDate, setNewVoucherDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newVoucherNo, setNewVoucherNo] = useState<string>('');
  const [newPadRef, setNewPadRef] = useState<string>('');
  const [newRequestedTo, setNewRequestedTo] = useState<string>('');
  const [newRequestedBy, setNewRequestedBy] = useState<string>('Gotera Project');
  const [newCheckedById, setNewCheckedById] = useState<string>('usr-4');
  const [newApprovedById, setNewApprovedById] = useState<string>('usr-7');
  
  // Form Multiple Items selection table
  const [registrationItems, setRegistrationItems] = useState<NewVoucherItem[]>([
    { id: 'item-1', materialId: 'mat-1', quantity: 1500, spec: 'Cement factory consignment bulk' },
    { id: 'item-2', materialId: 'mat-2', quantity: 200, spec: 'Fine sand concrete yard' }
  ]);
  const [formSelectedMatId, setFormSelectedMatId] = useState<string>('');
  const [formQty, setFormQty] = useState<number>(0);
  const [formSpec, setFormSpec] = useState<string>('');

  // Report duration and filters (Page 3)
  const [reportType, setReportType] = useState<'Bin Card' | 'Stock Movement' | 'Monthly Report'>('Bin Card');
  const [reportSearchQuery, setReportSearchQuery] = useState('');

  // Action Inputs for the Reconciliation panel
  const [remarksText, setRemarksText] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Initialize form default fields
  useEffect(() => {
    if (materials.length > 0 && !formSelectedMatId) {
      setFormSelectedMatId(materials[0].id);
    }
    if (stores.length > 0 && !newRequestedTo) {
      setNewRequestedTo(stores[0].id);
    }
  }, [materials, stores]);

  // Merge transactions from props with any registered vouchers created locally during the session
  useEffect(() => {
    const defaultTxIds = new Set(binTransactions.map(t => t.id));
    // Filter out any default transactions from localVouchers that might duplicate
    const uniqueLocal = localVouchers.filter(v => !defaultTxIds.has(v.id));
    setLocalVouchers([...binTransactions, ...uniqueLocal]);
  }, [binTransactions]);

  // Derived properties of the active user context
  const currentUserObj = systemUsers.find(u => u.id === activeUserId);
  const isTerminated = currentUserObj ? userStatuses[currentUserObj.id] === 'Terminated' : false;
  const userAccessList = currentUserObj ? rolePermissions[currentUserObj.role] || [] : [];

  // Security authorization checks (conforming to matrix guidelines)
  const canPerformAction = (action: 'Read Only' | 'Write' | 'Edit' | 'Delete' | 'Check' | 'Approve' | 'Full Access') => {
    if (isSuperUser) return true;
    if (isTerminated) return false;
    return userAccessList.includes(action);
  };

  // Safe fetch of inbound receipts matching search filters and sorted
  const grvTransactions = localVouchers.filter(
    t => t.receivedQty !== undefined && t.receivedQty > 0
  );

  // Triggering sorting and custom search
  const filteredGrvs = grvTransactions.filter(grv => {
    const mat = materials.find(m => m.id === grv.materialId);
    const matName = mat ? mat.description : '';
    
    // Page 1 Search guidelines: Search by item description or voucher/GRV number or Pad reference number
    const query = grvSearch.toLowerCase().trim();
    const searchMatches = 
      grv.grnSivNo.toLowerCase().includes(query) || 
      matName.toLowerCase().includes(query) ||
      (grv.remark || '').toLowerCase().includes(query) ||
      (grv.plateNumber || '').toLowerCase().includes(query);
    
    // Page 1 Duration Selector Filter
    let dateMatches = true;
    if (durationStart) {
      dateMatches = dateMatches && grv.date >= durationStart;
    }
    if (durationEnd) {
      dateMatches = dateMatches && grv.date <= durationEnd;
    }

    // Tab categories filter
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

  // Automatically fetch matching PO when a voucher is selected
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
  
  // Find matching PO line item
  const matchingPoItem = activePo && grvMaterial 
    ? activePo.items.find(item => 
        item.description.toLowerCase().includes(grvMaterial.description.toLowerCase()) ||
        grvMaterial.description.toLowerCase().includes(item.description.toLowerCase()) ||
        item.code === grvMaterial.code
      ) || activePo.items[0]
    : null;

  // Comparison metrics
  const grvQty = activeGrv?.receivedQty || 0;
  const grvPrice = activeGrv?.unitPrice || 0;
  const grvTotal = grvQty * grvPrice;

  const poQty = matchingPoItem?.quantity || 0;
  const poPrice = matchingPoItem?.unitPrice || 0;
  const poTotal = poQty * poPrice;

  // Variances
  const qtyMismatch = grvQty !== poQty;
  const priceMismatch = grvPrice !== poPrice;
  const qtyDiff = grvQty - poQty;
  const priceDiff = grvPrice - poPrice;
  const totalDiff = grvTotal - poTotal;

  // Total Summary Panel Stats
  const totalGrvs = grvTransactions.length;
  const pendingQty = grvTransactions.filter(t => !t.qaApprovedById && t.qaStatus !== 'Rejected' && t.qaStatus !== 'Revision Required').length;
  const approvedQty = grvTransactions.filter(t => t.qaStatus === 'Approved').length;
  const revisionQty = grvTransactions.filter(t => t.qaStatus === 'Revision Required').length;
  const rejectedQty = grvTransactions.filter(t => t.qaStatus === 'Rejected').length;

  // Handlers for validation flows
  const handleApprove = () => {
    if (!activeGrv) return;
    if (isTerminated) {
      alert('Your user account is Terminated. Access denied.');
      return;
    }
    if (!canPerformAction('Approve')) {
      alert('Authorized role check error. Your current role lacks Approve permissions.');
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
    
    // Notification log
    setSuccessMessage(`Voucher ${activeGrv.grnSivNo} has been verified & approved. Balance ledger posted.`);
    setRemarksText('');
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleReject = () => {
    if (!activeGrv) return;
    if (isTerminated) {
      alert('Your user account is Terminated. Access denied.');
      return;
    }
    if (!canPerformAction('Approve')) {
      alert('Role check error: Rejections require Check/Approve authorization privileges.');
      return;
    }
    if (!remarksText) {
      alert('Rejection justification remarks are mandatory.');
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
      alert('Your user account is Terminated. Access denied.');
      return;
    }
    if (!canPerformAction('Check')) {
      alert('Unauthorized role check error. Requesting corrections requires validation permission.');
      return;
    }
    if (!remarksText) {
      alert('Please explain the required modifications in the log remarks.');
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
    setSuccessMessage(`Revision notification transmitted for Voucher ${activeGrv.grnSivNo}.`);
    setRemarksText('');
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // Page 1: Revert verified status. Only available to super users and certain users
  const handleRevertStatus = (voucher: BinCardTransaction) => {
    if (isTerminated) {
      alert('Your user account is Terminated. Access denied.');
      return;
    }
    if (!isSuperUser && currentUserObj?.role !== 'Project Manager') {
      alert('Reverting status is restricted strictly to Super Users and Project Managers.');
      return;
    }

    const updated: BinCardTransaction = {
      ...voucher,
      qaApprovedById: undefined,
      qaStatus: undefined,
      qaApprovedDate: undefined,
      qaRemark: undefined
    };

    onUpdateTransaction(updated);
    setLocalVouchers(prev => prev.map(t => t.id === updated.id ? updated : t));
    setSuccessMessage(`Voucher ${voucher.grnSivNo} has been reverted to Pending state.`);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // Page 1 Action: Delete completely
  const handleDeleteVoucher = (voucherId: string) => {
    const v = localVouchers.find(tx => tx.id === voucherId);
    if (!v) return;

    if (isTerminated) {
      alert('Your user account is Terminated. Access denied.');
      return;
    }
    if (!canPerformAction('Delete')) {
      alert('Role check error: Your current scope lacks Delete authorization permissions.');
      return;
    }

    if (window.confirm(`Are you absolutely sure you want to delete Voucher ${v.grnSivNo}?`)) {
      setLocalVouchers(prev => prev.filter(tx => tx.id !== voucherId));
      if (selectedGrvId === voucherId) {
        setSelectedGrvId(null);
      }
      setSuccessMessage(`Voucher ${v.grnSivNo} deleted permanently.`);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  // Page 1 Trigger Refresh action above the table
  const handleRefreshTable = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setGrvSearch('');
      setDurationStart('');
      setDurationEnd('');
      setStatusFilter('All');
      setIsRefreshing(false);
      setSuccessMessage('Ledger indices synchronized and refreshed.');
      setTimeout(() => setSuccessMessage(''), 3000);
    }, 600);
  };

  // Page 2: Add dynamic line item in the Multi-Item registry form
  const handleAddFormItem = () => {
    if (!formSelectedMatId) {
      alert('Please select a material Code/Description.');
      return;
    }
    if (formQty <= 0) {
      alert('Please enter a valid positive quantity.');
      return;
    }

    const duplicate = registrationItems.some(i => i.materialId === formSelectedMatId);
    if (duplicate) {
      alert('This material is already in your registration checklist. Edit its quantity instead.');
      return;
    }

    const newItem: NewVoucherItem = {
      id: `reg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      materialId: formSelectedMatId,
      quantity: formQty,
      spec: formSpec || 'Standard construction delivery'
    };

    setRegistrationItems([...registrationItems, newItem]);
    setFormQty(0);
    setFormSpec('');
  };

  const handleRemoveFormItem = (itemId: string) => {
    setRegistrationItems(registrationItems.filter(i => i.id !== itemId));
  };

  // Page 2 Registering multiple materials: Posts them to the menu table
  const handleRegisterVoucher = (e: React.FormEvent) => {
    e.preventDefault();

    if (isTerminated) {
      alert('Your user account is Terminated. Access denied.');
      return;
    }
    if (!canPerformAction('Write')) {
      alert('Role check error: Your current role scope lacks Write permissions to create vouchers.');
      return;
    }

    if (registrationItems.length === 0) {
      alert('Please add at least one material line item to the voucher.');
      return;
    }

    const generatedNo = newVoucherNo || `GRV-${Math.floor(Math.random() * 9000) + 1000}`;

    // Loop through each item in the multiple registration checklist and construct transactions
    const constructedTxs: BinCardTransaction[] = registrationItems.map((item, idx) => {
      const matDetail = materials.find(m => m.id === item.materialId);
      return {
        id: `tx-new-${Date.now()}-${idx}`,
        materialId: item.materialId,
        date: newVoucherDate,
        grnSivNo: generatedNo,
        receivedQty: item.quantity,
        balance: (matDetail?.quantity || 0) + item.quantity,
        unitPrice: matDetail?.unitPrice || 750,
        remark: `${newVoucherType} - ${item.spec} (Pad Ref: ${newPadRef || 'None'})`,
        signature: currentUserObj?.initials || 'CREATOR',
        checkedById: newCheckedById,
        approvedById: newApprovedById,
        qaStatus: undefined // Starts as pending validation
      };
    });

    // Save and queue on parent props
    constructedTxs.forEach(tx => {
      // Feed transactions incrementally back to layout parent so inventory counts update
      onUpdateTransaction(tx);
    });

    // Append to local state list immediately
    setLocalVouchers(prev => [...constructedTxs, ...prev]);

    // Clear and prompt success
    setSuccessMessage(`Successfully registered ${newVoucherType} No: ${generatedNo} with ${registrationItems.length} items. Checklist assigned to controllers.`);
    setRegistrationItems([]);
    setNewVoucherNo('');
    setNewPadRef('');
    
    // Page 2 Guideline: "Automatically refresh to display the new entry, default sorting is latest to earliest."
    // Switch tab to Voucher Ledger with 'All' filter Active
    setStatusFilter('All');
    setSortField('date');
    setSortOrder('desc');
    setActiveTab('ledger');
    
    setTimeout(() => setSuccessMessage(''), 5050);
  };

  // PDF / Excel formatting alerts (Page 3 Reports)
  const triggerSimulationExport = (format: 'Excel' | 'PDF') => {
    setSuccessMessage(`Preparing ${format} download pipeline...`);
    const mockFilename = `${reportType.toLowerCase().replace(' ', '_')}_export_${new Date().toISOString().split('T')[0]}`;
    
    setTimeout(() => {
      // Triggers browser-native prompt or beautiful toast
      const link = document.createElement('a');
      link.href = '#';
      link.setAttribute('download', `${mockFilename}.${format === 'Excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccessMessage(`Export complete: ${mockFilename}.${format === 'Excel' ? 'xlsx' : 'pdf'} generated (simulated download).`);
      setTimeout(() => setSuccessMessage(''), 4000);
    }, 1200);
  };

  const handleSimulatePrint = () => {
    setSuccessMessage('Transmitting print package load to queue spooler...');
    setTimeout(() => {
      window.print();
    }, 700);
  };

  const voucherTableColumns = [
    {
      title: 'Voucher Info',
      key: 'voucherInfo',
      render: (_: unknown, record: BinCardTransaction) => {
        const mat = materials.find(m => m.id === record.materialId);
        const status = record.qaStatus || (record.qaApprovedById ? 'Approved' : 'Pending');
        let statusTagColor = 'orange';
        if (status === 'Approved') statusTagColor = 'green';
        else if (status === 'Revision Required') statusTagColor = 'volcano';
        else if (status === 'Rejected') statusTagColor = 'red';

        return (
          <div className="space-y-1 text-left">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 font-mono text-xs">{record.grnSivNo}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded border leading-none font-semibold uppercase ${
                status === 'Approved' ? 'text-[#52c41a] bg-[#f6ffed] border-[#b7eb8f]' :
                status === 'Revision Required' ? 'text-[#fa541c] bg-[#fff2e8] border-[#ffd8bf]' :
                status === 'Rejected' ? 'text-[#ff4d4f] bg-[#fff1f0] border-[#ffccc7]' :
                'text-[#faad14] bg-[#fffbe6] border-[#ffe58f]'
              }`}>
                {status === 'Revision Required' ? 'Revis' : status}
              </span>
            </div>
            <p className="text-[#262626] font-medium leading-normal line-clamp-1 text-xs">
              {mat ? mat.description : 'Unspecified BoQ Line Item'}
            </p>
            <div className="flex items-center justify-between text-[10px] text-[#8c8c8c] pt-1">
              <span>Qty: <strong className="text-slate-700">{record.receivedQty} {mat?.unit || 'Units'}</strong></span>
              <span>Date: <strong className="text-slate-705">{record.date}</strong></span>
            </div>
          </div>
        );
      }
    },
    {
      title: 'Action',
      key: 'action',
      width: 75,
      render: (_: unknown, record: BinCardTransaction) => {
        const status = record.qaStatus || (record.qaApprovedById ? 'Approved' : 'Pending');
        
        interface MenuItemType {
          key: string;
          label: string;
          icon: React.ReactNode;
          danger?: boolean;
          onClick: () => void;
        }

        const menuItems: MenuItemType[] = [
          {
            key: 'view',
            label: 'View Audit',
            icon: <EyeOutlined />,
            onClick: () => setSelectedGrvId(record.id)
          }
        ];
        
        if (status !== 'Pending') {
          menuItems.push({
            key: 'revert',
            label: 'Revert To Pending',
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

        const menuProps = { items: menuItems };

        return (
          <div onClick={(e) => {
            e.stopPropagation();
          }}>
            <Dropdown menu={menuProps} trigger={['click']}>
              <Button type="text" size="small" icon={<MoreOutlined className="text-slate-500" />} />
            </Dropdown>
          </div>
        );
      }
    }
  ];

  const registrationTableColumns = [
    {
      title: 'No',
      key: 'index',
      width: 50,
      align: 'center' as const,
      render: (_: unknown, record: NewVoucherItem, index: number) => index + 1
    },
    {
      title: 'Material Code',
      key: 'code',
      render: (_: unknown, record: NewVoucherItem) => {
        const matInfo = materials.find(m => m.id === record.materialId);
        return <span className="font-mono font-medium">{matInfo?.code || 'AUTO'}</span>;
      }
    },
    {
      title: 'Material Description',
      key: 'description',
      render: (_: unknown, record: NewVoucherItem) => {
        const matInfo = materials.find(m => m.id === record.materialId);
        return <span className="text-slate-800 font-medium">{matInfo?.description || 'N/A'}</span>;
      }
    },
    {
      title: 'Unit',
      key: 'unit',
      align: 'center' as const,
      render: (_: unknown, record: NewVoucherItem) => {
        const matInfo = materials.find(m => m.id === record.materialId);
        return <span className="text-slate-500">{matInfo?.unit || 'Units'}</span>;
      }
    },
    {
      title: 'Quantity',
      key: 'quantity',
      align: 'right' as const,
      render: (_: unknown, record: NewVoucherItem) => (
        <span className="font-mono font-bold text-slate-950">{record.quantity}</span>
      )
    },
    {
      title: 'Specification / Remarks',
      key: 'spec',
      render: (_: unknown, record: NewVoucherItem) => (
        <span className="text-slate-600 italic text-[11px]">{record.spec}</span>
      )
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center' as const,
      render: (_: unknown, record: NewVoucherItem) => (
        <Button 
          type="link" 
          danger 
          size="small" 
          onClick={() => handleRemoveFormItem(record.id)}
          className="text-xs hover:bg-red-50 font-semibold"
        >
          ✕ Remove
        </Button>
      )
    }
  ];

  const reportTableColumns = [
    {
      title: 'Voucher No',
      key: 'voucherNo',
      dataIndex: 'grnSivNo',
      render: (text: string) => <span className="font-mono font-semibold text-slate-900">{text}</span>
    },
    {
      title: 'Reference Document',
      key: 'reference',
      render: (_: unknown, record: BinCardTransaction) => (
        <span className="font-medium text-slate-500">
          {record.remark && record.remark.includes('Pad Ref:') ? record.remark.split('Pad Ref:')[1].trim() : 'N/A Code'}
        </span>
      )
    },
    {
      title: 'Category',
      key: 'category',
      render: (_: unknown, record: BinCardTransaction) => {
        const matObj = materials.find(m => m.id === record.materialId);
        return <span className="text-slate-500 text-[11px]">{matObj?.category || 'General BoQ'}</span>;
      }
    },
    {
      title: 'GC Date',
      key: 'date',
      dataIndex: 'date',
      render: (text: string) => <span className="font-mono text-slate-500">{text}</span>
    },
    {
      title: 'Material Asset Block',
      key: 'materialAssetBlock',
      render: (_: unknown, record: BinCardTransaction) => {
        const matObj = materials.find(m => m.id === record.materialId);
        return <span className="font-medium text-slate-800">{matObj?.description || 'N/A Item'}</span>;
      }
    },
    {
      title: 'Inbound (Qty)',
      key: 'inbound',
      align: 'right' as const,
      render: (_: unknown, record: BinCardTransaction) => (
        <span className="text-emerald-600 font-mono font-bold">{record.receivedQty || '-'}</span>
      )
    },
    {
      title: 'Outbound (Qty)',
      key: 'outbound',
      align: 'right' as const,
      render: (_: unknown, record: BinCardTransaction) => (
        <span className="text-rose-600 font-mono font-bold">{record.issuedQty || record.transferredQty || '-'}</span>
      )
    },
    {
      title: 'Unit',
      key: 'unit',
      align: 'center' as const,
      render: (_: unknown, record: BinCardTransaction) => {
        const matObj = materials.find(m => m.id === record.materialId);
        return <span className="text-slate-400 text-[11px]">{matObj?.unit || 'PCS'}</span>;
      }
    },
    {
      title: 'Unit Price (ETB)',
      key: 'unitPrice',
      align: 'right' as const,
      render: (_: unknown, record: BinCardTransaction) => (
        <span className="font-mono font-semibold text-slate-700">{record.unitPrice.toLocaleString()}</span>
      )
    },
    {
      title: 'Audit Status',
      key: 'auditStatus',
      align: 'center' as const,
      render: (_: unknown, record: BinCardTransaction) => {
        const status = record.qaStatus || (record.qaApprovedById ? 'Approved' : 'Pending');
        let auditBadge = 'text-[#faad14] bg-[#fffbe6] border-[#ffe58f]';
        if (status === 'Approved') {
          auditBadge = 'text-[#52c41a] bg-[#f6ffed] border-[#b7eb8f]';
        } else if (status === 'Revision Required') {
          auditBadge = 'text-[#fa541c] bg-[#fff2e8] border-[#ffd8bf]';
        } else if (status === 'Rejected') {
          auditBadge = 'text-[#ff4d4f] bg-[#fff1f0] border-[#ffccc7]';
        }
        return (
          <span className={`inline-block px-1.5 py-0.5 rounded border text-[10px] uppercase font-bold tracking-tight ${auditBadge}`}>
            {status}
          </span>
        );
      }
    }
  ];

  return (
    <div className="space-y-4 font-sans text-left" id="voucher-validation-view">

      {successMessage && (
        <div className="p-3 bg-[#f6ffed] border border-[#b7eb8f] text-[#389e0d] rounded-[6px] text-xs font-normal flex items-center justify-between shadow-3xs transition duration-300">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 size={14} className="text-[#52c41a]" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-slate-450 hover:text-slate-700 cursor-pointer transition">
            <X size={14} />
          </button>
        </div>
      )}

      {/* 2. Sleek Ant Design Menu Sub-selector Tab Rows (Page 1 manual) */}
      <Menu
        mode="horizontal"
        selectedKeys={[activeTab]}
        onClick={(info) => setActiveTab(info.key as 'ledger' | 'register' | 'reports' | 'access')}
        className="border-b border-[#f0f0f0] bg-white rounded-t-[6px] px-1 shadow-3xs mb-4"
        items={[
          {
            key: 'ledger',
            label: (
              <div className="flex items-center gap-1.5">
                <FileText size={14} className="inline-block" />
                <span>Vouchers Ledger ({filteredGrvs.length})</span>
              </div>
            )
          },
          {
            key: 'register',
            label: (
              <div className="flex items-center gap-1.5">
                <Plus size={14} className="inline-block" />
                <span>Voucher Registration Form</span>
              </div>
            )
          },
          {
            key: 'reports',
            label: (
              <div className="flex items-center gap-1.5">
                <FileDown size={14} className="inline-block" />
                <span>Detailed & Summary Reports</span>
              </div>
            )
          },
          {
            key: 'access',
            label: (
              <div className="flex items-center gap-1.5">
                <Users size={14} className="inline-block" />
                <span>Access Control Matrix (Roles)</span>
              </div>
            )
          }
        ]}
      />

      {/* 3. Tab Contents Layout */}

      {/* TAB A: Voucher Ledger & 3-Way Reconciliation Audit */}
      {activeTab === 'ledger' && (
        <Layout style={{ background: 'transparent' }} className="flex flex-col lg:flex-row gap-5">
          
          {/* A1. Voucher List Sidebar Converted to full Menu Table with Columns (Page 1) */}
          <Sider
            width={380}
            breakpoint="lg"
            collapsedWidth="100%"
            style={{ background: '#fff' }}
            className="flex flex-col border border-[#f0f0f0] rounded-[6px] shadow-sm overflow-hidden h-[620px]"
          >
            
            {/* Filters panel inside Sidebar menu table header (Page 1 Enhancements) */}
            <div className="p-3.5 bg-[#fafafa] border-b border-[#f0f0f0] flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#262626]">Filter & Search Vouchers</span>
                <button 
                  onClick={handleRefreshTable}
                  disabled={isRefreshing}
                  className="p-1.5 text-[#1677ff] hover:bg-[#e6f4ff] rounded transition cursor-pointer flex items-center gap-1 text-[11px]"
                  title="Refresh Voucher Table Indices"
                >
                  <RefreshCw size={11} className={isRefreshing ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </button>
              </div>

              {/* Page 1 Search guidelines: Search by Item Description / Voucher No / Pad Reference */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                  <Search size={12} />
                </span>
                <input
                  type="text"
                  value={grvSearch}
                  onChange={(e) => setGrvSearch(e.target.value)}
                  placeholder="Search item, GRV No, Ref No, metadata..."
                  className="w-full h-8 pl-8 pr-3 text-xs text-[#262626] bg-white border border-[#d9d9d9] rounded-[4px] hover:border-[#4096ff] focus:border-[#4096ff] focus:shadow-[0_0_0_2px_rgba(22,119,255,0.08)] outline-none transition duration-200"
                />
              </div>

              {/* Page 1 UX: Filter inside Date - Duration Selector */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block mb-0.5">Start Date</span>
                  <input 
                    type="date"
                    value={durationStart}
                    onChange={(e) => setDurationStart(e.target.value)}
                    className="w-full text-xs h-7 px-1.5 border border-[#d9d9d9] rounded hover:border-[#4096ff] focus:outline-none"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">End Date</span>
                  <input 
                    type="date"
                    value={durationEnd}
                    onChange={(e) => setDurationEnd(e.target.value)}
                    className="w-full text-xs h-7 px-1.5 border border-[#d9d9d9] rounded hover:border-[#4096ff] focus:outline-none"
                  />
                </div>
              </div>

              {/* Page 1 UX: Sort on Voucher Number and Date */}
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

              {/* Segmented status filter tabs with count indicators */}
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
                          ? 'bg-white text-[#1677ff] shadow-[0_1px_3px_rgba(0,0,0,0.09)]'
                          : 'text-[#595959] hover:text-[#262626]'
                      }`}
                    >
                      {tab === 'Revision Required' ? 'Revision' : tab}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* List Table container (Page 1 specifications) */}
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
                  onClick: () => {
                    setSelectedGrvId(record.id);
                  },
                })}
                showHeader={false}
                rowClassName={(record) => `cursor-pointer transition select-none ${selectedGrvId === record.id ? 'bg-[#e6f4ff]' : ''}`}
                locale={{
                  emptyText: (
                    <div className="p-12 text-center text-[#8c8c8c] text-xs font-normal">
                      <AlertTriangle className="mx-auto text-slate-300 mb-2" size={18} />
                      <span>No registered vouchers found.</span>
                    </div>
                  )
                }}
                className="custom-antd-table font-sans text-xs"
              />
            </div>
          </Sider>

          {/* A2. Detailed 3-Way Reconciliation Card */}
          <div className="lg:col-span-7 flex flex-col bg-white border border-[#f0f0f0] rounded-[6px] shadow-sm overflow-hidden h-[620px]">
            {selectedGrvId ? (
              <div className="h-full flex flex-col justify-between">
                
                {/* Header detail */}
                <div className="p-4 border-b border-[#f0f0f0] bg-white flex flex-wrap items-center justify-between gap-3 text-left">
                  <div>
                    <h4 className="text-sm font-semibold text-[#262626]">3-Way Audit Panel: {activeGrv?.grnSivNo}</h4>
                    <p className="text-xs text-[#8c8c8c] mt-0.5">Check material actual measurements against purchase contract rates.</p>
                  </div>
                  
                  {/* Select PO to evaluate against */}
                  <div className="flex items-center gap-2">
                    <span className="text-[#8c8c8c] text-xs">Verify against:</span>
                    <select
                      value={selectedPoId || ''}
                      onChange={(e) => setSelectedPoId(e.target.value || null)}
                      className="h-8 px-2 bg-white border border-[#d9d9d9] hover:border-[#4096ff] rounded-[4px] font-medium text-[#1677ff] focus:border-[#4096ff] focus:outline-none cursor-pointer text-xs"
                    >
                      <option value="">-- Manual Selection --</option>
                      {purchaseOrders.map(po => (
                        <option key={po.id} value={po.id}>
                          PO-{po.poNumber} ({po.supplierName})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Detailed checklist */}
                <div className="p-4 flex-1 overflow-y-auto bg-white space-y-4">
                  {activePo ? (
                    <div className="space-y-4">
                      
                      {/* Flow direction context */}
                      <div className="flex flex-wrap items-center justify-between border-b border-[#f0f0f0] pb-2.5 gap-2">
                        <div className="text-left">
                          <span className="text-[10px] text-[#8c8c8c] block font-bold uppercase tracking-wider">Audit Stream</span>
                          <div className="flex items-center gap-1.5 mt-0.5 text-xs font-medium text-[#262626]">
                            <span className="font-semibold text-slate-800">{activePo.supplierName}</span>
                            <span className="text-[#d9d9d9]">•</span>
                            <span className="font-mono text-[#1677ff]">PO-{activePo.poNumber}</span>
                            <span className="text-[#d9d9d9]">•</span>
                            <span className="font-mono text-slate-500">{activeGrv?.grnSivNo}</span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <span className="text-[10px] text-[#8c8c8c] block font-bold uppercase tracking-wider">Results</span>
                          {qtyMismatch || priceMismatch ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#fff1f0] border border-[#ffccc7] rounded-[4px] text-[10px] font-semibold text-[#ff4d4f] mt-0.5">
                              <AlertTriangle size={11} /> Variance Detected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#f6ffed] border border-[#b7eb8f] rounded-[4px] text-[10px] font-semibold text-[#52c41a] mt-0.5">
                              <Check size={11} /> Ledger Balanced
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Material info */}
                      <div className="p-3 bg-slate-50 rounded border border-[#f0f0f0] text-xs">
                        <span className="text-[#8c8c8c] block text-[10px] uppercase font-bold tracking-wider mb-1">Assigned Material Item Summary</span>
                        <div className="flex justify-between font-semibold text-[#262626]">
                          <span>{grvMaterial?.description || 'Loading item...'}</span>
                          <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-[#d9d9d9] text-[10px] text-slate-500">
                            Code: {grvMaterial?.code}
                          </span>
                        </div>
                      </div>

                      {/* Metric Variance table */}
                      <div className="border border-[#f0f0f0] rounded-[6px] overflow-hidden">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="bg-[#fafafa] border-b border-[#f0f0f0] text-[#262626] font-medium">
                              <th className="p-2.5 pl-3">Matched Metric</th>
                              <th className="p-2.5 text-right">PO (Standard)</th>
                              <th className="p-2.5 text-right">GRV (Actual)</th>
                              <th className="p-2.5 text-right">Variance</th>
                              <th className="p-2.5 text-center pr-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#f0f0f0]">
                            
                            {/* Quantity Row */}
                            <tr className="hover:bg-[#fafafa] transition">
                              <td className="p-2.5 pl-3 text-slate-700">Received Quantity</td>
                              <td className="p-2.5 text-right font-mono text-slate-900">{poQty} {matchingPoItem?.unit || 'Units'}</td>
                              <td className="p-2.5 text-right font-mono text-slate-900">{grvQty} {grvMaterial?.unit || 'Units'}</td>
                              <td className={`p-2.5 text-right font-mono font-medium ${qtyMismatch ? 'text-[#faad14]' : 'text-slate-500'}`}>
                                {qtyDiff > 0 ? `+${qtyDiff}` : qtyDiff}
                              </td>
                              <td className="p-2.5 text-center pr-3">
                                {qtyMismatch ? (
                                  <span className="inline-block px-1.5 py-0.5 bg-[#fffbe6] text-[#faad14] rounded border border-[#ffe58f] text-[9px] font-semibold">Mismatch</span>
                                ) : (
                                  <span className="inline-block px-1.5 py-0.5 bg-[#f6ffed] text-[#52c41a] rounded border border-[#b7eb8f] text-[9px] font-semibold">Passed</span>
                                )}
                              </td>
                            </tr>

                            {/* Cost Row */}
                            <tr className="hover:bg-[#fafafa] transition">
                              <td className="p-2.5 pl-3 text-slate-700">Contract Rate (ETB)</td>
                              <td className="p-2.5 text-right font-mono text-slate-900">{poPrice.toLocaleString()}</td>
                              <td className="p-2.5 text-right font-mono text-slate-900">{grvPrice.toLocaleString()}</td>
                              <td className={`p-2.5 text-right font-mono font-medium ${priceMismatch ? 'text-[#ff4d4f]' : 'text-slate-500'}`}>
                                {priceDiff > 0 ? `+${priceDiff.toLocaleString()}` : priceDiff.toLocaleString()}
                              </td>
                              <td className="p-2.5 text-center pr-3">
                                {priceMismatch ? (
                                  <span className="inline-block px-1.5 py-0.5 bg-[#fff1f0] text-[#ff4d4f] rounded border border-[#ffccc7] text-[9px] font-semibold">Rate Diff</span>
                                ) : (
                                  <span className="inline-block px-1.5 py-0.5 bg-[#f6ffed] text-[#52c41a] rounded border border-[#b7eb8f] text-[9px] font-semibold">Passed</span>
                                )}
                              </td>
                            </tr>

                            {/* Aggregated totals */}
                            <tr className="hover:bg-[#fafafa] bg-[#fafafa]/50 transition">
                              <td className="p-2.5 pl-3 font-semibold text-[#1f1f1f]">Aggregate Financial Total</td>
                              <td className="p-2.5 text-right font-semibold text-[#1f1f1f] font-mono">{(poTotal).toLocaleString()} ETB</td>
                              <td className="p-2.5 text-right font-semibold text-[#1f1f1f] font-mono">{(grvTotal).toLocaleString()} ETB</td>
                              <td className={`p-2.5 text-right font-semibold font-mono ${qtyMismatch || priceMismatch ? 'text-[#ff4d4f]' : 'text-slate-500'}`}>
                                {totalDiff > 0 ? `+${totalDiff.toLocaleString()}` : totalDiff.toLocaleString()} ETB
                              </td>
                              <td className="p-2.5 text-center pr-3">
                                {qtyMismatch || priceMismatch ? (
                                  <span className="inline-block px-1.5 py-0.5 bg-[#fff1f0] text-[#ff4d4f] rounded border border-[#ffccc7] text-[9px] font-semibold block uppercase">Unbalanced</span>
                                ) : (
                                  <span className="inline-block px-1.5 py-0.5 bg-[#f6ffed] text-[#52c41a] rounded border border-[#b7eb8f] text-[9px] font-semibold block uppercase">Matched</span>
                                )}
                              </td>
                            </tr>

                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="py-20 text-center text-[#8c8c8c] text-xs font-normal flex flex-col items-center justify-center gap-2.5 border border-dashed border-[#d9d9d9] rounded-[8px] bg-[#fafafa]">
                      <AlertTriangle className="text-[#faad14]" size={24} />
                      <span className="text-slate-500 font-medium max-w-sm">Link an authorized purchase contract order in the selection menu above to calculate 3-way reconciliation variables.</span>
                    </div>
                  )}
                </div>

                {/* Audit Action panel at bottom of validation card */}
                <div className="bg-[#fafafa] border-t border-[#f0f0f0] p-3.5 text-left text-xs">
                  {activeGrv?.qaApprovedById || activeGrv?.qaStatus === 'Rejected' || activeGrv?.qaStatus === 'Revision Required' ? (
                    <div className={`border rounded-[6px] p-3 flex flex-wrap items-center justify-between gap-3 ${
                      activeGrv.qaStatus === 'Approved'
                        ? 'bg-[#f6ffed] border-[#b7eb8f]'
                        : activeGrv.qaStatus === 'Revision Required'
                        ? 'bg-[#fff2e8] border-[#ffd8bf]'
                        : 'bg-[#fff1f0] border-[#ffccc7]'
                    }`}>
                      <div className="flex items-center gap-2.5">
                        {activeGrv.qaStatus === 'Approved' ? (
                          <CheckCircle2 size={16} className="text-[#52c41a]" />
                        ) : activeGrv.qaStatus === 'Revision Required' ? (
                          <RefreshCw size={14} className="text-[#fa541c]" />
                        ) : (
                          <XCircle size={16} className="text-[#ff4d4f]" />
                        )}
                        <div>
                          <span className="text-slate-900 font-semibold mr-1.5">
                            {activeGrv.qaStatus === 'Approved' ? 'Ledger Posted' : activeGrv.qaStatus === 'Revision Required' ? 'Revision Pending' : 'Ledger Rejected'}
                          </span>
                          <span className="text-[#595959] text-[11px] italic">"{activeGrv.qaRemark}"</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-[10px] text-[#8c8c8c] font-medium font-mono">
                          Auditor: {systemUsers.find(u => u.id === activeGrv.qaApprovedById)?.name || 'Audit Officer'}
                        </span>
                        
                        <button
                          onClick={() => handleRevertStatus(activeGrv)}
                          className="text-[#1677ff] hover:text-[#4096ff] font-medium flex items-center gap-1 cursor-pointer text-xs"
                        >
                          <RefreshCw size={11} className="transition duration-300 hover:rotate-180" />
                          <span>Unlock Ledger</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 pointer-events-none">
                            <MessageSquare size={12} />
                          </span>
                          <input
                            type="text"
                            value={remarksText}
                            onChange={(e) => setRemarksText(e.target.value)}
                            placeholder="Audit sign-off remarks/justifications (Required for rejections or corrections)..."
                            className="w-full h-8 pl-8 pr-3 text-xs text-[#262626] bg-white border border-[#d9d9d9] rounded-[4px] hover:border-[#4096ff] focus:border-[#4096ff] outline-none transition duration-200 shadow-3xs"
                          />
                        </div>

                        <div className="flex items-center gap-1 bg-white border border-[#d9d9d9] hover:border-[#4096ff] px-2 rounded-[4px] h-8 shadow-3xs hover:cursor-pointer">
                          <User size={12} className="text-slate-450" />
                          <select
                            value={activeUserId}
                            onChange={(e) => setActiveUserId(e.target.value)}
                            className="h-full bg-transparent border-none text-[11px] font-medium focus:outline-none text-slate-750 cursor-pointer"
                          >
                            {systemUsers.map(u => (
                              <option key={u.id} value={u.id}>{u.name} ({u.role.split(' ')[0]})</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Reconciliation controls */}
                      <div className="flex justify-end gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={handleReject}
                          className="h-8 px-4 bg-[#ff4d4f] hover:bg-[#ff7875] text-white rounded-[4px] text-xs font-medium border border-[#ff4d4f] hover:border-[#ff7875] flex items-center gap-1 cursor-pointer transition active:scale-95 shadow-3xs"
                          title="Reject the ledger alignment completely"
                        >
                          <X size={13} strokeWidth={2.5} />
                          <span>Reject</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleRequestRevision}
                          className="h-8 px-4 bg-white hover:text-[#fa541c] hover:border-[#ffd8bf] hover:bg-[#fff2e8] border border-[#d9d9d9] text-[#595959] rounded-[4px] text-xs font-medium cursor-pointer transition active:scale-95"
                          title="Flag corrections on measurement records of voucher"
                        >
                          <RefreshCw size={11} strokeWidth={2.5} />
                          <span>Request Revision</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleApprove}
                          className="h-8 px-5 bg-[#1677ff] hover:bg-[#4096ff] text-white rounded-[4px] text-xs font-medium flex items-center gap-1 cursor-pointer transition active:scale-95 shadow-sm"
                          title="Approve measurements and post aggregate updates directly to bin inventory"
                        >
                          <Check size={13} strokeWidth={2.5} />
                          <span>Approve & Post Ledger</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white">
                <FileText size={44} className="text-slate-300 mb-4 animate-bounce" />
                <h4 className="font-semibold text-[#262626] text-sm">3-Way Reconciliation View Desk</h4>
                <p className="text-xs text-[#8c8c8c] mt-1 max-w-sm leading-normal">
                  Select a registered voucher from the list index on the left, or open the "Voucher Registration Form" to register a dynamic multi-item receipt directly from physical deliveries.
                </p>
                
                <div className="mt-6 flex gap-2">
                  <button 
                    onClick={() => setActiveTab('register')}
                    className="h-8 px-4 bg-[#1677ff] text-white text-xs font-medium rounded hover:bg-[#4096ff] transition cursor-pointer"
                  >
                    + Register New Voucher
                  </button>
                  <button 
                    onClick={() => {
                      if (filteredGrvs.length > 0) {
                        setSelectedGrvId(filteredGrvs[0].id);
                      }
                    }}
                    className="h-8 px-4 bg-slate-50 hover:bg-slate-100 border border-[#d9d9d9] text-[#262626] text-xs font-medium rounded transition cursor-pointer"
                  >
                    Quick Select First
                  </button>
                </div>
              </div>
            )}
          </div>

        </Layout>
      )}

      {/* TAB B: Voucher Registration Form (Page 2) */}
      {activeTab === 'register' && (
        <form onSubmit={handleRegisterVoucher} className="bg-white border border-[#f0f0f0] rounded-[6px] shadow-sm p-6 text-left space-y-6">
          
          <div className="border-b border-[#f0f0f0] pb-3 flex justify-between items-center">
            <div>
              <h3 className="text-base font-semibold text-[#262626]">New Multiple Material Voucher Registration</h3>
              <p className="text-xs text-[#8c8c8c] mt-0.5">Prepare Store Requisitions, Goods Received Vouchers, or Daily Report logs with multiple item assets.</p>
            </div>
          </div>

          {/* Form Context Info Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">* GC Date (Default Today)</label>
              <input 
                type="date"
                required
                value={newVoucherDate}
                onChange={(e) => setNewVoucherDate(e.target.value)}
                className="w-full h-8 px-2.5 bg-white border border-[#d9d9d9] hover:border-[#4096ff] focus:border-[#4096ff] focus:outline-none rounded-[4px] text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">* Voucher Structure Type</label>
              <select
                value={newVoucherType}
                onChange={(e) => setNewVoucherType(e.target.value as 'Goods Received' | 'Store Requisition' | 'Daily Report')}
                className="w-full h-8 px-2.5 bg-white border border-[#d9d9d9] hover:border-[#4096ff] focus:border-[#4096ff] focus:outline-none rounded-[4px] text-xs cursor-pointer"
              >
                <option value="Goods Received">Goods Received Note (GRV)</option>
                <option value="Store Requisition">Store Requisition (SIV)</option>
                <option value="Daily Report">Daily Report Log</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Voucher Number (Sequential)</label>
              <input 
                type="text"
                placeholder="e.g. GRV-5323 (Automatic if empty)"
                value={newVoucherNo}
                onChange={(e) => setNewVoucherNo(e.target.value)}
                className="w-full h-8 px-2.5 bg-white border border-[#d9d9d9] hover:border-[#4096ff] focus:border-[#4096ff] focus:outline-none rounded-[4px] text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">* Delivery Destination Store</label>
              <select
                value={newRequestedTo}
                onChange={(e) => setNewRequestedTo(e.target.value)}
                className="w-full h-8 px-2.5 bg-white border border-[#d9d9d9] hover:border-[#4096ff] focus:border-[#4096ff] focus:outline-none rounded-[4px] text-xs cursor-pointer"
              >
                {stores.map(st => (
                  <option key={st.id} value={st.id}>{st.name} ({st.type})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">* Requested By Project</label>
              <input 
                type="text"
                required
                placeholder="e.g. Gotera Project, Bole Site Project"
                value={newRequestedBy}
                onChange={(e) => setNewRequestedBy(e.target.value)}
                className="w-full h-8 px-2.5 bg-white border border-[#d9d9d9] hover:border-[#4096ff] focus:border-[#4096ff] focus:outline-none rounded-[4px] text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Pad Reference Number</label>
              <input 
                type="text"
                placeholder="e.g. Ref-18679 / 20111"
                value={newPadRef}
                onChange={(e) => setNewPadRef(e.target.value)}
                className="w-full h-8 px-2.5 bg-white border border-[#d9d9d9] hover:border-[#4096ff] focus:border-[#4096ff] focus:outline-none rounded-[4px] text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Prepared By (Logged Creator)</label>
              <input 
                type="text"
                disabled
                value={`${currentUserObj?.name} (Keeper)`}
                className="w-full h-8 px-2.5 bg-slate-50 border border-[#d9d9d9] rounded-[4px] text-xs text-slate-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">* Checked By Officer</label>
              <select
                value={newCheckedById}
                onChange={(e) => setNewCheckedById(e.target.value)}
                className="w-full h-8 px-2.5 bg-white border border-[#d9d9d9] hover:border-[#4096ff] focus:border-[#4096ff] focus:outline-none rounded-[4px] text-xs cursor-pointer"
              >
                {systemUsers.filter(u => u.role === 'Stock Controller' || u.role === 'Warehouse Manager').map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">* Approved By Supervisor</label>
              <select
                value={newApprovedById}
                onChange={(e) => setNewApprovedById(e.target.value)}
                className="w-full h-8 px-2.5 bg-white border border-[#d9d9d9] hover:border-[#4096ff] focus:border-[#4096ff] focus:outline-none rounded-[4px] text-xs cursor-pointer"
              >
                {systemUsers.filter(u => u.role === 'Project Manager').map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Page 2: Multiple Material Registration Grid Sub-form */}
          <div className="bg-[#fafafa] border border-[#f0f0f0] p-4 rounded-[6px] space-y-4">
            <h4 className="text-xs font-semibold text-[#262626] uppercase tracking-wider flex items-center justify-between">
              <span>Multiple Materials Registration Checklist (Grid)</span>
              <span className="text-[10px] text-slate-400 font-normal normal-case">Add items below to create complex multi-item vouchers</span>
            </h4>
            
            {/* Quick-add row */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-5">
                <span className="block text-[11px] text-slate-550 mb-1">Select Material Item & Code</span>
                <select
                  value={formSelectedMatId}
                  onChange={(e) => setFormSelectedMatId(e.target.value)}
                  className="w-full h-8 px-2 bg-white border border-[#d9d9d9] hover:border-[#4096ff] focus:outline-none rounded text-xs cursor-pointer"
                >
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>{m.code} - {m.description} ({m.unit})</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3">
                <span className="block text-[11px] text-slate-550 mb-1">Received Quantity</span>
                <input 
                  type="number"
                  placeholder="e.g. 500"
                  value={formQty || ''}
                  onChange={(e) => setFormQty(Number(e.target.value))}
                  className="w-full h-8 px-2.5 bg-white border border-[#d9d9d9] hover:border-[#4096ff] focus:outline-none rounded text-xs"
                />
              </div>

              <div className="md:col-span-3">
                <span className="block text-[11px] text-slate-550 mb-1">Details / Specification</span>
                <input 
                  type="text"
                  placeholder="e.g. Concrete mix/batch no"
                  value={formSpec}
                  onChange={(e) => setFormSpec(e.target.value)}
                  className="w-full h-8 px-2.5 bg-white border border-[#d9d9d9] hover:border-[#4096ff] focus:outline-none rounded text-xs"
                />
              </div>

              <div className="md:col-span-1 font-sans">
                <Button
                  type="primary"
                  onClick={handleAddFormItem}
                  icon={<PlusOutlined />}
                  className="w-full h-8 flex items-center justify-center font-medium bg-[#1677ff]"
                />
              </div>
            </div>

            {/* List spreadsheet representation */}
            <div className="border border-[#f0f0f0] rounded-[6px] overflow-hidden bg-white">
              <Table
                dataSource={registrationItems.map(item => ({ ...item, key: item.id }))}
                columns={registrationTableColumns}
                pagination={false}
                size="small"
                locale={{
                  emptyText: 'No material items added yet. Choose a material above and click the invite plus button.'
                }}
              />
            </div>

          </div>

          <div className="flex justify-end items-center bg-[#fafafa] p-3 rounded-[6px] border text-xs gap-3">
            <div className="flex gap-2.5 shrink-0">
              <Button
                type="default"
                onClick={() => {
                  if (window.confirm('Discard current voucher progress?')) {
                    setRegistrationItems([]);
                    setNewVoucherNo('');
                    setNewPadRef('');
                  }
                }}
                className="h-9 px-4 text-xs font-medium text-[#595959]"
              >
                Clear Form
              </Button>
              
              <Button
                type="primary"
                htmlType="submit"
                className="h-9 px-6 text-xs font-semibold bg-[#1677ff]"
              >
                Register & Post Voucher
              </Button>
            </div>
          </div>

        </form>
      )}

      {/* TAB C: Detailed or Summary Reports (Page 3) */}
      {activeTab === 'reports' && (
        <div className="bg-white border border-[#f0f0f0] rounded-[6px] p-6 shadow-sm space-y-6">
          
          <div className="border-b border-[#f0f0f0] pb-3 flex flex-wrap justify-between items-center gap-3 text-left">
            <div>
              <h3 className="text-base font-semibold text-[#262626]">ConDigital Production & Material Reserves Report Desk</h3>
              <p className="text-xs text-[#8c8c8c] mt-0.5">Generate, audit, and export real-time movements, balance histories, and reconciliation details.</p>
            </div>

            {/* Simulated tools matching ConDigital's screenshot header */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => triggerSimulationExport('Excel')}
                className="h-8 px-3.5 bg-[#f6ffed] border border-[#b7eb8f] text-[#389e0d] hover:bg-[#eaf8dd] transition rounded text-xs font-medium flex items-center gap-1 cursor-pointer"
                title="Download Excel spreadsheet"
              >
                <FileText size={12} />
                <span>Export to Excel</span>
              </button>

              <button
                onClick={() => triggerSimulationExport('PDF')}
                className="h-8 px-3.5 bg-red-50 border border-red-200 text-red-650 hover:bg-[#fff1f0] transition rounded text-xs font-medium flex items-center gap-1 cursor-pointer"
                title="Download non-editable PDF presentation"
              >
                <FileDown size={12} />
                <span>Export to PDF</span>
              </button>

              <button
                onClick={handleSimulatePrint}
                className="h-8 px-3.5 bg-slate-50 border border-[#d9d9d9] text-[#262626] hover:bg-slate-100 rounded text-xs font-medium flex items-center gap-1 cursor-pointer"
                title="Print report layout safely"
              >
                <Printer size={12} />
                <span>Print Report</span>
              </button>

              <span className="h-5 w-px bg-slate-205"></span>

              <button
                onClick={handleRefreshTable}
                className="h-8 w-8 bg-[#1677ff] text-white rounded hover:bg-[#4096ff] flex items-center justify-center cursor-pointer transition"
                title="Synchronize formulas"
              >
                <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Report configuration filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#fafafa] p-4 rounded-[6px] border text-left text-xs">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">* Report Selection</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as 'Bin Card' | 'Stock Movement' | 'Monthly Report')}
                className="w-full h-8 px-2 bg-white border rounded border-[#d9d9d9] outline-none font-medium text-slate-700 cursor-pointer"
              >
                <option value="Bin Card">Bin Card Movement Ledger</option>
                <option value="Stock Movement">Stock Movement Balance report</option>
                <option value="Monthly Report">Monthly reconciliation audit summary</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-500 font-semibold mb-1">Search Material / Voucher Number</label>
              <div className="relative">
                <input 
                  type="text"
                  placeholder="e.g. Cement PPC, GRV-5323, Pad-22472"
                  value={reportSearchQuery}
                  onChange={(e) => setReportSearchQuery(e.target.value)}
                  className="w-full h-8 pl-8 pr-2 bg-white border rounded border-[#d9d9d9] outline-none text-slate-800"
                />
                <span className="absolute inset-y-0 left-2.5 flex items-center text-slate-400">
                  <Search size={12} />
                </span>
              </div>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">Duration Selector Filter</label>
              <div className="flex gap-1">
                <input 
                  type="date"
                  value={durationStart}
                  onChange={(e) => setDurationStart(e.target.value)}
                  className="flex-1 min-w-0 h-8 px-1 text-xs border rounded outline-none"
                />
                <span className="self-center text-slate-400">to</span>
                <input 
                  type="date"
                  value={durationEnd}
                  onChange={(e) => setDurationEnd(e.target.value)}
                  className="flex-1 min-w-0 h-8 px-1 text-xs border rounded outline-none"
                />
              </div>
            </div>
          </div>

          {/* Big Reports Grid Table */}
          <div className="border border-[#f0f0f0] rounded-[6px] overflow-hidden bg-white font-sans">
            <Table
              dataSource={localVouchers.filter(tx => {
                const matObj = materials.find(m => m.id === tx.materialId);
                const desc = matObj ? matObj.description.toLowerCase() : '';
                const code = tx.grnSivNo.toLowerCase();
                const q = reportSearchQuery.toLowerCase().trim();

                let dateCheck = true;
                if (durationStart) dateCheck = dateCheck && tx.date >= durationStart;
                if (durationEnd) dateCheck = dateCheck && tx.date <= durationEnd;

                return (desc.includes(q) || code.includes(q) || (tx.remark || '').toLowerCase().includes(q)) && dateCheck;
              }).map(t => ({ ...t, key: t.id }))}
              columns={reportTableColumns}
              pagination={{
                defaultPageSize: 10,
                size: 'small',
                showSizeChanger: true,
                showTotal: (total) => `${total} records shown`
              }}
              className="custom-antd-table font-sans text-xs"
            />
          </div>

          {/* Tab footer content spacer */}

        </div>
      )}

      {/* TAB D: Access Control Matrix (Roles) */}
      {activeTab === 'access' && (
        <div className="bg-white border border-[#f0f0f0] rounded-[6px] p-6 shadow-sm space-y-6 text-left">
          
          <div className="border-b border-[#f0f0f0] pb-3">
            <h3 className="text-base font-semibold text-[#262626]">Access Control Settings & Company User Matrix</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            
            {/* Control Column Selector */}
            <div className="md:col-span-4 bg-[#fafafa] p-4 rounded-[6px] border space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#262626]">User Account Settings</h4>
              
              <div className="space-y-3">
                
                {/* Switch Actor */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Simulated Session User</label>
                  <select
                    value={activeUserId}
                    onChange={(e) => setActiveUserId(e.target.value)}
                    className="w-full text-xs h-8 px-2 bg-white border border-[#d9d9d9] rounded cursor-pointer text-[#1677ff] font-semibold"
                  >
                    {systemUsers.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* User Privilege classification */}
                <div className="bg-white p-3 rounded border space-y-2">
                  <span className="text-[11px] text-[#8c8c8c] uppercase font-bold tracking-wider block">Access Category</span>
                  
                  <div className="flex gap-4 text-xs font-medium">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="radio" 
                        name="priv" 
                        checked={!isSuperUser} 
                        onChange={() => setIsSuperUser(false)}
                      />
                      <span>Normal User</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="radio" 
                        name="priv" 
                        checked={isSuperUser} 
                        onChange={() => setIsSuperUser(true)}
                      />
                      <span className="text-emerald-600">Super User</span>
                    </label>
                  </div>
                </div>

                {/* Status Toggle */}
                <div className="bg-white p-3 rounded border space-y-2">
                  <span className="text-[11px] text-[#595959] uppercase font-bold tracking-wider block">Activation Status</span>
                  
                  <div className="flex gap-2">
                    {systemUsers.map(u => {
                      const status = userStatuses[u.id] || 'Activated';
                      const isSelf = u.id === activeUserId;
                      return (
                        <div key={u.id} className="flex items-center justify-between text-xs w-full pb-1 border-b last:border-0">
                          <span className={`${isSelf ? 'font-bold text-[#1677ff]' : 'text-[#262626]'}`}>{u.name.split(' ')[0]}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setUserStatuses(prev => ({
                                ...prev,
                                [u.id]: status === 'Activated' ? 'Terminated' : 'Activated'
                              }));
                            }}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold cursor-pointer transition ${
                              status === 'Activated'
                                ? 'bg-[#f6ffed] text-[#52c41a] border border-[#b7eb8f]'
                                : 'bg-[#fff1f0] text-[#ff4d4f] border border-[#ffccc7]'
                            }`}
                          >
                            {status}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>

            {/* Matrix Columns Guidelines table */}
            <div className="md:col-span-8 space-y-3 text-left">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#262626]">Privileges Access Rights Matrix</h4>
              
              <div className="border border-[#f0f0f0] rounded-[6px] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#f5f5f5] text-[#262626] border-b font-medium">
                      <th className="p-2.5">Role Designation</th>
                      <th className="p-2.5 text-center">Read Only</th>
                      <th className="p-2.5 text-center">Write</th>
                      <th className="p-2.5 text-center">Edit</th>
                      <th className="p-2.5 text-center">Delete</th>
                      <th className="p-2.5 text-center">Check</th>
                      <th className="p-2.5 text-center">Approve</th>
                      <th className="p-2.5 text-center">Full Access</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f0f0]">
                    {Object.keys(rolePermissions).map((role) => {
                      const rights = rolePermissions[role];
                      const isMatchingActive = currentUserObj?.role === role;
                      
                      return (
                        <tr key={role} className={`transition hover:bg-[#fafafa] ${isMatchingActive ? 'bg-amber-50/40 font-semibold' : ''}`}>
                          <td className="p-2.5 font-medium text-slate-800">
                            {role} {isMatchingActive && <span className="text-[#1677ff] text-[10px] italic">(Active)</span>}
                          </td>
                          {['Read Only', 'Write', 'Edit', 'Delete', 'Check', 'Approve', 'Full Access'].map((act) => {
                            const active = rights.includes(act);
                            return (
                              <td key={act} className="p-2.5 text-center">
                                <input
                                  type="checkbox"
                                  checked={active}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setRolePermissions(prev => {
                                      const oldRights = prev[role] || [];
                                      const newRights = checked 
                                        ? [...oldRights, act] 
                                        : oldRights.filter(r => r !== act);
                                      return { ...prev, [role]: newRights };
                                    });
                                  }}
                                  className="w-3.5 h-3.5 accent-[#1677ff] cursor-pointer"
                                />
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
