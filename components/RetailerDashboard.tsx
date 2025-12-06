
import React, { useState, useEffect } from 'react';
import { User, Batch, BatchStatus } from '../types';
import { LedgerService } from '../services/ledgerService';
import { 
  Scan, 
  ShoppingBag, 
  ArrowDownToLine, 
  CreditCard,
  Camera,
  AlertOctagon
} from 'lucide-react';
import QRScanner from './QRScanner';
import { toast } from 'react-toastify';

interface RetailerDashboardProps {
  user: User;
}

const RetailerDashboard: React.FC<RetailerDashboardProps> = ({ user }) => {
  const [activeMode, setActiveMode] = useState<'receive' | 'dispense'>('dispense');
  const [scanInput, setScanInput] = useState('');
  const [scannedBatch, setScannedBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [inventory, setInventory] = useState<Batch[]>([]);

  // Duplicate Detection State
  const [duplicateAlert, setDuplicateAlert] = useState<{detected: boolean, msg: string}>({ detected: false, msg: '' });

  useEffect(() => {
    fetchInventory();
  }, [user]);

  const fetchInventory = async () => {
    const data = await LedgerService.getBatches(user);
    setInventory(data);
  };

  const handleScan = async (e?: React.FormEvent, directInput?: string) => {
    if (e) e.preventDefault();
    const query = directInput || scanInput;
    if (!query.trim()) return;

    setLoading(true);
    setScannedBatch(null);
    setDuplicateAlert({ detected: false, msg: '' });

    try {
      // 1. First, check status via POS API (High speed, Anti-counterfeit)
      // This checks if the bottle was ALREADY sold elsewhere.
      if (activeMode === 'dispense') {
          const check = await LedgerService.checkPOSStatus(query.trim(), user.gln);
          if (check.status === 'DUPLICATE') {
              setDuplicateAlert({ detected: true, msg: check.message });
              // We stop here - DO NOT allow sale.
              toast.error("COUNTERFEIT ALERT: Duplicate Scan Detected!");
              setLoading(false);
              return;
          }
      }

      // 2. Retrieve Batch Details
      let batch = await LedgerService.getBatchByID(query.trim());
      if (!batch) batch = await LedgerService.verifyByHash(query.trim());

      if (batch) {
        setScannedBatch(batch);
        setScanInput(query.trim());
      } else {
        toast.error('Item not found on ledger.');
      }
    } catch (err) {
      toast.error('Scan Error');
    } finally {
      setLoading(false);
    }
  };

  const executeAction = async () => {
    if (!scannedBatch) return;
    try {
      if (activeMode === 'receive') {
        await LedgerService.receiveBatch(scannedBatch.batchID, user);
        toast.success(`Stock received: ${scannedBatch.productName}`);
      } else {
        await LedgerService.sellBatch(scannedBatch.batchID, user);
        toast.success(`Sale recorded: ${scannedBatch.productName}`);
      }
      setScannedBatch(null);
      setScanInput('');
      fetchInventory();
    } catch (err: any) {
      toast.error(err.message || 'Action failed.');
    }
  };

  return (
    <div className="w-full space-y-6">
      {showScanner && (
        <QRScanner onScan={(text) => { setShowScanner(false); setScanInput(text); handleScan(undefined, text); }} onClose={() => setShowScanner(false)} />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Retail Point of Sale (POS)</h2>
          <p className="text-slate-500 text-sm">Blockchain-Verified Dispensing</p>
        </div>
        
        <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex">
           <button onClick={() => setActiveMode('receive')} className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 ${activeMode === 'receive' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>
             <ArrowDownToLine size={16} /><span>Inbound</span>
           </button>
           <button onClick={() => setActiveMode('dispense')} className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 ${activeMode === 'dispense' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}>
             <ShoppingBag size={16} /><span>Checkout</span>
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Scanner Section */}
        <div className={`rounded-xl shadow-lg border p-6 ${duplicateAlert.detected ? 'bg-red-50 border-red-500' : 'bg-white border-slate-200'}`}>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Scan /> {activeMode === 'dispense' ? 'Scan to Sell' : 'Scan to Receive'}
            </h3>
            
            <div className="relative mb-6">
                <input 
                  autoFocus
                  type="text" 
                  value={scanInput}
                  onChange={e => setScanInput(e.target.value)}
                  placeholder="Scan QR or Enter ID..."
                  className="w-full pl-4 pr-12 py-4 text-lg border-2 border-slate-300 rounded-xl outline-none focus:border-blue-500 transition font-mono"
                />
                <button onClick={() => setShowScanner(true)} className="absolute right-3 top-3 text-slate-400 hover:text-blue-600">
                    <Camera size={24} />
                </button>
            </div>
            
            <button 
                onClick={(e) => handleScan(e)} 
                disabled={loading}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-lg font-bold transition shadow-md"
            >
                {loading ? 'Verifying Blockchain...' : 'Verify & Lookup'}
            </button>

            {/* DUPLICATE / COUNTERFEIT ALERT */}
            {duplicateAlert.detected && (
                <div className="mt-6 bg-red-100 border-l-4 border-red-600 p-4 rounded animate-pulse">
                    <div className="flex items-center gap-3">
                        <AlertOctagon className="text-red-600" size={32} />
                        <div>
                            <h4 className="font-black text-red-700 text-lg uppercase">Counterfeit Warning</h4>
                            <p className="text-red-800 font-medium">{duplicateAlert.msg}</p>
                            <p className="text-xs text-red-600 mt-1">This bottle ID was already sold. Do not dispense.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Valid Batch Result */}
            {scannedBatch && !duplicateAlert.detected && (
                <div className="mt-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-lg text-slate-800">{scannedBatch.productName}</h4>
                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">VERIFIED GENUINE</span>
                    </div>
                    <p className="font-mono text-xs text-slate-500 mb-4">{scannedBatch.batchID}</p>
                    <button 
                        onClick={executeAction}
                        className={`w-full py-3 rounded-lg font-bold text-white shadow-md ${activeMode === 'receive' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                    >
                        {activeMode === 'receive' ? 'Confirm Inbound Stock' : 'Confirm Sale & Deactivate ID'}
                    </button>
                </div>
            )}
        </div>

        {/* Inventory Stats */}
        <div className="space-y-4">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-2 text-slate-500">
                    <ShoppingBag />
                    <span className="font-bold uppercase text-sm">Available Stock</span>
                </div>
                <p className="text-4xl font-bold text-slate-800">{inventory.filter(b => b.status === BatchStatus.RECEIVED).length}</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-2 text-slate-500">
                    <CreditCard />
                    <span className="font-bold uppercase text-sm">Today's Sales</span>
                </div>
                <p className="text-4xl font-bold text-slate-800">{inventory.filter(b => b.status === BatchStatus.SOLD).length}</p>
            </div>
        </div>

      </div>
    </div>
  );
};

export default RetailerDashboard;
