import React, { useState } from 'react';
import { User, Batch, TraceEvent } from '../types';
import { LedgerService } from '../services/ledgerService';
import { QrCode, Search, ShieldCheck, AlertTriangle, Truck, MapPin, Calendar, FileText, CheckCircle2, XCircle, Box } from 'lucide-react';

const EPassScanner: React.FC<{ user: User }> = ({ user }) => {
  const [ePassNo, setEPassNo] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<{ batch: Batch, event: TraceEvent } | null>(null);
  const [error, setError] = useState('');

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ePassNo.trim()) return;

    setIsScanning(true);
    setError('');
    setResult(null);

    try {
      // In a real app, we would query the backend by ePassNo directly.
      // Here, we'll fetch all batches and search their traces for the ePassNo.
      const allBatches = await LedgerService.exportLedger();
      let foundBatch: Batch | null = null;
      let foundEvent: TraceEvent | null = null;

      for (const batch of allBatches) {
        const event = batch.trace.find(evt => evt.ePassNo === ePassNo.trim() || evt.metadata?.ePass?.ePassNo === ePassNo.trim());
        if (event) {
          foundBatch = batch;
          foundEvent = event;
          break;
        }
      }

      if (foundBatch && foundEvent) {
        setResult({ batch: foundBatch, event: foundEvent });
      } else {
        setError('Invalid e-Pass Number. No records found.');
      }
    } catch (err) {
      setError('An error occurred while verifying the e-Pass.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5"><QrCode size={200} /></div>
        
        <div className="relative z-10">
          <h2 className="text-3xl font-black tracking-tight mb-2">e-Pass Scanner</h2>
          <p className="text-slate-400 max-w-lg">
            Verify transport permits for liquor consignments. Enter the e-Pass number to validate the shipment against the blockchain ledger.
          </p>
        </div>

        <form onSubmit={handleScan} className="relative z-10 mt-8 max-w-xl">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-12 pr-32 py-4 bg-white/10 border border-white/20 rounded-2xl text-lg text-white placeholder-slate-400 focus:ring-4 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all outline-none font-mono"
              placeholder="Enter EPASS-XXXXXX"
              value={ePassNo}
              onChange={(e) => setEPassNo(e.target.value)}
            />
            <button
              type="submit"
              disabled={isScanning || !ePassNo.trim()}
              className="absolute inset-y-2 right-2 px-6 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isScanning ? 'Scanning...' : 'Scan'}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex gap-4 items-start animate-in fade-in slide-in-from-bottom-4">
          <XCircle className="h-8 w-8 text-red-500 shrink-0" />
          <div>
            <h3 className="text-lg font-bold text-red-900 mb-1">Verification Failed</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          {/* Status Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex gap-4 items-start shadow-sm">
            <ShieldCheck className="h-8 w-8 text-emerald-600 shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-emerald-900">Valid e-Pass</h3>
                <span className="bg-emerald-200 text-emerald-800 text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider">Verified on Ledger</span>
              </div>
              <p className="text-emerald-700 mt-1">This transport permit is authentic and matches the blockchain record.</p>
            </div>
          </div>

          {/* e-Pass Details */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 md:p-8 border-b border-slate-100 flex items-center gap-4">
              <div className="h-12 w-12 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100 shrink-0">
                <FileText className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800">Permit Details</h3>
                <p className="text-sm font-mono text-slate-500">{result.event.metadata?.ePass?.ePassNo || result.event.ePassNo}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-100">
              <div className="bg-white p-6 md:p-8">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Truck size={14} /> Transport Info
                </p>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Vehicle Number</p>
                    <p className="font-mono font-bold text-slate-800 text-lg">{result.event.metadata?.ePass?.vehicleNo || result.event.vehicleNo || 'N/A'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">From</p>
                      <p className="font-bold text-slate-800">{result.event.metadata?.ePass?.fromLocation || result.event.location}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">To</p>
                      <p className="font-bold text-slate-800">{result.event.metadata?.ePass?.toLocation || result.event.metadata?.recipient || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Valid Until</p>
                    <p className="font-bold text-slate-800">
                      {result.event.metadata?.ePass?.validUntil 
                        ? new Date(result.event.metadata.ePass.validUntil).toLocaleString() 
                        : new Date(new Date(result.event.timestamp).getTime() + 86400000).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 md:p-8">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Box size={14} /> Consignment Info
                </p>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Product</p>
                    <p className="font-bold text-slate-800 text-lg">{result.batch.productName}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Batch ID</p>
                      <p className="font-mono font-bold text-slate-800">{result.batch.batchID}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Liquor Type</p>
                      <p className="font-bold text-slate-800">{result.batch.liquorType || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Quantity</p>
                      <p className="font-bold text-slate-800">{result.batch.quantity} units</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Volume</p>
                      <p className="font-bold text-slate-800">{result.batch.bulkLiters ? `${result.batch.bulkLiters} BL` : 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-500">
                <Calendar size={16} />
                <span className="text-sm font-medium">Dispatched on {new Date(result.event.timestamp).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Dispatched By:</span>
                <span className="text-sm font-bold text-slate-700">{result.event.actorName}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EPassScanner;
