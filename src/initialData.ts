import { Store, Material, SystemUser, Supplier, PurchaseRequisition, PurchaseEvaluation, PurchaseOrder } from './types';

export const INITIAL_STORES: Store[] = [
  {
    id: 'store-1',
    name: 'Main Store - Addis',
    city: 'Addis Ababa',
    wereda: 'Wereda 03',
    type: 'Main Store',
    createdAt: '2026-05-22'
  },
  {
    id: 'store-2',
    name: 'Bole Site Store',
    city: 'Addis Ababa',
    wereda: 'Wereda 10',
    type: 'Site Store',
    createdAt: '2026-05-22'
  },
  {
    id: 'store-3',
    name: 'Lideta Sub Store',
    city: 'Addis Ababa',
    wereda: 'Wereda 08',
    type: 'Sub Store',
    createdAt: '2026-05-22'
  },
  {
    id: 'store-4',
    name: 'Adama Warehouse',
    city: 'Adama',
    wereda: 'Wereda 02',
    type: 'Warehouse',
    createdAt: '2026-05-25'
  }
];

export const INITIAL_MATERIALS: Material[] = [
  {
    id: 'mat-1',
    code: '0001',
    category: 'Construction Material',
    description: 'OPC Cement Grade 42.5R (Dergba)',
    unit: 'Quintal',
    quantity: 2500,
    unitPrice: 850,
    storeId: 'store-1',
    remarks: 'High strength, for super-structure',
    createdAt: '2026-05-22'
  },
  {
    id: 'mat-2',
    code: '0002',
    category: 'Construction Material',
    description: 'Fine Aggregates (Coarse Sand)',
    unit: 'M³',
    quantity: 450,
    unitPrice: 1400,
    storeId: 'store-1',
    remarks: 'Clean query sand, well graded',
    createdAt: '2026-05-22'
  },
  {
    id: 'mat-3',
    code: '0003',
    category: 'Construction Material',
    description: 'Deformed Reinforcement Steel rebars (12mm)',
    unit: 'PCS',
    quantity: 800,
    unitPrice: 1200,
    storeId: 'store-2',
    remarks: 'Grade 60 structural steel',
    createdAt: '2026-05-22'
  },
  {
    id: 'mat-4',
    code: '0004',
    category: 'Construction Equipment',
    description: 'Excavator Crawler CAT-320D',
    unit: 'PCS',
    quantity: 2,
    unitPrice: 350000,
    storeId: 'store-2',
    remarks: 'For basement bulk excavation works',
    createdAt: '2026-05-22'
  },
  {
    id: 'mat-5',
    code: '0005',
    category: 'Vehicle',
    description: 'Concrete Mixer Truck (9M³ Transit)',
    unit: 'PCS',
    quantity: 4,
    unitPrice: 180000,
    storeId: 'store-3',
    remarks: 'Euro 4 compliant heavy machinery',
    createdAt: '2026-05-23'
  },
  {
    id: 'mat-6',
    code: '0006',
    category: 'Fixed Asset',
    description: 'Pre-fabricated Site Office Container',
    unit: 'PCS',
    quantity: 6,
    unitPrice: 45000,
    storeId: 'store-3',
    remarks: 'Fully equipped electrical fit-out',
    createdAt: '2026-05-24'
  },
  {
    id: 'mat-7',
    code: '0007',
    category: 'Construction Material',
    description: 'PVC Drainage Conduit Pipes (110mm)',
    unit: 'PCS',
    quantity: 1500,
    unitPrice: 120,
    storeId: 'store-4',
    remarks: 'Heavy duty, water distribution line',
    createdAt: '2026-05-25'
  },
  {
    id: 'mat-8',
    code: '0008',
    category: 'Construction Material',
    description: 'Acrylic Plastic paint - Weathercoat White',
    unit: 'Lt.',
    quantity: 350,
    unitPrice: 180,
    storeId: 'store-4',
    remarks: 'For external wall application',
    createdAt: '2026-05-26'
  },
  {
    id: 'mat-9',
    code: 'FM-GRN-12',
    category: 'Construction Material',
    description: 'Granite Harer Thread 1.30*0.32',
    unit: 'M²',
    quantity: 11.65,
    unitPrice: 1250,
    storeId: 'store-1',
    remarks: 'Imported granite thread tiling',
    createdAt: '2024-07-01'
  }
];

