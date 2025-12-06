
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
    // Filter batches that can be aggregated (e.g., Created or Received)
    setBatches(data.filter(b => b.status === BatchStatus.CREATED || b.status === BatchStatus.RECEIVED));
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Logistics Units (SSCC)</h2>
        <div className="flex space-x-2">
           <button 
             onClick={() => setActiveTab('list')}
             className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'list' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
           >
             Active Pallets
           </button>
           <button 
             onClick={() => setActiveTab('create')}
             className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'create' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
           >
             Create New Pallet
           </button>
        </div>
      </div>

      {activeTab === 'create' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center space-x-2">
             <Package size={20} />
             <span>Step 1: Select Batches to Aggregate</span>
          </h3>
          
          <div className="max-h-96 overflow-y-auto border border-slate-100 rounded-lg mb-6">
            <table className="w-full text-left">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                   <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase w-12">Select</th>
                   <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Product / Batch ID</th>
                   <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Qty</th>
                   <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Expiry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                 {batches.map(b => (
                   <tr 
                     key={b.batchID} 
                     className={`hover:bg-slate-50 cursor-pointer ${selectedBatches.includes(b.batchID) ? 'bg-blue-50' : ''}`}
                     onClick={() => toggleBatchSelection(b.batchID)}
                   >
                     <td className="px-4 py-3 text-slate-400">
                        {selectedBatches.includes(b.batchID) ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} />}
                     </td>
                     <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{b.productName}</div>
                        <div className="text-xs text-slate-500 font-mono">{b.batchID}</div>
                     </td>
                     <td className="px-4 py-3 text-sm">{b.quantity} {b.unit}</td>
                     <td className="px-4 py-3 text-sm">{b.expiryDate}</td>
                   </tr>
                 ))}
                 {batches.length === 0 && (
                   <tr>
                     <td colSpan={4} className="p-8 text-center text-slate-400">No batches available for aggregation.</td>
                   </tr>
                 )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-6">
             <div className="text-sm text-slate-600">
               Selected: <span className="font-bold">{selectedBatches.length} items</span>
             </div>
             <button
               onClick={handleCreateUnit}
               disabled={selectedBatches.length === 0 || loading}
               className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium flex items-center space-x-2 shadow-sm transition-all"
             >
               {loading ? <span>Generating...</span> : (
                 <>
                   <Plus size={18} />
                   <span>Generate SSCC & Aggregate</span>
                 </>
               )}
             </button>
          </div>
        </div>
      )}

      {activeTab === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {units.map(unit => (
            <div key={unit.sscc} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col hover:shadow-md transition-shadow">
               <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-slate-100 rounded-lg">
                    <Box size={24} className="text-slate-600" />
                  </div>
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">
                    {unit.status}
                  </span>
               </div>
               
               <div className="mb-6">
                 <p className="text-xs text-slate-500 uppercase font-bold mb-1">SSCC (18-Digit)</p>
                 <p className="font-mono text-lg font-bold text-slate-800 tracking-wide">{unit.sscc}</p>
               </div>

               <div className="space-y-2 text-sm text-slate-600 mb-6 flex-1">
                 <div className="flex justify-between">
                   <span>Contents:</span>
                   <span className="font-medium">{unit.contents.length} Batches</span>
                 </div>
                 <div className="flex justify-between">
                   <span>Created:</span>
                   <span>{new Date(unit.createdDate).toLocaleDateString()}</span>
                 </div>
               </div>

               <button 
                 onClick={() => setViewingLabel(unit)}
                 className="w-full border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
               >
                 <Printer size={16} />
                 <span>Print Label</span>
               </button>
            </div>
          ))}
          {units.length === 0 && (
            <div className="col-span-full p-12 text-center bg-white rounded-xl border border-slate-200 border-dashed">
               <div className="inline-block p-4 bg-slate-50 rounded-full mb-3">
                 <Box size={32} className="text-slate-300" />
               </div>
               <p className="text-slate-500">No Logistics Units created yet.</p>
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
