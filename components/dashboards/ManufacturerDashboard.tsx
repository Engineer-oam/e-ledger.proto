import React, { useState, useEffect } from 'react';
import { User, Batch } from '../../types';
import { LedgerService } from '../../services/ledgerService';
import { useRealTimeData } from '../../hooks/useRealTimeData';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Factory, Box, Activity, Zap, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

const ManufacturerDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [batches, setBatches] = useState<Batch[]>([]);
  useEffect(() => { LedgerService.getBatches(user).then(setBatches); }, [user]);
  
  const { stats, liveFeed, chartData } = useRealTimeData(batches);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
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
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
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

        {/* Live Feed */}
        <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col">
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
            Connected to Node: IN-MUM-01
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManufacturerDashboard;