import React, { useEffect, useState } from 'react';
import { Batch, User, UserRole, BatchStatus } from '../types';
import { LedgerService } from '../services/ledgerService';
import { AuthService } from '../services/authService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from 'recharts';
import { 
  Stamp, AlertTriangle, Truck, Activity, ScanBarcode, Globe, 
  ShieldCheck, Fingerprint, TrendingUp, AlertCircle, CheckCircle2, Lightbulb,
  Wine, Landmark
} from 'lucide-react';
import { Link } from 'react-router-dom';
import DistributorDashboard from './DistributorDashboard';
import RetailerDashboard from './RetailerDashboard';

interface DashboardProps {
  user: User;
}

const StatCard = ({ title, value, icon: Icon, color, subtitle }: { title: string; value: string | number; icon: any; color: string; subtitle?: string }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between transition-all hover:shadow-md">
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
    <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
      <Icon className={color.replace('bg-', 'text-')} size={24} />
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const data = await LedgerService.getBatches(user);
      setBatches(data);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (loading) return <div className="animate-pulse flex space-x-4 p-8"><div className="h-12 w-full bg-slate-200 rounded"></div></div>;

  // --- ROLE ROUTING ---
  if (user.role === UserRole.DISTRIBUTOR) {
    return <DistributorDashboard user={user} />;
  }
  
  if (user.role === UserRole.RETAILER) {
    return <RetailerDashboard user={user} />;
  }

  // --- EXCISE / DISTILLERY / REGULATOR DASHBOARD LOGIC ---
  const totalBatches = batches.length;
  const inTransit = batches.filter(b => b.status === BatchStatus.IN_TRANSIT).length;
  // Duty Paid vs Bonded
  const dutyPaidCount = batches.filter(b => b.dutyPaid).length;
  const bondedCount = batches.filter(b => b.status === BatchStatus.BONDED || !b.dutyPaid).length;
  
  // Illicit Detection (No integrity hash or duty mismatch)
  const illicitCount = batches.filter(b => !b.integrityHash).length;

  const received = batches.filter(b => b.status === BatchStatus.RECEIVED || b.status === BatchStatus.SOLD).length;

  // --- Compliance Metrics ---
  const validGTINs = batches.filter(b => AuthService.validateGS1(b.gtin)).length;
  const gtinComplianceRate = totalBatches > 0 ? Math.round((validGTINs / totalBatches) * 100) : 100;
  const integrityRate = totalBatches > 0 ? Math.round(((totalBatches - illicitCount) / totalBatches) * 100) : 0;

  // Network Reach
  const allGLNs = new Set<string>();
  batches.forEach(b => {
    if (b.manufacturerGLN) allGLNs.add(b.manufacturerGLN);
    if (b.currentOwnerGLN) allGLNs.add(b.currentOwnerGLN);
    b.trace.forEach(t => {
      if (t.actorGLN) allGLNs.add(t.actorGLN);
    });
  });
  const networkSize = allGLNs.size;
  const totalEvents = batches.reduce((acc, b) => acc + b.trace.length, 0);

  // --- Compliance Issues Detection ---
  const qualityIssues = batches.reduce((acc, batch) => {
    const issues = [];
    if (!batch.integrityHash) issues.push('Suspect: No Hologram Hash');
    if (batch.status === BatchStatus.SOLD && !batch.dutyPaid) issues.push('Tax Evasion: Sold without Duty');
    if (batch.status === BatchStatus.QUARANTINED) issues.push('Seized Stock');
    
    if (issues.length > 0) {
      acc.push({ 
        id: batch.batchID, 
        product: batch.productName, 
        issues, 
        integrityHash: batch.integrityHash 
      });
    }
    return acc;
  }, [] as any[]);

  // --- Smart Recommendations ---
  const recommendations = [
    { icon: Stamp, color: 'text-blue-500', text: "Ensure all 'BONDED' stock pays duty before dispatch to retail." },
    { icon: AlertTriangle, color: 'text-amber-500', text: "Audit pending for 3 Warehouses with high transit times." },
  ];
  if(bondedCount > dutyPaidCount) {
      recommendations.push({ icon: Landmark, color: 'text-red-500', text: "Revenue Alert: High volume of stock currently in Bond." });
  }

  // --- Chart Data ---
  const statusData = [
    { name: 'Distilled', value: batches.filter(b => b.status === 'DISTILLED').length },
    { name: 'Bonded', value: batches.filter(b => b.status === 'BONDED').length },
    { name: 'Duty Paid', value: dutyPaidCount },
    { name: 'Sold', value: batches.filter(b => b.status === 'SOLD').length },
  ].filter(d => d.value > 0);

  const complianceTrendData = [
    { month: 'Wk 1', score: 92000, target: 100000 },
    { month: 'Wk 2', score: 95000, target: 100000 },
    { month: 'Wk 3', score: 110000, target: 100000 },
    { month: 'Current', score: totalBatches * 500, target: 100000 }, // Simulated Revenue
  ];

  const COLORS = ['#94a3b8', '#f59e0b', '#10b981', '#6366f1'];

  return (
    <div className="space-y-8 pb-12">
      {/* Primary Ops Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Spirit Volume" value={totalBatches} icon={Wine} color="bg-indigo-500" subtitle="Batches Registered" />
        <StatCard title="Bonded Stock" value={bondedCount} icon={Landmark} color="bg-amber-500" subtitle="Duty Unpaid" />
        <StatCard title="Duty Paid Stock" value={dutyPaidCount} icon={Stamp} color="bg-emerald-500" subtitle="Ready for Retail" />
        <StatCard title="Enforcement Alerts" value={qualityIssues.length} icon={AlertTriangle} color="bg-red-500" subtitle="Seizures / Evasion" />
      </div>

      {/* --- EXCISE CONTROL SECTION --- */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-slate-900 p-2 rounded-lg text-white">
              <ScanBarcode size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Supply Chain Integrity & Revenue</h2>
              <p className="text-xs text-slate-500">Track and Trace for Illicit Liquor Prevention</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
            <CheckCircle2 size={16} />
            <span className="font-semibold">Excise Net Active</span>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hologram Coverage</p>
                <Fingerprint size={20} className={integrityRate > 90 ? "text-blue-500" : "text-amber-500"} />
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-2xl font-bold text-slate-800">{integrityRate}%</span>
                <span className="text-xs text-slate-400">batches tagged</span>
              </div>
               <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="h-full rounded-full bg-blue-500" style={{ width: `${integrityRate}%` }}></div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Licensees</p>
                <Globe size={20} className="text-indigo-500" />
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-2xl font-bold text-slate-800">{networkSize}</span>
                <span className="text-xs text-slate-400">GLNs active</span>
              </div>
            </div>

             <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chain Events</p>
                <Activity size={20} className="text-purple-500" />
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-2xl font-bold text-slate-800">{totalEvents}</span>
                <span className="text-xs text-slate-400">transactions</span>
              </div>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Seizures</p>
                <AlertCircle size={20} className="text-red-500" />
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-2xl font-bold text-slate-800">{batches.filter(b=>b.status === 'SEIZED').length}</span>
                <span className="text-xs text-slate-400">illicit batches</span>
              </div>
            </div>
          </div>

          {/* Charts & Insights Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left: Revenue Trend */}
            <div className="lg:col-span-2 bg-white rounded-lg flex flex-col h-96">
              <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <TrendingUp size={16} />
                <span>Estimated Revenue Collection (INR)</span>
              </h4>
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={complianceTrendData}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#10b981" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorScore)" 
                      name="Revenue"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right: Insights & Alerts */}
            <div className="flex flex-col gap-6 h-96">
              
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 overflow-hidden flex flex-col flex-1">
                <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center justify-between shrink-0">
                  <span className="flex items-center gap-2">
                     <AlertCircle size={16} className="text-amber-500" />
                     <span>Enforcement Feed</span>
                  </span>
                </h4>
                
                <div className="overflow-y-auto flex-1 pr-1 space-y-3 min-h-0">
                  {qualityIssues.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-4">
                      <CheckCircle2 size={32} className="mb-2 opacity-50" />
                      <p className="text-xs">No critical violations.</p>
                    </div>
                  ) : (
                    qualityIssues.map((item) => (
                      <div key={item.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm text-sm">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-slate-800 truncate pr-2">{item.product}</span>
                          <Link to={`/trace/${item.id}`} className="text-blue-600 text-xs hover:underline shrink-0">Trace</Link>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono mb-2 truncate">{item.id}</p>
                        
                        <div className="flex flex-wrap gap-1">
                          {item.issues.map((issue: string, idx: number) => (
                            <span key={idx} className="bg-red-50 text-red-700 px-2 py-0.5 rounded text-[10px] font-medium border border-red-100">
                              {issue}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100 shrink-0">
                <h4 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
                  <Lightbulb size={16} className="text-indigo-600" />
                  <span>Officer Tasks</span>
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                  {recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-2 bg-white/50 rounded-lg">
                      <rec.icon size={14} className={`mt-0.5 shrink-0 ${rec.color}`} />
                      <p className="text-xs text-indigo-900 leading-snug">{rec.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Stock Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-4 mt-2">
             {statusData.map((entry, index) => (
               <div key={index} className="flex items-center text-xs text-slate-500">
                 <span className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: COLORS[index] }}></span>
                 {entry.name} ({entry.value})
               </div>
             ))}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Live Ledger Events</h3>
          <div className="flex-1 overflow-auto max-h-[300px]">
            <ul className="space-y-4">
              {batches.slice(0, 5).flatMap(b => b.trace.slice(-1)).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((trace, idx) => (
                 <li key={idx} className="flex items-start space-x-3 pb-3 border-b border-slate-50 last:border-0">
                    <div className="mt-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500 ring-4 ring-blue-50"></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{trace.type}</p>
                      <p className="text-xs text-slate-500">{trace.actorName} at {trace.location}</p>
                      <p className="text-xs text-slate-400 mt-1 font-mono">{new Date(trace.timestamp).toLocaleString()}</p>
                    </div>
                 </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;