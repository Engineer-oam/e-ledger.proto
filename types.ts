

export enum Sector {
  EXCISE = 'EXCISE',
  PHARMA = 'PHARMA',
  FMCG = 'FMCG',
  AGRICULTURE = 'AGRICULTURE',
  LOGISTICS = 'LOGISTICS',
  TEXTILE = 'TEXTILE',
  AUTOMOTIVE = 'AUTOMOTIVE',
  ELECTRONICS = 'ELECTRONICS',
  GENERAL = 'GENERAL'
}

export enum ERPType {
  SAP = 'SAP / ORACLE',
  TALLY = 'TALLY',
  ZOHO = 'ZOHO / ODOO',
  MARG = 'MARG ERP',
  MANUAL = 'NO ERP (MANUAL)'
}

export enum UserRole {
  MANUFACTURER = 'MANUFACTURER',
  DISTRIBUTOR = 'DISTRIBUTOR',
  RETAILER = 'RETAILER',
  REGULATOR = 'REGULATOR',
  INSPECTION_AGENCY = 'INSPECTION_AGENCY',
  FINANCIER = 'FINANCIER',
  AUDITOR = 'AUDITOR',
  EXPORTER = 'EXPORTER',
  IMPORTER = 'IMPORTER',
  LOGISTICS_PROVIDER = 'LOGISTICS_PROVIDER',
  CUSTOMS_OFFICIAL = 'CUSTOMS_OFFICIAL',
  PORT_OPERATOR = 'PORT_OPERATOR',
  SYSTEM_ADMIN = 'SYSTEM_ADMIN'
}

export enum BatchStatus {
  CREATED = 'CREATED',
  IN_TRANSIT = 'IN_TRANSIT',
  RECEIVED = 'RECEIVED',
  SOLD = 'SOLD',
  RECALLED = 'RECALLED',
  DESTROYED = 'DESTROYED',
  RETURNED = 'RETURNED',
  QUARANTINED = 'QUARANTINED',
  BONDED = 'BONDED',
  DUTY_PAID = 'DUTY_PAID',
  CONSUMED = 'CONSUMED'
}

export interface TraceEvent {
  eventID: string;
  type: string;
  timestamp: string;
  actorGLN: string;
  actorName: string;
  location: string;
  metadata?: Record<string, any>;
  txHash: string;
  previousHash: string;
  
  // Return specific fields
  returnReason?: ReturnReason;
  returnQuantity?: number;
  returnRecipientGLN?: string;
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
  
  // Dynamic Context
  sector: Sector;
  country: string;
  
  // Industry Specific
  alcoholContent?: number; 
  category?: string;
  dutyPaid?: boolean;
  dosageForm?: string; // Pharma specific
  serialNumber?: string; // Pharma specific (SGTIN)
  
  // GST Compliance Fields
  hsnCode?: string;
  taxableValue?: number;
  taxRate?: number;
  taxAmount?: number;
  mrp?: number; // Maximum Retail Price (India Specific)

  // Return tracking
  totalReturnedQuantity?: number;

  blockchainId: string;
  genesisHash: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  gln: string;
  orgName: string;
  country: string;
  sector: Sector;
  positionLabel: string;
  erpType: ERPType;
  erpStatus: 'CONNECTED' | 'DISCONNECTED' | 'PENDING';
  subCategories?: string[];
}

// Internal ERP Data Structures
export interface ProductionOrder {
  id: string;
  productName: string;
  plannedQty: number;
  actualQty: number;
  startDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  sectorSpecifics: Record<string, any>;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  stockLevel: number;
  minLevel: number;
  unit: string;
}

export interface SaleOrder {
  id: string;
  customerName: string;
  totalAmount: number;
  date: string;
  items: Array<{name: string, qty: number, price: number}>;
  syncStatus: 'SYNCED' | 'PENDING';
}

export interface CountryConfig {
  code: string;
  name: string;
  // Fix: Made sectors optional to support countries that only have a subset of industries
  sectors: {
    [key in Sector]?: {
      roles: Array<{
        role: UserRole;
        label: string;
        description: string;
      }>
    }
  }
}

export enum VerificationStatus {
  VERIFIED = 'VERIFIED',
  FAILED = 'FAILED',
  SUSPECT = 'SUSPECT'
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

export enum ReturnReason {
  DAMAGED = 'DAMAGED',
  EXPIRED = 'EXPIRED',
  RECALLED = 'RECALLED',
  WRONG_ITEM = 'WRONG_ITEM',
  OTHER = 'OTHER'
}

export enum StakeholderRole {
  // Platform Users (Transacting Entities)
  MANUFACTURER = 'MANUFACTURER',
  EXPORTER = 'EXPORTER',
  IMPORTER = 'IMPORTER',
  DISTRIBUTOR = 'DISTRIBUTOR',
  RETAILER = 'RETAILER',
  PHARMA_COMPANY = 'PHARMA_COMPANY',
  FMCG_COMPANY = 'FMCG_COMPANY',
  MSME = 'MSME',

  // Workflow Validators
  INSPECTION_AGENCY = 'INSPECTION_AGENCY',
  QUALITY_CONTROLLER = 'QUALITY_CONTROLLER',
  LOGISTICS_PROVIDER = 'LOGISTICS_PROVIDER',
  PORT_OPERATOR = 'PORT_OPERATOR',
  CUSTOMS_BROKER = 'CUSTOMS_BROKER',

  // Regulatory Nodes
  CUSTOMS_OFFICIAL = 'CUSTOMS_OFFICIAL',
  REGULATOR = 'REGULATOR',
  TRADE_AUTHORITY = 'TRADE_AUTHORITY', // DGFT, State Depts
  
  // Financial Participants
  BANKER = 'BANKER',
  FINANCIER = 'FINANCIER',
  INSURER = 'INSURER',
  EXPORT_CREDIT_AGENCY = 'EXPORT_CREDIT_AGENCY',

  // Governance & Technical
  GOVERNANCE_COUNCIL = 'GOVERNANCE_COUNCIL',
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  AUDITOR = 'AUDITOR'
}

export interface Stakeholder {
  id: string;
  name: string;
  role: StakeholderRole;
  gln: string;
  email?: string;
}

export interface ExportDetails {
  isExport: boolean;
  countryOfOrigin?: string;
  portOfEntry?: string;
  portOfExit?: string;
  currency?: string;
  customsDutyRate?: number;
  customsBrokerGLN?: string;
  incoterms?: string; // e.g., FOB, CIF
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

export enum PaymentStatus {
  PAID = 'PAID',
  UNPAID = 'UNPAID',
  PARTIAL = 'PARTIAL',
  WAIVED = 'WAIVED',
  CREDIT = 'CREDIT'
}

export interface PaymentDetails {
  totalAmount: number;
  amountPaid: number;
  amountRemaining: number;
  waivedAmount: number;
  status: PaymentStatus;
  method: string;
  notes?: string;
}

export interface LogisticsUnit {
  sscc: string;
  creatorGLN: string;
  status: 'CREATED' | 'IN_TRANSIT' | 'RECEIVED' | 'DEPARTED';
  contents: string[];
  createdDate: string;
  txHash: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userGLN: string;
  action: string;
  resourceId: string;
  details: string;
}