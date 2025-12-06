
import React, { useState, useEffect } from 'react';
import { User, Batch, LogisticsUnit, BatchStatus } from '../types';
import { LedgerService } from '../services/ledgerService';
import { AuthService } from '../services/authService';
import { Package, Plus, Printer, Box, CheckSquare, Square } from 'lucide-react';
import SSCCLabel from './SSCCLabel';
import { toast } from 'react-toastify';

interface SSCCManagerProps {
  user: User;
}

const SSCCManager: React.FC<SSCCManagerProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [units, setUnits] = useState<LogisticsUnit[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]); // Available batches
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewingLabel, setViewingLabel] = useState<LogisticsUnit | null>(null);

  useEffect(() => {
    fetchUnits();
    fetchBatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchUnits = async () => {
    const data = await LedgerService.getLogisticsUnits(user);
    setUnits(data);
  };

  const fetchBatches = async () => {
    const data = await LedgerService.getBatches(user);
    // Filter batches that can be aggregated. 
    // Allow Bonded, Duty Paid, and Received stock to be palletized.
    setBatches(data.filter(b => 
        b.status === BatchStatus.CREATED || 
        b.status === BatchStatus.BONDED || 
        b.status === BatchStatus.DUTY_PAID || 
        b.status === BatchStatus.RECEIVED
    ));
  };

  const toggleBatchSelection = (batchID: string) => {
    if (selectedBatches.includes(batchID)) {
      setSelectedBatches(prev => prev.filter(id => id !== batchID));
    } else {
      setSelectedBatches(prev => [...prev, batchID]);
    }
  };

  const handleCreateUnit = async () => {
    if (selectedBatches.length === 0) return;
    setLoading(true);
    
    try {
      // 1. Generate SSCC
      const sscc = AuthService.generateSSCC(user.gln);
      
      // 2. Commit to Ledger
      await LedgerService.createLogisticsUnit(sscc, selectedBatches, user);
      toast.success(`Pallet created with SSCC: ${sscc}`);
      
      // 3. Reset
      setSelectedBatches([]);
      setActiveTab('list');
      fetchUnits();
    } catch (err: any) {
      toast.error('Failed to create pallet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Logistics Units (SSCC)</h2>
           <p className="text-slate-500 text-sm">Aggregation & Pallet Management</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
           <button 
             onClick={() => setActiveTab('list')}
             className={`px-4 py-2 rounded-md text-sm font-bold transition-all shadow-sm ${activeTab === 'list' ? 'bg-white text-slate-900' : 'bg-transparent text-slate-500 hover:text-slate-700 shadow-none'}`}
           >
             Active Pallets
           </button>
           <button 
             onClick={() => setActiveTab('create')}
             className={`px-4 py-2 rounded-md text-sm font-bold transition-all shadow-sm ${activeTab === 'create' ? 'bg-white text-slate-900' : 'bg-transparent text-slate-500 hover:text-slate-700 shadow-none'}`}
           >
             New Pallet
           </button>
        </div>
      </div>

      {activeTab === 'create' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
             <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <Package size={24} />
             </div>
             <div>
                <h3 className="text-lg font-bold text-slate-800">Aggregation Wizard</h3>
                <p className="text-sm text-slate-500">Select individual cases to combine into a Logistics Unit (SSCC)</p>
             </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-xl mb-6 shadow-inner bg-slate-50">
            <table className="w-full text-left">
              <thead className="bg-white sticky top-0 shadow-sm z-10">
                <tr>
                   <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase w-16">Select</th>
                   <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Product / Batch ID</th>
                   <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Qty</th>
                   <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Expiry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                 {batches.map(b => (
                   <tr 
                     key={b.batchID} 
                     className={`hover:bg-indigo-50/50 cursor-pointer transition-colors ${selectedBatches.includes(b.batchID) ? 'bg-indigo-50' : ''}`}
                     onClick={() => toggleBatchSelection(b.batchID)}
                   >
                     <td className="px-6 py-4 text-center">
                        {selectedBatches.includes(b.batchID) ? <CheckSquare size={20} className="text-indigo-600" /> : <Square size={20} className="text-slate-300" />}
                     </td>
                     <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{b.productName}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">{b.batchID}</div>
                     </td>
                     <td className="px-6 py-4 text-sm font-medium">{b.quantity} {b.unit}</td>
                     <td className="px-6 py-4 text-sm font-medium text-slate-600">{b.expiryDate}</td>
                   </tr>
                 ))}
                 {batches.length === 0 && (
                   <tr>
                     <td colSpan={4} className="p-12 text-center text-slate-400">
                       <Package size={48} className="mx-auto mb-2 opacity-20" />
                       <p>No loose batches available for aggregation.</p>
                     </td>
                   </tr>
                 )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-6">
             <div className="flex items-center gap-2 text-sm text-slate-600">
               <span className="font-bold text-slate-800 text-lg">{selectedBatches.length}</span>
               <span>items selected</span>
             </div>
             <button
               onClick={handleCreateUnit}
               disabled={selectedBatches.length === 0 || loading}
               className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold flex items-center space-x-2 shadow-lg shadow-indigo-200 transition-all transform active:scale-95"
             >
               {loading ? <span>Processing...</span> : (
                 <>
                   <Plus size={20} />
                   <span>Generate SSCC & Aggregate</span>
                 </>
               )}
             </button>
          </div>
        </div>
      )}

      {activeTab === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2">
          {units.map(unit => (
            <div key={unit.sscc} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col hover:shadow-md transition-shadow group">
               <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-slate-100 rounded-xl group-hover:bg-slate-200 transition-colors">
                    <Box size={24} className="text-slate-600" />
                  </div>
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide border border-emerald-200">
                    {unit.status}
                  </span>
               </div>
               
               <div className="mb-6">
                 <p className="text-[10px] text-slate-400 uppercase font-bold mb-1 tracking-wider">SSCC (18-Digit)</p>
                 <p className="font-mono text-lg font-bold text-slate-800 tracking-wide break-all">
                    (00) {unit.sscc}
                 </p>
               </div>

               <div className="space-y-3 text-sm text-slate-600 mb-6 flex-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                 <div className="flex justify-between border-b border-slate-200 pb-2">
                   <span className="text-slate-500">Contents</span>
                   <span className="font-bold text-slate-800">{unit.contents.length} Batches</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-slate-500">Created</span>
                   <span className="font-mono text-xs">{new Date(unit.createdDate).toLocaleDateString()}</span>
                 </div>
               </div>

               <button 
                 onClick={() => setViewingLabel(unit)}
                 className="w-full border border-slate-300 hover:bg-slate-50 hover:border-slate-400 text-slate-700 font-bold py-3 rounded-xl flex items-center justify-center space-x-2 transition-all"
               >
                 <Printer size={18} />
                 <span>Print Logistics Label</span>
               </button>
            </div>
          ))}
          {units.length === 0 && (
            <div className="col-span-full p-16 text-center bg-slate-50 rounded-xl border-2 border-slate-200 border-dashed">
               <div className="inline-block p-4 bg-white rounded-full mb-3 shadow-sm">
                 <Box size={32} className="text-slate-300" />
               </div>
               <h3 className="text-lg font-bold text-slate-700">No Pallets Found</h3>
               <p className="text-slate-500 mt-1">Create a new aggregation to generate SSCCs.</p>
            </div>
          )}
        </div>
      )}

      {/* Label Modal */}
      {viewingLabel && (
        <SSCCLabel 
          unit={viewingLabel} 
          user={user} 
          onClose={() => setViewingLabel(null)} 
        />
      )}
    </div>
  );
};

export default SSCCManager;