export const INITIAL_USERS: SystemUser[] = [
  {
    id: 'usr-1',
    name: 'Nahom Sisay',
    role: 'Store Keeper',
    initials: 'N.S.',
    email: 'nahomcondigital@gmail.com'
  },
  {
    id: 'usr-2',
    name: 'Kidus Daniel',
    role: 'Store Keeper',
    initials: 'K.D.',
    email: 'kidus.d@allura.com'
  },
  {
    id: 'usr-3',
    name: 'Aster Kebede',
    role: 'Store Keeper',
    initials: 'A.K.',
    email: 'aster.k@allura.com'
  },
  {
    id: 'usr-4',
    name: 'Bethlehem Yonas',
    role: 'Stock Controller',
    initials: 'B.Y.',
    email: 'bethlehem.y@allura.com'
  },
  {
    id: 'usr-5',
    name: 'Nebiyu Samuel',
    role: 'Stock Controller',
    initials: 'N.S.',
    email: 'nebiyu.s@allura.com'
  },
  {
    id: 'usr-6',
    name: 'Abebe Bekele',
    role: 'Warehouse Manager',
    initials: 'A.B.',
    email: 'abebe.b@allura.com'
  },
  {
    id: 'usr-7',
    name: 'Selamawit Dawit',
    role: 'Project Manager',
    initials: 'S.D.',
    email: 'selamawit.d@allura.com'
  }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  { id: 'sup-1', name: 'NOC', phone: '+251 111 223344', address: 'Addis Ababa', email: 'info@noc.et', tin: 'TIN-445892', createdAt: '2026-06-03' },
  { id: 'sup-2', name: 'Tesegaye', phone: '+251 911 445566', address: 'Bole, Addis Ababa', email: 'tesegaye@gmail.com', tin: 'TIN-987112', createdAt: '2026-06-03' },
  { id: 'sup-3', name: 'Ethio', phone: '+251 113 778899', address: 'Kazanchis, Addis Ababa', email: 'sales@ethio.et', tin: 'TIN-332415', createdAt: '2026-06-03' },
  { id: 'sup-4', name: 'Tilaye Nigussie', phone: '+251 912 334455', address: 'Megenagna, Addis Ababa', email: 'tilaye@nigussie.com', tin: 'TIN-889312', createdAt: '2026-06-03' },
  { id: 'sup-5', name: 'Melese', phone: '+251 911 889900', address: 'Lideta, Addis Ababa', email: 'melese@outlook.com', tin: 'TIN-112344', createdAt: '2026-06-03' },
  { id: 'sup-6', name: 'Zablon Trading PLC', phone: '+251 116 123456', address: 'Gotera, Addis Ababa', email: 'info@zablon.com', tin: 'TIN-101293', createdAt: '2026-06-03' },
  { id: 'sup-7', name: 'Sentinel', phone: '+251 114 656768', address: 'Nifas Silk, Addis Ababa', email: 'contact@sentinel.et', tin: 'TIN-557689', createdAt: '2026-06-03' },
  { id: 'sup-8', name: 'Hiya Scaffolding', phone: '+251 911 112233', address: 'Lideta, Addis Ababa', email: 'info@hiyascaffolding.com', tin: 'TIN-009841', createdAt: '2026-05-25' }
];

export const INITIAL_PRS: PurchaseRequisition[] = [
  {
    id: 'pr-1',
    code: 'PR-2460',
    date: '2026-06-03',
    srCode: 'SR-12130',
    description: "Brush 3/4'",
    unit: 'PCS',
    requestedQty: 4
  },
  {
    id: 'pr-2',
    code: 'PR-2417',
    date: '2026-06-03',
    srCode: 'SR-12001',
    description: 'Cement PPC (bulk)',
    unit: 'Quintal',
    requestedQty: 2500
  },
  {
    id: 'pr-3',
    code: 'PR-2455',
    date: '2026-06-03',
    srCode: 'SR-11894',
    description: 'Coil Rewinding Service',
    unit: 'PCS',
    requestedQty: 1
  }
];

