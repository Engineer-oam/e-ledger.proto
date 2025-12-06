
import React, { useState, useEffect } from 'react';
import { AuthService } from '../services/authService';
import { UserRole } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Loader2, Building2, UserCircle, MapPin, RefreshCw, AlertTriangle, ArrowRight } from 'lucide-react';

const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    orgName: '',
    gln: '',
    role: UserRole.MANUFACTURER,
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRemote, setIsRemote] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsRemote(localStorage.getItem('ELEDGER_USE_REMOTE') === 'true');
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGenerateGLN = (e: React.MouseEvent) => {
    e.preventDefault();
    const newGln = AuthService.generateGLN();
    setFormData(prev => ({ ...prev, gln: newGln }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (formData.gln.length !== 13) {
        throw new Error('GLN must be exactly 13 digits.');
      }
      
      await AuthService.signup(
        formData.name,
        formData.orgName,
        formData.gln,
        formData.role,
        formData.password
      );
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Failed to register.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      {/* Increased Width to max-w-4xl and Rounded Corners to 3xl */}
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* Sidebar - Adjusted width to w-5/12 (~40%) */}
        <div className="hidden md:flex w-5/12 bg-slate-900 p-10 text-white flex-col justify-between relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          
          <div className="relative z-10">
            <div className="inline-block p-3 bg-indigo-600 rounded-2xl mb-6 shadow-lg shadow-indigo-900/40">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-3xl font-extrabold mb-3 tracking-tight">Excise Portal</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Register your Distillery, Bonded Warehouse, or Retail Establishment on the state blockchain network.
            </p>
          </div>

          <div className="relative z-10 space-y-6">
             <div className="flex items-center gap-4 text-sm text-slate-300">
               <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold">1</div>
               <p>Identity Verification</p>
             </div>
             <div className="flex items-center gap-4 text-sm text-slate-300">
               <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold">2</div>
               <p>License Mapping</p>
             </div>
             <div className="flex items-center gap-4 text-sm text-slate-300">
               <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold">3</div>
               <p>Ledger Access</p>
             </div>
          </div>

          <div className="text-[10px] text-slate-500 font-mono relative z-10">
            SECURE GOVERNMENT GATEWAY © 2024
          </div>
        </div>

        {/* Form Area */}
        <div className="flex-1 p-8 md:p-12 flex flex-col justify-center">
          <div className="flex justify-between items-start mb-8">
             <div>
                <h2 className="text-2xl font-bold text-slate-800">Licensee Registration</h2>
                <p className="text-slate-500 text-sm mt-1">Create your digital identity</p>
             </div>
             <Link to="/login" className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors">
               LOGIN INSTEAD
             </Link>
          </div>
          
          {!isRemote && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
              <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
              <div className="text-xs text-amber-800 leading-relaxed">
                <strong className="block mb-1 font-bold">Simulation Mode Active</strong>
                Account data will be stored locally in your browser.
              </div>
            </div>
          )}

          {error && <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl font-medium">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Owner Name</label>
                <div className="relative">
                  <UserCircle size={18} className="absolute left-3 top-3 text-slate-400" />
                  <input name="name" required value={formData.name} onChange={handleChange} className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all" placeholder="Full Name" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Business Name</label>
                <div className="relative">
                  <Building2 size={18} className="absolute left-3 top-3 text-slate-400" />
                  <input name="orgName" required value={formData.orgName} onChange={handleChange} className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all" placeholder="e.g. Royal Distilleries" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">License No / GLN</label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <MapPin size={18} className="absolute left-3 top-3 text-slate-400" />
                  <input name="gln" required maxLength={13} minLength={13} value={formData.gln} onChange={handleChange} className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono" placeholder="0000000000000" />
                </div>
                <button type="button" onClick={handleGenerateGLN} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-200 transition-colors font-medium text-xs flex items-center gap-1" title="Generate Random">
                   <RefreshCw size={14} /> <span>Gen</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">License Category</label>
              <select name="role" value={formData.role} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white cursor-pointer">
                <option value={UserRole.MANUFACTURER}>Distillery / Brewery / Bottling Plant</option>
                <option value={UserRole.DISTRIBUTOR}>Bonded Warehouse / Wholesaler</option>
                <option value={UserRole.RETAILER}>Retail Shop / Bar / Hotel</option>
                <option value={UserRole.REGULATOR}>Excise Official (Govt)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Password</label>
              <input name="password" type="password" required value={formData.password} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" placeholder="••••••••" />
            </div>

            <button type="submit" disabled={loading} className="w-full mt-6 bg-slate-900 hover:bg-slate-800 disabled:opacity-70 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 transform hover:translate-y-[-1px]">
              {loading ? <Loader2 size={20} className="animate-spin" /> : <><span>Complete Registration</span><ArrowRight size={18} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
