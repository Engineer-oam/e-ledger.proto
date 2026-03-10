
import React, { useState } from 'react';
import { User, UserRole, Sector } from '../types';
import { 
  Users, Search, Filter, ShieldCheck, Building2, 
  MapPin, ExternalLink, CheckCircle2, AlertCircle,
  Stethoscope, Factory, Truck, Store
} from 'lucide-react';

interface Stakeholder {
  id: string;
  name: string;
  orgName: string;
  role: UserRole;
  gln: string;
  state: string;
  status: 'VERIFIED' | 'PENDING' | 'SUSPENDED';
  licenseNo: string;
  pharmacistRegNo?: string;
}

const MOCK_STAKEHOLDERS: Stakeholder[] = [
  {
    id: 'sh-1',
    name: 'Dr. Anjali Sharma',
    orgName: 'Apollo Pharmacy - Mumbai Central',
    role: UserRole.PHARMACIST,
    gln: '27ABCDE1234F1Z5',
    state: 'Maharashtra',
    status: 'VERIFIED',
    licenseNo: 'MH-MZ1-100200',
    pharmacistRegNo: 'PCI/MAH/45678'
  },
  {
    id: 'sh-2',
    name: 'Rajesh Kumar',
    orgName: 'Cipla Manufacturing Unit 4',
    role: UserRole.MANUFACTURER,
    gln: '24GHIJK5678L1Z9',
    state: 'Gujarat',
    status: 'VERIFIED',
    licenseNo: 'GUJ-MFG-556677',
  },
  {
    id: 'sh-3',
    name: 'Suresh Mehta',
    orgName: 'Mehta Pharma Stockists',
    role: UserRole.STOCKIST,
    gln: '07MNOPQ9012R1Z1',
    state: 'Delhi',
    status: 'VERIFIED',
    licenseNo: 'DL-WHL-889900',
  },
  {
    id: 'sh-4',
    name: 'Vikram Singh',
    orgName: 'Blue Dart Cold Chain Logistics',
    role: UserRole.LOGISTICS_PROVIDER,
    gln: '33STUVW3456X1Z3',
    state: 'Tamil Nadu',
    status: 'VERIFIED',
    licenseNo: 'TN-LOG-112233',
  },
  {
    id: 'sh-5',
    name: 'CDSCO Admin',
    orgName: 'Central Drugs Standard Control Organization',
    role: UserRole.CDSCO_OFFICIAL,
    gln: '00GOVT00000A1Z0',
    state: 'Delhi',
    status: 'VERIFIED',
    licenseNo: 'GOV-CDSCO-001',
  }
];

const StakeholderManager: React.FC<{ user: User }> = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');

  const filteredStakeholders = MOCK_STAKEHOLDERS.filter(sh => {
    const matchesSearch = sh.orgName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          sh.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sh.gln.includes(searchTerm);
    const matchesRole = filterRole === 'ALL' || sh.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.MANUFACTURER: return <Factory className="text-blue-500" size={18} />;
      case UserRole.PHARMACIST: return <Stethoscope className="text-emerald-500" size={18} />;
      case UserRole.SUPER_STOCKIST:
      case UserRole.STOCKIST: 
      case UserRole.CF_AGENT:
      case UserRole.SUB_STOCKIST: return <Truck className="text-orange-500" size={18} />;
      case UserRole.CDSCO_OFFICIAL:
      case UserRole.SLA_OFFICIAL:
      case UserRole.NPPA_OFFICIAL: return <ShieldCheck className="text-purple-500" size={18} />;
      default: return <Building2 className="text-slate-500" size={18} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">STAKEHOLDER REGISTRY</h1>
          <p className="text-sm text-slate-500">Verified entities on the {user.sector === Sector.PHARMA ? 'Pharma' : 'Excise'} Network</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all">
            Invite Partner
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by Name, Organization, GSTIN or GLN..." 
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <select 
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none appearance-none cursor-pointer shadow-sm"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="ALL">All Roles</option>
            <option value={UserRole.MANUFACTURER}>Manufacturers</option>
            <option value={UserRole.SUPER_STOCKIST}>Super Stockists</option>
            <option value={UserRole.STOCKIST}>Stockists</option>
            <option value={UserRole.PHARMACIST}>Pharmacists</option>
            <option value={UserRole.CDSCO_OFFICIAL}>Regulators</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Organization & Role</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorized Person</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Location & GSTIN</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">License Details</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStakeholders.map((sh) => (
                <tr key={sh.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                        {getRoleIcon(sh.role)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{sh.orgName}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{sh.role.replace('_', ' ')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-medium text-slate-700">{sh.name}</p>
                    {sh.pharmacistRegNo && (
                      <p className="text-[10px] text-emerald-600 font-bold">Reg: {sh.pharmacistRegNo}</p>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                      <MapPin size={12} />
                      <span className="text-xs">{sh.state}, India</span>
                    </div>
                    <p className="text-[10px] font-mono font-bold text-slate-400">{sh.gln}</p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-lg border border-slate-200">
                      <ShieldCheck size={12} className="text-slate-500" />
                      <span className="text-[10px] font-mono font-bold text-slate-600">{sh.licenseNo}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      sh.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' : 
                      sh.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {sh.status === 'VERIFIED' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                      {sh.status}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
                      <ExternalLink size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredStakeholders.length === 0 && (
          <div className="p-12 text-center">
            <Users size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-500 font-medium">No stakeholders found matching your criteria.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-emerald-900/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-800/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10">
            <h3 className="text-xl font-black mb-2 tracking-tight">TRUST NETWORK</h3>
            <p className="text-emerald-100/70 text-sm leading-relaxed mb-6">
              Entities on this registry are verified by CDSCO or State Licensing Authorities. 
              Transactions between verified nodes are automatically compliant with GxP standards.
            </p>
            <div className="flex gap-4">
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex-1">
                <p className="text-[10px] font-black text-emerald-300 uppercase mb-1">Total Nodes</p>
                <p className="text-2xl font-black">1,240</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex-1">
                <p className="text-[10px] font-black text-emerald-300 uppercase mb-1">Verified Today</p>
                <p className="text-2xl font-black">12</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 mb-4 tracking-tight">COMPLIANCE ALERTS</h3>
          <div className="space-y-4">
            {[
              { title: 'License Expiry', desc: '3 Stockists in your network have licenses expiring in < 30 days.', type: 'warning' },
              { title: 'Verification Request', desc: 'New verification request from Apollo Pharmacy (Mumbai).', type: 'info' }
            ].map((alert, i) => (
              <div key={i} className={`p-4 rounded-2xl border flex gap-4 ${alert.type === 'warning' ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${alert.type === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                  {alert.type === 'warning' ? <AlertCircle size={20} /> : <ShieldCheck size={20} />}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{alert.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{alert.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StakeholderManager;
