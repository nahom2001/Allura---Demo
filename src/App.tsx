import React, { useState, useEffect } from 'react';
import { Layout, Button, Table, Dropdown, DatePicker, Modal, Select, Tooltip, Tag } from 'antd';
import dayjs from 'dayjs';
import { PlusOutlined, EditOutlined, DeleteOutlined, MoreOutlined, EyeOutlined, SyncOutlined, ShareAltOutlined } from '@ant-design/icons';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Edit,
  Filter, 
  Layers, 
  Building2, 
  MapPin, 
  Boxes, 
  Tags, 
  Scale, 
  Coins, 
  Info, 
  Eye, 
  Package, 
  Truck, 
  HardHat, 
  Monitor, 
  ChevronRight,
  RefreshCw,
  SlidersHorizontal,
  BookmarkCheck,
  Download
} from 'lucide-react';

import { Store, Material, MaterialCategory, BinCardTransaction, SystemUser, Supplier, PurchaseRequisition, PurchaseEvaluation, PurchaseOrder, InterStoreTransfer } from './types';
import { INITIAL_STORES, INITIAL_MATERIALS, INITIAL_USERS, INITIAL_SUPPLIERS, INITIAL_PRS, INITIAL_EVALUATIONS, INITIAL_POS, INITIAL_TRANSFERS } from './initialData';
import ConDigitalHeader from './components/ConDigitalHeader';
import StoreModal from './components/StoreModal';
import MaterialModal from './components/MaterialModal';
import BinCardModal from './components/BinCardModal';
import PurchaseEvaluationView from './components/PurchaseEvaluationView';
import PurchaseOrderView from './components/PurchaseOrderView';
import SupplierView from './components/SupplierView';
import GRVModal from './components/GRVModal';
import SIVModal from './components/SIVModal';
import VoucherValidationView from './components/VoucherValidationView';
import InterStoreTransferView from './components/InterStoreTransferView';


function generateDefaultTransactions(): BinCardTransaction[] {
  const seeds: BinCardTransaction[] = [];
  
  // Seed for OPC Cement (mat-1, quantity: 2500)
  seeds.push({
    id: 'seed-t1-1',
    materialId: 'mat-1',
    date: '2026-05-10',
    grnSivNo: 'GRN-101',
    receivedQty: 3000,
    balance: 3000,
    unitPrice: 850,
    remark: 'Consignment delivery from Cement factory',
    signature: 'K.A.'
  });
  seeds.push({
    id: 'seed-t1-2',
    materialId: 'mat-1',
    date: '2026-05-18',
    grnSivNo: 'SIV-045',
    issuedQty: 500,
    balance: 2500,
    unitPrice: 850,
    remark: 'Issued for Block-2 Foundation concrete casting',
    signature: 'M.F.'
  });

  // Seed for Fine Aggregates (mat-2, quantity: 450)
  seeds.push({
    id: 'seed-t2-1',
    materialId: 'mat-2',
    date: '2026-05-12',
    grnSivNo: 'GRN-104',
    receivedQty: 600,
    balance: 600,
    unitPrice: 1400,
    remark: 'Stockpile replenishment',
    signature: 'K.A.'
  });
  seeds.push({
    id: 'seed-t2-2',
    materialId: 'mat-2',
    date: '2026-05-19',
    grnSivNo: 'SIV-046',
    issuedQty: 150,
    balance: 450,
    unitPrice: 1400,
    remark: 'Paving blocks formulation production',
    signature: 'M.K.'
  });

  // Seed for Deformed Reinforcement Steel rebars (mat-3, quantity: 800)
  seeds.push({
    id: 'seed-t3-1',
    materialId: 'mat-3',
    date: '2026-05-14',
    grnSivNo: 'GRN-108',
    receivedQty: 1000,
    balance: 1000,
    unitPrice: 1200,
    remark: 'High-tensile Grade 60 batch intake',
    signature: 'T.S.'
  });
  seeds.push({
    id: 'seed-t3-2',
    materialId: 'mat-3',
    date: '2026-05-21',
    grnSivNo: 'SIV-048',
    issuedQty: 200,
    balance: 800,
    unitPrice: 1200,
    remark: 'Bending yard requisition',
    signature: 'M.F.'
  });

  // Seed for Granite Harer (mat-9)
  seeds.push({
    id: 'seed-t9-1',
    materialId: 'mat-9',
    date: '2024-07-04',
    grnSivNo: 'GRN-4411 (00018679)',
    receivedQty: 1.66,
    balance: 1.66,
    unitPrice: 1250,
    remark: 'Goods Receiving Note',
    signature: 'N.S.',
    plateNumber: ''
  });
  seeds.push({
    id: 'seed-t9-2',
    materialId: 'mat-9',
    date: '2024-07-15',
    grnSivNo: 'GRN-3444 (00018699)',
    receivedQty: 5.41,
    balance: 7.07,
    unitPrice: 1250,
    remark: 'Goods Receiving Note',
    signature: 'N.S.',
    plateNumber: ''
  });
  seeds.push({
    id: 'seed-t9-3',
    materialId: 'mat-9',
    date: '2024-10-04',
    grnSivNo: 'GRN-3864 (20111)',
    receivedQty: 1.25,
    balance: 8.32,
    unitPrice: 1250,
    remark: 'Goods Receiving Note',
    signature: 'N.S.',
    plateNumber: ''
  });
  seeds.push({
    id: 'seed-t9-4',
    materialId: 'mat-9',
    date: '2024-10-22',
    grnSivNo: 'GRN-4000 (20964)',
    receivedQty: 3.33,
    balance: 11.65,
    unitPrice: 1250,
    remark: 'Goods Receiving Note',
    signature: 'N.S.',
    plateNumber: '3-05554'
  });

  // Seeds for GYPSUM 25 KG FOR CHAK (mat-10) matching the GRV screenshot
  seeds.push({
    id: 'seed-gypsum-1',
    materialId: 'mat-10',
    date: '2026-06-04',
    grnSivNo: 'GRN-6218',
    receivedQty: 40,
    balance: 40,
    unitPrice: 350,
    remark: 'Goods Receiving Note - Gypsum',
    signature: 'E.A.',
    receivedBy: 'Endalkachew Amogne',
    supplierName: 'Yonatan BT plc',
    padReferenceNumber: '22315',
    qaStatus: 'Approved' // Representing "Checked (1)"
  });
  seeds.push({
    id: 'seed-gypsum-2',
    materialId: 'mat-10',
    date: '2026-06-04',
    grnSivNo: 'GRN-6219',
    receivedQty: 40,
    balance: 80,
    unitPrice: 350,
    remark: 'Goods Receiving Note - Gypsum',
    signature: 'E.A.',
    receivedBy: 'Endalkachew Amogne',
    supplierName: 'Yonatan BT plc',
    padReferenceNumber: '22316'
  });
  seeds.push({
    id: 'seed-gypsum-3',
    materialId: 'mat-10',
    date: '2026-06-04',
    grnSivNo: 'GRN-6220',
    receivedQty: 40,
    balance: 120,
    unitPrice: 350,
    remark: 'Goods Receiving Note - Gypsum',
    signature: 'E.A.',
    receivedBy: 'Endalkachew Amogne',
    supplierName: 'Yonatan BT plc',
    padReferenceNumber: '22317'
  });

  // For any other initial material, let's auto-generate a Beginning stock transaction
  INITIAL_MATERIALS.forEach(m => {
    if (!['mat-1', 'mat-2', 'mat-3', 'mat-9', 'mat-10'].includes(m.id)) {
      seeds.push({
        id: `seed-auto-${m.id}`,
        materialId: m.id,
        date: m.createdAt || '2026-05-22',
        grnSivNo: 'GRN-001',
        receivedQty: m.quantity,
        balance: m.quantity,
        unitPrice: m.unitPrice,
        remark: 'Beginning Balance / Initial Registration',
        signature: 'SYSTEM'
      });
    }
  });

  return seeds;
}

