
import { Batch, BatchStatus, UserRole, User } from './types';

export const MOCK_USERS: User[] = [
  {
    id: 'user-mfg-01',
    name: 'John Distiller',
    role: UserRole.MANUFACTURER,
    gln: '0490001234567',
    orgName: 'Royal Spirits Distillery'
  },
  {
    id: 'user-dist-01',
    name: 'Bob Warehouse',
    role: UserRole.DISTRIBUTOR,
    gln: '0490001234568',
    orgName: 'State Bonded Warehouse #4'
  },
  {
    id: 'user-ret-01',
    name: 'Charlie Retail',
    role: UserRole.RETAILER,
    gln: '0490001234569',
    orgName: 'City Premium Wines'
  },
  {
    id: 'user-reg-01',
    name: 'Officer Vijay',
    role: UserRole.REGULATOR,
    gln: '0490001234599',
    orgName: 'State Excise Department'
  }
];

// Seed Data simulating Ledger State for Liquor
export const INITIAL_BATCHES: Batch[] = [
  {
    batchID: 'BATCH-20241001-A',
    gtin: '00089012345678',
    lotNumber: 'VAT-42',
    expiryDate: '2030-10-01', // Spirits shelf life
    quantity: 500,
    unit: 'Cases',
    manufacturerGLN: '0490001234567',
    currentOwnerGLN: '0490001234568', // Currently with Bonded Warehouse
    status: BatchStatus.BONDED,
    productName: 'Royal Reserve Whisky 750ml',
    alcoholContent: 42.8,
    category: 'IMFL',
    dutyPaid: false,
    blockchainId: 'BLK-INIT-001',
    genesisHash: '0xGENESIS001',
    trace: [
      {
        eventID: 'evt-001',
        type: 'MANUFACTURE',
        timestamp: '2024-10-01T08:00:00Z',
        actorGLN: '0490001234567',
        actorName: 'Royal Spirits Distillery',
        location: 'Plant A - Bottling Line',
        txHash: '0x123abc...789',
        previousHash: '0x00000000000000000000000000000000',
        metadata: { strength: '42.8%', type: 'IMFL' }
      },
      {
        eventID: 'evt-002',
        type: 'DISPATCH',
        timestamp: '2024-10-02T14:30:00Z',
        actorGLN: '0490001234567',
        actorName: 'Royal Spirits Distillery',
        location: 'Distillery Gate',
        txHash: '0x456def...012',
        previousHash: '0x123abc...789',
        metadata: { destination: 'Bonded Warehouse #4' }
      },
      {
        eventID: 'evt-003',
        type: 'RECEIVE',
        timestamp: '2024-10-03T09:15:00Z',
        actorGLN: '0490001234568',
        actorName: 'State Bonded Warehouse #4',
        location: 'Sector 5 Warehouse',
        txHash: '0x789ghi...345',
        previousHash: '0x456def...012'
      }
    ]
  },
  {
    batchID: 'BATCH-20241005-B',
    gtin: '00089098765432',
    lotNumber: 'BREW-99',
    expiryDate: '2025-04-20', // Beer expiry
    quantity: 2000,
    unit: 'Crates',
    manufacturerGLN: '0490001234567',
    currentOwnerGLN: '0490001234567',
    status: BatchStatus.CREATED,
    productName: 'Thunderbolt Strong Beer',
    alcoholContent: 8.0,
    category: 'BEER',
    dutyPaid: false,
    blockchainId: 'BLK-INIT-002',
    genesisHash: '0xGENESIS002',
    trace: [
      {
        eventID: 'evt-004',
        type: 'MANUFACTURE',
        timestamp: '2024-10-05T10:00:00Z',
        actorGLN: '0490001234567',
        actorName: 'Royal Spirits Distillery',
        location: 'Brewery Unit 2',
        txHash: '0xabc123...xyz',
        previousHash: '0x00000000000000000000000000000000'
      }
    ]
  },
  {
    batchID: 'BATCH-20240901-C',
    gtin: '00089011223344',
    lotNumber: 'IMP-01',
    expiryDate: '2029-12-01',
    quantity: 50,
    unit: 'Bottles',
    manufacturerGLN: '0490001234567',
    currentOwnerGLN: '0490001234569', // Retailer
    status: BatchStatus.SOLD,
    productName: 'Highland Single Malt 12Y',
    alcoholContent: 40.0,
    category: 'IMFL',
    dutyPaid: true,
    blockchainId: 'BLK-INIT-003',
    genesisHash: '0xGENESIS003',
    trace: [
      {
        eventID: 'evt-010',
        type: 'MANUFACTURE',
        timestamp: '2024-09-01T08:00:00Z',
        actorGLN: '0490001234567',
        actorName: 'Royal Spirits Distillery',
        location: 'Import Dock',
        txHash: '0xAAA...',
        previousHash: '0x00000000000000000000000000000000'
      },
      {
        eventID: 'evt-011',
        type: 'DUTY_PAYMENT',
        timestamp: '2024-09-02T10:00:00Z',
        actorGLN: '0490001234567',
        actorName: 'Royal Spirits Distillery',
        location: 'Excise Portal',
        txHash: '0xTAX123',
        previousHash: '0xAAA...',
        metadata: { challanNo: 'EXCISE-2024-999', amount: 500000 }
      },
      {
        eventID: 'evt-012',
        type: 'RECEIVE',
        timestamp: '2024-09-06T12:00:00Z',
        actorGLN: '0490001234569',
        actorName: 'City Premium Wines',
        location: 'High Street Store',
        txHash: '0xCCC...',
        previousHash: '0xTAX123'
      },
      {
        eventID: 'evt-013',
        type: 'SALE',
        timestamp: '2024-09-10T18:30:00Z',
        actorGLN: '0490001234569',
        actorName: 'City Premium Wines',
        location: 'POS Terminal 1',
        txHash: '0xEEE...',
        previousHash: '0xCCC...',
        metadata: { type: 'Consumer Sale' }
      }
    ]
  }
];
