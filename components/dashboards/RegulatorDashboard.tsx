import React, { useState, useEffect } from 'react';
import { User, Batch, AuditLog } from '../../types';
import { LedgerService } from '../../services/ledgerService';
import { useRealTimeData } from '../../hooks/useRealTimeData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ShieldCheck, AlertTriangle, DollarSign, Eye, Server, Map, FileText, Search, User as UserIcon, Clock, Fingerprint, Plus, IndianRupee } from 'lucide-react';

import DocumentVault from '../DocumentVault';

const RegulatorDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'OVERSIGHT' | 'RULES' | 'VAULT'>('OVERSIGHT');

  useEffect(() => { 
      LedgerService.exportLedger().then(setBatches); 
      LedgerService.getAuditLogs(user).then(setAuditLogs);
  }, [user]);
  
  const { stats } = useRealTimeData(batches);

  // Compliance Data Simulation
  const complianceData = [
    { region: 'North', compliance: 98, revenue: 4500 },
    { region: 'West', compliance: 92, revenue: 6200 },
    { region: 'South', compliance: 96, revenue: 5100 },
    { region: 'East', compliance: 88, revenue: 3200 },
  ];

  const filteredLogs = auditLogs.filter(log => 
    log.userGLN.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.resourceId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-slate-200 pb-4">
        <button 
            onClick={() => setActiveTab('OVERSIGHT')}
            className={`text-sm font-bold px-4 py-2 rounded-lg transition-colors ${activeTab === 'OVERSIGHT' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
        >
            Oversight Dashboard
        </button>
        <button 
            onClick={() => setActiveTab('RULES')}
            className={`text-sm font-bold px-4 py-2 rounded-lg transition-colors ${activeTab === 'RULES' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
        >
            Smart Contract Rules
        </button>
        <button 
            onClick={() => setActiveTab('VAULT')}
            className={`text-sm font-bold px-4 py-2 rounded-lg transition-colors ${activeTab === 'VAULT' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
        >
            Document Vault
        </button>
      </div>

      {activeTab === 'VAULT' && <DocumentVault />}

      {activeTab === 'RULES' && (
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <FileText size={24} className="text-indigo-600" />
                        Smart Contract Configuration
                    </h3>
                    <p className="text-slate-500 text-sm mt-1">Define automated compliance rules executed by the ledger.</p>
                </div>
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2">
                    <Plus size={14} /> Add Rule
                </button>
            </div>
            
            <div className="space-y-4">
                {[
                    { name: 'Require Phytosanitary Cert', sector: 'AGRICULTURE', condition: 'Export > 1000kg', status: 'ACTIVE' },
                    { name: 'Verify VAT Payment', sector: 'EXCISE', condition: 'Movement > State Border', status: 'ACTIVE' },
                    { name: 'Check Cold Chain Temp', sector: 'PHARMA', condition: 'Temp > 8°C', status: 'TESTING' },
                ].map((rule, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-slate-100 rounded-lg text-slate-500 font-mono text-xs font-bold">{i+1}</div>
                            <div>
                                <p className="font-bold text-slate-800">{rule.name}</p>
                                <p className="text-xs text-slate-500 font-mono">IF {rule.condition} THEN REJECT</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-bold uppercase bg-slate-100 px-2 py-1 rounded text-slate-500">{rule.sector}</span>
                            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${rule.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                {rule.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {activeTab === 'OVERSIGHT' && (
        <>
            <div className="bg-slate-900 rounded-[2rem] p-8 text-white flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-5"><ShieldCheck size={200} /></div>
                
                <div className="relative z-10 flex items-center gap-6">
                <div className="bg-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-900/50">
                    <Eye size={32} />
                </div>
                <div>
                    <h2 className="text-3xl font-black tracking-tight">Oversight Command</h2>
                    <div className="flex items-center gap-2 mt-2">
                    <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border border-emerald-500/30">
                        System Healthy
                    </span>
                    <span className="text-slate-400 text-xs font-mono"> | Active Nodes: {stats.activeNodes}</span>
                    </div>
                </div>
                </div>

                <div className="flex gap-8 relative z-10">
                {user.sector === 'EXCISE' ? (
                    <>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Bulk Liters (BL)</p>
                            <p className="text-2xl font-black text-blue-400 flex items-center justify-end">
                                {batches.reduce((acc, b) => acc + (b.bulkLiters || 0), 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Proof Liters (PL)</p>
                            <p className="text-2xl font-black text-indigo-400 flex items-center justify-end">
                                {batches.reduce((acc, b) => acc + (b.proofLiters || 0), 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Est. Duty Revenue</p>
                            <p className="text-2xl font-black text-emerald-400 flex items-center justify-end">
                                <IndianRupee size={20} />
                                {(batches.reduce((acc, b) => acc + (b.proofLiters || 0), 0) * 300).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </p>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Duty / Tax Collected</p>
                            <p className="text-2xl font-black text-emerald-400 flex items-center justify-end">
                                <DollarSign size={20} />
                                {(stats.totalVolume * 450).toLocaleString()}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Compliance Rate</p>
                            <p className="text-2xl font-black text-blue-400">98.2%</p>
                        </div>
                    </>
                )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Compliance Map/Chart */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        <Map size={20} className="text-indigo-600" />
                        Regional Compliance & Duty Yield
                    </h3>
                    </div>
                    <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={complianceData}>
                            <XAxis dataKey="region" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 'bold'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                            <Tooltip 
                                cursor={{fill: '#f1f5f9'}}
                                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                            />
                            <Bar dataKey="revenue" fill="#4f46e5" radius={[6, 6, 0, 0]}>
                                {complianceData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.compliance > 95 ? '#10b981' : entry.compliance > 90 ? '#4f46e5' : '#f59e0b'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    </div>
                </div>

                {/* Alerts Feed */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <AlertTriangle size={18} className="text-amber-500" />
                    Real-time Alerts
                    </h3>
                    <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar max-h-[300px]">
                    {batches.filter(b => b.status === 'RECALLED').map(b => (
                        <div key={b.batchID} className="bg-red-50 p-4 rounded-xl border border-red-100 flex gap-3">
                            <div className="mt-1"><AlertTriangle size={16} className="text-red-600" /></div>
                            <div>
                                <p className="text-xs font-bold text-red-800 uppercase">Recall Initiated</p>
                                <p className="text-sm font-medium text-slate-700">{b.productName}</p>
                                <p className="text-[10px] text-slate-500 font-mono mt-1">{b.batchID}</p>
                            </div>
                        </div>
                    ))}
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3">
                        <div className="mt-1"><Server size={16} className="text-amber-600" /></div>
                        <div>
                            <p className="text-xs font-bold text-amber-800 uppercase">Node Sync Delay</p>
                            <p className="text-sm font-medium text-slate-700">Mumbai West Node</p>
                            <p className="text-[10px] text-slate-500 mt-1">Latency &gt; 200ms</p>
                        </div>
                    </div>
                    </div>
                </div>
            </div>

            {/* Audit Log Section */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Fingerprint size={24} className="text-indigo-600" />
                        Immutable Audit Trail
                    </h3>
                    <p className="text-slate-500 text-sm mt-1">Forensic log of all network actions</p>
                    </div>
                    <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by GLN, Batch ID, or Action..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                    />
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                    <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">
                        <tr>
                            <th className="px-8 py-5">Timestamp</th>
                            <th className="px-8 py-5">Actor (GLN)</th>
                            <th className="px-8 py-5">Action Type</th>
                            <th className="px-8 py-5">Resource ID</th>
                            <th className="px-8 py-5">Metadata / Hash</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        {filteredLogs.map(log => (
                            <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-8 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Clock size={14} className="text-slate-400" />
                                    <span className="font-mono text-xs">{new Date(log.timestamp).toLocaleString()}</span>
                                </div>
                                </td>
                                <td className="px-8 py-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500"><UserIcon size={14} /></div>
                                    <span className="font-mono text-xs font-bold text-slate-700">{log.userGLN}</span>
                                </div>
                                </td>
                                <td className="px-8 py-4">
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                    log.action.includes('CREATE') ? 'bg-emerald-100 text-emerald-700' : 
                                    log.action.includes('RECALL') ? 'bg-red-100 text-red-700' :
                                    log.action.includes('LOGIN') ? 'bg-slate-100 text-slate-600' :
                                    'bg-indigo-100 text-indigo-700'
                                }`}>
                                    {log.action}
                                </span>
                                </td>
                                <td className="px-8 py-4">
                                <span className="font-mono text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                                    {log.resourceId}
                                </span>
                                </td>
                                <td className="px-8 py-4">
                                <span className="text-xs text-slate-500 font-mono truncate max-w-[200px] block" title={log.details}>
                                    {log.details}
                                </span>
                                </td>
                            </tr>
                        ))}
                        {filteredLogs.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-12 text-center text-slate-400">
                                <FileText size={32} className="mx-auto mb-2 opacity-20" />
                                <p>No audit records found matching your query.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                    </table>
                </div>
            </div>
        </>
      )}
    </div>
  );
};

export default RegulatorDashboard;