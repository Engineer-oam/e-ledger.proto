import React, { useState, useEffect } from 'react';
import { Server, Database, Save, CheckCircle2, AlertTriangle, RefreshCw, Settings } from 'lucide-react';
import { toast } from 'react-toastify';

const SystemSettings: React.FC = () => {
  const [useRemote, setUseRemote] = useState(false);
  const [apiUrl, setApiUrl] = useState('http://localhost:3001/api');
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');

  useEffect(() => {
    setUseRemote(localStorage.getItem('ELEDGER_USE_REMOTE') === 'true');
    setApiUrl(localStorage.getItem('ELEDGER_API_URL') || 'http://localhost:3001/api');
  }, []);

  const handleSave = () => {
    localStorage.setItem('ELEDGER_USE_REMOTE', String(useRemote));
    localStorage.setItem('ELEDGER_API_URL', apiUrl);
    toast.success("Settings saved. Please reload the app to apply changes.");
    setTimeout(() => window.location.reload(), 1500);
  };

  const testConnection = async () => {
    setConnectionStatus('unknown');
    try {
      const res = await fetch(`${apiUrl}/batches`);
      if (res.ok) {
        setConnectionStatus('connected');
        toast.success("Connection to Backend Successful!");
      } else {
        throw new Error("Status " + res.status);
      }
    } catch (e) {
      setConnectionStatus('error');
      toast.error("Could not connect to Backend server.");
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">System Config</h2>
          <p className="text-slate-500 text-sm">System Architecture & Backend Settings</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden w-full">
        <div className="bg-slate-900 p-6 text-white">
          <h3 className="font-bold text-lg">Backend Configuration</h3>
          <p className="text-slate-400 text-sm mt-1">
            Choose between browser-based simulation (Demo) or a solid Node.js backend.
          </p>
        </div>

        <div className="p-8 space-y-8 w-full">
          
          <div className="flex items-start gap-4">
            <div className={`mt-1 p-2 rounded-lg ${useRemote ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
              <Database size={24} />
            </div>
            <div className="flex-1">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={useRemote} onChange={e => setUseRemote(e.target.checked)} />
                  <div className={`block w-14 h-8 rounded-full transition-colors ${useRemote ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${useRemote ? 'transform translate-x-6' : ''}`}></div>
                </div>
                <div className="font-bold text-slate-800">Use Remote Backend (Node.js + SQLite)</div>
              </label>
              <p className="text-sm text-slate-500 mt-2">
                Enable this to connect to a real `server.js` instance running locally or in the cloud. 
                Disabling this uses Browser LocalStorage (Demo Mode).
              </p>
            </div>
          </div>

          {useRemote && (
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 animate-in fade-in w-full">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Backend API URL</label>
              <div className="flex gap-2">
                <input 
                  value={apiUrl}
                  onChange={e => setApiUrl(e.target.value)}
                  className="flex-1 border border-slate-300 rounded-lg px-4 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="http://localhost:3001/api"
                />
                <button 
                  onClick={testConnection}
                  className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600"
                  title="Test Connection"
                >
                  <RefreshCw size={18} />
                </button>
              </div>
              
              {connectionStatus === 'connected' && (
                <div className="mt-3 flex items-center gap-2 text-green-600 text-sm font-medium">
                  <CheckCircle2 size={16} />
                  <span>Server Online & Reachable</span>
                </div>
              )}
              {connectionStatus === 'error' && (
                <div className="mt-3 flex items-center gap-2 text-red-600 text-sm font-medium">
                  <AlertTriangle size={16} />
                  <span>Connection Failed. Ensure server.js is running.</span>
                </div>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button 
              onClick={handleSave}
              className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors"
            >
              <Save size={18} />
              <span>Save & Reload</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SystemSettings;