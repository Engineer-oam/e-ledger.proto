
import React, { useState, useEffect } from 'react';
import { AuthService } from '../services/authService';
import { User } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Loader2, ArrowRight, Lock, KeyRound, CheckCircle2, Settings, Server, AlertTriangle, Save, Stamp } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const REMEMBER_KEY = 'eledger_remembered_gln';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [view, setView] = useState<'login' | 'forgot'>('login');
  
  const [gln, setGln] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  const [resetGln, setResetGln] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetStep, setResetStep] = useState(1); 

  const [showSettings, setShowSettings] = useState(false);
  const [useRemote, setUseRemote] = useState(false);
  const [apiUrl, setApiUrl] = useState('http://localhost:3001/api');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedGln = localStorage.getItem(REMEMBER_KEY);
    if (savedGln) {
      setGln(savedGln);
      setRememberMe(true);
    }
    setUseRemote(localStorage.getItem('ELEDGER_USE_REMOTE') === 'true');
    setApiUrl(localStorage.getItem('ELEDGER_API_URL') || 'http://localhost:3001/api');
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await AuthService.login(gln, password);
      if (user) {
        if (rememberMe) {
          localStorage.setItem(REMEMBER_KEY, gln);
        } else {
          localStorage.removeItem(REMEMBER_KEY);
        }
        
        onLogin(user);
        navigate('/dashboard');
      } else {
        if (!useRemote) {
          setError('Invalid License No / GLN or Password.');
        } else {
          setError('Invalid Credentials.');
        }
      }
    } catch (err) {
      setError('Connection failed. Please check network.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Step 1: Verify Identity
    if (resetStep === 1) {
        if (resetGln.length < 5) {
            setError('Invalid License No / GLN format.');
            return;
        }
        setLoading(true);
        try {
            const exists = await AuthService.checkUser(resetGln);
            if (exists) {
                setResetStep(2);
                setSuccess('Identity Verified.');
            } else {
                setError('License No / GLN not found in registry.');
            }
        } catch (err) {
            setError('Verification failed.');
        } finally {
            setLoading(false);
        }
        return;
    }

    // Step 2: Update Password
    setLoading(true);
    try {
      if (newPassword.length < 4) throw new Error("Password too short.");
      if (newPassword !== confirmPassword) throw new Error("Passwords mismatch.");

      const result = await AuthService.resetPassword(resetGln, newPassword);
      if (result) {
        setSuccess('Password reset successfully. Please login.');
        setTimeout(() => {
            setView('login');
            setGln(resetGln);
            setPassword('');
            setResetStep(1);
            setSuccess('');
        }, 2000);
      } else {
        setError('License No / GLN not found.');
      }
    } catch (err: any) {
      setError(err.message || 'Reset failed.');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = () => {
    localStorage.setItem('ELEDGER_USE_REMOTE', String(useRemote));
    localStorage.setItem('ELEDGER_API_URL', apiUrl);
    window.location.reload(); 
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 overflow-y-auto">
      
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
               <h3 className="font-bold flex items-center gap-2">
                 <Server size={18} />
                 <span>Server Settings</span>
               </h3>
               <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="p-6 space-y-4">
               <div className="flex items-start gap-3 bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm text-blue-800">
                 <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                 <p>
                   <strong>Demo Mode (Local):</strong> Data stored in browser only.<br/><br/>
                   <strong>Remote Mode:</strong> Connects to centralized Excise Database.
                 </p>
               </div>
               
               <div className="space-y-3">
                 <label className="flex items-center gap-3 cursor-pointer p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded" checked={useRemote} onChange={e => setUseRemote(e.target.checked)} />
                    <span className="font-medium text-slate-700">Use Remote Excise Server</span>
                 </label>

                 <div className={`transition-opacity ${useRemote ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">API Endpoint</label>
                    <input type="text" value={apiUrl} onChange={e => setApiUrl(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm font-mono" />
                 </div>
               </div>

               <button onClick={saveSettings} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2 mt-4">
                 <Save size={18} />
                 <span>Save Configuration</span>
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Card */}
      <div className="max-w-[540px] w-full bg-white rounded-3xl shadow-xl overflow-hidden transition-all duration-300 relative my-auto">
        <button onClick={() => setShowSettings(true)} className="absolute top-4 right-4 z-20 p-2 bg-slate-800/50 hover:bg-slate-800 text-white rounded-full backdrop-blur-sm transition-colors">
          <Settings size={16} />
        </button>

        <div className="bg-slate-900 p-6 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="relative z-10">
            <div className="inline-block p-2.5 bg-indigo-600 rounded-2xl mb-2 shadow-lg shadow-indigo-900/50 transform rotate-3">
              {view === 'login' ? <Stamp size={24} className="text-white" /> : <KeyRound size={24} className="text-white" />}
            </div>
            <h1 className="text-2xl font-extrabold text-white mb-0.5 tracking-tight">ExciseLedger</h1>
            <p className="text-slate-400 text-xs font-medium">State Supply Chain Portal</p>
          </div>
        </div>
        
        <div className="p-6">
          {!useRemote && (
            <div className="mb-4 flex flex-col gap-2">
              <div className="flex justify-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-500 border border-slate-200">
                  <Settings size={10} />
                  Simulation Mode
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-2.5 bg-red-50 border border-red-200 text-red-600 text-xs font-medium rounded-lg text-center animate-in fade-in">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-2.5 bg-green-50 border border-green-200 text-green-700 text-xs font-medium rounded-lg text-center flex items-center justify-center gap-2 animate-in fade-in">
              <CheckCircle2 size={14} />
              {success}
            </div>
          )}
          
          {view === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  License No / GLN
                </label>
                <input
                  type="text"
                  required
                  value={gln}
                  onChange={(e) => setGln(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition font-mono text-sm"
                  placeholder="0000000000000"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Password</label>
                  <button type="button" onClick={() => { setView('forgot'); setError(''); }} className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold">Forgot?</button>
                </div>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition text-sm" placeholder="••••••••" />
              </div>

              <div className="flex items-center">
                <input id="remember-me" type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-3.5 w-3.5 text-indigo-600 rounded cursor-pointer" />
                <label htmlFor="remember-me" className="ml-2 block text-xs text-slate-600 cursor-pointer select-none">Remember GLN</label>
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-indigo-200 transition-all duration-300 ease-in-out flex items-center justify-center space-x-2 text-sm"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <><span>Secure Login</span><ArrowRight size={16} /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              {resetStep === 1 && (
                <>
                  <p className="text-xs text-slate-600 text-center mb-2 leading-relaxed">Enter your License Number to verify identity.</p>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">License / GLN</label>
                    <input type="text" autoFocus required value={resetGln} onChange={(e) => setResetGln(e.target.value)} className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 font-mono text-sm" />
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl transition-colors shadow-lg text-sm flex items-center justify-center gap-2">
                    {loading ? <Loader2 size={16} className="animate-spin" /> : 'Verify Identity'}
                  </button>
                </>
              )}

              {resetStep === 2 && (
                <>
                   <p className="text-xs text-slate-600 text-center mb-2">Identity verified. Set new password.</p>
                   <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">New Password</label><input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 text-sm" /></div>
                   <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Confirm</label><input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 text-sm" /></div>
                  <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-colors flex justify-center items-center gap-2 shadow-lg text-sm">{loading ? <Loader2 size={18} className="animate-spin"/> : <Lock size={16} />}<span>Update Password</span></button>
                </>
              )}
              <button type="button" onClick={() => { setView('login'); setError(''); setResetStep(1); }} className="w-full mt-2 text-slate-500 hover:text-slate-800 text-xs font-medium py-2">Back to Login</button>
            </form>
          )}

          {view === 'login' && (
            <div className="mt-4 pt-4 border-t border-slate-100 text-center">
              <p className="text-slate-400 text-xs mb-1">New Licensee?</p>
              <Link to="/signup" className="text-indigo-600 hover:text-indigo-800 font-bold text-xs transition-colors uppercase tracking-wide">Apply for Account</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
