import React, { useState, useEffect } from 'react';
import { User, Batch, UserRole, BatchStatus, GSTDetails, EWayBill, ReturnReason, Sector, ExportDetails, Stakeholder } from '../types';
import { LedgerService } from '../services/ledgerService';
import { AuthService } from '../services/authService';
import { Plus, Search, ArrowRight, Package, Zap, Truck, ArrowUpRight, ArrowDownLeft, Send, CheckSquare, Square, Layers, RotateCcw, AlertTriangle, MapPin, IndianRupee, Printer, Filter, Percent, Landmark, Pill, Tag, Stamp, PenTool } from 'lucide-react';
import { Link } from 'react-router-dom';
import BatchLabel from './BatchLabel';
import TransferModal from './TransferModal'; 
import { toast } from 'react-toastify';

interface BatchManagerProps {
  user: User;
}

const BatchManager: React.FC<BatchManagerProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'shipments' | 'incoming'>('inventory');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [showTransferModal, setShowTransferModal] = useState(false);
  
  // Return States
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedBatchForReturn, setSelectedBatchForReturn] = useState<Batch | null>(null);

  // Recall States
  const [showRecallModal, setShowRecallModal] = useState(false);
  const [selectedBatchForRecall, setSelectedBatchForRecall] = useState<Batch | null>(null);
  const [recallReason, setRecallReason] = useState('');

  // Print States
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Filter State
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [loading, setLoading] = useState(true);

  // Pharma-Specific Initial Form State
  const getInitialFormData = () => ({
    gtin: '',
    productName: '',
    lotNumber: '',
    expiryDate: '',
    quantity: 0,
    unit: 'Packs',
    alcoholContent: 0, // Not used in Pharma UI but kept for type compatibility
    dosageForm: '',
    category: 'Prescription (Rx)',
    isDutyPaid: true, // Pharma usually tax paid at source or irrelevant for "duty" status (unlike Excise)
    hsnCode: '3004',
    taxableValue: 0,
    taxRate: 12, // Standard GST for medicines often 12% or 18%
    mrp: 0
  });

  const [formData, setFormData] = useState(getInitialFormData());
  
  // E-Signature State
  const [signature, setSignature] = useState({ name: '', consent: false });

  // Return Form State
  const [returnData, setReturnData] = useState({
    toGLN: '',
    reason: ReturnReason.DAMAGED,
    refundAmount: 0,
    quantityToReturn: 1
  });

  const fetchData = async () => {
    setLoading(true);
    const data = await LedgerService.getBatches(user);
    setBatches(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const toggleSelection = (id: string) => {
    if (selectedBatchIds.includes(id)) {
      setSelectedBatchIds(prev => prev.filter(bid => bid !== id));
    } else {
      setSelectedBatchIds(prev => [...prev, id]);
    }
  };

  const getSelectedBatches = () => {
    return batches.filter(b => selectedBatchIds.includes(b.batchID));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signature.name.trim() || !signature.consent) {
        toast.error("E-Signature required. Please sign and certify.");
        return;
    }

    try {
      const taxAmount = (formData.taxableValue * formData.taxRate) / 100;
      
      // Inject signature into batch data payload
      const batchPayload: Partial<Batch> = {
        ...formData,
        sector: Sector.PHARMA,
        country: user.country,
        dutyPaid: formData.isDutyPaid,
        status: BatchStatus.CREATED, 
        taxAmount: taxAmount,
        // @ts-ignore - appending custom data
        data: {
            signedBy: signature.name,
            signedDate: new Date().toISOString(),
            signatureVerified: true
        }
      };
      
      const batchID = await LedgerService.createBatch(batchPayload, user);
      toast.success(`Batch ${batchID} Registered & Signed!`);
      setShowCreateModal(false);
      fetchData(); 
      setFormData(getInitialFormData());
      setSignature({ name: '', consent: false });
    } catch (err: any) {
      toast.error(err.message || 'Failed to create batch');
    }
  };

  const handleTransferSubmit = async (toGLN: string, toName: string, gst?: GSTDetails, ewbPartial?: Partial<EWayBill>, payment?: any, exportDetails?: ExportDetails, stakeholders?: Stakeholder[]) => {
    const batchesToTransfer = getSelectedBatches();
    if (batchesToTransfer.length === 0) return;
    
    try {
        await LedgerService.transferBatches(
            batchesToTransfer.map(b => b.batchID),
            toGLN,
            toName,
            user,
            gst,
            ewbPartial,
            payment,
            exportDetails,
            stakeholders
        );
        toast.success(`Dispatched ${batchesToTransfer.length} items to ${toName}`);
        fetchData();
        setSelectedBatchIds([]);
        setShowTransferModal(false);
    } catch (err: any) {
        toast.error(`Transfer failed: ${err.message || err}`);
    }
  };

  const handleReceiveBatch = async (batch: Batch) => {
      try {
          await LedgerService.receiveBatch(batch.batchID, user);
          toast.success(`Received ${batch.productName} into inventory.`);
          fetchData();
      } catch (err: any) {
          toast.error("Failed to receive batch.");
      }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchForReturn) return;

    try {
      await LedgerService.returnBatch(
        selectedBatchForReturn.batchID,
        returnData.toGLN,
        returnData.reason,
        returnData.quantityToReturn,
        user,
        returnData.refundAmount
      );
      toast.success(`Batch marked as RETURNED.`);
      setShowReturnModal(false);
      setSelectedBatchForReturn(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Return failed');
    }
  };

  const handleRecallSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchForRecall || !recallReason) return;
    
    try {
      await LedgerService.recallBatch(
        selectedBatchForRecall.batchID,
        recallReason,
        user
      );
      toast.error(`BATCH RECALLED: ${selectedBatchForRecall.batchID}`);
      setShowRecallModal(false);
      setSelectedBatchForRecall(null);
      setRecallReason('');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Recall failed');
    }
  };

  const handleAutoFill = () => {
    const pharmaProducts = ['Amoxicillin 500mg', 'Paracetamol IP', 'Insulin Glargine', 'Azithromycin Tabs', 'Vitamix-D3'];
    const dosageForms = ['Tablet', 'Capsule', 'Injectable', 'Syrup', 'Tablet'];
    const categories = ['Prescription (Rx)', 'OTC', 'Biologic', 'Prescription (Rx)', 'Supplement'];
    
    const idx = Math.floor(Math.random() * pharmaProducts.length);
    const mockProduct = pharmaProducts[idx];
    const mockDosage = dosageForms[idx];
    const mockCategory = categories[idx];
    
    const randomLot = `LOT-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`;
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 2);
    
    setFormData({
      gtin: AuthService.generateGTIN(),
      productName: mockProduct,
      lotNumber: randomLot,
      expiryDate: futureDate.toISOString().split('T')[0],
      quantity: Math.floor(Math.random() * 500) + 50,
      unit: 'Packs',
      alcoholContent: 0,
      dosageForm: mockDosage,
      category: mockCategory,
      isDutyPaid: true,
      hsnCode: '3004',
      taxableValue: (Math.floor(Math.random() * 500) + 50) * 450,
      taxRate: 12,
      mrp: Math.floor(Math.random() * 500) + 100
    });
    toast.info(`Demo data auto-filled`);
  };

  const getStatusColor = (status: BatchStatus) => {
    switch (status) {
      case BatchStatus.CREATED: return 'bg-slate-100 text-slate-600 border-slate-200';
      case BatchStatus.BONDED: return 'bg-amber-100 text-amber-800 border-amber-200';
      case BatchStatus.DUTY_PAID: return 'bg-green-100 text-green-800 border-green-200';
      case BatchStatus.IN_TRANSIT: return 'bg-blue-100 text-blue-800 border-blue-200';
      case BatchStatus.RECEIVED: return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case BatchStatus.SOLD: return 'bg-slate-200 text-slate-500 border-slate-200';
      case BatchStatus.QUARANTINED: return 'bg-red-100 text-red-800 border-red-200';
      case BatchStatus.RECALLED: return 'bg-red-600 text-white border-red-700 shadow-sm';
      case BatchStatus.RETURNED: return 'bg-orange-100 text-orange-800 border-orange-200';
      case BatchStatus.DESTROYED: return 'bg-gray-800 text-gray-100 border-gray-900';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Inventory Management</h2>
            <p className="text-sm text-slate-500">Track product batches, expiry, and compliance status.</p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
             <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                   onClick={() => setActiveTab('inventory')}
                   className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'inventory' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    Current Stock
                </button>
                <button
                   onClick={() => setActiveTab('incoming')}
                   className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${activeTab === 'incoming' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    Incoming
                    {batches.filter(b => b.intendedRecipientGLN === user.gln && b.status === BatchStatus.IN_TRANSIT).length > 0 && (
                        <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                            {batches.filter(b => b.intendedRecipientGLN === user.gln && b.status === BatchStatus.IN_TRANSIT).length}
                        </span>
                    )}
                </button>
                <button
                   onClick={() => setActiveTab('shipments')}
                   className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'shipments' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    Logistics Logs
                </button>
             </div>

            {user.role === UserRole.MANUFACTURER && (
            <button 
                onClick={() => setShowCreateModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors shadow-sm ml-auto"
            >
                <Plus size={18} />
                <span className="hidden sm:inline">Register Batch</span>
            </button>
            )}
        </div>
      </div>

      {activeTab === 'inventory' && (
      <>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row items-center gap-4 justify-between">
            <div className="flex items-center gap-4 w-full md:w-auto flex-1">
                <div className="flex items-center space-x-3 w-full md:w-auto flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                    <Search className="text-slate-400 shrink-0" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search inventory..." 
                        className="flex-1 outline-none text-slate-700 bg-transparent placeholder-slate-400 min-w-0 text-sm"
                    />
                </div>
                
                <div className="relative shrink-0">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Filter size={16} className="text-slate-400" />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="pl-10 pr-8 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 bg-white focus:ring-2 focus:ring-emerald-500 outline-none appearance-none cursor-pointer hover:border-slate-300 transition-colors shadow-sm"
                    >
                        <option value="ALL">All Status</option>
                        {Object.values(BatchStatus).map((status) => (
                           <option key={status} value={status}>{status.replace('_', ' ')}</option>
                        ))}
                    </select>
                </div>
            </div>
            
            {selectedBatchIds.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end animate-in fade-in slide-in-from-right-2">
                    <span className="text-sm font-semibold text-slate-600 mr-2">{selectedBatchIds.length} Selected</span>
                    
                    <button 
                        onClick={() => setShowPrintModal(true)}
                        className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md hover:bg-slate-700 transition-colors"
                    >
                        <Printer size={16} />
                        <span>Print GS1 Labels</span>
                    </button>

                    <button 
                        onClick={() => setShowTransferModal(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md transition-colors"
                    >
                        <Layers size={16} />
                        <span>Dispatch / Transfer</span>
                    </button>
                </div>
            )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {loading ? (
            <div className="p-8 text-center text-slate-500">Syncing with Distributed Chain...</div>
            ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                    <th className="px-4 py-4 w-10"></th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Product / Variant</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">GTIN</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Category</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {batches
                      .filter(b => (statusFilter === 'ALL' || b.status === statusFilter) && b.currentOwnerGLN === user.gln)
                      .map((batch) => {
                        const canTransfer = batch.currentOwnerGLN === user.gln && batch.status !== 'SOLD' && batch.status !== 'IN_TRANSIT' && batch.status !== 'RETURNED' && batch.status !== 'RECALLED';
                        const isSelected = selectedBatchIds.includes(batch.batchID);
                        const canRecall = batch.status !== 'RECALLED' && (
                           (user.role === UserRole.MANUFACTURER && batch.manufacturerGLN === user.gln) ||
                           user.role === UserRole.REGULATOR
                        );

                        return (
                        <tr key={batch.batchID} className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-indigo-50/50' : ''}`}>
                            <td className="px-4 py-4 text-center">
                                {canTransfer ? (
                                    <button 
                                        onClick={() => toggleSelection(batch.batchID)}
                                        className="text-slate-400 hover:text-indigo-600"
                                    >
                                        {isSelected ? <CheckSquare className="text-indigo-600" /> : <Square />}
                                    </button>
                                ) : (
                                    <Square className="text-slate-200 cursor-not-allowed" />
                                )}
                            </td>
                            <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                    <Pill size={20} />
                                </div>
                                <div>
                                <p className="font-medium text-slate-800">{batch.productName}</p>
                                <p className="text-xs text-slate-500 font-mono">
                                    {batch.batchID} 
                                    {batch.dosageForm ? ` • ${batch.dosageForm}` : ''}
                                </p>
                                </div>
                            </div>
                            </td>
                            <td className="px-6 py-4 font-mono text-sm text-slate-600">{batch.gtin}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">{batch.category || 'N/A'}</td>
                            <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(batch.status)} whitespace-nowrap`}>
                                {batch.status.replace('_', ' ')}
                            </span>
                            </td>
                            <td className="px-6 py-4 text-right flex items-center justify-end space-x-4">
                                {canTransfer && (
                                    <>
                                        <button 
                                            onClick={() => { setSelectedBatchIds([batch.batchID]); setShowTransferModal(true); }}
                                            className="text-indigo-600 hover:text-indigo-800 text-xs font-bold uppercase tracking-wider flex items-center gap-1"
                                        >
                                            <Send size={14} />
                                            <span>Move</span>
                                        </button>
                                        <button 
                                            onClick={() => { 
                                                setSelectedBatchForReturn(batch); 
                                                const available = batch.quantity - (batch.totalReturnedQuantity || 0);
                                                setReturnData({ ...returnData, toGLN: batch.manufacturerGLN, quantityToReturn: available }); 
                                                setShowReturnModal(true); 
                                            }}
                                            className="text-amber-600 hover:text-amber-800 text-xs font-bold uppercase tracking-wider flex items-center gap-1"
                                        >
                                            <RotateCcw size={14} />
                                            <span>Return</span>
                                        </button>
                                    </>
                                )}
                                
                                {canRecall && (
                                    <button 
                                        onClick={() => {
                                            setSelectedBatchForRecall(batch);
                                            setShowRecallModal(true);
                                        }}
                                        className="text-red-600 hover:text-red-800 text-xs font-bold uppercase tracking-wider flex items-center gap-1"
                                        title="Initiate Product Recall"
                                    >
                                        <AlertTriangle size={14} />
                                        <span>Recall</span>
                                    </button>
                                )}

                                <Link 
                                    to={`/trace/${batch.batchID}`}
                                    className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                    <span>Trace</span>
                                    <ArrowRight size={16} />
                                </Link>
                            </td>
                        </tr>
                    )})}
                    {batches.filter(b => (statusFilter === 'ALL' || b.status === statusFilter) && b.currentOwnerGLN === user.gln).length === 0 && (
                        <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                <div className="flex flex-col items-center gap-2">
                                    <Package size={32} className="opacity-20" />
                                    <p>No batches found with the selected filter.</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
                </table>
            </div>
            )}
        </div>
      </>
      )}

      {activeTab === 'incoming' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                <Truck className="text-indigo-600" />
                <h3 className="font-bold text-slate-800">Incoming Shipments</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4">Batch ID</th>
                            <th className="px-6 py-4">Product</th>
                            <th className="px-6 py-4">Sender</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {batches.filter(b => b.intendedRecipientGLN === user.gln && b.status === BatchStatus.IN_TRANSIT).map(batch => (
                            <tr key={batch.batchID} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-mono text-sm">{batch.batchID}</td>
                                <td className="px-6 py-4 font-medium text-slate-800">{batch.productName}</td>
                                <td className="px-6 py-4 text-sm text-slate-600">
                                    {batch.trace.find(t => t.type === 'DISPATCH')?.actorName || batch.manufacturerGLN}
                                    <div className="text-[10px] text-slate-400">{batch.trace.find(t => t.type === 'DISPATCH')?.actorGLN}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-bold">In Transit</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => handleReceiveBatch(batch)}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md transition-colors"
                                    >
                                        Receive & Verify
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {batches.filter(b => b.intendedRecipientGLN === user.gln && b.status === BatchStatus.IN_TRANSIT).length === 0 && (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-400">No incoming shipments found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      )}
      
      {activeTab === 'shipments' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                <Truck className="text-blue-600" />
                <h3 className="font-bold text-slate-800">Transport & Permits</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                        <tr>
                            <th className="px-6 py-4">Direction</th>
                            <th className="px-6 py-4">Partner (GLN)</th>
                            <th className="px-6 py-4">Product / Batch</th>
                            <th className="px-6 py-4">E-Way Bill Details</th>
                            <th className="px-6 py-4 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {batches.flatMap(b => {
                            const events = [];
                            const dispatch = b.trace.find(t => t.type === 'DISPATCH' && t.actorGLN === user.gln);
                            if (dispatch) events.push({
                                type: 'OUTBOUND',
                                partner: dispatch.metadata?.recipientGLN || 'Unknown',
                                partnerName: dispatch.metadata?.recipient || 'Unknown',
                                date: dispatch.timestamp,
                                batch: b,
                                ewb: dispatch.metadata?.ewayBill
                            });
                            const receive = b.trace.find(t => t.type === 'RECEIVE' && t.actorGLN === user.gln);
                            if (receive) events.push({
                                type: 'INBOUND',
                                partner: b.trace.find(t => t.type === 'DISPATCH' && new Date(t.timestamp) < new Date(receive.timestamp))?.actorGLN || b.manufacturerGLN,
                                partnerName: 'Supplier',
                                date: receive.timestamp,
                                batch: b,
                                ewb: null
                            });
                            return events;
                        }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((log, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                                <td className="px-6 py-4">
                                    {log.type === 'OUTBOUND' ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                                            <ArrowUpRight size={14} /> Sent
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                                            <ArrowDownLeft size={14} /> Received
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <p className="font-medium text-slate-800">{log.partnerName}</p>
                                    <p className="font-mono text-xs text-slate-400">{log.partner}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-sm font-medium text-slate-800">{log.batch.productName}</p>
                                    <p className="font-mono text-xs text-slate-500">{log.batch.batchID}</p>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500">
                                    {log.ewb ? (
                                        <div className="flex flex-col text-xs space-y-1">
                                          <div className="flex items-center gap-1 text-slate-700 font-bold">
                                            <Truck size={12} />
                                            <span>{log.ewb.vehicleNo}</span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <MapPin size={12} />
                                            <span>{log.ewb.fromPlace} ➝ {log.ewb.toPlace}</span>
                                          </div>
                                          <span className="text-slate-400">Dist: {log.ewb.distanceKm} km</span>
                                        </div>
                                    ) : (
                                        <span className="text-slate-300 italic">--</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Link to={`/trace/${log.batch.batchID}`} className="text-blue-600 hover:underline text-xs font-bold">
                                        View
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}
      
      {showPrintModal && (
        <div className="fixed inset-0 z-[100] bg-white overflow-y-auto">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center print:hidden sticky top-0 z-50 shadow-md">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 rounded-lg">
                        <Printer size={20} className="text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold">Label Printing Queue</h3>
                        <p className="text-xs text-slate-400">{selectedBatchIds.length} stickers ready for thermal printer</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setShowPrintModal(false)} 
                        className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        Close
                    </button>
                    <button 
                        onClick={() => window.print()} 
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2"
                    >
                        <Printer size={18} />
                        <span>Print All</span>
                    </button>
                </div>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 print:block print:p-0 print:gap-0">
               {getSelectedBatches().map((batch, idx) => (
                   <div key={batch.batchID} className="flex justify-center print:break-inside-avoid print:mb-4 print:page-break-after-auto print:flex print:justify-start">
                      <BatchLabel 
                          gtin={batch.gtin} 
                          lot={batch.lotNumber} 
                          expiry={batch.expiryDate} 
                          productName={batch.productName} 
                          status={batch.status}
                          hidePrintButton={true}
                      />
                   </div>
               ))}
            </div>
            
            <div className="print:hidden p-8 text-center text-slate-400 text-sm">
                <p>Preview Mode. Use Ctrl+P or the Print button to send to printer.</p>
            </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
            <div className="flex-1 p-4 md:p-8 flex flex-col overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl text-slate-800">Register New Batch</h3>
                <button onClick={() => setShowCreateModal(false)} className="md:hidden text-slate-400 hover:text-slate-600">✕</button>
              </div>
              <div className="mb-4">
                <button onClick={handleAutoFill} className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors border border-emerald-200">
                  <Zap size={16} className="text-emerald-600 fill-current" />
                  <span>Auto-Fill (Simulate Data)</span>
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-5 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Product Info */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2 border-b pb-1">
                      <Package size={16} className="text-emerald-600" />
                      Product Specifics
                    </h4>
                    <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Product Name</label><input required type="text" className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition text-sm" value={formData.productName} onChange={e => setFormData({...formData, productName: e.target.value})} placeholder="e.g. Amoxicillin 500mg" /></div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Category</label>
                        <select className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                            <option value="Prescription (Rx)">Prescription (Rx)</option>
                            <option value="OTC">Over-the-Counter (OTC)</option>
                            <option value="Controlled">Controlled Substance</option>
                            <option value="Biologic">Biologic / Vaccine</option>
                            <option value="Medical Device">Medical Device</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Variant / Type</label>
                        <input required type="text" className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition text-sm" value={formData.dosageForm} onChange={e => setFormData({...formData, dosageForm: e.target.value})} placeholder="e.g. 500mg Tablet" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">GTIN</label><input required maxLength={14} minLength={14} type="text" className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition font-mono text-sm" value={formData.gtin} onChange={e => setFormData({...formData, gtin: e.target.value})} placeholder="00089012345678" /></div>
                      <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Lot / Batch No</label><input required type="text" className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition text-sm" value={formData.lotNumber} onChange={e => setFormData({...formData, lotNumber: e.target.value})} placeholder="LOT-2024-X" /></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Expiry Date</label><input required type="date" className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition text-sm" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} /></div>
                      <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Quantity ({formData.unit})</label><input required type="number" className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition text-sm" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})} /></div>
                    </div>
                  </div>

                  {/* Right Column: Financial Compliance */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2 border-b pb-1">
                      <Landmark size={16} className="text-emerald-600" />
                      GST & Pricing (India)
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">HSN Code</label>
                        <input required type="text" className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition text-sm font-mono" value={formData.hsnCode} onChange={e => setFormData({...formData, hsnCode: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">GST Rate (%)</label>
                        <div className="relative">
                          <Percent size={14} className="absolute right-3 top-2.5 text-slate-400" />
                          <input required type="number" className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition text-sm" value={formData.taxRate} onChange={e => setFormData({...formData, taxRate: parseInt(e.target.value)})} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Taxable Value (₹)</label>
                      <div className="relative">
                        <IndianRupee size={14} className="absolute left-3 top-2.5 text-slate-400" />
                        <input required type="number" className="w-full border border-slate-300 rounded-lg pl-8 pr-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition text-sm font-bold" value={formData.taxableValue} onChange={e => setFormData({...formData, taxableValue: parseInt(e.target.value)})} />
                      </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                            <Tag size={12} />
                            Maximum Retail Price (MRP)
                        </label>
                        <div className="relative">
                            <IndianRupee size={14} className="absolute left-3 top-2.5 text-slate-400" />
                            <input 
                                required 
                                type="number" 
                                className="w-full border border-slate-300 rounded-lg pl-8 pr-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition text-sm font-bold bg-teal-50 border-teal-200 text-teal-900" 
                                value={formData.mrp} 
                                onChange={e => setFormData({...formData, mrp: parseInt(e.target.value)})}
                                placeholder="Incl. of all taxes"
                            />
                        </div>
                    </div>

                    <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                      <div className="flex justify-between text-[10px] font-bold text-emerald-700 uppercase mb-1">
                        <span>GST Projection</span>
                        <span>{((formData.taxableValue * formData.taxRate) / 100).toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-emerald-200 h-1 rounded-full overflow-hidden">
                        <div className="bg-emerald-600 h-full w-[100%]"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* E-Signature Section */}
                <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                        <PenTool size={14} className="text-indigo-600" />
                        E-Signature Authorization
                    </h4>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Authorized Signatory Name</label>
                            <input 
                                type="text" 
                                placeholder="Type your full name to sign"
                                className="w-full border-b-2 border-slate-300 bg-transparent py-2 px-1 text-lg font-serif italic text-slate-800 focus:border-indigo-600 focus:outline-none placeholder:font-sans placeholder:text-sm placeholder:text-slate-300 placeholder:italic"
                                value={signature.name}
                                onChange={(e) => setSignature({...signature, name: e.target.value})}
                            />
                        </div>
                        <label className="flex items-start gap-3 cursor-pointer p-2 hover:bg-slate-100 rounded-lg transition-colors">
                            <input 
                                type="checkbox" 
                                className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                checked={signature.consent}
                                onChange={(e) => setSignature({...signature, consent: e.target.checked})}
                            />
                            <span className="text-[11px] text-slate-600 leading-relaxed">
                                I hereby declare that this batch complies with all applicable quality and regulatory standards (GMP/CDSCO). 
                                I understand that this digital signature is legally binding and recorded on the immutable ledger.
                            </span>
                        </label>
                    </div>
                </div>

                <div className="pt-4 flex justify-end space-x-3 mt-auto border-t border-slate-100">
                    <button type="button" onClick={() => setShowCreateModal(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Cancel</button>
                    <button 
                        type="submit" 
                        disabled={!signature.name || !signature.consent}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold shadow-md transition-all transform hover:scale-[1.02] flex items-center gap-2"
                    >
                        <Stamp size={16} />
                        <span>Sign & Register Batch</span>
                    </button>
                </div>
              </form>
            </div>
            <div className="w-full md:w-80 bg-slate-50 border-t md:border-t-0 md:border-l border-slate-200 p-6 md:p-8 flex flex-col items-center justify-center">
                <div className="mb-6 text-center">
                    <h4 className="text-sm font-bold text-slate-600 uppercase tracking-wide">Label Preview</h4>
                    <p className="text-xs text-slate-400 mt-1">Serialized 2D DataMatrix</p>
                </div>
                <BatchLabel 
                    gtin={formData.gtin} 
                    lot={formData.lotNumber} 
                    expiry={formData.expiryDate} 
                    productName={formData.productName} 
                    status={formData.isDutyPaid ? BatchStatus.DUTY_PAID : BatchStatus.CREATED}
                />
                <div className="mt-8 text-center px-4">
                    <p className="text-xs text-slate-400 leading-relaxed">
                        This DataMatrix enables real-time verification at pharmacies and hospitals, ensuring compliance with iVEDA and global track & trace mandates.
                    </p>
                </div>
            </div>
          </div>
        </div>
      )}

      {showTransferModal && selectedBatchIds.length > 0 && (
        <TransferModal 
          batches={getSelectedBatches()} 
          onClose={() => { setShowTransferModal(false); setSelectedBatchIds([]); }}
          onSubmit={handleTransferSubmit}
          currentUser={user}
        />
      )}

      {showReturnModal && selectedBatchForReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
           <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                   <RotateCcw className="text-amber-500" />
                   <span>Initiate Return</span>
                </h3>
                <button onClick={() => setShowReturnModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
              
              <div className="bg-amber-50 p-4 rounded-lg mb-6 border border-amber-100">
                 <p className="text-sm text-amber-900 font-medium">Returning: {selectedBatchForReturn.productName}</p>
                 <p className="text-xs text-amber-700 font-mono mt-1">{selectedBatchForReturn.batchID}</p>
                 <p className="text-xs text-amber-600 mt-1">Available to Return: {selectedBatchForReturn.quantity - (selectedBatchForReturn.totalReturnedQuantity || 0)} {selectedBatchForReturn.unit}</p>
              </div>

              <form onSubmit={handleReturnSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Return To (GLN)</label>
                        <input 
                            required
                            className="w-full border border-slate-300 rounded-lg px-4 py-2 font-mono text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                            value={returnData.toGLN}
                            onChange={e => setReturnData({...returnData, toGLN: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quantity ({selectedBatchForReturn.unit})</label>
                        <input 
                            type="number"
                            required
                            min="1"
                            max={selectedBatchForReturn.quantity - (selectedBatchForReturn.totalReturnedQuantity || 0)}
                            className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                            value={returnData.quantityToReturn}
                            onChange={e => setReturnData({...returnData, quantityToReturn: parseInt(e.target.value)})}
                        />
                    </div>
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Reason</label>
                      <select 
                        className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                        value={returnData.reason}
                        onChange={e => setReturnData({...returnData, reason: e.target.value as ReturnReason})}
                      >
                         {Object.values(ReturnReason).map(r => (
                             <option key={r} value={r}>{r}</option>
                         ))}
                      </select>
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Refund Amount</label>
                      <input 
                        type="number"
                        className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                        value={returnData.refundAmount}
                        onChange={e => setReturnData({...returnData, refundAmount: parseFloat(e.target.value)})}
                      />
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-6">
                      <button 
                        type="button"
                        onClick={() => setShowReturnModal(false)}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                      >
                          Cancel
                      </button>
                      <button 
                        type="submit"
                        className="px-4 py-2 bg-amber-500 text-white rounded-lg font-bold hover:bg-amber-600 shadow-md"
                      >
                          Confirm Return
                      </button>
                  </div>
              </form>
           </div>
        </div>
      )}

      {showRecallModal && selectedBatchForRecall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
           <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border-t-4 border-red-600">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-red-700 flex items-center gap-2">
                   <AlertTriangle className="fill-red-100" />
                   <span>EMERGENCY RECALL</span>
                </h3>
                <button onClick={() => setShowRecallModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg mb-6 border border-red-100">
                 <p className="text-sm font-bold text-red-900">Recalling: {selectedBatchForRecall.productName}</p>
                 <p className="text-xs text-red-700 font-mono mt-1">Batch ID: {selectedBatchForRecall.batchID}</p>
                 <p className="text-xs text-red-600 mt-2">
                    Warning: This action is irreversible. The batch status will be updated to RECALLED on the ledger immediately.
                 </p>
              </div>

              <form onSubmit={handleRecallSubmit} className="space-y-4">
                  <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Reason for Recall</label>
                      <textarea 
                        required
                        className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 outline-none h-32"
                        placeholder="Describe the defect, contamination, or regulatory violation..."
                        value={recallReason}
                        onChange={e => setRecallReason(e.target.value)}
                      />
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-2">
                      <button 
                        type="button"
                        onClick={() => setShowRecallModal(false)}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                      >
                          Cancel
                      </button>
                      <button 
                        type="submit"
                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 shadow-md flex items-center gap-2"
                      >
                          <AlertTriangle size={16} />
                          <span>CONFIRM RECALL</span>
                      </button>
                  </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default BatchManager;