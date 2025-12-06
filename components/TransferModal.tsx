
import React, { useState } from 'react';
import { Batch, User, GSTDetails, EWayBill, PaymentStatus } from '../types';
import { Truck, FileText, IndianRupee, ShieldCheck, Printer, ArrowRight, CreditCard, MapPin, Check, User as UserIcon, ArrowLeft, Package } from 'lucide-react';
import { toast } from 'react-toastify';
import PrintableInvoice from './PrintableInvoice';

interface TransferModalProps {
  batches: Batch[]; 
  onClose: () => void;
  onSubmit: (toGLN: string, toName: string, gst?: GSTDetails, ewbPartial?: Partial<EWayBill>, payment?: any) => Promise<void>;
  currentUser: User;
}

const TransferModal: React.FC<TransferModalProps> = ({ batches, onClose, onSubmit, currentUser }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Recipient, 2: Compliance, 3: Payment
  const [loading, setLoading] = useState(false);
  const [printData, setPrintData] = useState<any>(null);
  
  // Step 1: Basic Info
  const [recipient, setRecipient] = useState({ gln: '', name: '' });
  
  // Step 2: Compliance Info (EWB & GST)
  const [gstData, setGstData] = useState({
    hsn: '2208', // Standard HSN for Spirits
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

  // Step 3: Payment Info
  const taxAmount = (gstData.value * gstData.rate) / 100;
  const totalAmount = gstData.value + taxAmount;

  const [paymentData, setPaymentData] = useState({
    amountPaid: 0,
    isCredit: true,
    waived: 0,
    notes: ''
  });

  const handleSubmit = async () => {
    if (!recipient.gln || !recipient.name) {
      toast.error("Recipient details required");
      return;
    }

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
      vehicleNo: transportData.vehicleNo || 'XX-00-0000', 
      distanceKm: transportData.distance,
      fromPlace: transportData.fromPlace,
      toPlace: transportData.toPlace || recipient.name
    };

    // Construct Payment Metadata
    let derivedStatus = PaymentStatus.UNPAID;
    if (paymentData.amountPaid >= totalAmount) derivedStatus = PaymentStatus.PAID;
    else if (paymentData.amountPaid > 0) derivedStatus = PaymentStatus.PARTIAL;
    else if (paymentData.waived >= totalAmount) derivedStatus = PaymentStatus.WAIVED;
    else if (paymentData.isCredit) derivedStatus = PaymentStatus.CREDIT;

    const paymentMeta = {
        totalAmount: totalAmount,
        amountPaid: paymentData.amountPaid,
        amountRemaining: Math.max(0, totalAmount - paymentData.amountPaid - paymentData.waived),
        waivedAmount: paymentData.waived,
        status: derivedStatus,
        method: 'BANK_TRANSFER',
        notes: paymentData.notes
    };

    try {
      await onSubmit(recipient.gln, recipient.name, gst, ewbPartial, paymentMeta);
      
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
        remarks: `Payment Status: ${derivedStatus}. Paid: ${paymentData.amountPaid}. Balance: ${paymentMeta.amountRemaining}.`,
        ewayBill: {
            ewbNo: '141' + Math.floor(100000000 + Math.random() * 900000000), 
            vehicleNo: transportData.vehicleNo,
            fromPlace: transportData.fromPlace,
            toPlace: transportData.toPlace || recipient.name,
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
                <StepIndicator num={3} label="Payment" active={step === 3} completed={step > 3} />
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
                            <input 
                                autoFocus
                                required
                                value={recipient.gln}
                                onChange={e => setRecipient({...recipient, gln: e.target.value})}
                                className="w-full border border-slate-300 rounded-lg px-4 py-3 font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow shadow-sm"
                                placeholder="0000000000000"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Organization Name</label>
                            <input 
                                required
                                value={recipient.name}
                                onChange={e => setRecipient({...recipient, name: e.target.value})}
                                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow shadow-sm"
                                placeholder="e.g. State Warehouse 1"
                            />
                        </div>
                    </div>

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
                           Logistics & E-Way Bill
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vehicle No</label>
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
                           <IndianRupee className="text-blue-500" size={18} />
                           Invoice & Tax
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">HSN Code</label>
                                <input 
                                    value={gstData.hsn} 
                                    onChange={e => setGstData({...gstData, hsn: e.target.value})}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Taxable Value (₹)</label>
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

            {/* Step 3: Payment */}
            {step === 3 && (
                <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-300">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center">
                        <p className="text-slate-500 text-sm font-medium uppercase mb-1">Total Invoice Amount</p>
                        <p className="text-3xl font-bold text-slate-900">₹{totalAmount.toLocaleString()}</p>
                        <p className="text-xs text-slate-400 mt-2">Includes ₹{taxAmount.toLocaleString()} Tax ({gstData.rate}%)</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Amount Paid (Advance)</label>
                            <div className="relative">
                                <IndianRupee size={16} className="absolute left-3 top-3 text-slate-400" />
                                <input 
                                    type="number" 
                                    className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                                    value={paymentData.amountPaid}
                                    onChange={e => setPaymentData({...paymentData, amountPaid: Number(e.target.value)})}
                                />
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setPaymentData({...paymentData, isCredit: !paymentData.isCredit})}>
                             <div className={`w-5 h-5 rounded border flex items-center justify-center ${paymentData.isCredit ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                                 {paymentData.isCredit && <Check size={14} className="text-white" />}
                             </div>
                             <div className="flex-1">
                                 <p className="text-sm font-bold text-slate-700">Credit Transaction</p>
                                 <p className="text-xs text-slate-500">Record remaining balance {Math.max(0, totalAmount - paymentData.amountPaid).toLocaleString()} as account payable.</p>
                             </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Payment Notes</label>
                            <input 
                                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-400 outline-none"
                                placeholder="Cheque No, Transaction ID..."
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

            {step < 3 ? (
                <button 
                    onClick={() => {
                        if (step === 1 && (!recipient.gln || !recipient.name)) {
                            toast.warn("Please enter recipient details.");
                            return;
                        }
                        setStep(step + 1 as any);
                    }}
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