export const INITIAL_EVALUATIONS: PurchaseEvaluation[] = [
  {
    id: 'bid-1',
    code: '1538',
    date: '2026-06-03',
    prId: 'pr-2', // Cement PPC (bulk)
    srCode: 'SR-12001',
    description: 'Cement PPC (bulk)',
    unit: 'Quintal',
    requestedQty: 2500,
    orderedQty: 2500,
    status: 'Pending (1)',
    createdAt: '2026-06-03',
    comparisons: [
      { id: 'bc-1-1', supplierId: 'sup-1', price: 820, taxRate: 15, discount: 0, status: 'Contender' },
      { id: 'bc-1-2', supplierId: 'sup-3', price: 810, taxRate: 15, discount: 5, status: 'Winner', winningReason: 'Price', remark: 'Best overall pricing and immediate availability' }
    ]
  },
  {
    id: 'bid-2',
    code: '1537',
    date: '2026-06-03',
    prId: 'pr-2', // Cement PPC (bulk)
    srCode: 'SR-12001',
    description: 'Cement PPC (bulk)',
    unit: 'Quintal',
    requestedQty: 2500,
    orderedQty: 2500,
    status: 'Checked (1) · PSL Checked (1)',
    createdAt: '2026-06-03',
    comparisons: [
      { id: 'bc-2-1', supplierId: 'sup-5', price: 830, taxRate: 15, discount: 2, status: 'Winner', winningReason: 'Quality', remark: 'Premium quality assurance' },
      { id: 'bc-2-2', supplierId: 'sup-6', price: 840, taxRate: 15, discount: 0, status: 'Contender' }
    ]
  },
  {
    id: 'bid-3',
    code: '1536',
    date: '2026-06-03',
    prId: 'pr-3', // Coil Rewinding Service
    srCode: 'SR-11894',
    description: 'Coil Rewinding Service',
    unit: 'PCS',
    requestedQty: 1,
    orderedQty: 1,
    status: 'Checked (1)',
    createdAt: '2026-06-03',
    comparisons: [
      { id: 'bc-3-1', supplierId: 'sup-7', price: 4200, taxRate: 15, discount: 0, status: 'Winner', winningReason: 'Sole Supplier', remark: 'Authorized maintenance center' }
    ]
  }
];

export const INITIAL_POS: PurchaseOrder[] = [
  {
    id: 'po-1',
    poNumber: '00097',
    date: '2026-05-25',
    type: 'Requested',
    evaluationId: 'bid-1',
    supplierId: 'sup-8', // Hiya Scaffolding
    supplierName: 'Hiya Scaffolding',
    tinNumber: 'TIN-009841',
    address: 'Lideta, Addis Ababa',
    purchaserName: 'Nahom Sisay',
    currency: 'ETB',
    remark: 'Scaffolding accessories for Lideta project site. Account No: Cash Deposit Acc No,1000',
    deliverySite: 'Lideta site',
    deliveryDate: '2026-06-15',
    additionalComments: 'Please supply/deliver in good order and condition to Lideta site on/before the specified date. Payment terms as scheduled with the Finance Department.',
    items: [
      {
        id: 'poi-1',
        prNo: 'PR-2460',
        description: 'U-head',
        code: '00097',
        unit: 'pcs',
        quantity: 143,
        unitPrice: 60.00
      },
      {
        id: 'poi-2',
        prNo: 'PR-2460',
        description: 'Base Juck',
        code: '00097',
        unit: 'pcs',
        quantity: 143,
        unitPrice: 105.00
      },
      {
        id: 'poi-3',
        prNo: 'PR-2460',
        description: 'Extention 50cm',
        code: '00097',
        unit: 'pcs',
        quantity: 100,
        unitPrice: 345.60
      }
    ],
    subTotal: 58155.00,
    vatRate: 15,
    vatAmount: 8723.25,
    amountWithVat: 66878.25,
    freightChargeType: 'No',
    freightChargeAmount: 0,
    withholdRate: 3,
    withholdAmount: 1744.65,
    netPayableAmount: 65133.60,
    shipmentType: 'Land Freight',
    paymentMethod: 'Bank Transfer',
    preparedBy: 'Nahom Sisay',
    checkedBy: 'Abebe Bekele',
    approvedBy: 'Selamawit Dawit',
    createdAt: '2026-05-25'
  }
];



