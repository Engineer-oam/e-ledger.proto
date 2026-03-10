import React, { useState } from 'react';
import { LedgerService } from '../services/ledgerService';
import { AuthService } from '../services/authService';
import { Batch, User } from '../types';
import { Search, ShieldCheck, XCircle, Clock, MapPin, CheckCircle2, Fingerprint, Camera, Stamp, AlertOctagon, Award, Building2, UserCheck, Briefcase, Globe } from 'lucide-react';
import QRScanner from './QRScanner';

const ProductVerifier: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'product' | 'partner'>('product');
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<Batch | null>(null);
  const [partnerResult, setPartnerResult] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [duplicateAlert, setDuplicateAlert] = useState<{detected: boolean, msg: string}>({ detected: false, msg: '' });

  const handleVerify = async (e?: React.FormEvent, directInput?: string) => {
    if (e) e.preventDefault();
    const searchQuery = directInput || query;
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);
    setSearched(true);
    setDuplicateAlert({ detected: false, msg: '' });

    try {
      // 1. Anti-Counterfeit Check (POS API)
      const posCheck = await LedgerService.checkPOSStatus(searchQuery.trim(), 'public_verifier');
      
      if (posCheck.status === 'DUPLICATE') {
         setDuplicateAlert({ detected: true, msg: posCheck.message });
         setLoading(false);
         return; 
      }

      // 2. Data Lookup
      let batch = await LedgerService.verifyByHash(searchQuery.trim());
      if (!batch) {
        batch = await LedgerService.getBatchByID(searchQuery.trim());
      }

      if (batch) {
        setResult(batch);
        setQuery(searchQuery.trim());
      } else {
        setError('Invalid Identification. This product may be illicit or counterfeit.');
      }
    } catch (err) {
      setError('Verification Error.');
    } finally {
      setLoading(false);
    }
  };

  const handlePartnerVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setError('');
    setPartnerResult(null);
    setSearched(true);

    try {
        const user = await AuthService.getPublicProfile(query.trim());
        if (user) {
            setPartnerResult(user);
        } else {
            setError('GLN not found in Global Registry. This entity may be unauthorized.');
        }
    } catch (err) {
        setError('Verification Service Unavailable.');
    } finally {
        setLoading(false);
    }
  };

  const handleCameraScan = (text: string) => {
    setShowScanner(false);
    setQuery(text);
    if (activeTab === 'product') {
        handleVerify(undefined, text);
    }
  };

  return (
    <div className="w-full">
      {showScanner && (
        <QRScanner 
          onScan={handleCameraScan} 
          onClose={() => setShowScanner(false)} 
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Verification Services</h2>
           <p className="text-slate-500 text-sm">Verify Products (GTIN) and Trading Partners (GLN)</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-t-2xl border-b border-slate-200 px-2 flex gap-2">
         <button 
            onClick={() => { setActiveTab('product'); setQuery(''); setResult(null); setError(''); setSearched(false); }}
            className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'product' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
         >
            <ShieldCheck size={18} />
            Product Authenticity
         </button>
         <button 
            onClick={() => { setActiveTab('partner'); setQuery(''); setPartnerResult(null); setError(''); setSearched(false); }}
            className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'partner' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
         >
            <Building2 size={18} />
            Partner GLN Status
         </button>
      </div>

      <div className="bg-white rounded-b-2xl shadow-sm border border-slate-200 border-t-0 mb-8 w-full overflow-hidden">
        <form onSubmit={activeTab === 'product' ? (e) => handleVerify(e) : handlePartnerVerify} className="p-4 md:p-6 flex flex-col md:flex-row items-center gap-3 md:gap-4 bg-slate-50 border-b border-slate-100">
          <div className="relative flex-1 w-full max-w-2xl">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={activeTab === 'product' ? "Enter Product Hash or Batch ID..." : "Enter 13-digit Global Location Number (GLN)..."}
              className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition font-mono text-sm shadow-sm"
            />
            {activeTab === 'product' && (
                <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="absolute right-3 top-2.5 p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Scan"
                >
                <Camera size={22} />
                </button>
            )}
          </div>
          <button 
            type="submit" 
            disabled={loading || !query}
            className="w-full md:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 whitespace-nowrap"
          >
            {loading ? 'Verifying...' : 'Check Status'}
          </button>
        </form>

        {/* Counterfeit / Duplicate Alert */}
        {duplicateAlert.detected && (
          <div className="bg-red-50 border-l-8 border-red-600 p-6 m-4 md:m-8 rounded-r-xl shadow-inner animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-5">
              <div className="bg-red-100 p-3 rounded-full shrink-0">
                <AlertOctagon size={40} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-red-700 uppercase tracking-wide">Counterfeit Alert</h3>
                <p className="text-lg font-bold text-red-900 mt-1">{duplicateAlert.msg}</p>
                <p className="text-sm text-red-800 mt-2 leading-relaxed">
                  This specific identifier has already been marked as <strong>SOLD</strong> or <strong>CONSUMED</strong>. 
                  Multiple scans of the same ID indicate a cloned label or refilled container.
                </p>
                <div className="mt-4 inline-block bg-red-600 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-md">
                  ⛔ STOP: DO NOT PURCHASE / USE
                </div>
              </div>
            </div>
          </div>
        )}

        {searched && !loading && !result && !partnerResult && !error && !duplicateAlert.detected && (
           <div className="p-16 text-center text-slate-400">
              <Search size={48} className="mx-auto mb-4 opacity-20" />
              <p>No records found on the global ledger. Please check the ID.</p>
           </div>
        )}

        {error && (
          <div className="p-12 text-center bg-red-50 m-4 rounded-xl border border-red-100">
            <XCircle size={56} className="text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-red-700">Verification Failed</h3>
            <p className="text-red-600 mt-2 max-w-md mx-auto">{error}</p>
          </div>
        )}

        {/* Product Result */}
        {result && activeTab === 'product' && (
          <div className="bg-white animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Certificate Header */}
            <div className={`relative overflow-hidden p-8 text-white ${result.dutyPaid ? 'bg-emerald-600' : 'bg-amber-500'}`}>
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
                    backgroundImage: 'radial-gradient(circle, #fff 2px, transparent 2.5px)',
                    backgroundSize: '20px 20px'
                }}></div>
                
                <div className="relative z-10 flex items-start justify-between">
                    <div>
                        <div className="flex items-center space-x-2 font-black opacity-90 uppercase tracking-widest text-xs mb-2">
                            <ShieldCheck size={16} />
                            <span>Verified Integrity Document</span>
                        </div>
                        <h3 className="text-3xl font-bold tracking-tight">{result.productName}</h3>
                        <p className="text-white/80 font-mono mt-1 text-sm">{result.batchID}</p>
                    </div>
                    <div className="hidden sm:flex flex-col items-end">
                        <Award size={48} className="text-white/30 mb-2" />
                        <span className="text-2xl font-black uppercase tracking-widest">{result.dutyPaid ? 'COMPLIANT' : 'BONDED'}</span>
                    </div>
                </div>
            </div>

            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-xs border-b border-slate-100 pb-2 flex items-center gap-2">
                    <Fingerprint size={16} className="text-indigo-500" />
                    Product DNA (GS1)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Potency / Strength</p>
                    <p className="font-bold text-lg text-slate-800">{result.alcoholContent || result.alcoholicStrength || 'N/A'}<span className="text-xs text-slate-500 ml-1">% v/v</span></p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Volume / Qty</p>
                    <p className="font-bold text-lg text-slate-800">{result.quantity} <span className="text-xs text-slate-500">{result.unit}</span></p>
                  </div>
                  {result.liquorType && (
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Liquor Type</p>
                        <p className="font-bold text-lg text-slate-800">{result.liquorType}</p>
                      </div>
                  )}
                  {result.packageSize && (
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Package Size</p>
                        <p className="font-bold text-lg text-slate-800">{result.packageSize.replace('_', ' ')}</p>
                      </div>
                  )}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 col-span-2">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Expiry / Manufacture</p>
                    <p className="font-bold text-lg text-slate-800">{result.expiryDate}</p>
                  </div>
                </div>

                {result.integrityHash && (
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <div className="flex items-center space-x-2 text-indigo-700 mb-2">
                      <Fingerprint size={18} />
                      <span className="font-bold text-sm">Blockchain Integrity Seal</span>
                    </div>
                    <p className="font-mono text-[10px] break-all bg-white p-2 rounded border border-indigo-200 text-slate-500 shadow-inner">
                      {result.integrityHash}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-xs border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
                    <MapPin size={16} className="text-indigo-500" />
                    Immutable Chain of Custody
                </h4>
                <div className="space-y-6 relative pl-6 border-l-2 border-slate-200 ml-2">
                  {result.trace.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).map((event, idx) => (
                    <div key={idx} className="relative group">
                       <div className={`absolute -left-[31px] w-4 h-4 rounded-full border-2 border-white shadow-sm transition-transform group-hover:scale-125 ${idx === 0 ? 'bg-indigo-500' : 'bg-slate-300'}`}></div>
                       <div>
                         <div className="flex justify-between items-center">
                            <p className="font-bold text-sm text-slate-800">{event.type}</p>
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{new Date(event.timestamp).toLocaleDateString()}</span>
                         </div>
                         <div className="mt-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs shadow-sm">
                           <p className="font-semibold text-slate-700">{event.actorName}</p>
                           <p className="text-slate-500 flex items-center gap-1 mt-0.5">
                             <MapPin size={10} />
                             {event.location}
                           </p>
                         </div>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 p-4 border-t border-slate-100 text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Verified via E-Ledger Distributed Network</p>
            </div>
          </div>
        )}

        {/* Partner GLN Result */}
        {partnerResult && activeTab === 'partner' && (
            <div className="bg-white animate-in fade-in slide-in-from-bottom-8 duration-700 p-8">
                <div className="border border-slate-200 rounded-3xl overflow-hidden shadow-lg">
                    <div className="bg-slate-900 p-8 text-white text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                        <div className="relative z-10">
                            <div className="w-24 h-24 bg-white text-slate-900 rounded-full flex items-center justify-center text-3xl font-black mx-auto mb-4 border-4 border-slate-700 shadow-xl">
                                {partnerResult.orgName.charAt(0)}
                            </div>
                            <h3 className="text-2xl font-black">{partnerResult.orgName}</h3>
                            <p className="text-slate-400 text-sm font-medium mt-1 uppercase tracking-widest">{partnerResult.role.replace('_', ' ')}</p>
                        </div>
                    </div>
                    
                    <div className="p-8">
                        <div className="flex justify-center mb-8">
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full font-bold text-sm border border-emerald-200">
                                <UserCheck size={18} />
                                Verified Trading Partner
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                    <Globe size={12} /> Global Location Number
                                </p>
                                <p className="text-lg font-mono font-bold text-slate-800">{partnerResult.gln}</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                    <Briefcase size={12} /> Category
                                </p>
                                <p className="text-lg font-bold text-slate-800">{partnerResult.positionLabel}</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                    <MapPin size={12} /> Jurisdiction
                                </p>
                                <p className="text-lg font-bold text-slate-800">{partnerResult.country === 'IN' ? 'India (GST/Reg)' : 'Global / Cross-Border'}</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                    <Clock size={12} /> Member Since
                                </p>
                                <p className="text-lg font-bold text-slate-800">2023</p>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-100 text-center">
                            <p className="text-xs text-slate-500">
                                This entity is authorized to transact on the E-Ledger India network.
                                <br/>Always verify digital signatures on invoices matching this GLN.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default ProductVerifier;