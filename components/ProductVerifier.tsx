import React, { useState } from 'react';
import { LedgerService } from '../services/ledgerService';
import { Batch } from '../types';
import { Search, ShieldCheck, XCircle, Clock, MapPin, CheckCircle2, Fingerprint, Camera, Stamp } from 'lucide-react';
import QRScanner from './QRScanner';

const ProductVerifier: React.FC = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<Batch | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const handleVerify = async (e?: React.FormEvent, directInput?: string) => {
    if (e) e.preventDefault();
    const searchQuery = directInput || query;
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);
    setSearched(true);

    try {
      let batch = await LedgerService.verifyByHash(searchQuery.trim());
      if (!batch) {
        batch = await LedgerService.getBatchByID(searchQuery.trim());
      }

      if (batch) {
        setResult(batch);
        setQuery(searchQuery.trim());
      } else {
        setError('Invalid Hologram. This bottle may be illicit or counterfeit.');
      }
    } catch (err) {
      setError('Verification Error.');
    } finally {
      setLoading(false);
    }
  };

  const handleCameraScan = (text: string) => {
    setShowScanner(false);
    setQuery(text);
    handleVerify(undefined, text);
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      {showScanner && (
        <QRScanner 
          onScan={handleCameraScan} 
          onClose={() => setShowScanner(false)} 
        />
      )}

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-full mb-4">
          <Stamp size={32} className="text-indigo-600" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900">Excise Hologram Verify</h2>
        <p className="text-slate-500 mt-2">Scan QR or enter ID to check Duty Paid status.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200 mb-8">
        <form onSubmit={e => handleVerify(e)} className="p-2 md:p-4 flex flex-col md:flex-row items-center gap-2 md:gap-4 bg-slate-50 border-b border-slate-100">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter Batch ID or Hash..."
              className="w-full pl-12 pr-12 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition font-mono text-sm"
            />
            <button
               type="button"
               onClick={() => setShowScanner(true)}
               className="absolute right-3 top-2.5 p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
               title="Scan"
            >
               <Camera size={20} />
            </button>
          </div>
          <button 
            type="submit" 
            disabled={loading || !query}
            className="w-full md:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors shadow-md"
          >
            {loading ? 'Checking...' : 'Verify'}
          </button>
        </form>

        {searched && !loading && !result && !error && (
           <div className="p-12 text-center text-slate-400">Scan result will appear here.</div>
        )}

        {error && (
          <div className="p-8 text-center bg-red-50">
            <XCircle size={48} className="text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-red-700">Verification Failed</h3>
            <p className="text-red-600 mt-1">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-white animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className={`p-6 flex items-center justify-between ${result.dutyPaid ? 'bg-green-600' : 'bg-amber-500'} text-white`}>
              <div>
                <div className="flex items-center space-x-2 font-bold opacity-90 uppercase tracking-wider text-xs mb-1">
                  <CheckCircle2 size={14} />
                  <span>{result.dutyPaid ? 'Official & Duty Paid' : 'Bonded / Duty Unpaid'}</span>
                </div>
                <h3 className="text-2xl font-bold">{result.productName}</h3>
              </div>
              <div className="text-right hidden sm:block">
                <p className="opacity-80 text-xs">Category</p>
                <p className="text-xl font-bold uppercase tracking-wide">{result.category || 'LIQUOR'}</p>
              </div>
            </div>

            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Bottle Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 uppercase">Alcohol Content</p>
                    <p className="font-medium text-slate-800">{result.alcoholContent}% ABV</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 uppercase">Volume</p>
                    <p className="font-medium text-slate-800">{result.quantity} {result.unit}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 uppercase">Batch ID</p>
                    <p className="font-mono text-xs font-bold text-slate-800 break-all">{result.batchID}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 uppercase">Expiry / Date</p>
                    <p className="font-medium text-slate-800">{result.expiryDate}</p>
                  </div>
                </div>

                {result.integrityHash && (
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <div className="flex items-center space-x-2 text-indigo-700 mb-2">
                      <Fingerprint size={18} />
                      <span className="font-bold text-sm">Hologram Hash Match</span>
                    </div>
                    <p className="font-mono text-[10px] break-all bg-white p-2 rounded border border-indigo-200 text-slate-500">
                      {result.integrityHash}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">Supply Chain Trace</h4>
                <div className="space-y-6 relative pl-6 border-l-2 border-slate-200">
                  {result.trace.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).map((event, idx) => (
                    <div key={idx} className="relative">
                       <div className={`absolute -left-[31px] w-4 h-4 rounded-full border-2 border-white shadow-sm ${idx === 0 ? 'bg-indigo-500' : 'bg-slate-300'}`}></div>
                       <div>
                         <p className="font-bold text-sm text-slate-800">{event.type}</p>
                         <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                           <Clock size={12} />
                           {new Date(event.timestamp).toLocaleDateString()}
                         </p>
                         <div className="mt-2 bg-slate-50 p-2 rounded border border-slate-100 text-xs">
                           <p className="font-medium text-slate-700">{event.actorName}</p>
                           <p className="text-slate-500 flex items-center gap-1">
                             <MapPin size={10} />
                             {event.location}
                           </p>
                         </div>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductVerifier;