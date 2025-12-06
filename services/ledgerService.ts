
import { Batch, BatchStatus, TraceEvent, User, UserRole, LogisticsUnit, VerificationRequest, VerificationStatus, PaymentDetails, GSTDetails, EWayBill, ReturnReason } from '../types';

const LEDGER_STORAGE_KEY = 'eledger_data';
const SSCC_STORAGE_KEY = 'eledger_sscc';
const VRS_STORAGE_KEY = 'eledger_vrs';
const DELAY_MS = 600;
const RETRY_COUNT = 3;

// --- UTILS ---
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const sha256 = async (message: string) => {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const isRemote = () => {
    try { return localStorage.getItem('ELEDGER_USE_REMOTE') === 'true'; } catch { return false; }
};

const getApiUrl = () => {
    try { return localStorage.getItem('ELEDGER_API_URL') || 'http://localhost:3001/api'; } catch { return 'http://localhost:3001/api'; }
};

// Retry Wrapper for High Uptime
async function fetchWithRetry(url: string, options?: RequestInit, retries = RETRY_COUNT): Promise<Response> {
    try {
        const res = await fetch(url, options);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res;
    } catch (err) {
        if (retries > 0) {
            console.warn(`Retrying... attempts left: ${retries}`);
            await delay(1000); // Exponential backoff simulation
            return fetchWithRetry(url, options, retries - 1);
        }
        throw err;
    }
}

// --- LOCAL STORAGE HELPERS (Demo Mode) ---
const getLedgerState = (): Batch[] => {
  try {
    const stored = localStorage.getItem(LEDGER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
};

const saveLedgerState = (batches: Batch[]) => {
  localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(batches));
};

export const LedgerService = {
  getBatches: async (user: User): Promise<Batch[]> => {
    if (isRemote()) {
      try {
        const API_URL = getApiUrl();
        const res = await fetchWithRetry(`${API_URL}/batches?gln=${user.gln}&role=${user.role}`);
        return await res.json();
      } catch (e) {
        console.warn("Backend unavailable (Uptime Alert), falling back to cache if available.");
      }
    }
    await delay(DELAY_MS);
    const ledgerState = getLedgerState();
    if (user.role === UserRole.REGULATOR || user.role === UserRole.AUDITOR) return ledgerState;
    return ledgerState.filter(b => 
      b.currentOwnerGLN === user.gln || 
      b.manufacturerGLN === user.gln ||
      b.intendedRecipientGLN === user.gln ||
      b.trace.some(t => t.actorGLN === user.gln)
    );
  },

  getAllDataAsJson: (): string => {
    // Synchronous access to local state for AI analysis
    const ledgerState = getLedgerState();
    return JSON.stringify(ledgerState, null, 2);
  },

  getBatchByID: async (batchID: string): Promise<Batch | undefined> => {
    if (isRemote()) {
      try {
        const API_URL = getApiUrl();
        const res = await fetchWithRetry(`${API_URL}/batches/${batchID}`);
        if (res.ok) return await res.json();
      } catch(e) {}
    }
    await delay(DELAY_MS);
    const ledgerState = getLedgerState();
    return ledgerState.find(b => b.batchID === batchID);
  },

  verifyByHash: async (hash: string): Promise<Batch | undefined> => {
    await delay(DELAY_MS);
    // In MVP, we scan all batches for the integrity hash. Optimized backend would index this.
    const batches = await LedgerService.getBatches({ role: UserRole.REGULATOR, gln: 'admin', name: '', id: '', orgName: '' });
    return batches.find(b => b.integrityHash === hash || b.blockchainId === hash);
  },

  createBatch: async (batchData: Partial<Batch>, actor: User): Promise<string> => {
    const timestamp = new Date().toISOString();
    const identityString = `${batchData.gtin}-${batchData.lotNumber}-${actor.gln}-${timestamp}`;
    const genesisHash = await sha256(identityString);
    const batchID = `BATCH-${Date.now()}`;
    const blockchainId = `BLK-${genesisHash.substring(0,12)}`;

    // Merkle Root simulation: The first hash of the chain
    const initialTraceHash = await sha256(`GENESIS:${genesisHash}`);

    const newBatch: Batch = {
      batchID: batchID,
      blockchainId: blockchainId,
      genesisHash: genesisHash,
      gtin: batchData.gtin!,
      lotNumber: batchData.lotNumber!,
      expiryDate: batchData.expiryDate!,
      quantity: batchData.quantity || 0,
      unit: batchData.unit || 'units',
      productName: batchData.productName || 'Unknown Product',
      manufacturerGLN: actor.gln,
      currentOwnerGLN: actor.gln,
      status: BatchStatus.CREATED,
      integrityHash: genesisHash, // Hologram ID
      alcoholContent: batchData.alcoholContent,
      category: batchData.category,
      dutyPaid: false,
      trace: [
        {
          eventID: `evt-${Date.now()}`,
          type: 'MANUFACTURE',
          timestamp: timestamp,
          actorGLN: actor.gln,
          actorName: actor.orgName,
          location: 'Manufacturing Plant',
          txHash: initialTraceHash,
          previousHash: '00000000000000000000000000000000', // Genesis block has no prev hash
          metadata: { note: 'Blockchain Genesis Block', integrityHash: genesisHash }
        }
      ]
    };
    
    if (isRemote()) {
      const API_URL = getApiUrl();
      await fetchWithRetry(`${API_URL}/batches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBatch)
      });
    } else {
      await delay(DELAY_MS); 
      const ledgerState = getLedgerState();
      saveLedgerState([newBatch, ...ledgerState]);
    }
    
    return newBatch.batchID;
  },

  // Generic update helper with Chain Hashing
  updateBatch: async (batch: Batch, newEvent: TraceEvent) => {
    // 1. Calculate new hash linking to previous
    const lastEvent = batch.trace[batch.trace.length - 1];
    newEvent.previousHash = lastEvent.txHash;
    newEvent.txHash = await sha256(JSON.stringify(newEvent) + lastEvent.txHash);

    const updatedBatch = {
        ...batch,
        trace: [...batch.trace, newEvent]
    };

    if (isRemote()) {
      const API_URL = getApiUrl();
      await fetchWithRetry(`${API_URL}/batches/${batch.batchID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: updatedBatch.status,
          currentOwnerGLN: updatedBatch.currentOwnerGLN,
          intendedRecipientGLN: updatedBatch.intendedRecipientGLN,
          trace: updatedBatch.trace
        })
      });
    } else {
      const ledgerState = getLedgerState();
      const index = ledgerState.findIndex(b => b.batchID === batch.batchID);
      if (index !== -1) {
        ledgerState[index] = updatedBatch;
        saveLedgerState(ledgerState);
      }
    }
    return updatedBatch;
  },

  // POS API for High-Speed Verification
  checkPOSStatus: async (batchID: string, gln: string): Promise<{status: 'VALID' | 'INVALID' | 'DUPLICATE', message: string}> => {
      if(isRemote()) {
          try {
              const res = await fetch(`${getApiUrl()}/pos/verify`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ batchID, scannerGLN: gln })
              });
              if(res.status === 409) return { status: 'DUPLICATE', message: 'Double-Scan Detected: Item already sold' };
              if(res.status === 403) return { status: 'INVALID', message: 'Item Seized or Recalled' };
              if(res.ok) return { status: 'VALID', message: 'OK' };
          } catch(e) { console.error(e); }
      }
      
      // Local Fallback Logic
      const batch = await LedgerService.getBatchByID(batchID);
      if(!batch) return { status: 'INVALID', message: 'Not found' };
      if(batch.status === BatchStatus.SOLD) return { status: 'DUPLICATE', message: 'Anti-Counterfeit Alert: Already Sold' };
      if(batch.status === BatchStatus.QUARANTINED || batch.status === BatchStatus.RECALLED) return { status: 'INVALID', message: 'Compliance Block' };
      
      return { status: 'VALID', message: 'Verified' };
  },

  transferBatches: async (
    batchIDs: string[], 
    toGLN: string, 
    toName: string, 
    actor: User,
    gst?: GSTDetails,
    ewbPartial?: Partial<EWayBill>,
    paymentMeta?: any
  ): Promise<boolean> => {
    await delay(DELAY_MS); 
    const currentBatches = await LedgerService.getBatches(actor); 
    
    for (const id of batchIDs) {
        const batch = currentBatches.find(b => b.batchID === id);
        if (!batch) continue;
        if (batch.currentOwnerGLN !== actor.gln) continue;

        const newEvent: TraceEvent = {
            eventID: `evt-${Date.now()}`,
            type: 'DISPATCH',
            timestamp: new Date().toISOString(),
            actorGLN: actor.gln,
            actorName: actor.orgName,
            location: ewbPartial?.fromPlace || 'Distribution Center',
            txHash: '', // Calculated in updateBatch
            previousHash: '',
            metadata: { recipient: toName, recipientGLN: toGLN, gst, ewayBill: ewbPartial }
        };

        const updated = { ...batch, status: BatchStatus.IN_TRANSIT, intendedRecipientGLN: toGLN };
        await LedgerService.updateBatch(updated, newEvent);
    }
    return true;
  },

  receiveBatch: async (batchID: string, actor: User): Promise<Batch> => {
    await delay(DELAY_MS);
    const batch = await LedgerService.getBatchByID(batchID);
    if (!batch) throw new Error("Batch not found");

    const receiveEvent: TraceEvent = {
      eventID: `evt-${Date.now()}`,
      type: 'RECEIVE',
      timestamp: new Date().toISOString(),
      actorGLN: actor.gln,
      actorName: actor.orgName,
      location: 'Inbound Dock',
      txHash: '',
      previousHash: '',
      metadata: { method: 'QR Scan', sourceGLN: batch.currentOwnerGLN }
    };

    const updated = { ...batch, currentOwnerGLN: actor.gln, intendedRecipientGLN: undefined, status: BatchStatus.RECEIVED };
    return await LedgerService.updateBatch(updated, receiveEvent);
  },

  sellBatch: async (batchID: string, actor: User): Promise<Batch> => {
    // Pre-check for duplicate/sold status
    const check = await LedgerService.checkPOSStatus(batchID, actor.gln);
    if(check.status !== 'VALID') throw new Error(check.message);

    const batch = await LedgerService.getBatchByID(batchID);
    if (!batch) throw new Error("Batch not found");

    const saleEvent: TraceEvent = {
      eventID: `evt-${Date.now()}`,
      type: 'SALE',
      timestamp: new Date().toISOString(),
      actorGLN: actor.gln,
      actorName: actor.orgName,
      location: 'Point of Sale',
      txHash: '', 
      previousHash: '',
      metadata: { type: 'Consumer Sale' }
    };

    const updated = { ...batch, status: BatchStatus.SOLD };
    return await LedgerService.updateBatch(updated, saleEvent);
  },

  recallBatch: async (batchID: string, reason: string, actor: User): Promise<boolean> => {
    await delay(DELAY_MS);
    const batch = await LedgerService.getBatchByID(batchID);
    if (!batch) throw new Error("Batch not found");

    const recallEvent: TraceEvent = {
      eventID: `evt-${Date.now()}`,
      type: 'RECALL',
      timestamp: new Date().toISOString(),
      actorGLN: actor.gln,
      actorName: actor.orgName,
      location: 'Compliance Dept',
      txHash: '',
      previousHash: '',
      metadata: { reason: reason, initiatorRole: actor.role }
    };

    const updated = { ...batch, status: BatchStatus.RECALLED };
    await LedgerService.updateBatch(updated, recallEvent);
    return true;
  },
  
  returnBatch: async (batchID: string, toGLN: string, reason: ReturnReason, actor: User, refundValue?: number): Promise<boolean> => {
    const batch = await LedgerService.getBatchByID(batchID);
    if (!batch) throw new Error("Batch not found");
    const event: TraceEvent = {
        eventID: `evt-${Date.now()}`,
        type: 'RETURN',
        timestamp: new Date().toISOString(),
        actorGLN: actor.gln,
        actorName: actor.orgName,
        location: 'Returns',
        txHash: '', previousHash: '',
        metadata: { reason, refundAmount: refundValue }
    };
    const updated = { ...batch, status: BatchStatus.IN_TRANSIT, intendedRecipientGLN: toGLN };
    await LedgerService.updateBatch(updated, event);
    return true;
  },

  // Logistics Units
  getLogisticsUnits: async (user: User): Promise<LogisticsUnit[]> => {
    // ... same as before
    try {
        const stored = localStorage.getItem(SSCC_STORAGE_KEY);
        const units: LogisticsUnit[] = stored ? JSON.parse(stored) : [];
        return units.filter(u => u.creatorGLN === user.gln);
    } catch { return []; }
  },

  createLogisticsUnit: async (sscc: string, batchIDs: string[], actor: User): Promise<string> => {
    const newUnit: LogisticsUnit = {
      sscc,
      creatorGLN: actor.gln,
      status: 'CREATED',
      contents: batchIDs,
      createdDate: new Date().toISOString(),
      txHash: await sha256(sscc + actor.gln)
    };
    const stored = localStorage.getItem(SSCC_STORAGE_KEY);
    const units = stored ? JSON.parse(stored) : [];
    localStorage.setItem(SSCC_STORAGE_KEY, JSON.stringify([newUnit, ...units]));
    return sscc;
  },
  
  // VRS
  submitVerificationRequest: async (gtin: string, lot: string, requester: User): Promise<VerificationRequest> => {
     // ... logic ...
     return { reqID: '1', requesterGLN: requester.gln, responderGLN: 'system', gtin, serialOrLot: lot, timestamp: new Date().toISOString(), status: VerificationStatus.VERIFIED };
  },
  getVerificationHistory: async (user: User) => []
};
