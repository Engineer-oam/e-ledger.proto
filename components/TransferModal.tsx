
import React, { useState } from 'react';
import { Batch, User, GSTDetails, EWayBill, PaymentStatus, StakeholderRole, Stakeholder, ExportDetails } from '../types';
import { Truck, FileText, DollarSign, ShieldCheck, Printer, ArrowRight, CreditCard, MapPin, Check, User as UserIcon, ArrowLeft, Package, Banknote, Percent, AlertCircle, Globe, Anchor, Users } from 'lucide-react';
import { toast } from 'react-toastify';
import PrintableInvoice from './PrintableInvoice';

interface TransferModalProps {
  batches: Batch[]; 
  onClose: () => void;
  onSubmit: (toGLN: string, toName: string, gst?: GSTDetails, ewbPartial?: Partial<EWayBill>, payment?: any, exportDetails?: ExportDetails, stakeholders?: Stakeholder[]) => Promise<void>;
  currentUser: User;
}

const TransferModal: React.FC<TransferModalProps> = ({ batches, onClose, onSubmit, currentUser }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1); // 1: Recipient, 2: Compliance, 3: Export, 4: Stakeholders, 5: Payment
  const [loading, setLoading] = useState(false);
  const [printData, setPrintData] = useState<any>(null);
  
  // Step 1: Basic Info
  const [recipient, setRecipient] = useState({ gln: '', name: '' });
  const [isVerifyingGLN, setIsVerifyingGLN] = useState(false);
  const [verifiedRecipient, setVerifiedRecipient] = useState<User | null>(null);
  const [verificationError, setVerificationError] = useState('');
  
  // Step 2: Compliance Info (EWB & GST)
  const [gstData, setGstData] = useState({
    hsn: '3004', // Standard HSN for Products
    value: 10000 * batches.length, 
    rate: 18,
    invoiceNo: `INV-${Date.now().toString().slice(-6)}`,
  });
  
  const [transportData, setTransportData] = useState({
    vehicleNo: '',
    distance: 50,
    fromPlace: currentUser.orgName.split(' ')[0] + ' Depot',
    toPlace: ''
  });

  // Step 3: Export Details
  const [exportData, setExportData] = useState<ExportDetails>({
    isExport: false,
    countryOfOrigin: currentUser.country || 'IN',
    portOfEntry: '',
    portOfExit: '',
    currency: 'USD',
    customsDutyRate: 0,
    incoterms: 'FOB'
  });

  // Step 4: Stakeholders
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [newStakeholder, setNewStakeholder] = useState<Partial<Stakeholder>>({
    role: StakeholderRole.LOGISTICS_PROVIDER,
    name: '',
    gln: ''
  });

  // Step 5: Payment Info
  const taxAmount = (gstData.value * gstData.rate) / 100;
  const totalAmount = gstData.value + taxAmount;

  const [paymentData, setPaymentData] = useState({
    amountPaid: 0,
    isCredit: true,
    waived: 0,
    method: 'BANK_TRANSFER',
    notes: ''
  });

  // Validation Logic
  const validateStep1 = () => {
    if (!recipient.gln || recipient.gln.length !== 13) {
        toast.warn("Please enter a valid 13-digit GLN.");
        return false;
    }
    if (!recipient.name || recipient.name.length < 3) {
        toast.warn("Please enter a valid Organization Name.");
        return false;
    }
    if (!verifiedRecipient) {
        toast.warn("Please verify the Recipient GLN before proceeding.");
        return false;
    }
    return true;
  };

  const handleVerifyGLN = async () => {
    if (!recipient.gln || recipient.gln.length !== 13) {
        setVerificationError("GLN must be exactly 13 digits.");
        return;
    }
    setIsVerifyingGLN(true);
    setVerificationError('');
    setVerifiedRecipient(null);
    
    try {
        // We need to import AuthService at the top of the file
        const { AuthService } = await import('../services/authService');
        const user = await AuthService.getPublicProfile(recipient.gln);
        
        if (user) {
            setVerifiedRecipient(user);
            setRecipient(prev => ({ ...prev, name: user.orgName }));
            toast.success("Recipient verified successfully!");
        } else {
            setVerificationError("No entity found with this GLN.");
            toast.error("Verification failed. Entity not found.");
        }
    } catch (err) {
        setVerificationError("Error verifying GLN.");
    } finally {
        setIsVerifyingGLN(false);
    }
  };

  const validateStep2 = () => {
      if (!transportData.vehicleNo) {
          toast.warn("Vehicle / Vessel Number is required for Transit Docs.");
          return false;
      }
      if (transportData.distance <= 0) {
          toast.warn("Transport distance must be greater than 0 km.");
          return false;
      }
      if (!transportData.fromPlace || !transportData.toPlace) {
          toast.warn("Origin and Destination are required.");
          return false;
      }
      return true;
  };

  const handleNext = () => {
      if (step === 1) {
          if (!validateStep1()) return;
          // Auto-fill destination if empty
          if (!transportData.toPlace) {
              setTransportData(prev => ({ ...prev, toPlace: recipient.name }));
          }
          setStep(2);
      } else if (step === 2) {
          if (!validateStep2()) return;
          setStep(3);
      } else if (step === 3) {
          setStep(4);
      } else if (step === 4) {
          setStep(5);
      }
  };

  const addStakeholder = () => {
    if (!newStakeholder.name || !newStakeholder.gln) {
        toast.warn("Name and GLN required for stakeholder");
        return;
    }
    setStakeholders([...stakeholders, { ...newStakeholder, id: Date.now().toString() } as Stakeholder]);
    setNewStakeholder({ role: StakeholderRole.LOGISTICS_PROVIDER, name: '', gln: '' });
  };

  const removeStakeholder = (id: string) => {
    setStakeholders(stakeholders.filter(s => s.id !== id));
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    // Construct GST Object
    const gst: GSTDetails = {
      hsnCode: gstData.hsn,
      taxableValue: gstData.value,
      taxRate: gstData.rate,
      taxAmount: taxAmount,
      invoiceNo: gstData.invoiceNo,
      invoiceDate: new Date().toISOString()
    };

    // Construct EWB Object
    const ewbPartial: Partial<EWayBill> = {
      vehicleNo: transportData.vehicleNo, 
      distanceKm: transportData.distance,
      fromPlace: transportData.fromPlace,
      toPlace: transportData.toPlace
    };

    // Construct Payment Metadata
    let derivedStatus = PaymentStatus.UNPAID;
    if (paymentData.amountPaid >= (totalAmount - paymentData.waived)) derivedStatus = PaymentStatus.PAID;
    else if (paymentData.amountPaid > 0) derivedStatus = PaymentStatus.PARTIAL;
    else if (paymentData.waived >= totalAmount) derivedStatus = PaymentStatus.WAIVED;
    else if (paymentData.isCredit) derivedStatus = PaymentStatus.CREDIT;

    const paymentMeta = {
        totalAmount: totalAmount,
        amountPaid: paymentData.amountPaid,
        amountRemaining: Math.max(0, totalAmount - paymentData.amountPaid - paymentData.waived),
        waivedAmount: paymentData.waived,
        status: derivedStatus,
        method: paymentData.method,
        notes: paymentData.notes
    };

    try {
      await onSubmit(recipient.gln, recipient.name, gst, ewbPartial, paymentMeta, exportData.isExport ? exportData : undefined, stakeholders);
      
      // Prepare print data on success
      setPrintData({
        id: gstData.invoiceNo,
        date: new Date().toISOString(),
        from: { name: currentUser.orgName, gln: currentUser.gln, address: transportData.fromPlace },
        to: { name: recipient.name, gln: recipient.gln, address: transportData.toPlace },
        items: batches.map(b => ({
            product: b.productName,
            batch: b.batchID,
            hsos: gstData.hsn,
            qty: b.quantity,
            unit: b.unit,
            rate: (gstData.value / batches.length) / (b.quantity || 1),
            amount: gstData.value / batches.length
        })),
        tax: { rate: gstData.rate, amount: taxAmount },
        total: totalAmount,
        remarks: `Payment Status: ${derivedStatus}. Method: ${paymentData.method}. Paid: ${paymentData.amountPaid}. Balance: ${paymentMeta.amountRemaining}.`,
        ewayBill: {
            ewbNo: '141' + Math.floor(100000000 + Math.random() * 900000000), 
            vehicleNo: transportData.vehicleNo,
            fromPlace: transportData.fromPlace,
            toPlace: transportData.toPlace,
            distanceKm: transportData.distance,
            validUntil: new Date(Date.now() + (Math.ceil(transportData.distance / 200) * 86400000)).toISOString(),
            generatedDate: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (printData) {
    return <PrintableInvoice type="INVOICE" data={printData} onClose={onClose} />;
  }

  const isBulk = batches.length > 1;

  const StepIndicator = ({ num, label, active, completed }: { num: number, label: string, active: boolean, completed: boolean }) => (
    <div className={`flex flex-col items-center z-10 ${active ? 'text-indigo-600' : completed ? 'text-emerald-600' : 'text-slate-400'}`}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-white
            ${active ? 'border-indigo-600 shadow-[0_0_0_4px_rgba(79,70,229,0.1)] scale-110' : 
              completed ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300'}
        `}>
            {completed ? <Check size={20} className="text-emerald-600" /> : <span className="font-bold">{num}</span>}
        </div>
        <span className={`text-xs mt-2 font-bold uppercase tracking-wider ${active ? 'text-indigo-700' : 'text-slate-500'}`}>
            {label}
        </span>
    </div>
  );

  const StepConnector = ({ active }: { active: boolean }) => (
      <div className={`flex-1 h-0.5 mt-5 mx-2 transition-colors duration-500 ${active ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-white px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
            <div>
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Truck className="text-indigo-600" />
                    <span>{isBulk ? `Bulk Transfer (${batches.length} Items)` : 'Initiate Transfer'}</span>
                </h3>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-2 rounded-full transition-colors">✕</button>
        </div>

        {/* Wizard Header (Stepper) */}
        <div className="bg-slate-50/80 px-8 py-6 border-b border-slate-100">
            <div className="flex items-start justify-between">
                <StepIndicator num={1} label="Recipient" active={step === 1} completed={step > 1} />
                <StepConnector active={step > 1} />
                <StepIndicator num={2} label="Compliance" active={step === 2} completed={step > 2} />
                <StepConnector active={step > 2} />
                <StepIndicator num={3} label="Export" active={step === 3} completed={step > 3} />
                <StepConnector active={step > 3} />
                <StepIndicator num={4} label="Stakeholders" active={step === 4} completed={step > 4} />
                <StepConnector active={step > 4} />
                <StepIndicator num={5} label="Payment" active={step === 5} completed={step > 5} />
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
            
            {/* Step 1: Recipient Selection */}
            {step === 1 && (
                <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-300">
                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-start gap-3">
                         <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600 mt-1">
                             <UserIcon size={20} />
                         </div>
                         <div>
                             <h4 className="font-bold text-indigo-900">Trading Partner Details</h4>
                             <p className="text-sm text-indigo-700 mt-1">Identify who is receiving this stock. Ensure GLN matches the destination node.</p>
                         </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Recipient GLN</label>
                            <div className="flex gap-2">
                                <input 
                                    autoFocus
                                    required
                                    value={recipient.gln}
                                    onChange={e => {
                                        setRecipient({...recipient, gln: e.target.value});
                                        setVerifiedRecipient(null);
                                        setVerificationError('');
                                    }}
                                    className="flex-1 border border-slate-300 rounded-lg px-4 py-3 font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow shadow-sm"
                                    placeholder="0000000000000"
                                />
                                <button
                                    onClick={handleVerifyGLN}
                                    disabled={isVerifyingGLN || recipient.gln.length !== 13}
                                    className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-4 py-3 rounded-lg font-bold text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isVerifyingGLN ? 'Verifying...' : 'Verify'}
                                </button>
                            </div>
                            {verificationError && <p className="text-xs text-red-500 mt-1">{verificationError}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Organization Name</label>
                            <input 
                                required
                                value={recipient.name}
                                onChange={e => setRecipient({...recipient, name: e.target.value})}
                                disabled={!!verifiedRecipient}
                                className={`w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow shadow-sm ${verifiedRecipient ? 'bg-slate-50 text-slate-500' : ''}`}
                                placeholder="e.g. State Warehouse 1"
                            />
                        </div>
                    </div>

                    {verifiedRecipient && (
                        <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
                            <div className="p-2 bg-emerald-100 rounded-full text-emerald-600 shrink-0">
                                <ShieldCheck size={24} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-emerald-900">{verifiedRecipient.orgName}</h4>
                                    <span className="bg-emerald-200 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Verified</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-emerald-800">
                                    <p><span className="opacity-70">Role:</span> {verifiedRecipient.role.replace('_', ' ')}</p>
                                    <p><span className="opacity-70">Location:</span> {verifiedRecipient.state || verifiedRecipient.country}</p>
                                    <p><span className="opacity-70">Contact:</span> {verifiedRecipient.name}</p>
                                    <p><span className="opacity-70">Sector:</span> {verifiedRecipient.sector}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {!isBulk && (
                        <div className="mt-4 border-t border-slate-100 pt-4">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Item Preview</p>
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <Package className="text-slate-400" />
                                <div>
                                    <p className="font-bold text-slate-700">{batches[0].productName}</p>
                                    <p className="text-xs text-slate-500">{batches[0].quantity} {batches[0].unit}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Step 2: Compliance (GST & EWB) */}
            {step === 2 && (
                <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-300">
                    
                    {/* E-Way Bill Section */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                           <Truck className="text-emerald-500" size={18} />
                           Logistics & Transit Docs
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vehicle / Vessel No</label>
                                <input 
                                    value={transportData.vehicleNo} 
                                    onChange={e => setTransportData({...transportData, vehicleNo: e.target.value})}
                                    placeholder="XX-00-XX-0000"
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm uppercase placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Distance (KM)</label>
                                <input 
                                    type="number"
                                    value={transportData.distance} 
                                    onChange={e => setTransportData({...transportData, distance: Number(e.target.value)})}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" 
                                />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Origin</label>
                                <MapPin size={14} className="absolute left-3 top-8 text-slate-400" />
                                <input 
                                    value={transportData.fromPlace} 
                                    onChange={e => setTransportData({...transportData, fromPlace: e.target.value})}
                                    className="w-full pl-9 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" 
                                />
                            </div>
                            <div className="relative">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Destination</label>
                                <MapPin size={14} className="absolute left-3 top-8 text-slate-400" />
                                <input 
                                    value={transportData.toPlace} 
                                    onChange={e => setTransportData({...transportData, toPlace: e.target.value})}
                                    placeholder="City/Hub"
                                    className="w-full pl-9 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tax Section */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                           <DollarSign className="text-blue-500" size={18} />
                           Commercial Invoice & Duty
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">HS Code</label>
                                <input 
                                    value={gstData.hsn} 
                                    onChange={e => setGstData({...gstData, hsn: e.target.value})}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Taxable Value</label>
                                <input 
                                    type="number"
                                    value={gstData.value} 
                                    onChange={e => setGstData({...gstData, value: Number(e.target.value)})}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold" 
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 3: Export Details */}
            {step === 3 && (
                <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-300">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600 mt-1">
                            <Globe size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-blue-900">Cross-Border / Export Declaration</h4>
                            <p className="text-sm text-blue-700 mt-1">Enable this section if the goods are leaving the country.</p>
                        </div>
                        <div className="ml-auto">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={exportData.isExport} onChange={e => setExportData({...exportData, isExport: e.target.checked})} />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>

                    {exportData.isExport && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Country of Origin</label>
                                    <input 
                                        value={exportData.countryOfOrigin} 
                                        onChange={e => setExportData({...exportData, countryOfOrigin: e.target.value})}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Incoterms</label>
                                    <select 
                                        value={exportData.incoterms} 
                                        onChange={e => setExportData({...exportData, incoterms: e.target.value})}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    >
                                        <option value="EXW">EXW - Ex Works</option>
                                        <option value="FOB">FOB - Free on Board</option>
                                        <option value="CIF">CIF - Cost, Insurance & Freight</option>
                                        <option value="DDP">DDP - Delivered Duty Paid</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Port of Exit</label>
                                    <div className="relative">
                                        <Anchor size={14} className="absolute left-3 top-2.5 text-slate-400" />
                                        <input 
                                            value={exportData.portOfExit} 
                                            onChange={e => setExportData({...exportData, portOfExit: e.target.value})}
                                            placeholder="e.g. Mumbai Port"
                                            className="w-full pl-9 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Port of Entry</label>
                                    <div className="relative">
                                        <Anchor size={14} className="absolute left-3 top-2.5 text-slate-400" />
                                        <input 
                                            value={exportData.portOfEntry} 
                                            onChange={e => setExportData({...exportData, portOfEntry: e.target.value})}
                                            placeholder="e.g. Dubai Port"
                                            className="w-full pl-9 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Step 4: Stakeholders */}
            {step === 4 && (
                <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-300">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                            <Users size={18} className="text-indigo-600" />
                            Add Supply Chain Stakeholders
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                            <select 
                                value={newStakeholder.role} 
                                onChange={e => setNewStakeholder({...newStakeholder, role: e.target.value as StakeholderRole})}
                                className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                            >
                                {Object.values(StakeholderRole).map(role => (
                                    <option key={role} value={role}>{role.replace('_', ' ')}</option>
                                ))}
                            </select>
                            <input 
                                value={newStakeholder.name} 
                                onChange={e => setNewStakeholder({...newStakeholder, name: e.target.value})}
                                placeholder="Name"
                                className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                            />
                            <input 
                                value={newStakeholder.gln} 
                                onChange={e => setNewStakeholder({...newStakeholder, gln: e.target.value})}
                                placeholder="GLN"
                                className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                        <button onClick={addStakeholder} className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors">
                            Add Stakeholder
                        </button>
                    </div>

                    <div className="space-y-2">
                        {stakeholders.map(s => (
                            <div key={s.id} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                                <div>
                                    <p className="font-bold text-slate-800 text-sm">{s.name}</p>
                                    <p className="text-xs text-slate-500">{s.role.replace('_', ' ')} • {s.gln}</p>
                                </div>
                                <button onClick={() => removeStakeholder(s.id)} className="text-red-500 hover:text-red-700 text-xs font-bold">Remove</button>
                            </div>
                        ))}
                        {stakeholders.length === 0 && (
                            <p className="text-center text-slate-400 text-sm py-4">No additional stakeholders added.</p>
                        )}
                    </div>
                </div>
            )}

            {/* Step 5: Payment */}
            {step === 5 && (
                <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-300">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center">
                        <p className="text-slate-500 text-sm font-medium uppercase mb-1">Total Invoice Amount</p>
                        <p className="text-3xl font-bold text-slate-900">{totalAmount.toLocaleString()}</p>
                        <p className="text-xs text-slate-400 mt-2">Includes {taxAmount.toLocaleString()} Tax ({gstData.rate}%)</p>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Amount Paid</label>
                                <div className="relative">
                                    <DollarSign size={16} className="absolute left-3 top-3 text-slate-400" />
                                    <input 
                                        type="number" 
                                        className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                                        value={paymentData.amountPaid}
                                        onChange={e => setPaymentData({...paymentData, amountPaid: Number(e.target.value)})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Payment Method</label>
                                <div className="relative">
                                    <Banknote size={16} className="absolute left-3 top-3 text-slate-400" />
                                    <select 
                                        className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                                        value={paymentData.method}
                                        onChange={e => setPaymentData({...paymentData, method: e.target.value})}
                                    >
                                        <option value="BANK_TRANSFER">Bank Transfer (SWIFT/Wire)</option>
                                        <option value="UPI">Digital Wallet</option>
                                        <option value="CHEQUE">Cheque / Draft</option>
                                        <option value="CASH">Cash</option>
                                        <option value="CREDIT_CARD">Credit Card</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Waiver / Discount</label>
                            <div className="relative">
                                <Percent size={16} className="absolute left-3 top-3 text-slate-400" />
                                <input 
                                    type="number"
                                    className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                                    placeholder="0.00"
                                    value={paymentData.waived || ''}
                                    onChange={e => setPaymentData({...paymentData, waived: Number(e.target.value)})}
                                />
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setPaymentData({...paymentData, isCredit: !paymentData.isCredit})}>
                             <div className={`w-5 h-5 rounded border flex items-center justify-center ${paymentData.isCredit ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                                 {paymentData.isCredit && <Check size={14} className="text-white" />}
                             </div>
                             <div className="flex-1">
                                 <p className="text-sm font-bold text-slate-700">Credit Transaction</p>
                                 <p className="text-xs text-slate-500">Record remaining balance {Math.max(0, totalAmount - paymentData.amountPaid - paymentData.waived).toLocaleString()} as account payable.</p>
                             </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Payment Notes</label>
                            <input 
                                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-400 outline-none"
                                placeholder="Ref No, Transaction ID, Waiver Reason..."
                                value={paymentData.notes}
                                onChange={e => setPaymentData({...paymentData, notes: e.target.value})}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Footer Actions */}
        <div className="bg-white p-6 border-t border-slate-100 flex justify-between items-center shrink-0">
            {step > 1 ? (
                <button 
                    onClick={() => setStep(step - 1 as any)}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors"
                >
                    <ArrowLeft size={18} />
                    <span>Back</span>
                </button>
            ) : (
                <div></div> // Spacer
            )}

            {step < 5 ? (
                <button 
                    onClick={handleNext}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-indigo-900/20 transition-all hover:translate-y-[-1px]"
                >
                    <span>Next Step</span>
                    <ArrowRight size={18} />
                </button>
            ) : (
                <button 
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/20 transition-all hover:translate-y-[-1px] disabled:opacity-70 disabled:transform-none"
                >
                    {loading ? (
                        <span>Processing...</span>
                    ) : (
                        <>
                            <span>Confirm Transfer</span>
                            <ShieldCheck size={18} />
                        </>
                    )}
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default TransferModal;
