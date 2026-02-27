import React, { useState, useEffect } from 'react';
import { User, Batch, BatchStatus } from '../../types';
import { LedgerService } from '../../services/ledgerService';
import { useRealTimeData } from '../../hooks/useRealTimeData';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Factory, Box, Activity, Zap, TrendingUp, AlertCircle, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { toast } from 'react-toastify';

import DocumentVault from '../DocumentVault';

const ManufacturerDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [showRecallModal, setShowRecallModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [recallReason, setRecallReason] = useState('');
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'VAULT'>('OVERVIEW');

  useEffect(() => { LedgerService.getBatches(user).then(setBatches); }, [user]);
  
  const { stats, liveFeed, chartData } = useRealTimeData(batches);

  const handleRecallSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;
    try {
        await LedgerService.recallBatch(selectedBatch.batchID, recallReason, user);
        toast.error(`BATCH RECALLED: ${selectedBatch.batchID}`);
        setShowRecallModal(false);
        setRecallReason('');
        setSelectedBatch(null);
        // Refresh data
        LedgerService.getBatches(user).then(setBatches);
    } catch (err: any) {
        toast.error(err.message || "Recall failed");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      
      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-slate-200 pb-4">
        <button 
            onClick={() => setActiveTab('OVERVIEW')}
            className={`text-sm font-bold px-4 py-2 rounded-lg transition-colors ${activeTab === 'OVERVIEW' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
        >
            Overview & Production
        </button>
        <button 
            onClick={() => setActiveTab('VAULT')}
            className={`text-sm font-bold px-4 py-2 rounded-lg transition-colors ${activeTab === 'VAULT' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
        >
            Secure Document Vault
        </button>
      </div>

      {activeTab === 'VAULT' ? (
        <DocumentVault />
      ) : (
        <>
          {/* Recall Modal */}
          {showRecallModal && selectedBatch && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
               <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border-t-4 border-red-600">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-red-700 flex items-center gap-2">
                       <AlertTriangle className="fill-red-100" />
                       <span>EMERGENCY RECALL</span>
                    </h3>
                    <button onClick={() => setShowRecallModal(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-lg mb-6 border border-red-100">
                     <p className="text-sm font-bold text-red-900">Recalling: {selectedBatch.productName}</p>
                     <p className="text-xs text-red-700 font-mono mt-1">Batch ID: {selectedBatch.batchID}</p>
                     <p className="text-xs text-red-600 mt-2">
                        Warning: This action is irreversible. The batch status will be updated to RECALLED on the ledger immediately.
                     </p>
                  </div>

                  <form onSubmit={handleRecallSubmit} className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Reason for Recall</label>
                          <textarea 
                            required
                            className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 outline-none h-32"
                            placeholder="Describe the defect, contamination, or regulatory violation..."
                            value={recallReason}
                            onChange={e => setRecallReason(e.target.value)}
                          />
                      </div>
                      
                      <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-2">
                          <button 
                            type="button"
                            onClick={() => setShowRecallModal(false)}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                          >
                              Cancel
                          </button>
                          <button 
                            type="submit"
                            className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 shadow-md flex items-center gap-2"
                          >
                              <AlertTriangle size={16} />
                              <span>CONFIRM RECALL</span>
                          </button>
                      </div>
                  </form>
               </div>
            </div>
          )}

          {/* Header Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Production Rate</p>
                  <h3 className="text-3xl font-black mt-2">{stats.transactionsPerSecond} <span className="text-sm font-medium text-slate-500">batches/sec</span></h3>
                </div>
                <div className="bg-indigo-600 p-2 rounded-lg"><Activity size={20} /></div>
              </div>
              <div className="mt-4 w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${(stats.transactionsPerSecond / 10) * 100}%` }}></div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Inventory</p>
                  <h3 className="text-3xl font-black text-slate-800 mt-2">{batches.length}</h3>
                </div>
                <div className="bg-slate-100 p-2 rounded-lg text-slate-600"><Box size={20} /></div>
              </div>
              <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1">
                <TrendingUp size={12} /> +12% vs yesterday
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Network Latency</p>
                  <h3 className="text-3xl font-black text-slate-800 mt-2">{stats.networkLatency} <span className="text-sm font-medium text-slate-400">ms</span></h3>
                </div>
                <div className="bg-slate-100 p-2 rounded-lg text-slate-600"><Zap size={20} /></div>
              </div>
              <p className="text-xs text-slate-400 mt-2">Optimal Sync Speed</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-6 text-white shadow-lg">
              <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest">Blockchain Height</p>
              <h3 className="text-3xl font-black mt-2">#{stats.blockHeight.toLocaleString()}</h3>
              <div className="flex items-center gap-2 mt-2">
                 <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                 <span className="text-xs font-bold">Mining Live</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Chart */}
            <div className="lg:col-span-2 space-y-8">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Factory size={18} className="text-indigo-600" />
                        Production Output Velocity
                        </h3>
                        <span className="text-[10px] font-bold bg-slate-100 px-2 py-1 rounded text-slate-500">REAL-TIME</span>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                            <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                            </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                            <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                            itemStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                            />
                            <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorProd)" isAnimationActive={true} />
                        </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Quick Action / Recent Batches Panel */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Box className="text-emerald-600" size={18} />
                            Recent Production & Quality Control
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500">
                                <tr>
                                    <th className="px-6 py-4">Batch ID</th>
                                    <th className="px-6 py-4">Product</th>
                                    <th className="px-6 py-4">Expiry</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {batches.length === 0 ? (
                                    <tr><td colSpan={5} className="p-6 text-center text-slate-400">No batches produced yet.</td></tr>
                                ) : (
                                    batches.slice(0, 5).map(batch => (
                                        <tr key={batch.batchID} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-mono text-slate-600 text-xs">{batch.batchID}</td>
                                            <td className="px-6 py-4 font-bold text-slate-800">{batch.productName}</td>
                                            <td className="px-6 py-4 text-slate-500">{batch.expiryDate}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                                    batch.status === BatchStatus.RECALLED ? 'bg-red-100 text-red-700' : 
                                                    batch.status === BatchStatus.SOLD ? 'bg-slate-100 text-slate-500' :
                                                    'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                    {batch.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {batch.status !== BatchStatus.RECALLED && batch.status !== BatchStatus.DESTROYED ? (
                                                    <button 
                                                        onClick={() => { setSelectedBatch(batch); setShowRecallModal(true); }}
                                                        className="text-red-600 hover:text-red-800 text-xs font-bold uppercase tracking-wider border border-red-200 hover:bg-red-50 px-3 py-1 rounded-lg transition-colors flex items-center gap-1 ml-auto"
                                                    >
                                                        <AlertTriangle size={12} /> Recall
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-slate-300 font-medium italic">Locked</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Live Feed */}
            <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col h-[600px] sticky top-6">
              <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                <Activity size={18} className="text-emerald-400" />
                Ledger Stream
              </h3>
              <div className="flex-1 space-y-4 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-[2px] h-full bg-slate-800 ml-1.5"></div>
                {liveFeed.map((log, i) => (
                  <div key={i} className="flex gap-4 items-center animate-in slide-in-from-top-2 duration-500 relative z-10">
                    <div className={`w-3 h-3 rounded-full shrink-0 ${i === 0 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-slate-600'}`}></div>
                    <div>
                      <p className="text-xs font-medium text-slate-200">{log}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">Hash: 0x{Math.random().toString(16).substr(2, 8)}...</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800 text-[10px] text-slate-500 uppercase font-bold tracking-widest text-center">
                Connected to Node: PRIMARY-NODE-01
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ManufacturerDashboard;