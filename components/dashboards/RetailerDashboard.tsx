import React, { useState, useEffect } from 'react';
import { User, Batch } from '../../types';
import { LedgerService } from '../../services/ledgerService';
import { useRealTimeData } from '../../hooks/useRealTimeData';
import { 
  Scan, ShoppingBag, ArrowDownToLine, CreditCard, Camera, 
  AlertOctagon, TrendingUp, Users, Clock, Receipt, Activity
} from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import QRScanner from '../QRScanner';
import { toast } from 'react-toastify';

interface RetailerDashboardProps {
  user: User;
}

const RetailerDashboard: React.FC<RetailerDashboardProps> = ({ user }) => {
  const [activeMode, setActiveMode] = useState<'receive' | 'dispense'>('dispense');
  const [scanInput, setScanInput] = useState('');
  const [scannedBatch, setScannedBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [inventory, setInventory] = useState<Batch[]>([]);
  
  const { stats, liveFeed, chartData } = useRealTimeData(inventory);
  
  const [duplicateAlert, setDuplicateAlert] = useState<{detected: boolean, msg: string}>({ detected: false, msg: '' });

  useEffect(() => {
    fetchInventory();
  }, [user]);

  const fetchInventory = async () => {
    const data = await LedgerService.getBatches(user);
    setInventory(data);
  };

  const handleScan = async (e?: React.FormEvent, directInput?: string) => {
    if (e) e.preventDefault();
    const query = directInput || scanInput;
    if (!query.trim()) return;

    setLoading(true);
    setScannedBatch(null);
    setDuplicateAlert({ detected: false, msg: '' });

    try {
      if (activeMode === 'dispense') {
          const check = await LedgerService.checkPOSStatus(query.trim(), user.gln);
          if (check.status === 'DUPLICATE') {
              setDuplicateAlert({ detected: true, msg: check.message });
              toast.error("COUNTERFEIT ALERT: Duplicate Scan Detected!");
              setLoading(false);
              return;
          }
      }

      let batch = await LedgerService.getBatchByID(query.trim());
      if (!batch) batch = await LedgerService.verifyByHash(query.trim());

      if (batch) {
        setScannedBatch(batch);
        setScanInput(query.trim());
      } else {
        toast.error('Item not found on ledger.');
      }
    } catch (err) {
      toast.error('Scan Error');
    } finally {
      setLoading(false);
    }
  };

  const executeAction = async () => {
    if (!scannedBatch) return;
    try {
      if (activeMode === 'receive') {
        await LedgerService.receiveBatch(scannedBatch.batchID, user);
        toast.success(`Stock received: ${scannedBatch.productName}`);
      } else {
        await LedgerService.sellBatch(scannedBatch.batchID, user);
        toast.success(`Sale recorded: ${scannedBatch.productName}`);
      }
      setScannedBatch(null);
      setScanInput('');
      fetchInventory();
    } catch (err: any) {
      toast.error(err.message || 'Action failed.');
    }
  };

  const dailyRevenue = Math.floor(stats.totalVolume * 150) + (stats.blockHeight % 1000) * 10;
  const customersInStore = Math.floor(stats.activeNodes * 1.5);

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500">
      {showScanner && (
        <QRScanner onScan={(text) => { setShowScanner(false); setScanInput(text); handleScan(undefined, text); }} onClose={() => setShowScanner(false)} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
           <div className="absolute right-0 top-0 p-6 opacity-10"><ShoppingBag size={100} /></div>
           <p className="text-emerald-100 font-bold text-xs uppercase tracking-widest mb-1">Today's Store Revenue</p>
           <h2 className="text-4xl font-black flex items-center gap-2">
             {dailyRevenue.toLocaleString()}
             <span className="text-sm font-medium bg-white/20 px-2 py-1 rounded text-white flex items-center gap-1">
               <TrendingUp size={12} /> +14%
             </span>
           </h2>
           <p className="text-xs text-emerald-100 mt-2 opacity-80">Live from 4 POS Terminals</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
           <div className="flex justify-between items-start">
              <div>
                 <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">Footfall</p>
                 <h3 className="text-3xl font-black text-slate-800">{customersInStore}</h3>
              </div>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                 <Users size={20} />
              </div>
           </div>
           <p className="text-xs text-slate-500 mt-2">Active shoppers in store</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
           <div className="flex justify-between items-start">
              <div>
                 <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">Pending Stock</p>
                 <h3 className="text-3xl font-black text-slate-800">12</h3>
              </div>
              <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                 <Clock size={20} />
              </div>
           </div>
           <p className="text-xs text-slate-500 mt-2">Crates in unloading bay</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                 <Scan className="text-indigo-600" />
                 <span>Point of Sale</span>
              </h3>
              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button onClick={() => setActiveMode('receive')} className={`px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${activeMode === 'receive' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
                    <ArrowDownToLine size={14} /><span>Stock In</span>
                </button>
                <button onClick={() => setActiveMode('dispense')} className={`px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${activeMode === 'dispense' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}>
                    <ShoppingBag size={14} /><span>Checkout</span>
                </button>
              </div>
           </div>

           <div className={`rounded-2xl shadow-lg border p-8 transition-all ${duplicateAlert.detected ? 'bg-red-50 border-red-500 ring-4 ring-red-500/20' : 'bg-white border-slate-200'}`}>
                <div className="relative mb-6">
                    <input 
                    autoFocus
                    type="text" 
                    value={scanInput}
                    onChange={e => setScanInput(e.target.value)}
                    placeholder={activeMode === 'dispense' ? "Scan item to sell..." : "Scan inbound carton..."}
                    className="w-full pl-6 pr-12 py-5 text-xl border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition font-mono shadow-inner bg-slate-50 focus:bg-white"
                    />
                    <button onClick={() => setShowScanner(true)} className="absolute right-4 top-4 text-slate-400 hover:text-indigo-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
                        <Camera size={28} />
                    </button>
                </div>
                
                <button 
                    onClick={(e) => handleScan(e)} 
                    disabled={loading}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-bold transition shadow-lg text-sm uppercase tracking-wider flex justify-center items-center gap-2 active:scale-[0.98]"
                >
                    {loading ? <span className="animate-pulse">Checking Ledger...</span> : <span>Verify & Process</span>}
                </button>

                {duplicateAlert.detected && (
                    <div className="mt-6 bg-white border-l-4 border-red-600 p-6 rounded-r-xl shadow-sm animate-pulse">
                        <div className="flex items-start gap-4">
                            <div className="bg-red-100 p-3 rounded-full"><AlertOctagon className="text-red-600" size={32} /></div>
                            <div>
                                <h4 className="font-black text-red-700 text-xl uppercase tracking-tight">Counterfeit Warning</h4>
                                <p className="text-red-900 font-bold mt-1 text-lg">{duplicateAlert.msg}</p>
                                <p className="text-sm text-red-600 mt-2">This unit identifier (UID) is already marked as sold. Possible cloned label.</p>
                            </div>
                        </div>
                    </div>
                )}

                {scannedBatch && !duplicateAlert.detected && (
                    <div className="mt-6 bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 animate-in slide-in-from-bottom-4">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="font-black text-2xl text-slate-800">{scannedBatch.productName}</h4>
                                <p className="font-mono text-sm text-slate-500 mt-1">{scannedBatch.batchID}</p>
                            </div>
                            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wide border border-emerald-200 flex items-center gap-1">
                                <Activity size={12} /> Verified Genuine
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-white p-3 rounded-lg border border-slate-100">
                                <p className="text-[10px] text-slate-400 uppercase font-bold">Expiry</p>
                                <p className="font-bold text-slate-700">{scannedBatch.expiryDate}</p>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-slate-100">
                                <p className="text-[10px] text-slate-400 uppercase font-bold">Price</p>
                                <p className="font-bold text-slate-700">{scannedBatch.mrp || 120}</p>
                            </div>
                        </div>
                        <button 
                            onClick={executeAction}
                            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 ${activeMode === 'receive' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                        >
                            {activeMode === 'receive' ? <ArrowDownToLine /> : <CreditCard />}
                            <span>{activeMode === 'receive' ? 'Confirm Inbound Stock' : 'Complete Sale'}</span>
                        </button>
                    </div>
                )}
           </div>
        </div>

        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Activity size={18} className="text-indigo-600" />
                    <span>Hourly Sales Velocity</span>
                </h4>
                <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                            <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 h-[400px] flex flex-col">
                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Receipt size={18} className="text-slate-400" />
                    <span>Live Transaction Feed</span>
                </h4>
                <div className="flex-1 overflow-hidden space-y-3 relative">
                    <div className="absolute top-0 left-0 w-[2px] h-full bg-slate-200 ml-2"></div>
                    {liveFeed.map((log, i) => (
                        <div key={i} className="flex gap-3 relative z-10 animate-in slide-in-from-right-4">
                            <div className="w-4 h-4 rounded-full bg-white border-2 border-slate-300 mt-0.5 shrink-0 flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-700">{log.includes('Batch') ? 'Customer Checkout' : 'Stock Update'}</p>
                                <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{log}</p>
                                <p className="text-[9px] text-slate-400 font-mono mt-1">Reg ID: POS-{Math.floor(Math.random()*5)+1}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default RetailerDashboard;