
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Batch, User, TraceEvent } from '../types';
import { LedgerService } from '../services/ledgerService';
import { 
  CheckCircle2, MapPin, User as UserIcon, Clock, ArrowLeft, 
  ShieldCheck, Database, Link as LinkIcon, FileText, Truck, 
  CreditCard, BadgeCheck, FileCheck, Printer
} from 'lucide-react';
import PrintableInvoice from './PrintableInvoice';

const TraceVisualizer: React.FC<{ user: User }> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [activeTab, setActiveTab] = useState<'TIMELINE' | 'DOCS'>('TIMELINE');
  const [viewingDoc, setViewingDoc] = useState<any>(null);

  useEffect(() => {
    if (id) LedgerService.getBatchByID(id).then(setBatch);
  }, [id]);

  if (!batch) return <div className="p-12 text-center text-slate-400">Locating Block...</div>;

  // Extract financial/compliance documents from trace
  const documents = batch.trace.filter(t => t.metadata?.gst || t.metadata?.ewayBill || t.metadata?.paymentStatus);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-700">
      <div className="flex items-center justify-between">
        <Link to="/batches" className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-xs uppercase transition-colors">
            <ArrowLeft size={16} /> Back to Records
        </Link>
        <div className="flex gap-2">
            <button 
                onClick={() => setActiveTab('TIMELINE')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'TIMELINE' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
            >
                Chain of Custody
            </button>
            <button 
                onClick={() => setActiveTab('DOCS')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'DOCS' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
            >
                <span>Financial Docs</span>
                {documents.length > 0 && <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full text-[10px]">{documents.length}</span>}
            </button>
        </div>
      </div>

      {/* Block Header */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <Database size={160} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
                <span className={`bg-indigo-100 text-indigo-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest`}>
                {batch.status.replace('_', ' ')}
                </span>
                {batch.dutyPaid && (
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
                        <CheckCircle2 size={12} /> Duty Paid
                    </span>
                )}
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">{batch.productName}</h1>
            <p className="text-sm font-mono text-slate-500 mt-2">UUID: {batch.batchID}</p>
          </div>
          <div className="text-right">
             <div className="p-4 bg-slate-900 rounded-2xl text-white shadow-lg">
                <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Integrity Hash</p>
                <p className="text-xs font-mono text-indigo-400 break-all max-w-[200px]">{batch.integrityHash?.slice(0, 24)}...</p>
                <div className="mt-2 pt-2 border-t border-slate-800 flex justify-end">
                    <span className="text-[9px] text-emerald-400 flex items-center gap-1">
                        <ShieldCheck size={10} /> Cryptographically Secured
                    </span>
                </div>
             </div>
          </div>
        </div>
      </div>

      {activeTab === 'TIMELINE' && (
        <div className="relative pl-8 md:pl-0">
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-slate-200 -translate-x-1/2"></div>
            
            <div className="space-y-12 relative">
            {batch.trace.map((event, idx) => (
                <div key={event.eventID} className={`flex flex-col md:flex-row items-center w-full ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                <div className="flex-1 md:w-1/2"></div>
                
                {/* Dot */}
                <div className={`absolute left-4 md:left-1/2 w-8 h-8 rounded-full -translate-x-1/2 z-10 flex items-center justify-center shadow-lg border-4 ${idx === 0 ? 'bg-emerald-500 border-emerald-100 text-white' : 'bg-white border-slate-200 text-slate-400'}`}>
                    {idx === 0 ? <CheckCircle2 size={14} /> : <LinkIcon size={12} />}
                </div>

                <div className={`flex-1 md:w-1/2 p-4 md:p-8 ${idx % 2 === 0 ? 'md:pr-12' : 'md:pl-12'}`}>
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs flex items-center gap-2">
                        <ShieldCheck size={14} className="text-emerald-500" />
                        {event.type}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 font-mono flex items-center gap-1">
                            <Clock size={10} />
                            {new Date(event.timestamp).toLocaleString()}
                        </p>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-slate-50 rounded-full text-slate-400">
                                <UserIcon size={16} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-slate-800">{event.actorName}</span>
                                    {event.actorGLN && (
                                        <span className="bg-blue-50 text-blue-600 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-blue-100" title="Verified Global Location Number">
                                            <BadgeCheck size={10} /> GLN Verified
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {event.actorGLN}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-slate-50 rounded-full text-slate-400">
                                <MapPin size={16} />
                            </div>
                            <div>
                                <span className="font-bold text-sm text-slate-800 block">Location</span>
                                <span className="text-xs text-slate-500">{event.location}</span>
                            </div>
                        </div>

                        {event.metadata && (Object.keys(event.metadata).length > 0) && (
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                                {event.metadata.gst && (
                                    <div className="flex items-center justify-between text-slate-600">
                                        <span className="font-bold flex items-center gap-1"><FileText size={10} /> Invoice</span>
                                        <span className="font-mono">{event.metadata.gst.invoiceNo}</span>
                                    </div>
                                )}
                                {event.metadata.ewayBill && (
                                    <div className="flex items-center justify-between text-slate-600">
                                        <span className="font-bold flex items-center gap-1"><Truck size={10} /> E-Way Bill</span>
                                        <span className="font-mono">{event.metadata.ewayBill.ewbNo}</span>
                                    </div>
                                )}
                                {event.ePassNo && (
                                    <div className="flex items-center justify-between text-slate-600">
                                        <span className="font-bold flex items-center gap-1"><FileText size={10} /> e-Pass</span>
                                        <span className="font-mono bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">{event.ePassNo}</span>
                                    </div>
                                )}
                                {event.vehicleNo && (
                                    <div className="flex items-center justify-between text-slate-600">
                                        <span className="font-bold flex items-center gap-1"><Truck size={10} /> Vehicle</span>
                                        <span className="font-mono">{event.vehicleNo}</span>
                                    </div>
                                )}
                                {event.metadata.paymentStatus && (
                                    <div className="flex items-center justify-between text-slate-600">
                                        <span className="font-bold flex items-center gap-1"><CreditCard size={10} /> Payment</span>
                                        <span className={`font-bold px-1.5 rounded ${event.metadata.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {event.metadata.paymentStatus}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-50">
                        <p className="text-[9px] font-mono text-slate-300 break-all leading-tight">TX: {event.txHash}</p>
                    </div>
                    </div>
                </div>
                </div>
            ))}
            </div>
        </div>
      )}

      {activeTab === 'DOCS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {documents.length === 0 && (
                  <div className="col-span-2 p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
                      <FileText size={48} className="text-slate-300 mx-auto mb-4" />
                      <h3 className="text-slate-500 font-bold">No Financial Records Found</h3>
                      <p className="text-sm text-slate-400">This batch has not yet been associated with any invoices or e-way bills on the ledger.</p>
                  </div>
              )}
              
              {documents.map((event, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-6">
                          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                              <FileCheck size={24} />
                          </div>
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded uppercase tracking-wider">
                              {event.type} Record
                          </span>
                      </div>
                      
                      <div className="space-y-4">
                          {event.metadata?.gst && (
                              <div>
                                  <p className="text-xs text-slate-400 uppercase font-bold mb-1">Tax Invoice</p>
                                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                                      <span className="font-mono text-sm font-bold text-slate-700">{event.metadata.gst.invoiceNo}</span>
                                      <span className="text-xs font-bold text-slate-600">₹{event.metadata.gst.taxableValue + event.metadata.gst.taxAmount}</span>
                                  </div>
                              </div>
                          )}
                          
                          {event.metadata?.ewayBill && (
                              <div>
                                  <div className="flex justify-between items-center mb-1">
                                      <p className="text-xs text-slate-400 uppercase font-bold">Logistics Permit</p>
                                      <button 
                                          onClick={() => {
                                              const gst = event.metadata?.gst;
                                              const ewb = event.metadata?.ewayBill;
                                              setViewingDoc({
                                                  id: gst?.invoiceNo || 'EWB-VIEW',
                                                  date: event.timestamp,
                                                  from: { name: event.actorName, gln: event.actorGLN, address: event.location },
                                                  to: { name: event.metadata?.recipient || 'Unknown', gln: event.metadata?.recipientGLN || 'Unknown' },
                                                  items: [{
                                                      product: batch.productName,
                                                      batch: batch.batchID,
                                                      hsos: gst?.hsnCode || 'N/A',
                                                      qty: batch.quantity,
                                                      unit: batch.unit,
                                                      rate: gst ? gst.taxableValue / batch.quantity : 0,
                                                      amount: gst ? gst.taxableValue : 0
                                                  }],
                                                  tax: gst ? { rate: gst.taxRate, amount: gst.taxAmount } : undefined,
                                                  total: gst ? (gst.taxableValue + gst.taxAmount) : 0,
                                                  ewayBill: ewb,
                                                  remarks: 'E-Way Bill View'
                                              });
                                          }}
                                          className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded transition-colors"
                                      >
                                          <Printer size={12} />
                                          <span>View / Print</span>
                                      </button>
                                  </div>
                                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                                      <div className="flex items-center gap-2">
                                          <Truck size={16} className="text-slate-400" />
                                          <span className="font-mono text-sm font-bold text-slate-700">{event.metadata.ewayBill.ewbNo}</span>
                                      </div>
                                      <span className="text-xs font-bold text-slate-600">{event.metadata.ewayBill.distanceKm} KM</span>
                                  </div>
                              </div>
                          )}

                          <div className="grid grid-cols-2 gap-4 pt-2">
                              <div>
                                  <p className="text-[10px] text-slate-400 uppercase font-bold">Generated By</p>
                                  <p className="text-xs font-bold text-slate-700">{event.actorName}</p>
                                  <p className="text-[10px] text-slate-500 font-mono">{event.actorGLN}</p>
                              </div>
                              <div className="text-right">
                                  <p className="text-[10px] text-slate-400 uppercase font-bold">Date</p>
                                  <p className="text-xs font-bold text-slate-700">{new Date(event.timestamp).toLocaleDateString()}</p>
                              </div>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      )}

      {viewingDoc && (
        <PrintableInvoice 
            type="INVOICE" 
            data={viewingDoc} 
            onClose={() => setViewingDoc(null)} 
        />
      )}
    </div>
  );
};

export default TraceVisualizer;
