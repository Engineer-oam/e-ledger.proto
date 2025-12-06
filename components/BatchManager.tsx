
import React, { useState, useEffect } from 'react';
import { User, Batch, UserRole, BatchStatus, GSTDetails, EWayBill, ReturnReason } from '../types';
import { LedgerService } from '../services/ledgerService';
import { AuthService } from '../services/authService';
import { Plus, Search, Eye, ArrowRight, Package, Zap, Truck, ArrowUpRight, ArrowDownLeft, Send, CheckSquare, Square, Layers, RotateCcw, Wine, Stamp, AlertTriangle, MapPin, DollarSign, Printer, X, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import BatchLabel from './BatchLabel';
import TransferModal from './TransferModal'; 
import { toast } from 'react-toastify';

interface BatchManagerProps {
  user: User;
}

const BatchManager: React.FC<BatchManagerProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'shipments'>('inventory');
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

  // Form State including Excise Fields
  const [formData, setFormData] = useState<{
    gtin: string;
    productName: string;
    lotNumber: string;
    expiryDate: string;
    quantity: number;
    unit: string;
    alcoholContent: number;
    category: 'IMFL' | 'BEER' | 'COUNTRY_LIQUOR' | 'WINE' | 'SPIRIT';
    isDutyPaid: boolean;
  }>({
    gtin: '',
    productName: '',
    lotNumber: '',
    expiryDate: '',
    quantity: 0,
    unit: 'Cases',
    alcoholContent: 42.8,
    category: 'IMFL',
    isDutyPaid: false
  });

  // Return Form State
  const [returnData, setReturnData] = useState({
    toGLN: '',
    reason: ReturnReason.DAMAGED,
    refundAmount: 0
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
    try {
      const batchPayload: Partial<Batch> = {
        ...formData,
        dutyPaid: formData.isDutyPaid,
        status: formData.isDutyPaid ? BatchStatus.DUTY_PAID : BatchStatus.BONDED
      };
      
      const batchID = await LedgerService.createBatch(batchPayload, user);
      toast.success(`Batch ${batchID} Registered! Status: ${batchPayload.status}`);
      setShowCreateModal(false);
      fetchData(); 
      setFormData({ 
        gtin: '', productName: '', lotNumber: '', expiryDate: '', quantity: 0, unit: 'Cases', alcoholContent: 42.8, category: 'IMFL', isDutyPaid: false 
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to create batch');
    }
  };

  const handleTransferSubmit = async (toGLN: string, toName: string, gst?: GSTDetails, ewbPartial?: Partial<EWayBill>, payment?: any) => {
    const batchesToTransfer = getSelectedBatches();
    if (batchesToTransfer.length === 0) return;
    
    try {
        // Pass E-Way Bill details directly to the service
        await LedgerService.transferBatches(
            batchesToTransfer.map(b => b.batchID),
            toGLN,
            toName,
            user,
            gst,
            ewbPartial,
            payment
        );
        toast.success(`Dispatched ${batchesToTransfer.length} loads to ${toName}`);
        fetchData();
        setSelectedBatchIds([]);
        setShowTransferModal(false);
    } catch (err: any) {
        toast.error(`Transfer failed: ${err.message || err}`);
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
    const products = [
      'Royal Reserve Whisky', 'Old Monk Rum', 'Kingfisher Lager', 'Sula Shiraz', 'Blue Riband Gin'
    ];
    const categories: ('IMFL' | 'BEER' | 'COUNTRY_LIQUOR' | 'WINE' | 'SPIRIT')[] = ['IMFL', 'IMFL', 'BEER', 'WINE', 'IMFL'];
    const idx = Math.floor(Math.random() * products.length);
    const randomProduct = products[idx];
    const randomCategory = categories[idx];
    
    const randomLot = `VAT-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`;
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 2);
    
    const isPaid = Math.random() > 0.5;

    setFormData({
      gtin: AuthService.generateGTIN(),
      productName: randomProduct,
      lotNumber: randomLot,
      expiryDate: futureDate.toISOString().split('T')[0],
      quantity: Math.floor(Math.random() * 500) + 50,
      unit: 'Cases',
      alcoholContent: randomCategory === 'BEER' ? 6.5 : 42.8,
      category: randomCategory,
      isDutyPaid: isPaid
    });
    toast.info('Distillery form auto-filled');
  };

  const getStatusColor = (status: BatchStatus) => {
    switch (status) {
      case BatchStatus.CREATED: return 'bg-slate-100 text-slate-600 border-slate-200'; // Distilled
      case BatchStatus.BONDED: return 'bg-amber-100 text-amber-800 border-amber-200'; // Amber for Bonded
      case BatchStatus.DUTY_PAID: return 'bg-green-100 text-green-800 border-green-200'; // Green for Duty Paid
      case BatchStatus.IN_TRANSIT: return 'bg-blue-100 text-blue-800 border-blue-200';
      case BatchStatus.RECEIVED: return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case BatchStatus.SOLD: return 'bg-slate-200 text-slate-500 border-slate-200';
      case BatchStatus.QUARANTINED: return 'bg-red-100 text-red-800 border-red-200';
      case BatchStatus.RECALLED: return 'bg-red-600 text-white border-red-700 shadow-sm'; // Solid Red for Recall
      case BatchStatus.RETURNED: return 'bg-orange-100 text-orange-800 border-orange-200';
      case BatchStatus.DESTROYED: return 'bg-gray-800 text-gray-100 border-gray-900';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Spirits Inventory</h2>
            <p className="text-sm text-slate-500">Track distillates, duty status, and shipments</p>
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
                   onClick={() => setActiveTab('shipments')}
                   className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'shipments' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    Logistics Logs
                </button>
             </div>

            {user.role === UserRole.MANUFACTURER && (
            <button 
                onClick={() => setShowCreateModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors shadow-sm ml-auto"
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
                        placeholder="Search stock..." 
                        className="flex-1 outline-none text-slate-700 bg-transparent placeholder-slate-400 min-w-0 text-sm"
                    />
                </div>
                
                {/* Status Filter */}
                <div className="relative shrink-0">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Filter size={16} className="text-slate-400" />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="pl-10 pr-8 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 bg-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer hover:border-slate-300 transition-colors shadow-sm"
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
                        <span>Print Labels</span>
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
            <div className="p-8 text-center text-slate-500">Syncing with Excise Chain...</div>
            ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                    <th className="px-4 py-4 w-10"></th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Brand / Details</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">GTIN</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Category</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {batches
                      .filter(b => statusFilter === 'ALL' || b.status === statusFilter)
                      .map((batch) => {
                        const canTransfer = batch.currentOwnerGLN === user.gln && batch.status !== 'SOLD' && batch.status !== 'IN_TRANSIT' && batch.status !== 'RETURNED' && batch.status !== 'RECALLED';
                        const isSelected = selectedBatchIds.includes(batch.batchID);
                        
                        // Recall Logic: Manufacturer or Regulator can recall any time (if not already recalled)
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
                                <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                                <Wine size={20} />
                                </div>
                                <div>
                                <p className="font-medium text-slate-800">{batch.productName}</p>
                                <p className="text-xs text-slate-500 font-mono">{batch.batchID} • {batch.alcoholContent}% ABV</p>
                                </div>
                            </div>
                            </td>
                            <td className="px-6 py-4 font-mono text-sm text-slate-600">{batch.gtin}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">{batch.category}</td>
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
                                                setReturnData({ ...returnData, toGLN: batch.manufacturerGLN }); 
                                                setShowReturnModal(true); 
                                            }}
                                            className="text-orange-600 hover:text-orange-800 text-xs font-bold uppercase tracking-wider flex items-center gap-1"
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
                    {batches.filter(b => statusFilter === 'ALL' || b.status === statusFilter).length === 0 && (
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

      {/* Shipment Logs Tab */}
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
                            <th className="px-6 py-4">Licensee (GLN)</th>
                            <th className="px-6 py-4">Brand / Batch</th>
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

      {/* PRINT LABELS MODAL */}
      {showPrintModal && (
        <div className="fixed inset-0 z-[100] bg-white overflow-y-auto">
            {/* Toolbar - Hidden when printing */}
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

            {/* Printable Grid */}
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

      {/* Create Modal - Adapted for Distillery */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
            <div className="flex-1 p-4 md:p-8 flex flex-col overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl text-slate-800">Register New Spirit Batch</h3>
                <button onClick={() => setShowCreateModal(false)} className="md:hidden text-slate-400 hover:text-slate-600">✕</button>
              </div>
              <div className="mb-4">
                <button onClick={handleAutoFill} className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors border border-indigo-200">
                  <Zap size={16} className="text-indigo-600 fill-current" />
                  <span>Auto-Fill (Simulate Distillery Output)</span>
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-5 flex-1">
                <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Brand / Product Name</label><input required type="text" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition" value={formData.productName} onChange={e => setFormData({...formData, productName: e.target.value})} placeholder="e.g. Royal Reserve Whisky" /></div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div>
                     <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Category</label>
                     <select className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm bg-white" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})}>
                       <option value="IMFL">IMFL (Foreign Liquor)</option>
                       <option value="BEER">Beer</option>
                       <option value="WINE">Wine</option>
                       <option value="COUNTRY_LIQUOR">Country Liquor</option>
                       <option value="SPIRIT">Rectified Spirit (ENA)</option>
                     </select>
                   </div>
                   <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Alcohol Content (%)</label><input required type="number" step="0.1" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition" value={formData.alcoholContent} onChange={e => setFormData({...formData, alcoholContent: parseFloat(e.target.value)})} /></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">GTIN</label><input required maxLength={14} minLength={14} type="text" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition font-mono" value={formData.gtin} onChange={e => setFormData({...formData, gtin: e.target.value})} placeholder="00089012345678" /></div><div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Vat / Lot Number</label><input required type="text" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition" value={formData.lotNumber} onChange={e => setFormData({...formData, lotNumber: e.target.value})} placeholder="VAT-2024-X" /></div></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Bottling Date</label><input required type="date" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} /></div><div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Quantity (Cases)</label><input required type="number" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})} /></div></div>
                
                {/* Duty Paid Toggle */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-2">
                    <label className="flex items-center cursor-pointer gap-3">
                        <div className="relative">
                            <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={formData.isDutyPaid}
                                onChange={e => setFormData({...formData, isDutyPaid: e.target.checked})} 
                            />
                            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        </div>
                        <div>
                            <span className="block text-sm font-bold text-slate-800">Pre-Pay State Excise Duty</span>
                            <span className="text-xs text-slate-500">Mark batch as Duty Paid immediately upon creation</span>
                        </div>
                    </label>
                    <div className="mt-2 pl-14">
                        {formData.isDutyPaid ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-200">
                                <DollarSign size={12} />
                                Status: DUTY PAID
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 font-bold bg-amber-100 px-2.5 py-1 rounded-md border border-amber-200">
                                <AlertTriangle size={12} />
                                Status: BONDED (Unpaid)
                            </span>
                        )}
                    </div>
                </div>

                <div className="pt-6 flex justify-end space-x-3 mt-auto"><button type="button" onClick={() => setShowCreateModal(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Cancel</button><button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md transition-all transform hover:scale-[1.02]">Issue Excise Holograms</button></div>
              </form>
            </div>
            <div className="w-full md:w-80 bg-slate-50 border-t md:border-t-0 md:border-l border-slate-200 p-6 md:p-8 flex flex-col items-center justify-center">
                <div className="mb-6 text-center"><h4 className="text-sm font-bold text-slate-600 uppercase tracking-wide">Security Feature</h4><p className="text-xs text-slate-400 mt-1">Digital Excise Hologram</p></div>
                <BatchLabel 
                    gtin={formData.gtin} 
                    lot={formData.lotNumber} 
                    expiry={formData.expiryDate} 
                    productName={formData.productName} 
                    status={formData.isDutyPaid ? BatchStatus.DUTY_PAID : BatchStatus.BONDED}
                />
                <div className="mt-8 text-center px-4"><p className="text-xs text-slate-400 leading-relaxed">This QR represents the State Excise Hologram. It must be affixed to every case before leaving the bonded warehouse.</p></div>
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
                   <RotateCcw className="text-orange-500" />
                   <span>Initiate Return</span>
                </h3>
                <button onClick={() => setShowReturnModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg mb-6 border border-orange-100">
                 <p className="text-sm text-orange-900 font-medium">Returning: {selectedBatchForReturn.productName}</p>
                 <p className="text-xs text-orange-700 font-mono mt-1">{selectedBatchForReturn.batchID}</p>
              </div>

              <form onSubmit={handleReturnSubmit} className="space-y-4">
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Return To (GLN)</label>
                      <input 
                        required
                        className="w-full border border-slate-300 rounded-lg px-4 py-2 font-mono text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                        value={returnData.toGLN}
                        onChange={e => setReturnData({...returnData, toGLN: e.target.value})}
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Reason</label>
                      <select 
                        className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                        value={returnData.reason}
                        onChange={e => setReturnData({...returnData, reason: e.target.value as ReturnReason})}
                      >
                         {Object.values(ReturnReason).map(r => (
                             <option key={r} value={r}>{r}</option>
                         ))}
                      </select>
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Refund Amount (INR)</label>
                      <input 
                        type="number"
                        className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
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
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 shadow-md"
                      >
                          Confirm Return
                      </button>
                  </div>
              </form>
           </div>
        </div>
      )}

      {/* RECALL MODAL */}
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
