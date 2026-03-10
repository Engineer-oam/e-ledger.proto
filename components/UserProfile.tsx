import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { 
  UserCircle, Building2, MapPin, Shield, Save, Loader2, 
  Cpu, ArrowRight, Tags, Mail, Phone, Globe, CreditCard, 
  Lock, Key, LogOut, History, Bell, Database
} from 'lucide-react';
import { toast } from 'react-toastify';

interface UserProfileProps {
  user: User;
  onUpdate: (user: User) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'security'>('details');
  const [formData, setFormData] = useState({
    name: user.name,
    orgName: user.orgName,
    email: 'authorized.user@' + user.orgName.toLowerCase().replace(/\s/g, '') + '.com', // Simulated
    phone: '+91 98765 43210' // Simulated
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      onUpdate({ ...user, name: formData.name, orgName: formData.orgName });
      toast.success('Profile updated successfully.');
      setLoading(false);
    }, 800);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="relative bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 overflow-hidden text-white shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-10">
           <Shield size={200} />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
           <div className="relative">
              <div className="w-28 h-28 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-4xl font-bold border-4 border-white/20 shadow-2xl">
                {user.name.charAt(0)}
              </div>
              <div className="absolute bottom-1 right-1 w-8 h-8 bg-emerald-500 rounded-full border-4 border-slate-900 flex items-center justify-center">
                 <Shield size={14} className="fill-white text-emerald-500" />
              </div>
           </div>
           
           <div className="text-center md:text-left space-y-2">
              <h1 className="text-3xl font-black tracking-tight">{user.name}</h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                 <span className="bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-indigo-200">
                    {user.role.replace('_', ' ')}
                 </span>
                 <span className="bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-emerald-200 flex items-center gap-1">
                    <Globe size={12} /> {user.country} Network
                 </span>
              </div>
              <p className="text-slate-400 text-sm max-w-lg">
                 {user.positionLabel} at {user.orgName}. Authorized signage rights for {user.sector} supply chain events.
              </p>
           </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
         <button 
           onClick={() => setActiveTab('details')}
           className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'details' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
         >
           Entity Details
         </button>
         <button 
           onClick={() => setActiveTab('security')}
           className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'security' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
         >
           Security & Access
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Left Column (Main Form) */}
         <div className="lg:col-span-2 space-y-6">
            {activeTab === 'details' ? (
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4">
                   
                   {/* Personal Info Section */}
                   <section>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                         <UserCircle className="text-indigo-500" size={18} />
                         Authorized Representative
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                            <input name="name" value={formData.name} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                         </div>
                         <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Official Email</label>
                            <div className="relative">
                               <Mail size={16} className="absolute left-4 top-3.5 text-slate-400" />
                               <input name="email" value={formData.email} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                            </div>
                         </div>
                         <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Contact Phone</label>
                            <div className="relative">
                               <Phone size={16} className="absolute left-4 top-3.5 text-slate-400" />
                               <input name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                            </div>
                         </div>
                      </div>
                   </section>

                   <div className="border-t border-slate-100"></div>

                   {/* Organization Section */}
                   <section>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                         <Building2 className="text-indigo-500" size={18} />
                         Legal Entity
                      </h3>
                      <div className="space-y-6">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Registered Org Name</label>
                                <input name="orgName" value={formData.orgName} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Global Location No (GLN)</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Globe size={16} className="absolute left-4 top-3.5 text-slate-400" />
                                        <input disabled value={user.gln} className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-mono text-slate-500 cursor-not-allowed" />
                                    </div>
                                </div>
                            </div>
                         </div>

                         {user.subCategories && user.subCategories.length > 0 && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Business Categories</label>
                                <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    {user.subCategories.map((cat, i) => (
                                        <span key={i} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 shadow-sm flex items-center gap-1">
                                            <Tags size={10} className="text-indigo-400" />
                                            {cat}
                                        </span>
                                    ))}
                                </div>
                            </div>
                         )}
                      </div>
                   </section>

                   <div className="flex justify-end pt-4">
                      <button 
                        type="submit" 
                        disabled={loading}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-70"
                      >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        <span>Save Changes</span>
                      </button>
                   </div>
                </form>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    {/* Security Cards */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <Lock className="text-indigo-600" size={20} />
                                    <span>Password & Authentication</span>
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">Manage how you sign in to the E-Ledger India network.</p>
                            </div>
                            <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800 px-4 py-2 bg-indigo-50 rounded-lg transition-colors">
                                Update Password
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400">
                                        <Key size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-700">Two-Factor Authentication</p>
                                        <p className="text-xs text-slate-500">Secure your node with OTP.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Enabled</span>
                                    <button className="text-xs text-slate-400 hover:text-slate-600 font-bold underline">Config</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                            <History className="text-indigo-600" size={20} />
                            <span>Session Activity</span>
                        </h3>
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${i === 1 ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-700">Web Portal Login</p>
                                            <p className="text-xs text-slate-400 font-mono">IP: 192.168.1.{10+i} • Mumbai, IN</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-500 font-medium">
                                        {i === 1 ? 'Active Now' : `${i*2} hours ago`}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
         </div>

         {/* Right Sidebar */}
         <div className="space-y-6">
            {/* ID Card Simulation */}
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-all"></div>
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Digital Identity</p>
                        <h3 className="text-xl font-black mt-1">E-Ledger Pass</h3>
                    </div>
                    <Cpu size={24} className="opacity-80" />
                </div>
                <div className="space-y-4">
                    <div>
                        <p className="text-[9px] uppercase font-bold opacity-60">GLN</p>
                        <p className="font-mono text-sm tracking-wide">{user.gln}</p>
                    </div>
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-[9px] uppercase font-bold opacity-60">Status</p>
                            <div className="flex items-center gap-1.5 mt-1">
                                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                                <span className="text-xs font-bold">Active Node</span>
                            </div>
                        </div>
                        <div className="bg-white/20 p-1.5 rounded">
                            <Cpu size={20} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ERP Status Mini */}
            {user.erpStatus && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <Database size={18} />
                        </div>
                        <h4 className="font-bold text-slate-700 text-sm">System Link</h4>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Type</span>
                            <span className="font-bold text-slate-800">{user.erpType}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Status</span>
                            <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                                user.erpStatus === 'CONNECTED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            }`}>{user.erpStatus}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Support */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
                <h4 className="font-bold text-slate-700 text-sm mb-2">Need Compliance Help?</h4>
                <p className="text-xs text-slate-500 mb-4">Contact the iVEDA support desk for assistance with regulatory reporting.</p>
                <button className="w-full py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                    Contact Support
                </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default UserProfile;