export default function App() {
  const { Sider, Content } = Layout;
  const [currentTab, setCurrentTab] = useState('Procurement');

  // Load stores from local storage or fallback to initial seed
  const [stores, setStores] = useState<Store[]>(() => {
    const saved = localStorage.getItem('condigital_stores');
    return saved ? JSON.parse(saved) : INITIAL_STORES;
  });

  // Load materials from local storage or fallback to initial seed
  const [materials, setMaterials] = useState<Material[]>(() => {
    const saved = localStorage.getItem('condigital_materials');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.some((m: any) => m.id === 'mat-10')) {
        const item = INITIAL_MATERIALS.find(m => m.id === 'mat-10');
        if (item) parsed.push(item);
      }
      return parsed;
    }
    return INITIAL_MATERIALS;
  });

  // Load system registration users
  const [users, setUsers] = useState<SystemUser[]>(() => {
    const saved = localStorage.getItem('condigital_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  // Load suppliers registered
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('condigital_suppliers');
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
  });

  // Load purchase requisitions
  const [purchaseRequisitions, setPurchaseRequisitions] = useState<PurchaseRequisition[]>(() => {
    const saved = localStorage.getItem('condigital_prs');
    return saved ? JSON.parse(saved) : INITIAL_PRS;
  });

  // Load purchase evaluations supplier comparisons
  const [evaluations, setEvaluations] = useState<PurchaseEvaluation[]>(() => {
    const saved = localStorage.getItem('condigital_evaluations');
    return saved ? JSON.parse(saved) : INITIAL_EVALUATIONS;
  });

  // Load purchase orders
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem('condigital_purchase_orders');
    return saved ? JSON.parse(saved) : INITIAL_POS;
  });

  // Load inter-store transfers
  const [transfers, setTransfers] = useState<InterStoreTransfer[]>(() => {
    const saved = localStorage.getItem('condigital_transfers');
    return saved ? JSON.parse(saved) : INITIAL_TRANSFERS;
  });


  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
  const [storeSearchQuery, setStoreSearchQuery] = useState('');
  const [materialSearchQuery, setMaterialSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [materialStartDate, setMaterialStartDate] = useState<string>('');
  const [materialEndDate, setMaterialEndDate] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<string>('Material');
  const [isGrvMode, setIsGrvMode] = useState<boolean>(false);
  const [isSivMode, setIsSivMode] = useState<boolean>(false);

  // Lifted ISTV Requests state
  const [istvRequests, setIstvRequests] = useState<any[]>(() => {
    const saved = localStorage.getItem('condigital_istv_requests');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'req-1',
        code: 'REQ-1082',
        requisitionNo: 'MR-1082',
        materialId: 'mat-1',
        quantity: 45,
        fromStoreId: 'store-1',
        toStoreId: 'store-2',
        date: '2026-06-03',
        status: 'Pending',
        type: 'Via SIV',
        sivNo: 'SIV-045'
      },
      {
        id: 'req-3',
        code: 'REQ-3310',
        requisitionNo: 'MR-3310',
        materialId: 'mat-3',
        quantity: 30,
        fromStoreId: 'store-2',
        toStoreId: 'store-1',
        date: '2026-06-08',
        status: 'Converted',
        type: 'Via SIV',
        sivNo: 'SIV-048'
      }
    ];
  });

  // Keep istvRequests in localStorage updated
  useEffect(() => {
    localStorage.setItem('condigital_istv_requests', JSON.stringify(istvRequests));
  }, [istvRequests]);

  // SIV to ISTV conversion states
  const [convertingSiv, setConvertingSiv] = useState<any | null>(null);
  const [conversionToStoreId, setConversionToStoreId] = useState<string>('');

  // SIV detail preview states
  const [selectedSivForView, setSelectedSivForView] = useState<any | null>(null);
  const [isSivDetailOpen, setIsSivDetailOpen] = useState<boolean>(false);

  // Modals state
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);
  const [isGRVOpen, setIsGRVOpen] = useState(false);
  const [isSIVOpen, setIsSIVOpen] = useState(false);

  // Active Bin Card modal state
  const [isBinCardOpen, setIsBinCardOpen] = useState(false);
  const [activeBinCardMaterial, setActiveBinCardMaterial] = useState<Material | null>(null);

  // Load bin card transactions from localStorage or fallback to default seed
  const [binTransactions, setBinTransactions] = useState<BinCardTransaction[]>(() => {
    const saved = localStorage.getItem('condigital_bin_transactions');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.some((t: any) => t.id === 'seed-gypsum-1')) {
        const defaultTxs = generateDefaultTransactions();
        const gypsumTxs = defaultTxs.filter(t => t.id.startsWith('seed-gypsum-'));
        parsed.push(...gypsumTxs);
      }
      return parsed;
    }
    return generateDefaultTransactions();
  });

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('condigital_stores', JSON.stringify(stores));
  }, [stores]);

  useEffect(() => {
    localStorage.setItem('condigital_materials', JSON.stringify(materials));
  }, [materials]);

  useEffect(() => {
    localStorage.setItem('condigital_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('condigital_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('condigital_prs', JSON.stringify(purchaseRequisitions));
  }, [purchaseRequisitions]);

  useEffect(() => {
    localStorage.setItem('condigital_evaluations', JSON.stringify(evaluations));
  }, [evaluations]);

  useEffect(() => {
    localStorage.setItem('condigital_purchase_orders', JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  useEffect(() => {
    localStorage.setItem('condigital_bin_transactions', JSON.stringify(binTransactions));
  }, [binTransactions]);

  useEffect(() => {
    localStorage.setItem('condigital_transfers', JSON.stringify(transfers));
  }, [transfers]);


  // Synchronize Header sub-tabs selection with the Store filter state
  const handleSubTabChange = (tabName: string) => {
    setActiveSubTab(tabName);
    if (tabName === 'Material') {
      setSelectedStoreId('all');
    } else if (tabName === 'Store') {
      if (stores.length > 0) {
        // Keeps current selection if already a store, otherwise selects the first one
        if (selectedStoreId === 'all') {
          setSelectedStoreId(stores[0].id);
        }
      } else {
        setSelectedStoreId('all');
      }
    }
  };

  // Synchronize store selections to reflect active sub tabs
  useEffect(() => {
    if (selectedStoreId === 'all') {
      setActiveSubTab('Material');
    } else {
      setActiveSubTab('Store');
    }
  }, [selectedStoreId]);

  // Handle store actions
  const handleSaveStore = (storeData: Omit<Store, 'id' | 'createdAt'> & { id?: string }) => {
    if (storeData.id) {
      // Editing existing store
      setStores(prev => prev.map(s => s.id === storeData.id ? { 
        ...s, 
        name: storeData.name,
        city: storeData.city,
        wereda: storeData.wereda,
        type: storeData.type
      } : s));
    } else {
      // Add new store
      const newStore: Store = {
        id: `store-${Date.now()}`,
        name: storeData.name,
        city: storeData.city,
        wereda: storeData.wereda,
        type: storeData.type,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setStores(prev => [...prev, newStore]);
      // Auto-select newly created store
      setSelectedStoreId(newStore.id);
    }
  };

  const handleDeleteStore = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}? All materials loaded under this store will also be deleted to maintain dataset logic integrity.`)) {
      setStores(prev => prev.filter(s => s.id !== id));
      setMaterials(prev => prev.filter(m => m.storeId !== id));
      if (selectedStoreId === id) {
        setSelectedStoreId('all');
      }
    }
  };

  // Handle material actions
  const handleSaveMaterial = (materialData: Omit<Material, 'id' | 'createdAt'> & { id?: string }) => {
    if (materialData.id) {
      // Editing existing material
      setMaterials(prev => prev.map(m => m.id === materialData.id ? {
        ...m,
        code: materialData.code,
        category: materialData.category,
        description: materialData.description,
        unit: materialData.unit,
        quantity: materialData.quantity,
        unitPrice: materialData.unitPrice,
        storeId: materialData.storeId,
        minimumStock: materialData.minimumStock,
        maximumStock: materialData.maximumStock
      } : m));
    } else {
      // Add new material
      const newMatId = `mat-${Date.now()}`;
      const newMaterial: Material = {
        id: newMatId,
        code: materialData.code,
        category: materialData.category,
        description: materialData.description,
        unit: materialData.unit,
        quantity: materialData.quantity,
        unitPrice: materialData.unitPrice,
        storeId: materialData.storeId,
        createdAt: new Date().toISOString().split('T')[0],
        minimumStock: materialData.minimumStock ?? 50,
        maximumStock: materialData.maximumStock ?? 1000
      };
      setMaterials(prev => [...prev, newMaterial]);

      // Seed starting transaction for a pristine ledger record
      const startTx: BinCardTransaction = {
        id: `tx-init-${Date.now()}`,
        materialId: newMatId,
        date: newMaterial.createdAt,
        grnSivNo: 'GRN-001',
        receivedQty: newMaterial.quantity,
        balance: newMaterial.quantity,
        unitPrice: newMaterial.unitPrice,
        remark: 'Opening stock count upon system registration',
        signature: 'SYSTEM'
      };
      setBinTransactions(prev => [...prev, startTx]);
    }
  };

  const handleDeleteMaterial = (id: string, description: string) => {
    if (window.confirm(`Are you sure you want to remove "${description}" from registration?`)) {
      setMaterials(prev => prev.filter(m => m.id !== id));
      setBinTransactions(prev => prev.filter(t => t.materialId !== id));
    }
  };

  const handleAddBinTransaction = (newTxData: Omit<BinCardTransaction, 'id' | 'materialId'>) => {
    if (!activeBinCardMaterial) return;

    const materialId = activeBinCardMaterial.id;
    // For direct manual ledger postings, we pre-approve them by default so they are immediate inbound transactions
    const qaApprovedById = newTxData.receivedQty !== undefined ? 'usr-7' : undefined;

    setBinTransactions(prevTxs => {
      const updatedTxs = [...prevTxs];

      const newTx: BinCardTransaction = {
        id: `tx-${Date.now()}`,
        materialId,
        date: newTxData.date,
        grnSivNo: newTxData.grnSivNo,
        receivedQty: newTxData.receivedQty,
        issuedQty: newTxData.issuedQty,
        returnedQty: newTxData.returnedQty,
        transferredQty: newTxData.transferredQty,
        plateNumber: newTxData.plateNumber,
        balance: 0, // calculated dynamically below
        unitPrice: newTxData.unitPrice,
        remark: newTxData.remark,
        signature: newTxData.signature,
        qaApprovedById: qaApprovedById
      };

      updatedTxs.push(newTx);

      // Recompute rolling balance for this material
      const materialTxs = updatedTxs.filter(t => t.materialId === materialId).sort((a, b) => a.date.localeCompare(b.date));
      let rolling = 0;
      const recomputed = materialTxs.map(t => {
        let delta = 0;
        const approved = t.receivedQty === undefined || t.id.startsWith('seed-') || !!t.qaApprovedById;
        if (approved) {
          if (t.receivedQty !== undefined) delta = t.receivedQty;
          else if (t.returnedQty !== undefined) delta = t.returnedQty;
          else if (t.issuedQty !== undefined) delta = -t.issuedQty;
          else if (t.transferredQty !== undefined) delta = -t.transferredQty;
        } else {
          if (t.returnedQty !== undefined) delta = t.returnedQty;
          else if (t.issuedQty !== undefined) delta = -t.issuedQty;
          else if (t.transferredQty !== undefined) delta = -t.transferredQty;
        }
        rolling += delta;
        return { ...t, balance: rolling };
      });

      // Update materials table
      setMaterials(prevMats => prevMats.map(m => m.id === materialId ? {
        ...m,
        quantity: rolling,
        unitPrice: newTxData.unitPrice
      } : m));

      // Update active bin card Modal view
      setActiveBinCardMaterial(prevMat => prevMat ? {
        ...prevMat,
        quantity: rolling,
        unitPrice: newTxData.unitPrice
      } : null);

      const otherTxs = updatedTxs.filter(t => t.materialId !== materialId);
      return [...otherTxs, ...recomputed].sort((a, b) => a.date.localeCompare(b.date));
    });
  };

  const handleSaveVouchers = (voucherTransactions: { materialId: string; tx: Omit<BinCardTransaction, 'id' | 'materialId'> }[]) => {
    setBinTransactions(prev => {
      let updatedTxs = [...prev];
      const materialIdsToRecompute = new Set<string>();

      voucherTransactions.forEach(({ materialId, tx }) => {
        materialIdsToRecompute.add(materialId);

        const newTx: BinCardTransaction = {
          id: `tx-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          materialId,
          date: tx.date,
          grnSivNo: tx.grnSivNo,
          receivedQty: tx.receivedQty,
          issuedQty: tx.issuedQty,
          returnedQty: tx.returnedQty,
          transferredQty: tx.transferredQty,
          plateNumber: tx.plateNumber,
          balance: 0, // will be computed dynamically below
          unitPrice: tx.unitPrice,
          remark: tx.remark,
          signature: tx.signature,
          checkedById: tx.checkedById,
          approvedById: tx.approvedById,
          qaApprovedById: tx.qaApprovedById
        };

        updatedTxs.push(newTx);
      });

      // Recalculate rolling balances for all affected materials list
      let updatedMaterials = [...materials];

      materialIdsToRecompute.forEach(materialId => {
        const materialTxs = updatedTxs.filter(t => t.materialId === materialId).sort((a, b) => a.date.localeCompare(b.date));
        let rolling = 0;
        const recomputed = materialTxs.map(t => {
          let delta = 0;
          const approved = t.receivedQty === undefined || t.id.startsWith('seed-') || !!t.qaApprovedById;
          if (approved) {
            if (t.receivedQty !== undefined) delta = t.receivedQty;
            else if (t.returnedQty !== undefined) delta = t.returnedQty;
            else if (t.issuedQty !== undefined) delta = -t.issuedQty;
            else if (t.transferredQty !== undefined) delta = -t.transferredQty;
          } else {
            if (t.returnedQty !== undefined) delta = t.returnedQty;
            else if (t.issuedQty !== undefined) delta = -t.issuedQty;
            else if (t.transferredQty !== undefined) delta = -t.transferredQty;
          }
          rolling += delta;
          return { ...t, balance: rolling };
        });

        // Replace these recomputed transactions in our list
        updatedTxs = [
          ...updatedTxs.filter(t => t.materialId !== materialId),
          ...recomputed
        ];

        // Update materials quantity in memory
        updatedMaterials = updatedMaterials.map(m => m.id === materialId ? {
          ...m,
          quantity: rolling,
          unitPrice: voucherTransactions.find(vt => vt.materialId === materialId)?.tx.unitPrice || m.unitPrice
        } : m);
      });

      setMaterials(updatedMaterials);
      return updatedTxs.sort((a, b) => a.date.localeCompare(b.date));
    });
  };

  const handleConfirmSivConversion = () => {
    if (!convertingSiv) return;
    if (!conversionToStoreId) {
      alert('Please specify the recipient yard (To Store) for the transfer.');
      return;
    }
    const mat = materials.find(m => m.id === convertingSiv.materialId);
    const rNo = `MR-${Math.floor(1000 + Math.random() * 9000)}`;
    const newReq = {
      id: `req-siv-${convertingSiv.id}`,
      code: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
      requisitionNo: rNo,
      materialId: convertingSiv.materialId,
      quantity: convertingSiv.issuedQty || 0,
      fromStoreId: mat?.storeId || 'store-1',
      toStoreId: conversionToStoreId,
      date: new Date().toISOString().split('T')[0],
      status: 'Pending',
      type: 'Via SIV',
      sivNo: convertingSiv.grnSivNo
    };

    setIstvRequests(prev => [newReq, ...prev]);
    setConvertingSiv(null);
    setConversionToStoreId('');

    // Redirect user to Inter-Store Transfer tab
    setActiveSubTab('Inter-Store Transfer');
    
    Modal.success({
      title: 'SIV to ISTVR Conversion Successful',
      content: `Voucher SIV ${convertingSiv.grnSivNo} has been successfully converted to an Inter-Store Transfer Request under Requisition ${rNo}. You have been redirected to the transfer pipeline!`,
    });
  };

  const handleDeleteBinTransaction = (txId: string) => {
    const txToDelete = binTransactions.find(t => t.id === txId);
    if (!txToDelete) return;

    const materialId = txToDelete.materialId;

    setBinTransactions(prev => {
      const updated = prev.filter(t => t.id !== txId);
      const materialTxs = updated.filter(t => t.materialId === materialId).sort((a, b) => a.date.localeCompare(b.date));
      
      let rolling = 0;
      const recomputed = materialTxs.map(t => {
        let delta = 0;
        const approved = t.receivedQty === undefined || t.id.startsWith('seed-') || !!t.qaApprovedById;
        if (approved) {
          if (t.receivedQty !== undefined) delta = t.receivedQty;
          else if (t.returnedQty !== undefined) delta = t.returnedQty;
          else if (t.issuedQty !== undefined) delta = -t.issuedQty;
          else if (t.transferredQty !== undefined) delta = -t.transferredQty;
        } else {
          if (t.returnedQty !== undefined) delta = t.returnedQty;
          else if (t.issuedQty !== undefined) delta = -t.issuedQty;
          else if (t.transferredQty !== undefined) delta = -t.transferredQty;
        }
        rolling += delta;
        return { ...t, balance: rolling };
      });

      setMaterials(prevMats => prevMats.map(m => m.id === materialId ? {
        ...m,
        quantity: rolling
      } : m));

      setActiveBinCardMaterial(prevMat => prevMat ? {
        ...prevMat,
        quantity: rolling
      } : null);

      const otherTxs = updated.filter(t => t.materialId !== materialId);
      return [...otherTxs, ...recomputed].sort((a, b) => a.date.localeCompare(b.date));
    });
  };

  const handleUpdateBinTransaction = (updatedTx: BinCardTransaction) => {
    const materialId = updatedTx.materialId;

    setBinTransactions(prev => {
      const exists = prev.some(t => t.id === updatedTx.id);
      const updated = exists 
        ? prev.map(t => t.id === updatedTx.id ? updatedTx : t)
        : [...prev, updatedTx];
      const materialTxs = updated.filter(t => t.materialId === materialId).sort((a, b) => a.date.localeCompare(b.date));
      
      let rolling = 0;
      const recomputed = materialTxs.map(t => {
        let delta = 0;
        const approved = t.receivedQty === undefined || t.id.startsWith('seed-') || !!t.qaApprovedById;
        if (approved) {
          if (t.receivedQty !== undefined) delta = t.receivedQty;
          else if (t.returnedQty !== undefined) delta = t.returnedQty;
          else if (t.issuedQty !== undefined) delta = -t.issuedQty;
          else if (t.transferredQty !== undefined) delta = -t.transferredQty;
        } else {
          if (t.returnedQty !== undefined) delta = t.returnedQty;
          else if (t.issuedQty !== undefined) delta = -t.issuedQty;
          else if (t.transferredQty !== undefined) delta = -t.transferredQty;
        }
        rolling += delta;
        return { ...t, balance: rolling };
      });

      setMaterials(prevMats => prevMats.map(m => m.id === materialId ? {
        ...m,
        quantity: rolling
      } : m));

      setActiveBinCardMaterial(prevMat => prevMat ? {
        ...prevMat,
        quantity: rolling
      } : null);

      const otherTxs = updated.filter(t => t.materialId !== materialId);
      return [...otherTxs, ...recomputed].sort((a, b) => a.date.localeCompare(b.date));
    });
  };

  const handleUpdateMaterialSignoffs = (
    materialId: string, 
    preparedById?: string, 
    checkedById?: string, 
    approvedById?: string
  ) => {
    setMaterials(prev => prev.map(m => m.id === materialId ? {
      ...m,
      preparedById: preparedById || undefined,
      checkedById: checkedById || undefined,
      approvedById: approvedById || undefined
    } : m));

    // Update active modal material parameters structure to reflect in UI
    setActiveBinCardMaterial(prev => {
      if (prev && prev.id === materialId) {
        return {
          ...prev,
          preparedById,
          checkedById,
          approvedById
        };
      }
      return prev;
    });
  };

  const handleAddUser = (name: string, role: SystemUser['role'], initials: string, email: string) => {
    const newUser: SystemUser = {
      id: `usr-${Date.now()}`,
      name,
      role,
      initials: initials.toUpperCase(),
      email
    };
    setUsers(prev => [...prev, newUser]);
  };

  // Purchase evaluation handlers
  const handleSaveEvaluation = (savedEvaluation: PurchaseEvaluation) => {
    setEvaluations(prev => {
      const exists = prev.some(b => b.id === savedEvaluation.id);
      if (exists) {
        return prev.map(b => b.id === savedEvaluation.id ? savedEvaluation : b);
      } else {
        return [...prev, savedEvaluation];
      }
    });
  };

  const handleDeleteEvaluation = (evaluationId: string) => {
    setEvaluations(prev => prev.filter(b => b.id !== evaluationId));
  };

  // Purchase order handlers
  const handleSavePurchaseOrder = (savedPo: PurchaseOrder) => {
    setPurchaseOrders(prev => {
      const exists = prev.some(p => p.id === savedPo.id);
      if (exists) {
        return prev.map(p => p.id === savedPo.id ? savedPo : p);
      } else {
        return [...prev, savedPo];
      }
    });
  };

  const handleDeletePurchaseOrder = (poId: string) => {
    setPurchaseOrders(prev => prev.filter(p => p.id !== poId));
  };

  // Supplier registry handlers
  const handleSaveSupplier = (supData: { name: string; phone?: string; address?: string; email?: string; tin?: string; }) => {
    const newSup: Supplier = {
      id: `sup-${Date.now()}`,
      name: supData.name,
      phone: supData.phone,
      address: supData.address,
      email: supData.email,
      tin: supData.tin,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setSuppliers(prev => [...prev, newSup]);
  };

  const handleDeleteSupplier = (supId: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== supId));
  };

  // Inter-store transfer handlers
  const handleSaveTransfer = (savedTransfer: InterStoreTransfer) => {
    setTransfers(prev => {
      const exists = prev.some(t => t.id === savedTransfer.id);
      if (exists) {
        return prev.map(t => t.id === savedTransfer.id ? savedTransfer : t);
      } else {
        return [...prev, savedTransfer];
      }
    });

    if (savedTransfer.status === 'Completed') {
      const fromStoreObj = stores.find(s => s.id === savedTransfer.fromStoreId);
      const toStoreObj = stores.find(s => s.id === savedTransfer.toStoreId);
      const fromStoreName = fromStoreObj ? fromStoreObj.name : 'Origin Stockyard';
      const toStoreName = toStoreObj ? toStoreObj.name : 'Recipient Stockyard';

      setBinTransactions(prevTxs => {
        let updatedTxs = [...prevTxs];
        let updatedMaterials = [...materials];

        savedTransfer.items.forEach(item => {
          const sourceMat = updatedMaterials.find(m => m.id === item.materialId);
          if (!sourceMat) return;

          // Outbound transaction for From Store
          const outboundTx: BinCardTransaction = {
            id: `tx-out-${savedTransfer.transferNo}-${item.id}`,
            materialId: item.materialId,
            date: savedTransfer.date,
            grnSivNo: savedTransfer.transferNo,
            transferredQty: item.quantity,
            balance: 0,
            unitPrice: item.unitPrice,
            remark: `Inter-store transfer dispatched to "${toStoreName}" | Requisition: ${savedTransfer.requisitionNo}`,
            signature: users.find(u => u.id === savedTransfer.issuedById)?.initials || 'SK'
          };
          updatedTxs.push(outboundTx);

          // Find or create in memory matching material for To Store
          let destMat = updatedMaterials.find(m => m.storeId === savedTransfer.toStoreId && m.code === sourceMat.code);
          if (!destMat) {
            const newMatId = `mat-autogen-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            destMat = {
              id: newMatId,
              code: sourceMat.code,
              category: sourceMat.category,
              description: sourceMat.description,
              unit: sourceMat.unit,
              quantity: 0,
              unitPrice: item.unitPrice,
              storeId: savedTransfer.toStoreId,
              createdAt: savedTransfer.date,
              minimumStock: sourceMat.minimumStock || 25,
              maximumStock: sourceMat.maximumStock || 500
            };
            updatedMaterials.push(destMat);
          }

          // Inbound transaction for To Store
          const inboundTx: BinCardTransaction = {
            id: `tx-in-${savedTransfer.transferNo}-${item.id}`,
            materialId: destMat.id,
            date: savedTransfer.date,
            grnSivNo: savedTransfer.transferNo,
            receivedQty: item.quantity,
            balance: 0,
            unitPrice: item.unitPrice,
            remark: `Inter-store transfer received from "${fromStoreName}" | Requisition: ${savedTransfer.requisitionNo}`,
            signature: users.find(u => u.id === savedTransfer.issuedById)?.initials || 'SK',
            qaApprovedById: 'usr-7'
          };
          updatedTxs.push(inboundTx);
        });

        // Recompute materials list and balance parameters
        const modifiedMaterialIds = new Set(savedTransfer.items.map(i => i.materialId));
        savedTransfer.items.forEach(item => {
          const sourceMat = materials.find(m => m.id === item.materialId);
          if (sourceMat) {
            const destMat = updatedMaterials.find(m => m.storeId === savedTransfer.toStoreId && m.code === sourceMat.code);
            if (destMat) {
              modifiedMaterialIds.add(destMat.id);
            }
          }
        });

        modifiedMaterialIds.forEach(mId => {
          const materialTxs = updatedTxs.filter(t => t.materialId === mId).sort((a, b) => a.date.localeCompare(b.date));
          let rolling = 0;
          const recomputed = materialTxs.map(t => {
            let delta = 0;
            const approved = t.receivedQty === undefined || t.id.startsWith('seed-') || !!t.qaApprovedById;
            if (approved) {
              if (t.receivedQty !== undefined) delta = t.receivedQty;
              else if (t.returnedQty !== undefined) delta = t.returnedQty;
              else if (t.issuedQty !== undefined) delta = -t.issuedQty;
              else if (t.transferredQty !== undefined) delta = -t.transferredQty;
            } else {
              if (t.returnedQty !== undefined) delta = t.returnedQty;
              else if (t.issuedQty !== undefined) delta = -t.issuedQty;
              else if (t.transferredQty !== undefined) delta = -t.transferredQty;
            }
            rolling += delta;
            return { ...t, balance: rolling };
          });

          updatedTxs = [
            ...updatedTxs.filter(t => t.materialId !== mId),
            ...recomputed
          ];

          updatedMaterials = updatedMaterials.map(m => m.id === mId ? { ...m, quantity: rolling } : m);
        });

        setMaterials(updatedMaterials);
        return updatedTxs.sort((a, b) => a.date.localeCompare(b.date));
      });
    }
  };

  const handleDeleteTransfer = (transferId: string) => {
    setTransfers(prev => prev.filter(t => t.id !== transferId));
  };

  // Safe data reset to default demo data
  const handleResetData = () => {
    if (window.confirm('Would you like to reset the dashboard database to the official ConDigital demo template (stores & materials)?')) {
      setStores(INITIAL_STORES);
      setMaterials(INITIAL_MATERIALS);
      setUsers(INITIAL_USERS);
      setSuppliers(INITIAL_SUPPLIERS);
      setPurchaseRequisitions(INITIAL_PRS);
      setEvaluations(INITIAL_EVALUATIONS);
      setPurchaseOrders(INITIAL_POS);
      setTransfers(INITIAL_TRANSFERS);
      setBinTransactions(generateDefaultTransactions());
      setSelectedStoreId('all');
      setStoreSearchQuery('');
      setMaterialSearchQuery('');
      setSelectedCategory('all');
      setActiveSubTab('Material');
    }
  };


  // Filter stores for left sidebar list
  const filteredStores = stores.filter(store => {
    const q = storeSearchQuery.toLowerCase();
    return (
      store.name.toLowerCase().includes(q) ||
      store.city.toLowerCase().includes(q) ||
      store.wereda.toLowerCase().includes(q) ||
      store.type.toLowerCase().includes(q)
    );
  });

  // Filter materials for main dashboard grid/table list
  const filteredMaterials = materials.filter(material => {
    // 1. Filter by active store (unless 'Show All' is active)
    if (selectedStoreId !== 'all' && material.storeId !== selectedStoreId) {
      return false;
    }

    // 2. Filter by Category dropdown search
    if (selectedCategory !== 'all' && material.category !== selectedCategory) {
      return false;
    }

    // 3. Filter by date-range
    if (materialStartDate && material.createdAt < materialStartDate) {
      return false;
    }
    if (materialEndDate && material.createdAt > materialEndDate) {
      return false;
    }

    // 4. Search query filter
    const q = materialSearchQuery.toLowerCase();
    const storeObj = stores.find(s => s.id === material.storeId);
    const storeLabel = storeObj ? storeObj.name.toLowerCase() : '';
    
    return (
      material.code.toLowerCase().includes(q) ||
      material.description.toLowerCase().includes(q) ||
      material.unit.toLowerCase().includes(q) ||
      material.category.toLowerCase().includes(q) ||
      storeLabel.includes(q)
    );
  });

  // Filter and sort GRVs for the Good Received Voucher visual view
  const activeGrvs = binTransactions.filter(t => {
    return t.receivedQty !== undefined && t.receivedQty > 0 && t.grnSivNo.startsWith('GRN');
  });

  const filteredGrvs = activeGrvs.filter(t => {
    const material = materials.find(m => m.id === t.materialId);
    const itemDesc = material ? material.description : '';
    const code = t.grnSivNo || '';
    const supplier = t.supplierName || 'Yonatan BT plc';
    const received = t.receivedBy || 'Endalkachew Amogne';
    const q = materialSearchQuery.toLowerCase().trim();

    const matchesSearch = 
      code.toLowerCase().includes(q) ||
      itemDesc.toLowerCase().includes(q) ||
      supplier.toLowerCase().includes(q) ||
      received.toLowerCase().includes(q) ||
      (t.padReferenceNumber || '').includes(q);

    const matchesStore = selectedStoreId === 'all' || (material && material.storeId === selectedStoreId);

    let matchesDate = true;
    if (materialStartDate && t.date < materialStartDate) matchesDate = false;
    if (materialEndDate && t.date > materialEndDate) matchesDate = false;

    return matchesSearch && matchesStore && matchesDate;
  }).sort((a, b) => b.grnSivNo.localeCompare(a.grnSivNo));

  // Filter and sort SIVs for the Store Issue Voucher visual view
  const activeSivs = binTransactions.filter(t => {
    return t.issuedQty !== undefined && t.issuedQty > 0 && t.grnSivNo && t.grnSivNo.startsWith('SIV');
  });

  const filteredSivs = activeSivs.filter(t => {
    const material = materials.find(m => m.id === t.materialId);
    const itemDesc = material ? material.description : '';
    const code = t.grnSivNo || '';
    const issuedTo = t.remark?.includes('Issued to') ? t.remark.split('Issued to')[1].trim() : 'Project Site Workforce';
    const q = materialSearchQuery.toLowerCase().trim();

    const matchesSearch = 
      code.toLowerCase().includes(q) ||
      itemDesc.toLowerCase().includes(q) ||
      issuedTo.toLowerCase().includes(q);

    const matchesStore = selectedStoreId === 'all' || (material && material.storeId === selectedStoreId);

    let matchesDate = true;
    if (materialStartDate && t.date < materialStartDate) matchesDate = false;
    if (materialEndDate && t.date > materialEndDate) matchesDate = false;

    return matchesSearch && matchesStore && matchesDate;
  }).sort((a, b) => b.grnSivNo.localeCompare(a.grnSivNo));

  const activeStore = stores.find(s => s.id === selectedStoreId) || null;

  // Render a visual category icon
  const renderCategoryIcon = (cat: MaterialCategory) => {
    switch (cat) {
      case 'Construction Material':
        return <Boxes size={14} className="text-blue-600" />;
      case 'Construction Equipment':
        return <HardHat size={14} className="text-emerald-600" />;
      case 'Vehicle':
        return <Truck size={14} className="text-indigo-600" />;
      case 'Fixed Asset':
        return <Monitor size={14} className="text-orange-600" />;
      default:
        return <Package size={14} className="text-slate-500" />;
    }
  };

  // Helper count of materials in a store
  const getMaterialCountForStore = (storeId: string) => {
    return materials.filter(m => m.storeId === storeId).length;
  };

  const materialTableColumns = [
    {
      title: 'Item Code',
      dataIndex: 'code',
      key: 'code',
      className: 'font-mono font-semibold text-slate-700 text-xs',
      render: (text: string) => text,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text: string, record: Material) => {
        const hasGrv = binTransactions.some(t => {
          return t.materialId === record.id && 
                 t.grnSivNo.startsWith('GRN') && 
                 t.receivedQty !== undefined && 
                 t.receivedQty > 0 &&
                 t.grnSivNo !== 'GRN-001';
        });
        return (
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-slate-800 hover:text-[#033096] hover:underline leading-snug transition-colors">
                {text}
              </span>
              {hasGrv && (
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-bold text-[9px] px-1.5 py-0.5 shadow-3xs uppercase tracking-wider inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  GRV Inbound
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
              <svg className="w-3 h-3 text-[#033096]/60 inline animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>Open Ledger Card ({record.quantity} {record.unit} in stock)</span>
            </span>
          </div>
        );
      },
    },
    {
      title: 'Item Category',
      dataIndex: 'category',
      key: 'category',
      className: 'text-xs font-semibold text-slate-705',
    },
    {
      title: 'Sub Category',
      key: 'subCategory',
      className: 'text-xs text-slate-500',
      render: (record: Material) => record.subCategory || record.remarks || '-',
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit',
      className: 'text-xs text-slate-600 font-medium',
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center' as const,
      render: (_: unknown, record: Material) => {
        const actionMenuItems = [
          {
            key: 'edit',
            label: 'Edit',
            icon: <EditOutlined />,
            onClick: () => {
              setEditingMaterial(record);
              setIsMaterialModalOpen(true);
            }
          },
          {
            key: 'delete',
            label: 'Delete',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => handleDeleteMaterial(record.id, record.description)
          }
        ];
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Dropdown menu={{ items: actionMenuItems }} trigger={['click']}>
              <Button 
                type="text" 
                icon={<MoreOutlined style={{ fontSize: '18px', fontWeight: 'bold' }} />} 
                className="hover:bg-slate-100 rounded-full flex items-center justify-center p-1.5"
              />
            </Dropdown>
          </div>
        );
      }
    }
  ];

  const grvTableColumns = [
    {
      title: 'Date',
      key: 'date',
      width: 100,
      className: 'font-semibold text-slate-700 text-xs',
      render: (record: BinCardTransaction) => dayjs(record.date).format('DD/MM/YYYY'),
    },
    {
      title: 'GRN',
      dataIndex: 'grnSivNo',
      key: 'grnSivNo',
      width: 110,
      className: 'font-mono font-bold text-slate-800 text-xs',
    },
    {
      title: 'Received By',
      key: 'receivedBy',
      width: 160,
      className: 'text-xs font-semibold text-slate-700',
      render: (record: BinCardTransaction) => record.receivedBy || 'Endalkachew Amogne',
    },
    {
      title: 'Supplier',
      key: 'supplierName',
      width: 160,
      className: 'text-xs text-slate-705 font-semibold',
      render: (record: BinCardTransaction) => record.supplierName || 'Yonatan BT plc',
    },
    {
      title: 'Pad Reference Number',
      key: 'padReferenceNumber',
      width: 140,
      className: 'text-xs text-slate-605 font-mono font-semibold',
      render: (record: BinCardTransaction) => record.padReferenceNumber || '22315',
    },
    {
      title: 'Items',
      key: 'items',
      width: 220,
      className: 'text-xs font-bold text-slate-800',
      render: (record: BinCardTransaction) => {
        const material = materials.find(m => m.id === record.materialId);
        return material ? material.description : 'GYPSUM 25 KG FOR CHAK';
      },
    },
    {
      title: 'Share',
      key: 'share',
      width: 100,
      align: 'center' as const,
      render: () => (
        <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
          <Button 
            type="default"
            size="small"
            className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-205 hover:bg-slate-50 hover:border-slate-350 text-slate-755 text-xs font-bold rounded-lg cursor-pointer transition shadow-3xs"
            icon={<ShareAltOutlined style={{ fontSize: '11px' }} />}
          >
            Share
          </Button>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 150,
      render: (record: BinCardTransaction) => {
        if (record.grnSivNo === 'GRN-6218' || record.qaStatus === 'Approved') {
          return (
            <div className="flex items-center gap-1.5 flex-wrap animate-fade">
              <Tag color="success" className="font-bold text-[10px] m-0 border border-emerald-250 py-0.5 px-2">
                Checked (1)
              </Tag>
              <Tag color="warning" className="font-bold text-[10px] m-0 border border-amber-250 py-0.5 px-2">
                Pending (1)
              </Tag>
            </div>
          );
        }
        return (
          <Tag color="warning" className="font-bold text-[10px] m-0 border border-amber-250 py-0.5 px-2">
            Pending (1)
          </Tag>
        );
      },
    },
    {
      title: 'Action',
      key: 'action',
      width: 180,
      align: 'center' as const,
      render: (_: unknown, record: BinCardTransaction) => {
        const isRow3 = record.grnSivNo === 'GRN-6218';
        return (
          <div className="flex items-center gap-1 justify-center" onClick={e => e.stopPropagation()}>
            <Tooltip title="View GRV Document">
              <Button
                type="text"
                shape="circle"
                size="small"
                icon={<EyeOutlined style={{ fontSize: '14px', color: '#1e293b' }} />}
              />
            </Tooltip>
            <Tooltip title="Modify Receipt Details">
              <Button
                type="text"
                shape="circle"
                size="small"
                icon={<EditOutlined style={{ fontSize: '14px', color: '#2563eb' }} />}
              />
            </Tooltip>
            <Tooltip title="Voucher validation QA review">
              <Button
                type="text"
                shape="circle"
                size="small"
                icon={<EditOutlined style={{ fontSize: '14px', color: '#033096' }} />}
              />
            </Tooltip>
            {isRow3 ? (
              <Tooltip title="Revert/Sync transaction">
                <Button
                  type="text"
                  shape="circle"
                  size="small"
                  icon={<SyncOutlined className="text-red-500 hover:rotate-45" style={{ fontSize: '13px' }} />}
                />
              </Tooltip>
            ) : (
              <Tooltip title="Delete entry">
                <Button
                  type="text"
                  shape="circle"
                  size="small"
                  danger
                  icon={<DeleteOutlined style={{ fontSize: '14px' }} />}
                />
              </Tooltip>
            )}
          </div>
        );
      }
    }
  ];

  const sivTableColumns = [
    {
      title: 'Date',
      key: 'date',
      width: 100,
      className: 'font-semibold text-slate-700 text-xs',
      render: (record: BinCardTransaction) => dayjs(record.date).format('DD/MM/YYYY'),
    },
    {
      title: 'SIV No',
      dataIndex: 'grnSivNo',
      key: 'grnSivNo',
      width: 110,
      className: 'font-mono font-bold text-slate-800 text-xs',
    },
    {
      title: 'Issued To / Requested By',
      key: 'issuedTo',
      width: 170,
      className: 'text-xs font-semibold text-slate-700',
      render: (record: BinCardTransaction) => {
        const parts = record.remark?.split('Issued to');
        return parts && parts.length > 1 ? parts[1].trim() : 'Project Site Workforce';
      },
    },
    {
      title: 'Project / Site',
      key: 'project',
      width: 160,
      className: 'text-xs font-semibold text-slate-600',
      render: (record: BinCardTransaction) => record.remark && record.remark.includes('site') ? 'Phison Realstate SC site' : 'Civil Works Site Alpha',
    },
    {
      title: 'Items',
      key: 'items',
      width: 220,
      className: 'text-xs font-bold text-slate-800',
      render: (record: BinCardTransaction) => {
        const material = materials.find(m => m.id === record.materialId);
        const name = material ? material.description : 'OPC Cement';
        return `${name} (${record.issuedQty} Pcs/Bags)`;
      },
    },
    {
      title: 'Share',
      key: 'share',
      width: 100,
      align: 'center' as const,
      render: () => (
        <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
          <Button 
            type="default"
            size="small"
            className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-205 hover:bg-slate-50 hover:border-slate-350 text-slate-755 text-xs font-bold rounded-lg cursor-pointer transition shadow-3xs"
            icon={<ShareAltOutlined style={{ fontSize: '11px' }} />}
          >
            Share
          </Button>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 150,
      render: (record: BinCardTransaction) => {
        const req = istvRequests.find(r => r.sivNo === record.grnSivNo);
        if (req) {
          if (req.status === 'Converted') {
            return (
              <Tag color="success" className="font-bold text-[10px] m-0 border border-emerald-250 py-0.5 px-2">
                ISTVR Converted
              </Tag>
            );
          } else if (req.status === 'Rejected') {
            return (
              <Tag color="error" className="font-bold text-[10px] m-0 border border-rose-250 py-0.5 px-2">
                ISTVR Rejected
              </Tag>
            );
          } else {
            return (
              <Tag color="purple" className="font-bold text-[10px] m-0 border border-purple-250 py-0.5 px-2">
                ISTVR Pending
              </Tag>
            );
          }
        }
        return (
          <Tag color="warning" className="font-bold text-[10px] m-0 border border-amber-250 py-0.5 px-2">
            Logged
          </Tag>
        );
      },
    },
    {
      title: 'Action',
      key: 'action',
      width: 190,
      align: 'center' as const,
      render: (_: unknown, record: BinCardTransaction) => {
        const hasConverted = istvRequests.some(r => r.sivNo === record.grnSivNo);
        return (
          <div className="flex items-center gap-1 justify-center" onClick={e => e.stopPropagation()}>
            <Tooltip title="View SIV Document">
              <Button
                type="text"
                shape="circle"
                size="small"
                icon={<EyeOutlined style={{ fontSize: '14px', color: '#1e293b' }} />}
                onClick={() => {
                  setSelectedSivForView(record);
                  setIsSivDetailOpen(true);
                }}
              />
            </Tooltip>
            <Tooltip title="Modify Issue Details">
              <Button
                type="text"
                shape="circle"
                size="small"
                icon={<EditOutlined style={{ fontSize: '14px', color: '#2563eb' }} />}
                onClick={() => {
                  Modal.info({
                    title: 'Modify SIV Details',
                    content: 'To edit this record, please adjust SIV reference entries directly in the ledger log. Double click the item row to open raw card transaction lists.',
                  });
                }}
              />
            </Tooltip>
            {hasConverted ? (
              <Button 
                type="text" 
                size="small" 
                disabled 
                className="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 h-6 cursor-not-allowed"
              >
                ISTVR Active
              </Button>
            ) : (
              <Button 
                type="primary" 
                size="small" 
                onClick={() => {
                  setConvertingSiv(record);
                  setConversionToStoreId('');
                }}
                className="text-[10px] font-bold bg-[#033096] hover:bg-blue-800 border-none px-2 h-6"
              >
                Convert to ISTVR
              </Button>
            )}
            <Tooltip title="Delete SIV entry">
              <Button
                type="text"
                shape="circle"
                size="small"
                danger
                icon={<DeleteOutlined style={{ fontSize: '14px' }} />}
                onClick={() => {
                  Modal.confirm({
                    title: 'Delete SIV Entry',
                    content: `Are you sure you want to delete SIV record ${record.grnSivNo}? This action is permanent.`,
                    onOk: () => {
                      setBinTransactions(prev => prev.filter(t => t.id !== record.id));
                      setIstvRequests(prev => prev.filter(r => r.sivNo !== record.grnSivNo));
                    }
                  });
                }}
              />
            </Tooltip>
          </div>
        );
      }
    }
  ];

  return (
    <div className="min-h-screen bg-[#f1f4fa] flex flex-col font-sans select-none antialiased text-slate-800" id="main-app">
      
      {/* Top Professional Header */}
      <ConDigitalHeader 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        activeSubTab={activeSubTab}
        setActiveSubTab={handleSubTabChange}
      />

      {/* Main Container Layout */}
      <main className="flex-1 w-full p-4 md:p-6" id="app-body">
        
        {/* Sleek layout with action shortcuts */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-end gap-3">
          {(activeSubTab === 'Material' || activeSubTab === 'Store') && (
            <div className="flex items-center gap-2.5 self-start sm:self-center">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  if (stores.length === 0) {
                    alert('Please register at least one store in the left sidebar before logging GRVs.');
                    return;
                  }
                  setIsGRVOpen(true);
                }}
                className="font-semibold flex items-center shadow-sm h-9 px-4 cursor-pointer"
                style={{ backgroundColor: '#033096', borderColor: '#033096' }}
                title="Register a brand new Good Received Voucher (GRV)"
              >
                Register GRV
              </Button>
              <Button
                icon={<PlusOutlined />}
                onClick={() => {
                  if (stores.length === 0) {
                    alert('Please register at least one store in the left sidebar before logging SIVs.');
                    return;
                  }
                  setIsSIVOpen(true);
                }}
                className="font-semibold flex items-center shadow-sm h-9 px-4 cursor-pointer text-slate-755 border border-slate-205 hover:border-slate-300 rounded-lg bg-white"
                title="Register a brand new Store Issue Voucher (SIV)"
              >
                Register SIV
              </Button>
            </div>
          )}
        </div>

        {/* Download Action Alert Notification */}
        {downloadToast && (
          <div className="fixed bottom-5 right-5 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-lg shadow-xl flex items-center gap-2.5 animate-bounce z-50">
            <Download size={14} className="text-blue-400" />
            <span>Successfully downloaded spec document for: <strong>{downloadToast}</strong></span>
          </div>
        )}

        {/* Core Workspace - Dynamic navigation dependent content section */}
        {activeSubTab === 'Purchase Order' ? (
          <PurchaseOrderView
            suppliers={suppliers}
            purchaseRequisitions={purchaseRequisitions}
            evaluations={evaluations}
            purchaseOrders={purchaseOrders}
            onSavePurchaseOrder={handleSavePurchaseOrder}
            onDeletePurchaseOrder={handleDeletePurchaseOrder}
            systemUsers={users}
          />
        ) : activeSubTab === 'Purchase Evaluation' ? (
          <PurchaseEvaluationView
            suppliers={suppliers}
            purchaseRequisitions={purchaseRequisitions}
            evaluations={evaluations}
            onSaveEvaluation={handleSaveEvaluation}
            onDeleteEvaluation={handleDeleteEvaluation}
            systemUsers={users}
          />
        ) : activeSubTab === 'Supplier' ? (
          <SupplierView
            suppliers={suppliers}
            onAddSupplier={handleSaveSupplier}
            onDeleteSupplier={handleDeleteSupplier}
          />
        ) : activeSubTab === 'Voucher Validation' ? (
          <VoucherValidationView
            binTransactions={binTransactions}
            materials={materials}
            stores={stores}
            purchaseOrders={purchaseOrders}
            systemUsers={users}
            onUpdateTransaction={handleUpdateBinTransaction}
          />
        ) : activeSubTab === 'Inter-Store Transfer' ? (
          <InterStoreTransferView
            stores={stores}
            materials={materials}
            systemUsers={users}
            transfers={transfers}
            onSaveTransfer={handleSaveTransfer}
            onDeleteTransfer={handleDeleteTransfer}
            istvRequests={istvRequests}
            setIstvRequests={setIstvRequests}
            purchaseRequisitions={purchaseRequisitions}
          />
        ) : (

          <Layout className="bg-transparent flex flex-col lg:flex-row gap-6 items-start" style={{ background: 'transparent' }}>
            
            {/* Left Sidebar Layout: Optional Sider for categories/filters/locations */}
            <Sider 
              width={340} 
              theme="light" 
              className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs w-full lg:w-auto"
              style={{ background: '#fff', borderRadius: '12px' }}
              breakpoint="lg"
              collapsedWidth="0"
            >
              <div className="flex flex-col">
                {/* Sidebar header banner with clicking 'Show All' like active text label */}
                <div className="p-4 border-b border-slate-150 flex items-center justify-between bg-white">
                  <button
                    onClick={() => setSelectedStoreId('all')}
                    className={`text-sm font-bold transition-all duration-150 cursor-pointer
                      ${selectedStoreId === 'all'
                        ? 'text-blue-700 hover:text-blue-800'
                        : 'text-slate-500 hover:text-blue-700'
                      }`}
                  >
                    Show All
                  </button>
                  
                  {/* Outline add button styled exactly like Screenshot 1 "+ Add Revision" via AntD Button */}
                  <Button
                    onClick={() => {
                      setEditingStore(null);
                      setIsStoreModalOpen(true);
                    }}
                    type="default"
                    icon={<PlusOutlined />}
                    className="border border-slate-200 hover:border-blue-300 text-blue-700 bg-white font-semibold text-xs rounded shadow-3xs flex items-center cursor-pointer"
                  >
                    Register Store
                  </Button>
                </div>

                {/* Search box within Sidebar */}
                <div className="p-4 bg-slate-50/20 border-b border-slate-100/80">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 select-none pointer-events-none">
                      <Search size={13} />
                    </span>
                    <input
                      type="text"
                      value={storeSearchQuery}
                      onChange={(e) => setStoreSearchQuery(e.target.value)}
                      placeholder="Search store"
                      className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-404 bg-white border border-slate-200 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 outline-none transition shadow-3xs"
                    />
                  </div>
                </div>

                {/* List stacked vertically on the left hand side - Screenshot 1 structure */}
                <div className="p-4 max-h-[580px] overflow-y-auto space-y-3.5 bg-slate-50/10">
                  
                  {/* Physical stores stacked dynamic registry list */}
                  {filteredStores.length === 0 ? (
                    <div className="p-8 text-center bg-white border border-dashed border-slate-200 rounded-lg text-slate-400 text-xs font-sans">
                      No registered stores found matching search.
                    </div>
                  ) : (
                    filteredStores.map((store, index) => {
                      const isSelected = selectedStoreId === store.id;
                      const count = getMaterialCountForStore(store.id);
                      const displayIndex = String(index + 1).padStart(3, '0');
                      
                      return (
                        <div
                          key={store.id}
                          onClick={() => setSelectedStoreId(store.id)}
                          className={`bg-white border rounded-lg p-4 cursor-pointer transition-all duration-150 relative flex flex-col justify-between shadow-3xs hover:shadow-2xs hover:border-slate-350
                            ${isSelected
                              ? 'border-blue-600 ring-1 ring-blue-600/20 bg-[#f9fbfd]'
                              : 'border-slate-200'
                            }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="text-left">
                              <h4 className="text-xs font-bold text-slate-900 tracking-tight font-sans">
                                REV - {displayIndex}
                              </h4>
                              <p className="text-[11px] font-bold text-slate-800 mt-1 leading-normal">
                                {store.name}
                              </p>
                            </div>

                            <div className="flex items-center space-x-2">
                              <span className="text-[9px] font-bold text-slate-400 tracking-wider">
                                {count} MATERIALS
                              </span>
                              
                              {/* Small Action Icons */}
                              <div className="flex items-center space-x-1" onClick={e => e.stopPropagation()}>
                                <button
                                  onClick={() => {
                                    setEditingStore(store);
                                    setIsStoreModalOpen(true);
                                  }}
                                  className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded"
                                  title="Edit Location Settings"
                                >
                                  <Edit3 size={11} strokeWidth={2.5} />
                                </button>
                                <button
                                  onClick={() => handleDeleteStore(store.id, store.name)}
                                  className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded"
                                  title="De-register Store"
                                >
                                  <Trash2 size={11} strokeWidth={2.5} />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Bottom properties mapping the revision look */}
                          <div className="flex justify-between items-center text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
                            <span className="bg-slate-100/80 text-slate-600 px-1.5 py-0.5 rounded text-[9px] font-semibold">
                              {store.type} · {store.city}
                            </span>
                            <span className="font-sans font-medium text-slate-400/80">{store.createdAt || '22-05-2026'}</span>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Total list metric indicator at the bottom of sidebar list */}
                  <div className="text-center pt-2 pb-1 text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">
                    TOTAL {filteredStores.length} REVISIONS
                  </div>
                </div>
              </div>
            </Sider>

            {/* Right Core Workspace Panel: Content area */}
            <Content className="flex flex-col gap-4 flex-1 w-full" style={{ minWidth: 0 }}>
              
              {/* Dashboard grid controls header styled exactly like Screenshot 1 controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-3xs">
                
                {/* Search input and dropdown category filter */}
                <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  {/* Material Registration Date range filter */}
                  <div className="flex items-center gap-1 h-[28px]">
                    <DatePicker
                      placeholder="Start Date"
                      size="small"
                      value={materialStartDate ? dayjs(materialStartDate) : null}
                      onChange={(date) => setMaterialStartDate(date ? date.format('YYYY-MM-DD') : '')}
                      className="h-[28px] text-[11px] font-semibold w-[105px] font-sans text-slate-700 bg-white rounded"
                      allowClear
                    />
                    <span className="text-slate-300 font-medium select-none text-[11px]">→</span>
                    <DatePicker
                      placeholder="End Date"
                      size="small"
                      value={materialEndDate ? dayjs(materialEndDate) : null}
                      onChange={(date) => setMaterialEndDate(date ? date.format('YYYY-MM-DD') : '')}
                      className="h-[28px] text-[11px] font-semibold w-[105px] font-sans text-slate-700 bg-white rounded"
                      allowClear
                    />
                  </div>

                  <div className="relative flex-1 max-w-sm">
                    <input
                      type="text"
                      value={materialSearchQuery}
                      onChange={(e) => setMaterialSearchQuery(e.target.value)}
                      placeholder="Search materials"
                      className="w-full pl-3 pr-9 py-1.5 text-xs text-slate-800 placeholder-slate-400 bg-white border border-slate-200 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 outline-none transition shadow-2xs"
                    />
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 pointer-events-none">
                      <Search size={13} />
                    </span>
                  </div>

                  {/* Filter dropdown with custom funnel left icon to match screenshot exactly */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                      <Filter size={11} className="stroke-[2.5]" />
                    </div>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="pl-8 pr-8 py-1.5 text-xs bg-white border border-slate-200 text-slate-600 rounded outline-none transition cursor-pointer font-sans appearance-none shadow-2xs min-w-[120px]"
                    >
                      <option value="all">All Types</option>
                      <option value="Construction Material">Construction Materials</option>
                      <option value="Construction Equipment">Equipment</option>
                      <option value="Vehicle">Site Vehicles</option>
                      <option value="Fixed Asset">Fixed Assets</option>
                    </select>
                    <span className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 pointer-events-none">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </div>

                  {/* Modern Custom Toggle Switch styled exactly like the screenshot */}
                  <div className="flex items-center gap-1.5 select-none shrink-0" id="grv-view-toggle">
                    <button
                      type="button"
                      onClick={() => {
                        const nextVal = !isGrvMode;
                        setIsGrvMode(nextVal);
                        if (nextVal) setIsSivMode(false);
                      }}
                      className={`relative inline-flex h-6 w-[86px] items-center rounded-full transition-colors duration-200 cursor-pointer focus:outline-none px-0.5 ${
                        isGrvMode ? 'bg-[#033096]' : 'bg-[#bdbdbd]'
                      }`}
                      title="Toggle Good Received Vouchers view"
                    >
                      <span
                        className={`absolute top-[1.5px] bottom-0 flex items-center font-sans text-[9px] font-bold tracking-tight select-none transition-all duration-200 ${
                          isGrvMode ? 'left-2 text-white' : 'right-2 text-white/95'
                        }`}
                      >
                        Show GRV
                      </span>
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                          isGrvMode ? 'translate-x-[60px]' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Modern Custom Toggle Switch for SIV */}
                  <div className="flex items-center gap-1.5 select-none shrink-0" id="siv-view-toggle">
                    <button
                      type="button"
                      onClick={() => {
                        const nextVal = !isSivMode;
                        setIsSivMode(nextVal);
                        if (nextVal) setIsGrvMode(false);
                      }}
                      className={`relative inline-flex h-6 w-[86px] items-center rounded-full transition-colors duration-200 cursor-pointer focus:outline-none px-0.5 ${
                        isSivMode ? 'bg-[#722ed1]' : 'bg-[#bdbdbd]'
                      }`}
                      title="Toggle Store Issue Vouchers view"
                    >
                      <span
                        className={`absolute top-[1.5px] bottom-0 flex items-center font-sans text-[9px] font-bold tracking-tight select-none transition-all duration-200 ${
                          isSivMode ? 'left-2 text-white' : 'right-2 text-white/95'
                        }`}
                      >
                        Show SIV
                      </span>
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                          isSivMode ? 'translate-x-[60px]' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Status Count Label */}
                  <div className="text-[11px] font-semibold text-slate-505 bg-slate-50 border border-slate-205 px-2 py-1 rounded flex items-center">
                    {isGrvMode ? (
                      <span>{filteredGrvs.length} GRV Vouchers Listed</span>
                    ) : isSivMode ? (
                      <span>{filteredSivs.length} SIV Vouchers Listed</span>
                    ) : (
                      <span>{filteredMaterials.length} Materials Registered</span>
                    )}
                  </div>
                </div>

                {/* + New Material outline trigger button via AntD Button */}
                <Button
                  onClick={() => {
                    if (stores.length === 0) {
                      alert('Please register at least one store in the left sidebar before logging materials.');
                      return;
                    }
                    setEditingMaterial(null);
                    setIsMaterialModalOpen(true);
                  }}
                  type="default"
                  icon={<PlusOutlined />}
                  className="border border-slate-200 hover:border-blue-350 text-blue-700 bg-white font-semibold text-xs flex items-center shadow-3xs cursor-pointer h-9 px-3.5"
                >
                  New Material
                </Button>
              </div>
              {/* Robust Ant Design Table component with action dropdowns & click events */}
              <div className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-2xs">
                {isGrvMode ? (
                  <Table
                    dataSource={filteredGrvs.map(t => ({ ...t, key: t.id }))}
                    columns={grvTableColumns}
                    scroll={{ x: 1110 }}
                    pagination={{
                      defaultPageSize: 10,
                      showSizeChanger: true,
                      pageSizeOptions: ['10', '25', '50'],
                      showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total} results`,
                    }}
                    onRow={(record) => ({
                      onClick: () => {
                        const material = materials.find(m => m.id === record.materialId);
                        if (material) {
                          setActiveBinCardMaterial(material);
                          setIsBinCardOpen(true);
                        }
                      },
                    })}
                    locale={{
                      emptyText: (
                        <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-2">
                          <SlidersHorizontal size={24} className="text-slate-300" />
                          <p className="font-semibold text-slate-505 text-xs">No GRV vouchers found for this filter viewport</p>
                          <p className="text-[10px] text-slate-400 max-w-sm">
                            Make sure you have registered material receipts or select a different project location.
                          </p>
                        </div>
                      )
                    }}
                    className="custom-antd-table font-sans text-xs custom-grv-rows"
                  />
                ) : isSivMode ? (
                  <Table
                    dataSource={filteredSivs.map(t => ({ ...t, key: t.id }))}
                    columns={sivTableColumns}
                    scroll={{ x: 1210 }}
                    pagination={{
                      defaultPageSize: 10,
                      showSizeChanger: true,
                      pageSizeOptions: ['10', '25', '50'],
                      showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total} results`,
                    }}
                    onRow={(record) => ({
                      onClick: () => {
                        setSelectedSivForView(record);
                        setIsSivDetailOpen(true);
                      },
                    })}
                    locale={{
                      emptyText: (
                        <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-2">
                          <SlidersHorizontal size={24} className="text-slate-300" />
                          <p className="font-semibold text-slate-505 text-xs">No SIV vouchers found for this filter viewport</p>
                          <p className="text-[10px] text-slate-400 max-w-sm">
                            Make sure you have registered material issues or select a different project location.
                          </p>
                        </div>
                      )
                    }}
                    className="custom-antd-table font-sans text-xs custom-siv-rows"
                  />
                ) : (
                  <Table
                    dataSource={filteredMaterials.map(m => ({ ...m, key: m.id }))}
                    columns={materialTableColumns}
                    scroll={{ x: 1000 }}
                    pagination={{
                      defaultPageSize: 10,
                      showSizeChanger: true,
                      pageSizeOptions: ['10', '25', '50'],
                      showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total} results`,
                    }}
                    onRow={(record) => ({
                      onClick: () => {
                        setActiveBinCardMaterial(record);
                        setIsBinCardOpen(true);
                      },
                    })}
                    rowClassName={(record) => {
                      const hasGrv = binTransactions.some(t => {
                        return t.materialId === record.id && 
                               t.grnSivNo.startsWith('GRN') && 
                               t.receivedQty !== undefined && 
                               t.receivedQty > 0 &&
                               t.grnSivNo !== 'GRN-001';
                      });
                      return hasGrv ? 'bg-[#f0fdf4]/85 hover:bg-[#dcfce7]/90 border-l-[3.5px] border-emerald-500 font-medium transition-colors cursor-pointer' : 'cursor-pointer';
                    }}
                    locale={{
                      emptyText: (
                        <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-2">
                          <SlidersHorizontal size={24} className="text-slate-300" />
                          <p className="font-semibold text-slate-505 text-xs">No entries match the active filter viewport</p>
                          <p className="text-[10px] text-slate-400 max-w-sm">
                            Click "Show All" or select another registered store on the left stack to view listing.
                          </p>
                        </div>
                      )
                    }}
                    className="custom-antd-table font-sans text-xs"
                  />
                )}
              </div>

            </Content>
          </Layout>
        )}
      </main>

      {/* Stores Input Modal Container */}
      <StoreModal
        isOpen={isStoreModalOpen}
        onClose={() => setIsStoreModalOpen(false)}
        onSave={handleSaveStore}
        editingStore={editingStore}
      />

      {/* Materials Input Modal Container */}
      <MaterialModal
        isOpen={isMaterialModalOpen}
        onClose={() => setIsMaterialModalOpen(false)}
        onSave={handleSaveMaterial}
        editingMaterial={editingMaterial}
        stores={stores}
        defaultStoreId={selectedStoreId === 'all' ? undefined : selectedStoreId}
      />

      {/* Interactive Bin Card Modal Container */}
      {activeBinCardMaterial && (
        <BinCardModal
          isOpen={isBinCardOpen}
          onClose={() => {
            setIsBinCardOpen(false);
            setActiveBinCardMaterial(null);
          }}
          material={activeBinCardMaterial}
          store={stores.find(s => s.id === activeBinCardMaterial.storeId) || null}
          transactions={binTransactions.filter(t => t.materialId === activeBinCardMaterial.id && (t.receivedQty === undefined || t.id.startsWith('seed-') || !!t.qaApprovedById))}
          onAddTransaction={handleAddBinTransaction}
          onDeleteTransaction={handleDeleteBinTransaction}
          users={users}
          onUpdateSignoffs={handleUpdateMaterialSignoffs}
          onAddUser={handleAddUser}
          allMaterials={materials}
          onSelectMaterial={setActiveBinCardMaterial}
          stores={stores}
        />
      )}

      {/* GRV & SIV Voucher Modals */}
      <GRVModal
        isOpen={isGRVOpen}
        onClose={() => setIsGRVOpen(false)}
        stores={stores}
        materials={materials}
        purchaseRequisitions={purchaseRequisitions}
        suppliers={suppliers}
        users={users}
        onSave={handleSaveVouchers}
      />

      <SIVModal
        isOpen={isSIVOpen}
        onClose={() => setIsSIVOpen(false)}
        stores={stores}
        materials={materials}
        users={users}
        purchaseRequisitions={purchaseRequisitions}
        onSave={handleSaveVouchers}
      />

      {/* ------------------------------------------------------------- */}
      {/* CONVERT SIV TO ISTV REQUEST MODAL                             */}
      {/* ------------------------------------------------------------- */}
      <Modal
        title={
          <div className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5 uppercase tracking-wide">
            <span className="bg-[#722ed1] px-1.5 py-0.5 text-white rounded text-xs leading-none">SIV</span>
            <span>Convert Store Issue Voucher to ISTVR</span>
          </div>
        }
        open={convertingSiv !== null}
        onOk={handleConfirmSivConversion}
        onCancel={() => setConvertingSiv(null)}
        okText="Convert to ISTV Request"
        cancelText="Cancel"
        okButtonProps={{ className: 'bg-[#033096] border-none font-bold text-xs h-9 shadow-sm' }}
        cancelButtonProps={{ className: 'font-semibold text-xs h-9' }}
        className="custom-antd-modal"
        destroyOnClose
      >
        {convertingSiv && (() => {
          const mat = materials.find(m => m.id === convertingSiv.materialId);
          const fromStore = stores.find(s => s.id === mat?.storeId);
          const availableToStores = stores.filter(s => s.id !== mat?.storeId);
          return (
            <div className="py-4 space-y-4">
              <div className="bg-slate-50 border border-slate-200/50 p-3.5 rounded-lg space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-slate-400 font-medium">SIV Reference Code:</span> <span className="font-mono font-bold text-slate-800">{convertingSiv.grnSivNo}</span></div>
                <div className="flex justify-between"><span className="text-slate-400 font-medium">Item Name / Desc:</span> <span className="font-bold text-slate-800 text-right">{mat?.description || 'Construction Material'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400 font-medium">Issued Quantity:</span> <span className="font-bold text-[#033096]">{convertingSiv.issuedQty} {mat?.unit || 'Units'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400 font-medium">Dispatch Yard (From):</span> <span className="font-bold text-amber-700">{fromStore?.name || 'Main Yard'}</span></div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Select Recipient Yard (To Store)</label>
                <Select
                  value={conversionToStoreId || undefined}
                  onChange={setConversionToStoreId}
                  className="w-full text-xs font-semibold"
                  placeholder="Choose target store for direct inter-store transfer"
                  options={availableToStores.map(s => ({ value: s.id, label: `${s.name} (${s.city})` }))}
                />
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* VIEW SIV DETAIL PREVIEW MODAL                                 */}
      {/* ------------------------------------------------------------- */}
      <Modal
        title={
          <div className="text-xs uppercase font-bold tracking-wider text-slate-500 border-b pb-2 flex items-center justify-between">
            <span>Store Issue Voucher (SIV) Details</span>
            <span className="font-mono text-[10px] text-slate-400">Printed from ConDigital Ledger Platform</span>
          </div>
        }
        open={isSivDetailOpen}
        onCancel={() => {
          setIsSivDetailOpen(false);
          setSelectedSivForView(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setIsSivDetailOpen(false);
            setSelectedSivForView(null);
          }} className="font-semibold text-xs h-9">
            Close Panel
          </Button>,
          <Button key="print" type="primary" onClick={() => window.print()} className="bg-amber-600 hover:bg-amber-705 border-none font-bold text-xs h-9 shadow-sm">
            Print Sheet
          </Button>
        ]}
        width={650}
        destroyOnClose
      >
        {selectedSivForView && (() => {
          const mat = materials.find(m => m.id === selectedSivForView.materialId);
          const store = stores.find(s => s.id === mat?.storeId);
          const checkedUser = users.find(u => u.id === selectedSivForView.checkedById) || users[0];
          const approvedUser = users.find(u => u.id === selectedSivForView.approvedById) || users[1];
          return (
            <div className="py-6 font-sans text-left space-y-6">
              {/* Document Header */}
              <div className="border-b border-dashed border-slate-300 pb-4 flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-black tracking-tight text-slate-800 font-sans leading-none">CONDIGITAL CONSTRUCTION</h2>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-[#033096] mt-1">Store Issue Voucher (SIV)</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">SIV Ledger Record ID: {selectedSivForView.id.substring(0, 12)}</p>
                </div>
                <div className="text-right">
                  <div className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded border border-purple-200 font-mono text-sm font-black tracking-wider inline-block">
                    {selectedSivForView.grnSivNo}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5 font-bold">DATE: {dayjs(selectedSivForView.date).format('DD/MM/YYYY')}</p>
                </div>
              </div>

              {/* Grid Metadata */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/60 space-y-1.5">
                  <p className="text-[9px] font-black tracking-wider text-slate-400 uppercase">Dispatch / Issuing Center</p>
                  <p className="font-bold text-slate-800 text-sm leading-tight">{store?.name || 'Central Warehouse Office'}</p>
                  <p className="text-[10px] text-slate-500 font-medium">{store?.city}, {store?.wereda} | Type: {store?.type}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/60 space-y-1.5">
                  <p className="text-[9px] font-black tracking-wider text-slate-400 uppercase">Receiving Unit / Reference</p>
                  <p className="font-bold text-slate-800 text-sm leading-tight">Phison Realstate SC site</p>
                  <p className="text-[10px] text-slate-500 font-medium">Requisition No: MR-{Math.floor(1000 + Math.random() * 9000)} | Civil Works Area</p>
                </div>
              </div>

              {/* Items Receipt Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100/80 border-b border-slate-200 font-bold text-slate-700 text-[10px] uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-2.5 text-left">Code</th>
                      <th className="px-4 py-2.5 text-left">Description</th>
                      <th className="px-4 py-2.5 text-center">Unit</th>
                      <th className="px-4 py-2.5 text-right">Quantity</th>
                      <th className="px-4 py-2.5 text-right">Unit Price</th>
                      <th className="px-4 py-2.5 text-right">Total (ETB)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 font-medium text-slate-800">
                    <tr>
                      <td className="px-4 py-3 font-mono text-[10px] font-bold text-slate-600">{mat?.code || 'MT-1081'}</td>
                      <td className="px-4 py-3 text-slate-900 font-semibold">{mat?.description || 'OPC Cement (Pharaon)'}</td>
                      <td className="px-4 py-3 text-center text-slate-500 font-bold">{mat?.unit || 'Pcs'}</td>
                      <td className="px-4 py-3 text-right font-bold text-purple-700">{selectedSivForView.issuedQty || 0}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-600">{selectedSivForView.unitPrice ? `${selectedSivForView.unitPrice.toLocaleString()} ETB` : '185.00 ETB'}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                        {((selectedSivForView.issuedQty || 0) * (selectedSivForView.unitPrice || 185)).toLocaleString()} ETB
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Signature Manifest */}
              <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-200/60 divide-y divide-slate-200/50 text-xs">
                <div className="flex justify-between py-2 items-center">
                  <div className="flex items-center gap-1.5 font-bold text-slate-705">
                    <span className="text-[10px] font-extrabold bg-[#033096] text-white h-4 w-4 rounded-full flex items-center justify-center text-[9px]">1</span>
                    <span>Issued By:</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800">{selectedSivForView.signature || 'Nahom T.'}</p>
                    <p className="text-[10px] text-slate-400">System Authorized Dispatcher</p>
                  </div>
                </div>
                <div className="flex justify-between py-2 items-center">
                  <div className="flex items-center gap-1.5 font-bold text-slate-705">
                    <span className="text-[10px] font-extrabold bg-amber-500 text-white h-4 w-4 rounded-full flex items-center justify-center text-[9px]">2</span>
                    <span>Checked By:</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800">{checkedUser?.name || 'Endalkachew Amogne'}</p>
                    <p className="text-[10px] text-slate-550 font-medium">Position: {checkedUser?.role || 'Project Engineer'}</p>
                  </div>
                </div>
                <div className="flex justify-between py-2 items-center">
                  <div className="flex items-center gap-1.5 font-bold text-slate-705">
                    <span className="text-[10px] font-extrabold bg-indigo-600 text-white h-4 w-4 rounded-full flex items-center justify-center text-[9px]">3</span>
                    <span>Approved By:</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800">{approvedUser?.name || 'Yonatan BT plc'}</p>
                    <p className="text-[10px] text-slate-550 font-medium">Position: {approvedUser?.role || 'Project Manager'}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
