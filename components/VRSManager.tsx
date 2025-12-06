import React, { useState, useEffect } from 'react';
import { User, VerificationRequest, VerificationStatus } from '../types';
import { LedgerService } from '../services/ledgerService';
import { ShieldCheck, Search, AlertOctagon, CheckCircle2, History, RefreshCcw, Box } from 'lucide-react';

interface VRSManagerProps {
  user: User;
}

const VRSManager: React.FC<VRSManagerProps> = ({ user }) => {
  const [gtin, setGtin] = useState('');
  const [lot, setLot] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<VerificationRequest | null>(null);
  const [history, setHistory] = useState<VerificationRequest[]>([]);

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadHistory = async () => {
    const data = await LedgerService.getVerificationHistory(user);
    setHistory(data);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gtin || !lot) return;
    
    setLoading(true);
    setCurrentResult(null);
    
    try {
      const result = await LedgerService.submitVerificationRequest(gtin, lot, user);
      setCurrentResult(result);
      loadHistory(); // Refresh list
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: VerificationStatus) => {
    switch (status) {
      case VerificationStatus.VERIFIED: return <CheckCircle2 className="text-green-500" />;
      case VerificationStatus.FAILED: return <AlertOctagon className="text-red-500" />;
      case VerificationStatus.SUSPECT: return <AlertOctagon className="text-orange-600" />;
      default: return <RefreshCcw className="text-slate-400 animate-spin" />;
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">VRS / Returns Verification</h2>
          <p className="text-slate-500 text-sm">Saleable Returns Verification Service (DSCSA Compliance)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Action Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                <ShieldCheck className="text-indigo-600" size={20} />
                <span>Verify Product</span>
            </h3>
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">GTIN (Product Identifier)</label>
                <input 
                  value={gtin}
                  onChange={e => setGtin(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="00012345678905"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Lot / Serial Number</label>
                <input 
                  value={lot}
                  onChange={e => setLot(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="LOT-2024-X"
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-md transition-colors flex justify-center items-center space-x-2"
              >
                {loading ? <span>Connecting to VRS...</span> : (
                  <>
                    <Search size={18} />
                    <span>Verify Item</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {currentResult && (
            <div className={`rounded-xl p-6 border-2 animate-in fade-in slide-in-from-top-4 ${
              currentResult.status === 'VERIFIED' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start space-x-3">
                <div className="mt-1">{getStatusIcon(currentResult.status)}</div>
                <div>
                  <h4 className={`font-bold text-lg ${
                     currentResult.status === 'VERIFIED' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {currentResult.status}
                  </h4>
                  <p className="text-sm font-medium opacity-80 mt-1">{currentResult.responseMessage}</p>
                  
                  <div className="mt-4 pt-4 border-t border-black/10 text-xs font-mono opacity-70">
                    <p>Req ID: {currentResult.reqID}</p>
                    <p>Responder: {currentResult.responderGLN}</p>
                    <p>Time: {new Date(currentResult.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: History Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center">
               <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                 <History size={20} className="text-slate-400" />
                 <span>Verification History Log</span>
               </h3>
               <span className="text-xs bg-slate-100 px-2 py-1 rounded-full text-slate-600 font-mono">
                 {history.length} Requests
               </span>
             </div>
             
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                   <tr>
                     <th className="px-6 py-3">Status</th>
                     <th className="px-6 py-3">Product / Lot</th>
                     <th className="px-6 py-3">Responder GLN</th>
                     <th className="px-6 py-3">Timestamp</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 text-sm">
                   {history.map(req => (
                     <tr key={req.reqID} className="hover:bg-slate-50">
                       <td className="px-6 py-4">
                         <span className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                           req.status === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                           req.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                           'bg-orange-100 text-orange-700'
                         }`}>
                           {req.status === 'VERIFIED' && <CheckCircle2 size={12} />}
                           {req.status !== 'VERIFIED' && <AlertOctagon size={12} />}
                           <span>{req.status}</span>
                         </span>
                       </td>
                       <td className="px-6 py-4">
                         <div className="flex items-center space-x-2">
                           <Box size={16} className="text-slate-400" />
                           <span className="font-mono text-slate-700">{req.gtin}</span>
                         </div>
                         <div className="text-xs text-slate-500 pl-6 mt-1">Lot: {req.serialOrLot}</div>
                       </td>
                       <td className="px-6 py-4 font-mono text-slate-500">{req.responderGLN}</td>
                       <td className="px-6 py-4 text-slate-500">{new Date(req.timestamp).toLocaleString()}</td>
                     </tr>
                   ))}
                   {history.length === 0 && (
                     <tr>
                       <td colSpan={4} className="p-8 text-center text-slate-400">No verification requests found.</td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VRSManager;