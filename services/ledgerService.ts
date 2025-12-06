
import { Batch, BatchStatus, TraceEvent, User, UserRole, LogisticsUnit, VerificationRequest, VerificationStatus, PaymentDetails, GSTDetails, EWayBill, ReturnReason } from '../types';

const LEDGER_STORAGE_KEY = 'eledger_data';
const SSCC_STORAGE_KEY = 'eledger_sscc';
const VRS_STORAGE_KEY = 'eledger_vrs';
const DELAY_MS = 800;
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- REMOTE API CONFIGURATION ---
const isRemote = () => {
    try {
        return localStorage.getItem('ELEDGER_USE_REMOTE') === 'true';
    } catch { return false; }
};

const getApiUrl = () => {
    try {
        return localStorage.getItem('ELEDGER_API_URL') || 'http://localhost:3001/api';
    } catch { return 'http://localhost:3001/api'; }
};

// --- LOCAL STORAGE HELPERS (Demo Mode) ---
const getLedgerState = (): Batch[] => {
  try {
    const stored = localStorage.getItem(LEDGER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to parse Ledger State", e);
    return [];
  }
};

const saveLedgerState = (batches: Batch[]) => {
  localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(batches));
};

const getSSCCState = (): LogisticsUnit[] => {
  try {
    const stored = localStorage.getItem(SSCC_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
};

const saveSSCCState = (units: LogisticsUnit[]) => {
  localStorage.setItem(SSCC_STORAGE_KEY, JSON.stringify(units));
};

const getVRSState = (): VerificationRequest[] => {
  try {
    const stored = localStorage.getItem(VRS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
};

const saveVRSState = (reqs: VerificationRequest[]) => {
  localStorage.setItem(VRS_STORAGE_KEY, JSON.stringify(reqs));
};

const generateIntegrityHash = async (data: string): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const LedgerService = {
  // Query: Get all batches
  getBatches: async (user: User): Promise<Batch[]> => {
    if (isRemote()) {
      try {
        const API_URL = getApiUrl();
        const res = await fetch(`${API_URL}/batches?gln=${user.gln}&role=${user.role}`);
        if (!res.ok) throw new Error('API Error');
        return await res.json();
      } catch (e) {
        console.warn("Backend unavailable, falling back to local.");
      }
    }

    await delay(DELAY_MS);
    const ledgerState = getLedgerState();

    if (user.role === UserRole.REGULATOR || user.role === UserRole.AUDITOR) {
      return ledgerState; 
    }
    
    return ledgerState.filter(b => 
      b.currentOwnerGLN === user.gln || 
      b.manufacturerGLN === user.gln ||
      b.intendedRecipientGLN === user.gln ||
      b.trace.some(t => t.actorGLN === user.gln)
    );
  },

  getBatchByID: async (batchID: string): Promise<Batch | undefined> => {
    if (isRemote()) {
      try {
        const API_URL = getApiUrl();
        const res = await fetch(`${API_URL}/batches/${batchID}`);
        if (res.ok) return await res.json();
      } catch(e) {}
    }

    await delay(DELAY_MS);
    const ledgerState = getLedgerState();
    return ledgerState.find(b => b.batchID === batchID);
  },

  verifyByHash: async (hash: string): Promise<Batch | undefined> => {
    // API verification would need a specific endpoint, simplified to fetch all for match in hybrid
    await delay(DELAY_MS);
    const batches = await LedgerService.getBatches({ role: UserRole.REGULATOR, gln: 'admin', name: '', id: '', orgName: '' });
    return batches.find(b => b.integrityHash === hash);
  },

  createBatch: async (batchData: Partial<Batch>, actor: User): Promise<string> => {
    const identityString = `${batchData.gtin}-${batchData.lotNumber}-${actor.gln}-${Date.now()}`;
    const integrityHash = await generateIntegrityHash(identityString);

    const newBatch: Batch = {
      batchID: `BATCH-${Date.now()}`,
      gtin: batchData.gtin!,
      lotNumber: batchData.lotNumber!,
      expiryDate: batchData.expiryDate!,
      quantity: batchData.quantity || 0,
      unit: batchData.unit || 'units',
      productName: batchData.productName || 'Unknown Product',
      manufacturerGLN: actor.gln,
      currentOwnerGLN: actor.gln,
      status: BatchStatus.CREATED,
      integrityHash: integrityHash,
      trace: [
        {
          eventID: `evt-${Date.now()}`,
          type: 'MANUFACTURE',
          timestamp: new Date().toISOString(),
          actorGLN: actor.gln,
          actorName: actor.orgName,
          location: 'Manufacturing Plant',
          txHash: `0x${Math.random().toString(16).slice(2)}`,
          metadata: { note: 'Initial creation', integrityHash: integrityHash }
        }
      ]
    };
    
    if (isRemote()) {
      const API_URL = getApiUrl();
      await fetch(`${API_URL}/batches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBatch)
      });
    } else {
      await delay(DELAY_MS * 2); 
      const ledgerState = getLedgerState();
      saveLedgerState([newBatch, ...ledgerState]);
    }
    
    return newBatch.batchID;
  },

  // Generic update helper
  updateBatch: async (batch: Batch) => {
    if (isRemote()) {
      const API_URL = getApiUrl();
      await fetch(`${API_URL}/batches/${batch.batchID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: batch.status,
          currentOwnerGLN: batch.currentOwnerGLN,
          intendedRecipientGLN: batch.intendedRecipientGLN,
          trace: batch.trace
        })
      });
    } else {
      const ledgerState = getLedgerState();
      const index = ledgerState.findIndex(b => b.batchID === batch.batchID);
      if (index !== -1) {
        ledgerState[index] = batch;
        saveLedgerState(ledgerState);
      }
    }
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
    await delay(DELAY_MS); // Simulate processing time for UX
    
    // Fetch fresh state
    const currentBatches = await LedgerService.getBatches(actor); 
    
    // EWB Logic
    let generatedEWB: EWayBill | undefined;
    if (ewbPartial && ewbPartial.distanceKm) {
        generatedEWB = {
            ewbNo: `141${Math.floor(100000000 + Math.random() * 900000000)}`,
            vehicleNo: ewbPartial.vehicleNo || 'XX-00-XX-0000',
            fromPlace: ewbPartial.fromPlace || 'Source Hub',
            toPlace: ewbPartial.toPlace || 'Destination Hub',
            distanceKm: ewbPartial.distanceKm,
            generatedDate: new Date().toISOString(),
            validUntil: new Date(Date.now() + 86400000).toISOString()
        };
    }

    for (const id of batchIDs) {
        const batch = currentBatches.find(b => b.batchID === id);
        if (!batch) continue;

        if (batch.currentOwnerGLN !== actor.gln) continue;

        const metadata: Record<string, any> = { recipient: toName, recipientGLN: toGLN, bulkTransferId: `TX-${Date.now()}` };
        if (gst) metadata.gst = gst;
        if (generatedEWB) metadata.ewayBill = generatedEWB;
        if (paymentMeta) metadata.paymentDetails = paymentMeta;

        const newEvent: TraceEvent = {
            eventID: `evt-${Date.now()}-${Math.floor(Math.random()*1000)}`,
            type: 'DISPATCH',
            timestamp: new Date().toISOString(),
            actorGLN: actor.gln,
            actorName: actor.orgName,
            location: ewbPartial?.fromPlace || 'Distribution Center',
            txHash: `0x${Math.random().toString(16).slice(2)}`,
            metadata: metadata
        };

        const updatedBatch = {
            ...batch,
            status: BatchStatus.IN_TRANSIT,
            intendedRecipientGLN: toGLN, 
            trace: [...batch.trace, newEvent] 
        };

        await LedgerService.updateBatch(updatedBatch);
    }
    return true;
  },

  transferBatch: async (id: string, toGLN: string, toName: string, actor: User, gst?: any, ewb?: any, pay?: any) => {
    return await LedgerService.transferBatches([id], toGLN, toName, actor, gst, ewb, pay);
  },

  returnBatch: async (batchID: string, toGLN: string, reason: ReturnReason, actor: User, refundValue?: number): Promise<boolean> => {
    await delay(DELAY_MS);
    const batch = await LedgerService.getBatchByID(batchID);
    if (!batch) throw new Error("Batch not found");

    if (batch.currentOwnerGLN !== actor.gln) throw new Error("Not owner");

    const metadata: Record<string, any> = { reason, returnTo: toGLN };
    if (refundValue) {
        metadata.refundAmount = refundValue;
        metadata.currency = 'INR';
        metadata.creditNoteId = `CN-${Date.now().toString().slice(-8)}`;
    }

    const returnEvent: TraceEvent = {
        eventID: `evt-${Date.now()}`,
        type: 'RETURN',
        timestamp: new Date().toISOString(),
        actorGLN: actor.gln,
        actorName: actor.orgName,
        location: 'Returns Dept',
        txHash: `0x${Math.random().toString(16).slice(2)}`,
        metadata: metadata
    };

    const updatedBatch = {
        ...batch,
        status: BatchStatus.IN_TRANSIT,
        intendedRecipientGLN: toGLN,
        trace: [...batch.trace, returnEvent]
    };

    await LedgerService.updateBatch(updatedBatch);
    return true;
  },

  receiveBatch: async (batchID: string, actor: User): Promise<Batch> => {
    await delay(DELAY_MS);
    const batch = await LedgerService.getBatchByID(batchID);
    if (!batch) throw new Error("Batch not found");

    if (batch.intendedRecipientGLN && batch.intendedRecipientGLN !== actor.gln) {
        throw new Error("Wrong recipient");
    }

    const lastEvent = batch.trace[batch.trace.length - 1];
    const isReturnReceipt = lastEvent.type === 'RETURN';
    const eventType = isReturnReceipt ? 'RETURN_RECEIPT' : 'SHIPMENT_RECEIPT';
    const newStatus = isReturnReceipt ? BatchStatus.QUARANTINED : BatchStatus.RECEIVED;

    const receiveEvent: TraceEvent = {
      eventID: `evt-${Date.now()}`,
      type: eventType,
      timestamp: new Date().toISOString(),
      actorGLN: actor.gln,
      actorName: actor.orgName,
      location: 'Inbound Dock',
      txHash: `0x${Math.random().toString(16).slice(2)}`,
      metadata: { method: 'QR Scan', sourceGLN: batch.currentOwnerGLN }
    };

    const updatedBatch = {
      ...batch,
      currentOwnerGLN: actor.gln, 
      intendedRecipientGLN: undefined, 
      status: newStatus,
      trace: [...batch.trace, receiveEvent]
    };

    await LedgerService.updateBatch(updatedBatch);
    return updatedBatch;
  },

  sellBatch: async (batchID: string, actor: User, payment?: PaymentDetails): Promise<Batch> => {
    await delay(DELAY_MS);
    const batch = await LedgerService.getBatchByID(batchID);
    if (!batch) throw new Error("Batch not found");

    const metadata: Record<string, any> = { type: 'Retail Dispense' };
    if (payment) {
      metadata.paymentStatus = payment.status;
      metadata.amount = payment.amount.toString();
      metadata.receiptId = `RCPT-${Date.now().toString().slice(-8)}`;
      metadata.paymentDetails = {
          totalAmount: payment.amount,
          amountPaid: payment.amount,
          status: 'PAID',
          method: payment.method
      };
    }

    const saleEvent: TraceEvent = {
      eventID: `evt-${Date.now()}`,
      type: 'SALE',
      timestamp: new Date().toISOString(),
      actorGLN: actor.gln,
      actorName: actor.orgName,
      location: 'Point of Sale',
      txHash: `0x${Math.random().toString(16).slice(2)}`,
      metadata
    };

    const updatedBatch = {
      ...batch,
      status: BatchStatus.SOLD,
      trace: [...batch.trace, saleEvent]
    };

    await LedgerService.updateBatch(updatedBatch);
    return updatedBatch;
  },

  getLogisticsUnits: async (user: User): Promise<LogisticsUnit[]> => {
    if (isRemote()) {
        try {
            const API_URL = getApiUrl();
            const res = await fetch(`${API_URL}/sscc?gln=${user.gln}`);
            return await res.json();
        } catch(e) {}
    }
    await delay(DELAY_MS);
    const units = getSSCCState();
    return units.filter(u => u.creatorGLN === user.gln); 
  },

  createLogisticsUnit: async (sscc: string, batchIDs: string[], actor: User): Promise<string> => {
    const newUnit: LogisticsUnit = {
      sscc,
      creatorGLN: actor.gln,
      status: 'CREATED',
      contents: batchIDs,
      createdDate: new Date().toISOString(),
      txHash: `0x${Math.random().toString(16).slice(2)}`
    };

    if (isRemote()) {
        const API_URL = getApiUrl();
        await fetch(`${API_URL}/sscc`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUnit)
        });
    } else {
        await delay(DELAY_MS);
        const units = getSSCCState();
        saveSSCCState([newUnit, ...units]);
    }
    return sscc;
  },

  // VRS
  submitVerificationRequest: async (gtin: string, lot: string, requester: User): Promise<VerificationRequest> => {
    await delay(DELAY_MS);
    // Note: VRS logic usually requires complex checks, for hybrid we'll stick to mostly local or simple API pass
    const batch = await LedgerService.getBatchByID(`${gtin}`); 
    
    // Fallback to purely local construction for stability in demo
    const req: VerificationRequest = {
        reqID: `req-${Date.now()}`,
        requesterGLN: requester.gln,
        responderGLN: 'UNKNOWN',
        gtin,
        serialOrLot: lot,
        timestamp: new Date().toISOString(),
        status: VerificationStatus.PENDING
    };
    // ... logic ...
    const vrsHistory = getVRSState();
    saveVRSState([req, ...vrsHistory]);
    return req;
  },

  getVerificationHistory: async (user: User): Promise<VerificationRequest[]> => {
    if (isRemote()) {
        try {
            const API_URL = getApiUrl();
            const res = await fetch(`${API_URL}/vrs?gln=${user.gln}`);
            return await res.json();
        } catch(e) {}
    }
    const vrsHistory = getVRSState();
    return vrsHistory.filter(r => r.requesterGLN === user.gln || r.responderGLN === user.gln);
  },

  getAllDataAsJson: (): string => {
    return JSON.stringify({
      batches: getLedgerState(),
      logisticsUnits: getSSCCState(),
      verifications: getVRSState()
    }, null, 2);
  }
};
