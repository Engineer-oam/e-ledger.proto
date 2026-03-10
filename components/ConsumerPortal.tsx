import React, { useState } from 'react';
import { Search, ShieldCheck, AlertTriangle, Package, MapPin, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';
import { LedgerService } from '../services/ledgerService';
import { Batch, TraceEvent } from '../types';
import Logo from './Logo';

const ConsumerPortal: React.FC = () => {
  const [searchId, setSearchId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;

    setIsSearching(true);
    setError('');
    setBatch(null);

    try {
      const result = await LedgerService.getBatchByID(searchId.trim());
      if (result) {
        setBatch(result);
      } else {
        setError('Product not found. Please check the ID and try again.');
      }
    } catch (err) {
      setError('An error occurred while verifying the product.');
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SOLD': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'RECALLED': return 'text-red-600 bg-red-50 border-red-200';
      case 'DESTROYED': return 'text-red-600 bg-red-50 border-red-200';
      case 'QUARANTINED': return 'text-amber-600 bg-amber-50 border-amber-200';
      default: return 'text-indigo-600 bg-indigo-50 border-indigo-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <header className="bg-white border-b border-slate-200 py-4 px-6 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 p-1.5 rounded-xl">
            <Logo size="sm" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter text-slate-900">E-LEDGER INDIA</h1>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Consumer Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span className="text-[10px] font-black uppercase text-emerald-800">Authenticity Verified</span>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto p-6 md:p-12 flex flex-col">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">Verify Your Bottle</h2>
          <p className="text-slate-500 max-w-lg mx-auto">
            Enter the GTIN or Batch ID found on the excise label to trace its origin and ensure it is genuine and safe for consumption.
          </p>
        </div>

        <form onSubmit={handleSearch} className="relative max-w-xl w-full mx-auto mb-12">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-6 w-6 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-32 py-4 border-2 border-slate-200 rounded-2xl text-lg focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none font-mono shadow-sm"
            placeholder="e.g. BATCH-123456"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
          />
          <button
            type="submit"
            disabled={isSearching || !searchId.trim()}
            className="absolute inset-y-2 right-2 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            {isSearching ? 'Verifying...' : 'Verify'}
          </button>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center animate-in fade-in slide-in-from-bottom-4">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-red-900 mb-2">Verification Failed</h3>
            <p className="text-red-700">{error}</p>
            <p className="text-sm text-red-600 mt-4 font-medium">Do not consume this product. Please report it to the authorities.</p>
          </div>
        )}

        {batch && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {/* Product Card */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100 shrink-0">
                    <Package className="h-8 w-8 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">{batch.productName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-mono text-slate-500">{batch.batchID}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-sm font-bold text-slate-600">{batch.liquorType || 'Liquor'}</span>
                    </div>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-xl border font-black text-sm uppercase tracking-wider ${getStatusColor(batch.status)}`}>
                  {batch.status}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 md:p-8 bg-slate-50/50">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Package Size</p>
                  <p className="font-bold text-slate-800">{batch.packageSize?.replace('_', ' ') || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Alcohol Strength</p>
                  <p className="font-bold text-slate-800">{batch.alcoholicStrength ? `${batch.alcoholicStrength}% v/v` : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Mfg Date</p>
                  <p className="font-bold text-slate-800">{new Date(batch.productionDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Expiry Date</p>
                  <p className="font-bold text-slate-800">{new Date(batch.expiryDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Warning if Recalled or Destroyed */}
            {(batch.status === 'RECALLED' || batch.status === 'DESTROYED') && (
              <div className="bg-red-600 text-white rounded-2xl p-6 flex gap-4 items-start shadow-lg shadow-red-600/20">
                <AlertTriangle className="h-8 w-8 shrink-0" />
                <div>
                  <h4 className="text-lg font-black mb-1">DO NOT CONSUME</h4>
                  <p className="text-red-100">This product has been marked as {batch.status.toLowerCase()} by the authorities. It is unsafe for consumption.</p>
                </div>
              </div>
            )}

            {/* Traceability Timeline */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 md:p-8">
              <h3 className="text-lg font-black text-slate-900 mb-8 flex items-center gap-2">
                <MapPin className="text-indigo-600" />
                Product Journey
              </h3>
              
              <div className="relative pl-8 space-y-8">
                <div className="absolute top-2 bottom-2 left-[11px] w-0.5 bg-slate-100"></div>
                
                {batch.trace.map((event, index) => (
                  <div key={event.eventID} className="relative">
                    <div className="absolute -left-8 top-1 h-6 w-6 rounded-full border-4 border-white bg-indigo-600 shadow-sm"></div>
                    
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-lg">
                            {event.type.replace('_', ' ')}
                          </span>
                          <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      <h4 className="font-bold text-slate-800 text-lg mb-1">{event.actorName}</h4>
                      <p className="text-sm text-slate-500 flex items-center gap-1">
                        <MapPin size={14} /> {event.location}
                      </p>
                      
                      {event.ePassNo && (
                        <div className="mt-3 inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg">
                          <CheckCircle2 size={14} className="text-emerald-600" />
                          <span className="text-xs font-bold text-emerald-800">Valid e-Pass: {event.ePassNo}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
      
      <footer className="bg-slate-900 text-slate-400 py-6 text-center text-sm">
        <p>© {new Date().getFullYear()} E-Ledger India Network. All rights reserved.</p>
        <p className="text-xs mt-1 opacity-50">Secured by Blockchain Technology</p>
      </footer>
    </div>
  );
};

export default ConsumerPortal;
