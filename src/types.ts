export interface Store {
  id: string;
  name: string;
  city: string;
  wereda: string;
  type: string; // e.g. "Main Store", "Sub Store", "Site Store", "Warehouse"
  createdAt: string;
}

export type MaterialCategory = 'Construction Equipment' | 'Construction Material' | 'Vehicle' | 'Fixed Asset';

export interface Material {
  id: string;
  code: string;
  category: MaterialCategory;
  description: string;
  unit: string; // e.g. "M²", "M³", "PCS", "Quintal", "Lt.", "KM"
  quantity: number;
  unitPrice: number;
  storeId: string; // The store it belongs to
  subCategory?: string;
  remarks?: string;
  createdAt: string;
  minimumStock?: number;
  maximumStock?: number;
  preparedById?: string;
  checkedById?: string;
  approvedById?: string;
}

export interface SystemUser {
  id: string;
  name: string;
  role: 'Store Keeper' | 'Stock Controller' | 'Warehouse Manager' | 'Project Manager';
  initials: string;
  email: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  email?: string;
  tin?: string;
  createdAt: string;
}

export interface PurchaseRequisition {
  id: string;
  code: string;
  date: string;
  srCode: string;
  description: string;
  unit: string;
  requestedQty: number;
}

export interface PurchaseEvaluationItem {
  id: string;
  supplierId: string; // From the list of suppliers registered
  price: number;
  taxRate: number; // e.g. 15 or 0
  discount: number; // e.g. 0 or 5 etc
  status: 'Winner' | 'Contender';
  winningReason?: 'Price' | 'Quality' | 'Credit' | 'Experience' | 'CEO Decision' | 'Sole Supplier';
  remark?: string;
}

export interface PurchaseEvaluation {
  id: string;
  code: string; // e.g., "BA-001" or a number representing No
  date: string;
  prId: string; // linked PurchaseRequisition
  srCode: string;
  description: string; // Item and Unit from PR
  unit: string;
  requestedQty: number;
  orderedQty: number;
  comparisons: PurchaseEvaluationItem[];
  status: string; // e.g., "Pending (1)", "Checked (1)", "PSL Checked (1)"
  remark?: string;
  technicalReviewBy?: string;
  approvedBy?: string;
  createdAt: string;
}

export interface BinCardTransaction {
  id: string;
  materialId: string;
  date: string;
  grnSivNo: string; // GRN / SIV No.
  receivedQty?: number;
  issuedQty?: number;
  returnedQty?: number;
  transferredQty?: number;
  plateNumber?: string;
  balance: number;
  unitPrice: number;
  remark?: string;
  signature: string;
  checkedById?: string;
  approvedById?: string;
  qaApprovedById?: string;
  qaStatus?: 'Approved' | 'Rejected' | 'Revision Required';
  qaRemark?: string;
  qaApprovedDate?: string;
}

export interface PurchaseOrderItem {
  id: string;
  prNo: string; // Linked PR code / reference
  description: string;
  code: string; // Item designation code
  unit: string; // UOM e.g. "pcs", "M²"
  quantity: number;
  unitPrice: number;
  remark?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string; // PO No. e.g. "00097" or "PO-0005"
  date: string; // GC Date e.g. "2026-06-03"
  type: 'Requested' | 'Direct' | 'Urgent' | string; // Dropdown
  evaluationId?: string; // Linked Proforma Comparison Evaluation
  supplierId: string; // Linked Supplier ID
  supplierName: string; // Loaded supplier name
  tinNumber?: string;
  address?: string;
  purchaserName?: string;
  currency: string; // e.g. "ETB", "USD"
  remark?: string;
  deliverySite: string; // Deliver to (Phison Realstate SC site etc.)
  deliveryDate: string; // on/before date
  additionalComments?: string;
  
  items: PurchaseOrderItem[];
  
  subTotal: number;
  vatRate: number; // e.g. 15 for 15% VAT, 0 for None
  vatAmount: number;
  amountWithVat: number;
  freightChargeType: string; // e.g. "No" or "Yes" or Custom Freight
  freightChargeAmount: number;
  withholdRate: number; // percentage e.g. 2 or 3 percent or 0
  withholdAmount: number;
  netPayableAmount: number;

  shipmentType: string; // "Land Freight", etc.
  paymentMethod: string; // "Bank Transfer", etc.
  preparedBy?: string;
  checkedBy?: string;
  approvedBy?: string;
  createdAt: string;
}

export interface InterStoreTransferItem {
  id: string;
  materialId: string; // Source material Id
  code: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  remark?: string;
}

export interface InterStoreTransfer {
  id: string;
  transferNo: string; // e.g. IST-1234
  date: string;
  fromStoreId: string;
  toStoreId: string;
  project: string;
  requisitionNo: string;
  shippedBy: string;
  plateNo: string;
  telephoneNo: string;
  items: InterStoreTransferItem[];
  requestedById: string;
  approvedById: string;
  issuedById: string;
  status: 'Draft' | 'Completed';
  createdAt: string;
}


