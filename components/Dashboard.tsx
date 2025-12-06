
import React, { useEffect, useState } from 'react';
import { Batch, User, UserRole, BatchStatus } from '../types';
import { LedgerService } from '../services/ledgerService';
import { AuthService } from '../services/authService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from 'recharts';
import { 
  Stamp, AlertTriangle, Activity, ScanBarcode, Globe, 
  CheckCircle2, Lightbulb, Wine, Landmark, Database, Lock
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
      // Security Note: LedgerService automatically filters data based on UserRole 
      // to ensure competitors cannot see each other's data (Secrecy).
      const data = await LedgerService.getBatches(user);
      setBatches(data);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (loading) return <div className="animate-pulse flex space-x-4 p-8"><div className="h-12 w-full bg-slate-200 rounded"></div></div>;

  // Role Routing
  if (user.role === UserRole.DISTRIBUTOR) return <DistributorDashboard user={user} />;
  if (user.role === UserRole.RETAILER) return <RetailerDashboard user={user} />;

  // Metrics
  const totalBatches = batches.length;
  const dutyPaidCount = batches.filter(b => b.dutyPaid).length;
  const bondedCount = batches.filter(b => b.status === BatchStatus.BONDED || !b.dutyPaid).length;
  const integrityRate = totalBatches > 0 ? Math.round(((totalBatches - batches.filter(b => !b.integrityHash).length) / totalBatches) * 100) : 0;
  
  // Real-time Blockchain Status Simulation
  const uptime = "99.95%";
  const blockHeight = 14023 + totalBatches;

  // Chart Data
  const statusData = [
    { name: 'Bonded', value: bondedCount },
    { name: 'Duty Paid', value: dutyPaidCount },
    { name: 'Sold', value: batches.filter(b => b.status === 'SOLD').length },
  ];
  const COLORS = ['#f59e0b', '#10b981', '#6366f1'];

  return (
    <div className="w-full space-y-8 pb-12">
      {/* Real-time Infrastructure Status */}
      <div className="bg-slate-900 text-white rounded-lg p-4 flex items-center justify-between shadow-lg">
          <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  <span className="font-mono text-sm font-bold">Mainnet Active</span>
              </div>
              <div className="hidden md:block w-px h-6 bg-slate-700"></div>
              <div className="hidden md:flex items-center gap-2 text-sm text-slate-300">
                  <Database size={14} />
                  <span>Height: #{blockHeight}</span>
              </div>
              <div className="hidden md:flex items-center gap-2 text-sm text-slate-300">
                  <Activity size={14} />
                  <span>Uptime: {uptime}</span>
              </div>
          </div>
          {user.role !== 'REGULATOR' && (
              <div className="flex items-center gap-2 text-xs bg-slate-800 px-3 py-1 rounded-full text-indigo-300 border border-indigo-500/30">
                  <Lock size={12} />
                  <span className="hidden sm:inline">Encrypted Channel</span>
              </div>
          )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Volume" value={totalBatches} icon={Wine} color="bg-indigo-500" subtitle="Batches on Chain" />
        <StatCard title="Bonded (Unpaid)" value={bondedCount} icon={Landmark} color="bg-amber-500" subtitle="Pending Duty" />
        <StatCard title="Duty Paid" value={dutyPaidCount} icon={Stamp} color="bg-emerald-500" subtitle="Market Ready" />
        <StatCard title="Hologram Usage" value={`${integrityRate}%`} icon={ScanBarcode} color="bg-blue-500" subtitle="Secure Labeling" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
           <h3 className="text-lg font-bold text-slate-800 mb-6">Revenue & Stock Flow</h3>
           <div className="h-72 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={[
                 {name: 'Jan', duty: 4000, bonded: 2400},
                 {name: 'Feb', duty: 3000, bonded: 1398},
                 {name: 'Mar', duty: 2000, bonded: 9800},
                 {name: 'Apr', duty: 2780, bonded: 3908},
                 {name: 'May', duty: 1890, bonded: 4800},
                 {name: 'Jun', duty: 2390, bonded: 3800},
               ]}>
                 <defs>
                   <linearGradient id="colorDuty" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                     <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <XAxis dataKey="name" />
                 <YAxis />
                 <CartesianGrid strokeDasharray="3 3" />
                 <Tooltip />
                 <Area type="monotone" dataKey="duty" stroke="#10b981" fillOpacity={1} fill="url(#colorDuty)" />
                 <Area type="monotone" dataKey="bonded" stroke="#f59e0b" fillOpacity={1} fill="#fef3c7" />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Stock Distribution</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
                {statusData.map((d, i) => (
                    <div key={i} className="flex justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{background: COLORS[i]}}></span>
                            <span className="text-slate-600">{d.name}</span>
                        </div>
                        <span className="font-bold">{d.value}</span>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
