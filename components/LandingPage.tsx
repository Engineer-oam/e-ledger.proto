import React, { useState } from 'react';
// Added Link to imports from react-router-dom
import { useNavigate, Link } from 'react-router-dom';
import { AuthService } from '../services/authService';
import { User } from '../types';
import { ShieldCheck, ArrowRight, Loader2, KeyRound, Pill, Globe, Box, Database, Lock, Activity, Truck } from 'lucide-react';
import Logo from './Logo';

const LandingPage: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [gln, setGln] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await AuthService.login(gln, password);
      if (user) {
        onLogin(user);
        navigate('/dashboard');
      } else {
        setError('Authorization failed. Invalid Drug License or GSTIN.');
      }
    } catch (err) {
      setError('Network synchronization error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <div>
                <span className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter uppercase block leading-none">E-Ledger Network</span>
                <span className="text-[9px] md:text-[10px] font-bold text-teal-600 uppercase tracking-widest block leading-none">Cross-Border Trade Grid</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Global Compliance</span>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cross-Enterprise</span>
          </div>
        </div>
      </nav>

      <section className="relative pt-32 md:pt-48 pb-20 md:pb-32 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-teal-500 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500 rounded-full blur-[120px]"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 md:gap-24">
            
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 text-[10px] font-black uppercase tracking-widest mb-8">
                <Globe size={14} />
                Cross-Enterprise Traceability
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-8xl font-black text-slate-900 leading-[1.1] mb-8 tracking-tighter">
                Secure <br/>
                <span className="text-teal-500">Global</span> Chain.
              </h1>
              <p className="text-lg md:text-xl text-slate-500 max-w-xl leading-relaxed mb-12 mx-auto lg:mx-0">
                The unified blockchain ledger for cross-border supply chain operations. Streamlining trade with automated compliance, customs integration, and global serialization standards.
              </p>
              
              <div className="flex flex-wrap justify-center lg:justify-start gap-8 md:gap-12 text-slate-400">
                <div className="flex items-center gap-2 font-bold uppercase tracking-widest text-[10px]">
                   <Box size={24} className="text-teal-500" />
                   Standard Ready
                </div>
                <div className="flex items-center gap-2 font-bold uppercase tracking-widest text-[10px]">
                   <Activity size={24} className="text-blue-500" />
                   Trade Audit
                </div>
                <div className="flex items-center gap-2 font-bold uppercase tracking-widest text-[10px]">
                   <Truck size={24} className="text-green-500" />
                   Logistics
                </div>
              </div>
            </div>

            <div className="w-full max-w-md">
              <div className="bg-slate-900 rounded-[3rem] p-8 md:p-14 shadow-2xl relative">
                <div className="absolute -top-6 -right-6 w-16 h-16 bg-teal-500 rounded-2xl flex items-center justify-center shadow-xl text-white">
                  <Lock size={32} />
                </div>
                
                <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Partner Login</h2>
                <p className="text-slate-500 text-sm mb-10">Access the National Grid</p>

                {error && <div className="mb-6 p-4 bg-red-900/20 border border-red-900/40 text-red-400 text-xs font-bold rounded-2xl text-center">{error}</div>}

                <form onSubmit={handleLogin} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Business License / GSTIN</label>
                    <div className="relative">
                      <KeyRound className="absolute left-4 top-4 text-slate-600" size={18} />
                      <input
                        type="text"
                        required
                        value={gln}
                        onChange={(e) => setGln(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-12 py-4 text-white text-sm font-mono focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                        placeholder="GSTIN or License No"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Private Key</label>
                    <div className="relative">
                      <Database className="absolute left-4 top-4 text-slate-600" size={18} />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-12 py-4 text-white text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-white hover:bg-slate-100 text-slate-900 font-black py-5 rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-70"
                  >
                    {loading ? <Loader2 className="animate-spin" size={24} /> : (
                      <>
                        <span>Initialize Node</span>
                        <ArrowRight size={20} />
                      </>
                    )}
                  </button>

                  <div className="pt-6 text-center">
                    <Link to="/signup" className="text-teal-400 font-bold text-xs uppercase tracking-widest hover:text-teal-300 transition-colors">Apply for Access</Link>
                  </div>
                </form>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;