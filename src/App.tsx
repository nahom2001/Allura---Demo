import React, { useState, useEffect } from 'react';
import { Layout, Button, Table, Dropdown } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
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

import { Store, Material, MaterialCategory, BinCardTransaction, SystemUser, Supplier, PurchaseRequisition, PurchaseEvaluation, PurchaseOrder } from './types';
import { INITIAL_STORES, INITIAL_MATERIALS, INITIAL_USERS, INITIAL_SUPPLIERS, INITIAL_PRS, INITIAL_EVALUATIONS, INITIAL_POS } from './initialData';
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

  // For any other initial material, let's auto-generate a Beginning stock transaction
  INITIAL_MATERIALS.forEach(m => {
    if (!['mat-1', 'mat-2', 'mat-3', 'mat-9'].includes(m.id)) {
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
    return saved ? JSON.parse(saved) : INITIAL_MATERIALS;
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

  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
  const [storeSearchQuery, setStoreSearchQuery] = useState('');
  const [materialSearchQuery, setMaterialSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeSubTab, setActiveSubTab] = useState<string>('Material');

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
    return saved ? JSON.parse(saved) : generateDefaultTransactions();
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
      const updated = prev.map(t => t.id === updatedTx.id ? updatedTx : t);
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

    // 3. Search query filter
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
      render: (text: string, record: Material) => (
        <div className="flex flex-col text-left">
          <span className="font-bold text-slate-800 hover:text-[#033096] hover:underline leading-snug transition-colors">
            {text}
          </span>
          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
            <svg className="w-3 h-3 text-[#033096]/60 inline animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>Open Ledger Card ({record.quantity} {record.unit} in stock)</span>
          </span>
        </div>
      ),
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
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6" id="app-body">
        
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

                  {/* Status Count Label */}
                  <div className="text-[11px] font-medium text-slate-400/90 flex items-center px-1">
                    <span>{filteredMaterials.length} Materials in Full Project</span>
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
                <Table
                  dataSource={filteredMaterials.map(m => ({ ...m, key: m.id }))}
                  columns={materialTableColumns}
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
        onSave={handleSaveVouchers}
      />
    </div>
  );
}
