import React, { useState, useEffect } from 'react';
import { User, Batch, BatchStatus } from '../types';
import { LedgerService } from '../services/ledgerService';
import { useRealTimeData } from '../hooks/useRealTimeData'; // Hook import
import { 
  Scan, Truck, PackageCheck, ClipboardCheck, AlertTriangle, 
  ArrowRight, CheckCircle2, Box, MapPin, Camera, Activity
} from 'lucide-react';
import QRScanner from './QRScanner';
import { toast } from 'react-toastify';

interface DistributorDashboardProps {
  user: User;
}

const DistributorDashboard: React.FC<DistributorDashboardProps> = ({ user }) => {
  const [scanInput, setScanInput] = useState('');
  const [scannedBatch, setScannedBatch] = useState<Batch | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  // Hook Integration
  const { liveFeed } = useRealTimeData(batches);

  const fetchInventory = async () => {
    const data = await LedgerService.getBatches(user);
    setBatches(data);
  };

  useEffect(() => {
    fetchInventory();
  }, [user]);

  // Handle Scanning (Looking up the batch)
  const handleScan = async (e?: React.FormEvent, directInput?: string) => {
    if (e) e.preventDefault();
    const query = directInput || scanInput;
    if (!query.trim()) return;
    
    setLoading(true);
    setScannedBatch(null);

    try {
      let batch = await LedgerService.getBatchByID(query.trim());
      if (!batch) batch = await LedgerService.verifyByHash(query.trim());

      if (batch) {
        setScannedBatch(batch);
        setScanInput(query.trim());
        toast.info(`Found batch: ${batch.productName}`);
      } else {
        toast.error('QR Code not recognized on the ledger.');
      }
    } catch (err) {
      toast.error('Scan failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCameraScan = (text: string) => {
    setShowScanner(false);
    setScanInput(text);
    handleScan(undefined, text);
  };

  const handleReceive = async () => {
    if (!scannedBatch) return;
    setActionLoading(true);
    try {
      await LedgerService.receiveBatch(scannedBatch.batchID, user);
      toast.success(`Successfully received ${scannedBatch.productName} into inventory.`);
      setScannedBatch(null);
      setScanInput('');
      fetchInventory(); 
    } catch (err: any) {
      toast.error(err.message || 'Failed to receive batch.');
    } finally {
      setActionLoading(false);
    }
  };

  const inboundCount = batches.filter(b => b.status === BatchStatus.IN_TRANSIT && b.currentOwnerGLN === user.gln).length;
  const inventoryCount = batches.filter(b => b.status === BatchStatus.RECEIVED).length;
  const recentReceipts = batches.filter(b => b.status === BatchStatus.RECEIVED).slice(0, 5);

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500">
      {showScanner && (
        <QRScanner 
          onScan={handleCameraScan} 
          onClose={() => setShowScanner(false)} 
        />
      )}

      <div>
        <h2 className="text-2xl font-bold text-slate-800">Distributor Operations</h2>
        <p className="text-slate-500">Inbound Logistics & Inventory Management</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Scan size={24} className="text-indigo-400" />
                  <span>Receive Shipment</span>
                </h3>
                <p className="text-sm text-slate-400">Scan QR Code on Pallet or Batch Box</p>
              </div>
              <button 
                onClick={() => setShowScanner(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-lg shadow-indigo-900/50"
              >
                <Camera size={18} />
                <span className="hidden sm:inline">Use Camera</span>
              </button>
            </div>
            
            <div className="p-8">
              <form onSubmit={e => handleScan(e)} className="relative mb-6">
                <input 
                  type="text" 
                  value={scanInput}
                  onChange={e => setScanInput(e.target.value)}
                  placeholder="Focus here to scan with external device..."
                  className="w-full pl-12 pr-4 py-4 text-lg border-2 border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-0 outline-none transition font-mono shadow-inner"
                  autoFocus
                />
                <Scan className="absolute left-4 top-5 text-slate-400" size={24} />
                <button 
                  type="submit" 
                  className="absolute right-3 top-2.5 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-bold"
                  disabled={loading}
                >
                  {loading ? 'Scanning...' : 'Lookup'}
                </button>
              </form>

              {scannedBatch && (
                <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden animate-in slide-in-from-bottom-4">
                  <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                    <h4 className="font-bold text-slate-800">Scanned Item Found</h4>
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                      scannedBatch.status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {scannedBatch.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="p-6 grid grid-cols-2 gap-4">
                     <div><p className="text-xs text-slate-400 uppercase font-bold">Product</p><p className="font-medium text-lg text-slate-900">{scannedBatch.productName}</p></div>
                     <div><p className="text-xs text-slate-400 uppercase font-bold">Batch ID</p><p className="font-mono text-slate-600">{scannedBatch.batchID}</p></div>
                     <div><p className="text-xs text-slate-400 uppercase font-bold">Quantity</p><p className="font-medium text-slate-900">{scannedBatch.quantity} {scannedBatch.unit}</p></div>
                     <div><p className="text-xs text-slate-400 uppercase font-bold">Expiry</p><p className="font-medium text-slate-900">{scannedBatch.expiryDate}</p></div>
                  </div>
                  <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                    <button 
                      onClick={handleReceive}
                      disabled={actionLoading || scannedBatch.status === 'RECEIVED'}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-md transition-all"
                    >
                      {actionLoading ? 'Updating Ledger...' : (
                        <>
                          <ClipboardCheck size={20} />
                          <span>Confirm Receipt & Stock</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-lg text-slate-800 mb-4">Recently Received</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                  <tr><th className="px-4 py-3">Batch</th><th className="px-4 py-3">Product</th><th className="px-4 py-3">Time Received</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentReceipts.map(b => (
                    <tr key={b.batchID} className="text-sm">
                      <td className="px-4 py-3 font-mono text-slate-600">{b.batchID}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{b.productName}</td>
                      <td className="px-4 py-3 text-slate-500">{new Date().toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {recentReceipts.length === 0 && <tr><td colSpan={3} className="p-4 text-center text-slate-400">No recent activity.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Stats & Map Sim */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
            <div className="absolute right-0 top-0 p-4 opacity-10"><Truck size={80} /></div>
            <div className="flex items-center gap-3 mb-2 opacity-80">
              <Truck size={20} />
              <span className="text-sm font-bold uppercase tracking-wider">Inbound Pending</span>
            </div>
            <p className="text-4xl font-bold">{inboundCount}</p>
            <p className="text-sm mt-2 opacity-70">Shipments en route to your GLN</p>
          </div>

          {/* Map Simulation */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-0 overflow-hidden">
             <div className="bg-slate-50 p-4 border-b border-slate-200">
               <h4 className="font-bold text-slate-700 flex items-center gap-2">
                 <MapPin size={16} /> Live Logistics Map
               </h4>
             </div>
             <div className="h-48 bg-slate-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/shattered-island.png')] opacity-50"></div>
                {/* Simulated Truck Dots */}
                <div className="absolute top-1/3 left-1/4 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-bounce"></div>
                <div className="absolute top-2/3 right-1/3 w-3 h-3 bg-indigo-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                <div className="absolute bottom-4 left-8 text-[10px] bg-white/80 px-2 py-1 rounded backdrop-blur-sm font-bold text-slate-600">
                   2 Trucks Active
                </div>
             </div>
          </div>

          {/* Live Activity Feed (From Hook) */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
             <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
               <Activity size={16} className="text-emerald-500" /> Network Activity
             </h4>
             <div className="space-y-3">
               {liveFeed.slice(0,3).map((log, i) => (
                 <div key={i} className="text-xs text-slate-600 border-l-2 border-slate-200 pl-2 py-1">
                   {log}
                 </div>
               ))}
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DistributorDashboard;