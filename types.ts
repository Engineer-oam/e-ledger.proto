
export enum UserRole {
  MANUFACTURER = 'MANUFACTURER', // Context: Distillery / Brewery
  DISTRIBUTOR = 'DISTRIBUTOR',   // Context: Bonded Warehouse / Wholesaler
  RETAILER = 'RETAILER',         // Context: Wine Shop / Bar
  REGULATOR = 'REGULATOR',       // Context: Excise Inspector / Officer
  AUDITOR = 'AUDITOR'
}

export enum BatchStatus {
  CREATED = 'DISTILLED',
  IN_TRANSIT = 'IN_TRANSIT',
  RECEIVED = 'RECEIVED',
  SOLD = 'SOLD',
  RECALLED = 'RECALLED',
  DESTROYED = 'DESTROYED',
  RETURNED = 'RETURNED',
  QUARANTINED = 'SEIZED', // Excise term
  BONDED = 'BONDED',      // New: In Bonded Warehouse (Duty Unpaid)
  DUTY_PAID = 'DUTY_PAID', // New: Duty Paid, ready for retail
  CONSUMED = 'CONSUMED'   // Bottle opened/scanned by consumer
}

export interface TraceEvent {
  eventID: string;
  type: 'MANUFACTURE' | 'DISPATCH' | 'RECEIVE' | 'SALE' | 'AGGREGATION' | 'TRANSFORMATION' | 'RETURN' | 'RETURN_RECEIPT' | 'SHIPMENT_RECEIPT' | 'DUTY_PAYMENT' | 'PERMIT_ISSUE' | 'RECALL' | 'POS_SCAN';
  timestamp: string;
  actorGLN: string;
  actorName: string;
  location: string;
  metadata?: Record<string, any>;
  txHash: string; // The SHA-256 Hash of this specific event
  previousHash: string; // The Hash of the previous event in the chain
}

export interface Batch {
  batchID: string;
  gtin: string; 
  lotNumber: string;
  expiryDate: string; 
  quantity: number;
  unit: string;
  manufacturerGLN: string;
  currentOwnerGLN: string;
  intendedRecipientGLN?: string;
  status: BatchStatus;
  trace: TraceEvent[];
  productName: string;
  integrityHash?: string; 
  
  // Excise Specific Fields
  alcoholContent?: number; // ABV %
  category?: 'IMFL' | 'BEER' | 'COUNTRY_LIQUOR' | 'WINE' | 'SPIRIT';
  dutyPaid?: boolean;
  
  // Blockchain Core
  blockchainId: string; // Unique Immutable Ledger ID
  genesisHash: string;  // Hash of the creation block
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userGLN: string;
  action: string;
  resourceId?: string;
  details: string;
  ipAddress?: string;
}

export interface LogisticsUnit {
  sscc: string;
  creatorGLN: string;
  status: 'CREATED' | 'SHIPPED' | 'RECEIVED';
  contents: string[];
  createdDate: string;
  txHash: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  gln: string;
  orgName: string;
}

export interface DashboardMetrics {
  totalBatches: number;
  activeShipments: number;
  alerts: number;
  complianceScore: number;
}

// --- NEW FOR MEDILEDGER PARITY ---

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  FAILED = 'FAILED',
  SUSPECT = 'SUSPECT', // Potential Counterfeit / Illicit
  DUPLICATE = 'DUPLICATE_SCAN' // Anti-Counterfeit Flag
}

export interface VerificationRequest {
  reqID: string;
  requesterGLN: string;
  responderGLN: string;
  gtin: string;
  serialOrLot: string;
  timestamp: string;
  status: VerificationStatus;
  responseMessage?: string;
}

// --- SUPPLY CHAIN FINANCE ---
export enum PaymentStatus {
  PAID = 'PAID',
  CREDIT = 'CREDIT',
  PENDING = 'PENDING',
  UNPAID = 'UNPAID',
  PARTIAL = 'PARTIAL',
  WAIVED = 'WAIVED'
}

export interface PaymentDetails {
  status: PaymentStatus;
  method: 'CASH' | 'CARD' | 'INSURANCE' | 'INVOICE' | 'CHALLAN';
  amount: number;
  currency: string;
  timestamp: string;
}

export interface GSTDetails {
  hsnCode: string;
  taxableValue: number;
  taxRate: number; 
  taxAmount: number;
  invoiceNo: string;
  invoiceDate: string;
}

export interface EWayBill {
  ewbNo: string;
  vehicleNo: string;
  fromPlace: string;
  toPlace: string;
  distanceKm: number;
  validUntil: string;
  generatedDate: string;
}

export enum ReturnReason {
  DAMAGED = 'DAMAGED',
  EXPIRED = 'EXPIRED',
  UNSOLD = 'UNSOLD',
  RECALLED = 'RECALLED',
  INCORRECT_ITEM = 'INCORRECT_ITEM'
}
