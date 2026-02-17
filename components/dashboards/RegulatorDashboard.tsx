import React, { useState, useEffect } from 'react';
import { User, Batch } from '../../types';
import { LedgerService } from '../../services/ledgerService';
import { useRealTimeData } from '../../hooks/useRealTimeData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ShieldCheck, AlertTriangle, IndianRupee, Eye, Server, Map } from 'lucide-react';

const RegulatorDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [batches, setBatches] = useState<Batch[]>([]);
  useEffect(() => { LedgerService.exportLedger().then(setBatches); }, []);
  
  const { stats, liveFeed } = useRealTimeData(batches);

  // Compliance Data Simulation
  const complianceData = [
    { region: 'North', compliance: 98, revenue: 4500 },
    { region: 'West', compliance: 92, revenue: 6200 },
    { region: 'South', compliance: 96, revenue: 5100 },
    { region: 'East', compliance: 88, revenue: 3200 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
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
           <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Duty Collected</p>
              <p className="text-2xl font-black text-emerald-400 flex items-center justify-end">
                 <IndianRupee size={20} />
                 {(stats.totalVolume * 450).toLocaleString()}
              </p>
           </div>
           <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Compliance Rate</p>
              <p className="text-2xl font-black text-blue-400">98.2%</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Compliance Map/Chart */}
         <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-8">
               <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <Map size={20} className="text-indigo-600" />
                  Regional Compliance & Tax Yield
               </h3>
            </div>
            <div className="h-72 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={complianceData}>
                     <XAxis dataKey="region" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                     <Tooltip 
                        cursor={{fill: '#f8fafc'}}
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                     />
                     <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
                        {complianceData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.compliance > 90 ? '#4f46e5' : '#f59e0b'} />
                        ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
            <div className="mt-4 flex gap-6 justify-center text-xs text-slate-500 font-bold uppercase">
               <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-600 rounded"></div> High Compliance</div>
               <div className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-500 rounded"></div> Action Required</div>
            </div>
         </div>

         {/* Alerts Feed */}
         <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col">
            <h3 className="font-bold text-slate-800 text-lg mb-6 flex items-center gap-2">
               <AlertTriangle size={20} className="text-amber-500" />
               Live Violations
            </h3>
            <div className="space-y-4 flex-1 overflow-hidden">
               {[1, 2].map((i) => (
                  <div key={i} className="p-4 bg-red-50 rounded-xl border border-red-100 flex gap-3 animate-pulse">
                     <AlertTriangle size={18} className="text-red-600 shrink-0 mt-1" />
                     <div>
                        <p className="text-sm font-bold text-red-800">Suspicious Scan Pattern</p>
                        <p className="text-xs text-red-600 mt-1">Duplicate QR scan detected in 2 different locations within 5 minutes.</p>
                        <p className="text-[10px] font-mono font-bold text-red-900 mt-2">ID: BATCH-883-X{i}</p>
                     </div>
                  </div>
               ))}
               <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 text-center italic">Scanning ledger for anomalies...</p>
               </div>
            </div>
         </div>
      </div>

      {/* Network Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         {['Authentication Node', 'Transaction Validator', 'Audit Archiver', 'Storage Shard'].map((node, i) => (
            <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-3">
               <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm text-slate-400">
                  <Server size={16} />
               </div>
               <div>
                  <p className="text-xs font-bold text-slate-700">{node}</p>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider flex items-center gap-1">
                     <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> Online
                  </p>
               </div>
            </div>
         ))}
      </div>
    </div>
  );
};

export default RegulatorDashboard;