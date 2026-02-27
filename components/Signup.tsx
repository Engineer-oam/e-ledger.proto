import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AuthService } from '../services/authService';
import { UserRole, Sector, ERPType } from '../types';
import { REGISTRY_CONFIG, PHARMA_SUB_CATEGORIES } from '../constants';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Loader2, Building2, UserCircle, RefreshCw, 
  ArrowRight, Globe, Pill, Cpu, Check, Lock, Search, X, ChevronDown,
  CheckCircle2, Tags, Stethoscope, FileText, UploadCloud, AlertCircle
} from 'lucide-react';
import Logo from './Logo';

const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    orgName: '',
    gln: '',
    country: 'GL',
    sector: Sector.GENERAL, // Default to General
    role: UserRole.MANUFACTURER,
    positionLabel: '',
    password: '',
    erpType: ERPType.MANUAL,
    subCategories: [] as string[]
  });

  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [gstValid, setGstValid] = useState<boolean | null>(null);
  const [licenseFile, setLicenseFile] = useState<string | null>(null);
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedCountry = useMemo(() => 
    REGISTRY_CONFIG.find(c => c.code === formData.country), 
  [formData.country]);

  const availablePositions = useMemo(() => {
    if (!selectedCountry) return [];
    const sectorConfig = selectedCountry.sectors[formData.sector];
    return sectorConfig ? sectorConfig.roles : [];
  }, [selectedCountry, formData.sector]);

  useEffect(() => {
    if (availablePositions.length > 0 && !formData.positionLabel) {
      setFormData(prev => ({
        ...prev,
        role: availablePositions[0].role,
        positionLabel: availablePositions[0].label
      }));
    }
  }, [availablePositions]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // GSTIN Validation Logic
    if (name === 'gln') {
       // Simple Regex for GSTIN: 2 digits, 5 chars, 4 digits, 1 char, 1 digit/char, Z, 1 digit/char
       const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
       if (value.length > 0) {
         setGstValid(gstRegex.test(value));
       } else {
         setGstValid(null);
       }
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleSelect = (roleItem: any) => {
    setFormData(prev => ({ 
        ...prev, 
        role: roleItem.role, 
        positionLabel: roleItem.label 
    }));
  };

  const toggleSubCategory = (category: string) => {
    setFormData(prev => {
      const exists = prev.subCategories.includes(category);
      if (exists) {
        return { ...prev, subCategories: prev.subCategories.filter(c => c !== category) };
      } else {
        return { ...prev, subCategories: [...prev.subCategories, category] };
      }
    });
  };

  const handleGenerateGLN = (e: React.MouseEvent) => {
    e.preventDefault();
    const newGln = AuthService.generateGLN();
    setFormData(prev => ({ ...prev, gln: newGln }));
    setGstValid(true); // Mock valid for generated
  };

  const handleFileUpload = () => {
    // Simulation
    setTimeout(() => setLicenseFile("drug_license_form_20.pdf"), 800);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (formData.gln.length !== 13 && !gstValid) throw new Error('Valid GSTIN or 13-digit GLN required.');
      
      await AuthService.signup(
        formData.name,
        formData.orgName,
        formData.gln,
        formData.role,
        formData.password,
        {
          country: formData.country,
          sector: formData.sector,
          positionLabel: formData.positionLabel,
          erpType: formData.erpType,
          erpStatus: formData.erpType === ERPType.MANUAL ? 'CONNECTED' : 'PENDING',
          subCategories: formData.subCategories
        }
      );
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Failed to register.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0fdfa] flex items-center justify-center p-4">
      
      <div className="max-w-5xl w-full bg-white rounded-[2.5rem] shadow-[0_20px_60px_rgba(13,148,136,0.15)] overflow-hidden flex flex-col md:flex-row max-h-[90vh] min-h-[650px]">
        
        {/* Left Sidebar - Branding & Trust (Hidden on Mobile) */}
        <div className="hidden md:flex w-[35%] bg-[#0f172a] p-10 text-white flex-col justify-between relative overflow-hidden">
          {/* Background FX */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-900/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
                <Logo size="sm" />
                <span className="font-bold text-lg tracking-tight">E-Ledger Network</span>
            </div>
            <h2 className="text-3xl font-black mb-4 tracking-tighter leading-tight">
              Join the <br/>
              <span className="text-teal-400">Secure Supply</span> <br/>
              Network.
            </h2>
            <p className="text-slate-400 text-xs leading-relaxed max-w-xs">
              Onboard your entity to the unified cross-enterprise traceability ledger. Ensure compliance with global trade & tax mandates.
            </p>
          </div>

          <div className="relative z-10 space-y-8">
             <div className="space-y-4">
                {[
                    { title: "Market Context", desc: "Global (Trade/Reg)" }, 
                    { title: "Legal Identity", desc: "Tax ID / License" }, 
                    { title: "System Link", desc: "ERP Adapter" }, 
                    { title: "Cryptographic Keys", desc: "Node Security" }
                ].map((s, idx) => (
                    <div key={idx} className={`flex items-center gap-4 group ${step === idx + 1 ? 'opacity-100' : 'opacity-40'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border ${step === idx + 1 ? 'bg-teal-500 border-teal-500 text-white shadow-[0_0_15px_rgba(20,184,166,0.5)]' : 'border-slate-600 text-slate-400'}`}>
                            {step > idx + 1 ? <Check size={14} /> : idx + 1}
                        </div>
                        <div>
                            <p className={`font-bold text-xs uppercase tracking-wider ${step === idx + 1 ? 'text-white' : 'text-slate-400'}`}>{s.title}</p>
                            <p className="text-[10px] text-slate-500">{s.desc}</p>
                        </div>
                    </div>
                ))}
             </div>
          </div>

          <div className="relative z-10 pt-6 border-t border-slate-800">
             <div className="flex gap-4">
                <div className="flex items-center gap-1.5 opacity-60">
                    <ShieldCheck size={14} className="text-teal-400" />
                    <span className="text-[9px] font-bold uppercase tracking-widest">SOC2 Type II</span>
                </div>
                <div className="flex items-center gap-1.5 opacity-60">
                    <Globe size={14} className="text-blue-400" />
                    <span className="text-[9px] font-bold uppercase tracking-widest">GS1 India</span>
                </div>
             </div>
          </div>
        </div>

        {/* Right Form Area */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
          
          {/* Mobile Header (Visible only on small screens) */}
          <div className="md:hidden bg-slate-900 p-6 text-white shrink-0 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
             <div className="relative z-10">
               <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <Logo size="sm" className="scale-75" />
                  </div>
                  <span className="font-bold text-sm tracking-tight">E-Ledger Network</span>
               </div>
               <h2 className="text-xl font-black">
                 Join the <span className="text-teal-400">Network.</span>
               </h2>
             </div>
          </div>

          <div className="p-4 md:p-8 pb-2 shrink-0 flex justify-end">
             <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Already a partner?</p>
                <Link to="/login" className="text-sm font-bold text-teal-700 hover:text-teal-900 flex items-center justify-end gap-1 group">
                    Access Node <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 md:px-12 pb-8 custom-scrollbar">
          <form onSubmit={handleSubmit} className="h-full flex flex-col">
            
            {/* STEP 1: JURISDICTION */}
            {step === 1 && (
              <div className="my-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="text-center">
                    <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-teal-600">
                        <Globe size={32} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Confirm Jurisdiction</h3>
                    <p className="text-sm text-slate-500 max-w-md mx-auto">
                        E-Ledger nodes enforce regulatory rules based on the operating region. Please confirm your primary market.
                    </p>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {REGISTRY_CONFIG.map(country => (
                        <button 
                            key={country.code}
                            type="button" 
                            onClick={() => setFormData({...formData, country: country.code})}
                            className={`w-full p-4 rounded-xl shadow-sm border flex items-center justify-between group transition-all ${formData.country === country.code ? 'bg-teal-50 border-teal-500 ring-1 ring-teal-500' : 'bg-white border-slate-200 hover:border-teal-300'}`}
                        >
                            <div className="flex items-center gap-4">
                                <span className="text-2xl">{country.code === 'GL' ? '🌐' : country.code === 'IN' ? '🇮🇳' : country.code === 'US' ? '🇺🇸' : '🇪🇺'}</span>
                                <div className="text-left">
                                    <span className={`block text-lg font-bold ${formData.country === country.code ? 'text-teal-900' : 'text-slate-900'}`}>{country.name}</span>
                                    <span className="text-xs text-slate-500 font-medium">Trade / Regulatory Protocol</span>
                                </div>
                            </div>
                            {formData.country === country.code && (
                                <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center text-white animate-in zoom-in">
                                    <Check size={14} />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
                
                <button type="button" onClick={() => setStep(2)} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98]">
                  Confirm & Proceed
                </button>
              </div>
            )}

            {/* STEP 1.5: SECTOR SELECTION */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="text-center">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Select Industry Sector</h3>
                    <p className="text-sm text-slate-500 max-w-md mx-auto">
                        Choose the primary trade domain for your node.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {Object.values(Sector).map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => setFormData({...formData, sector: s})}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${formData.sector === s ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500' : 'border-slate-100 hover:border-slate-300'}`}
                        >
                            <span className="block text-sm font-bold text-slate-900">{s}</span>
                        </button>
                    ))}
                </div>

                <div className="flex gap-3 pt-4 mt-auto">
                  <button type="button" onClick={() => setStep(1)} className="px-6 py-4 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-100 transition-colors">Back</button>
                  <button type="button" onClick={() => setStep(3)} className="flex-1 bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] uppercase text-xs tracking-widest">Next: Identity</button>
                </div>
              </div>
            )}

            {/* STEP 2: IDENTITY (GST & LICENSE) */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div>
                    <h3 className="text-xl font-bold text-slate-900">Entity Verification</h3>
                    <p className="text-xs text-slate-500 mt-1">Provide your legal business details for KYC.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Authorized Person</label>
                        <div className="relative">
                            <UserCircle className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input name="name" required value={formData.name} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition-all" placeholder="Full Name" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Organization Name</label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input name="orgName" required value={formData.orgName} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition-all" placeholder="Legal Entity Name" />
                        </div>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase flex justify-between">
                        <span>Tax ID / Global Location Number</span>
                        {gstValid === true && <span className="text-teal-600 flex items-center gap-1"><CheckCircle2 size={10} /> Valid Format</span>}
                        {gstValid === false && <span className="text-red-500 flex items-center gap-1"><AlertCircle size={10} /> Invalid Format</span>}
                    </label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Globe className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input 
                                name="gln" 
                                required 
                                maxLength={15} 
                                value={formData.gln} 
                                onChange={handleChange} 
                                className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl text-sm font-mono focus:bg-white outline-none transition-all ${gstValid === false ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-2 focus:ring-teal-500'}`} 
                                placeholder="27AAPCA1234A1Z5" 
                            />
                        </div>
                        <button type="button" onClick={handleGenerateGLN} className="px-4 bg-slate-100 rounded-xl hover:bg-slate-200 text-slate-600 transition-colors" title="Generate Demo GLN">
                            <RefreshCw size={18} />
                        </button>
                    </div>
                </div>

                {/* Simulated File Upload */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Business License / Registration</label>
                    <div 
                        onClick={handleFileUpload}
                        className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${licenseFile ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:border-teal-400 hover:bg-slate-50'}`}
                    >
                        {licenseFile ? (
                            <>
                                <FileText size={24} className="text-teal-600 mb-2" />
                                <p className="text-xs font-bold text-teal-800">{licenseFile}</p>
                                <p className="text-[10px] text-teal-600">Uploaded Successfully</p>
                            </>
                        ) : (
                            <>
                                <UploadCloud size={24} className="text-slate-400 mb-2" />
                                <p className="text-xs font-bold text-slate-600">Click to Upload License PDF</p>
                                <p className="text-[10px] text-slate-400">Max size 5MB. Required for Trade.</p>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex gap-3 pt-4 mt-auto">
                  <button type="button" onClick={() => setStep(2)} className="px-6 py-4 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-100 transition-colors">Back</button>
                  <button type="button" onClick={() => setStep(4)} className="flex-1 bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] uppercase text-xs tracking-widest">Select Role</button>
                </div>
              </div>
            )}

            {/* STEP 3: ROLE & SCOPE */}
            {step === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div>
                    <h3 className="text-xl font-bold text-slate-900">Operational Role</h3>
                    <p className="text-xs text-slate-500 mt-1">Select your primary function in the supply chain.</p>
                </div>

                <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {availablePositions.map((p) => (
                        <button
                            key={p.label}
                            type="button"
                            onClick={() => handleRoleSelect(p)}
                            className={`p-4 rounded-xl border-2 text-left transition-all flex items-start gap-4 ${formData.positionLabel === p.label ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500' : 'border-slate-100 hover:border-slate-300'}`}
                        >
                            <div className={`mt-1 p-2 rounded-lg ${formData.positionLabel === p.label ? 'bg-teal-200 text-teal-800' : 'bg-slate-100 text-slate-500'}`}>
                                {p.role === UserRole.MANUFACTURER ? <FactoryIcon /> : p.role === UserRole.DISTRIBUTOR ? <TruckIcon /> : p.role === UserRole.RETAILER ? <StoreIcon /> : <ShieldIcon />}
                            </div>
                            <div>
                                <p className={`text-sm font-bold ${formData.positionLabel === p.label ? 'text-teal-900' : 'text-slate-800'}`}>{p.label}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">{p.description}</p>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="space-y-2 pt-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                      <Tags size={12} />
                      Business Categories
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PHARMA_SUB_CATEGORIES.slice(0, 8).map(category => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => toggleSubCategory(category)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                            formData.subCategories.includes(category)
                              ? 'bg-teal-600 text-white border-teal-600 shadow-md'
                              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                </div>

                <div className="flex gap-3 pt-4 mt-auto">
                  <button type="button" onClick={() => setStep(3)} className="px-6 py-4 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-100 transition-colors">Back</button>
                  <button type="button" onClick={() => setStep(5)} className="flex-1 bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] uppercase text-xs tracking-widest">Connect System</button>
                </div>
              </div>
            )}

            {/* STEP 4: SECURE & FINALIZE */}
            {step === 5 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div>
                    <h3 className="text-xl font-bold text-slate-900">Secure Node</h3>
                    <p className="text-xs text-slate-500 mt-1">Set your master key for signing transactions.</p>
                </div>

                <div className="space-y-4">
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                        <input name="password" type="password" required value={formData.password} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-slate-50 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Create Master Password" />
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2">
                       {Object.values(ERPType).map(type => (
                         <button key={type} type="button" onClick={() => setFormData({...formData, erpType: type})} className={`px-4 py-3 rounded-xl flex justify-between items-center transition-all ${formData.erpType === type ? 'bg-indigo-50 border-2 border-indigo-500 text-indigo-700' : 'bg-slate-50 border-2 border-transparent text-slate-500 hover:bg-slate-100'}`}>
                            <span className="text-xs font-bold">{type}</span>
                            {formData.erpType === type && <CheckCircle2 size={16} />}
                         </button>
                       ))}
                    </div>
                </div>

                <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-100 space-y-3">
                  <h4 className="text-[10px] font-black text-teal-800 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-teal-600" />
                    Configuration Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                    <div>
                        <span className="block text-[9px] font-bold text-slate-400 uppercase">Entity</span>
                        <span className="font-bold text-slate-800 truncate block">{formData.orgName}</span>
                    </div>
                    <div>
                        <span className="block text-[9px] font-bold text-slate-400 uppercase">Role</span>
                        <span className="font-bold text-slate-800 truncate block">{formData.positionLabel}</span>
                    </div>
                    <div>
                        <span className="block text-[9px] font-bold text-slate-400 uppercase">License ID</span>
                        <span className="font-mono font-bold text-slate-800 truncate block">{formData.gln}</span>
                    </div>
                    <div>
                        <span className="block text-[9px] font-bold text-slate-400 uppercase">Protocol</span>
                        <span className="font-bold text-slate-800 truncate block">GS1 / EPCIS</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2 mt-auto">
                  <button type="button" onClick={() => setStep(4)} className="px-6 py-4 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-100 transition-colors">Back</button>
                  <button type="submit" disabled={loading} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] uppercase text-xs tracking-widest">
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <span>Initialize Terminal</span>}
                  </button>
                </div>
              </div>
            )}
          </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple Icons for Roles
const FactoryIcon = () => <Building2 size={20} />;
const TruckIcon = () => <ArrowRight size={20} />;
const StoreIcon = () => <Building2 size={20} />; 
const ShieldIcon = () => <ShieldCheck size={20} />;

export default Signup;