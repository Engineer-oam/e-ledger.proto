
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { LedgerService } from '../services/ledgerService';
import { FileText, ArrowUpRight, ArrowDownLeft, RotateCcw, Printer, Filter, IndianRupee, Search } from 'lucide-react';
import PrintableInvoice from './PrintableInvoice';

interface FinancialRecordsProps {
  user: User;
}

interface Transaction {
  id: string; // Invoice No or Tx Hash
  date: string;
  type: 'INVOICE' | 'CREDIT_NOTE' | 'RECEIPT';
  product: string;
  batchID: string;
  partnerName: string;
  partnerGLN: string;
  amount: number;
  tax: number;
  status: 'PAID' | 'REFUNDED' | 'CREDIT';
  direction: 'IN' | 'OUT'; // Money flow direction
  remarks?: string;
  rawData: any; // For re-printing
}

const FinancialRecords: React.FC<FinancialRecordsProps> = ({ user }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'INVOICE' | 'CREDIT_NOTE' | 'RECEIPT'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [printData, setPrintData] = useState<any>(null);

  useEffect(() => {
    fetchFinancials();
  }, [user]);

  useEffect(() => {
    filterData();
  }, [transactions, filterType, searchTerm]);

  const fetchFinancials = async () => {
    setLoading(true);
    const batches = await LedgerService.getBatches(user);
    const txList: Transaction[] = [];

    batches.forEach(batch => {
      // Iterate through all events to find financial impact
      batch.trace.forEach(event => {
        const metadata = event.metadata || {};
        
        // 1. B2B SALES (Invoices)
        if (metadata.gst && metadata.gst.invoiceNo) {
          const isSender = event.actorGLN === user.gln;
          const isRecipient = metadata.recipientGLN === user.gln;

          if (isSender || isRecipient) {
            txList.push({
              id: metadata.gst.invoiceNo,
              date: metadata.gst.invoiceDate,
              type: 'INVOICE',
              product: batch.productName,
              batchID: batch.batchID,
              partnerName: isSender ? metadata.recipient : event.actorName,
              partnerGLN: isSender ? metadata.recipientGLN : event.actorGLN,
              amount: metadata.gst.taxableValue + metadata.gst.taxAmount,
              tax: metadata.gst.taxAmount,
              status: 'CREDIT', 
              direction: isSender ? 'IN' : 'OUT', // Sender gets money (IN)
              remarks: `GST Sale (${batch.quantity} ${batch.unit})`,
              rawData: { 
                  batch, event, gst: metadata.gst, 
                  to: { name: metadata.recipient, gln: metadata.recipientGLN },
                  from: { name: event.actorName, gln: event.actorGLN }
              }
            });
          }
        }

        // 2. RETURNS (Credit Notes)
        if (event.type === 'RETURN' && metadata.refundAmount) {
          const isReturner = event.actorGLN === user.gln; // I sent it back (Receive Refund IN)
          const isReceiver = metadata.returnTo === user.gln; // I received return (Pay Refund OUT)

          if (isReturner || isReceiver) {
            txList.push({
              id: metadata.creditNoteId || `CN-${event.eventID.slice(-6)}`,
              date: event.timestamp,
              type: 'CREDIT_NOTE',
              product: batch.productName,
              batchID: batch.batchID,
              partnerName: isReturner ? 'Supplier/Manufacturer' : event.actorName,
              partnerGLN: isReturner ? metadata.returnTo : event.actorGLN,
              amount: parseFloat(metadata.refundAmount),
              tax: 0,
              status: 'REFUNDED',
              direction: isReturner ? 'IN' : 'OUT', 
              remarks: `Return Reason: ${metadata.reason}. From: ${event.location}`,
              rawData: { 
                  batch, event, refund: metadata.refundAmount, 
                  to: { name: 'Supplier', gln: metadata.returnTo },
                  from: { name: event.actorName, gln: event.actorGLN }
              }
            });
          }
        }

        // 3. RETAIL SALES (Receipts)
        if (event.type === 'SALE' && metadata.amount && event.actorGLN === user.gln) {
           txList.push({
              id: metadata.receiptId || `RCPT-${event.eventID.slice(-6)}`,
              date: event.timestamp,
              type: 'RECEIPT',
              product: batch.productName,
              batchID: batch.batchID,
              partnerName: 'End Consumer',
              partnerGLN: 'N/A',
              amount: parseFloat(metadata.amount),
              tax: 0,
              status: metadata.paymentStatus || 'PAID',
              direction: 'IN', // Sales are Income
              remarks: `POS Sale - ${metadata.paymentMethod}`,
              rawData: { batch, event, amount: metadata.amount }
           });
        }
      });
    });

    // Sort by date desc
    txList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setTransactions(txList);
    setLoading(false);
  };

  const filterData = () => {
    let temp = transactions;
    if (filterType !== 'ALL') {
        temp = temp.filter(t => t.type === filterType);
    }
    if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        temp = temp.filter(t => 
            t.product.toLowerCase().includes(lowerSearch) ||
            t.id.toLowerCase().includes(lowerSearch) ||
            t.partnerName.toLowerCase().includes(lowerSearch)
        );
    }
    setFilteredTransactions(temp);
  };

  const handlePrint = (tx: Transaction) => {
    // Reconstruct data structure expected by PrintableInvoice
    let printData: any = {};

    if (tx.type === 'INVOICE') {
       const { gst, to, from, batch } = tx.rawData;
       printData = {
          id: tx.id,
          date: tx.date,
          from: from, 
          to: to,
          items: [{
             product: tx.product,
             batch: tx.batchID,
             hsos: gst.hsnCode,
             qty: batch.quantity,
             unit: batch.unit,
             rate: gst.taxableValue / batch.quantity,
             amount: gst.taxableValue
          }],
          tax: { rate: gst.taxRate, amount: gst.taxAmount },
          total: tx.amount,
          remarks: tx.remarks
       };
    } else if (tx.type === 'CREDIT_NOTE') {
        const { to, from, refund, event } = tx.rawData;
        printData = {
            id: tx.id,
            date: tx.date,
            from: from,
            to: to,
            items: [{
               product: tx.product,
               batch: tx.batchID,
               hsos: 'RETURN',
               qty: 1,
               unit: 'LOT',
               rate: refund,
               amount: refund
            }],
            tax: { rate: 0, amount: 0 },
            total: refund,
            remarks: `Returned from ${from.name} (${from.gln}). Reason: ${event.metadata.reason}`
        };
    } else {
        // Receipt
        const { amount, batch } = tx.rawData;
        printData = {
            id: tx.id,
            date: tx.date,
            from: { name: user.orgName, gln: user.gln },
            to: { name: 'Consumer', gln: 'N/A' },
            items: [{
               product: tx.product,
               batch: tx.batchID,
               hsos: 'POS',
               qty: batch.quantity,
               unit: batch.unit,
               rate: amount,
               amount: amount
            }],
            tax: { rate: 0, amount: 0 },
            total: amount,
            remarks: 'Thank you for shopping with us.'
        };
    }

    setPrintData(printData);
  };

  return (
    <div className="w-full">
      {printData && (
        <PrintableInvoice 
          type={printData.id.startsWith('CN') ? 'CREDIT_NOTE' : printData.id.startsWith('RCPT') ? 'RECEIPT' : 'INVOICE'}
          data={printData}
          onClose={() => setPrintData(null)}
        />
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Financial Transaction History</h2>
          <p className="text-slate-500 text-sm">Ledger of Invoices, Returns & Receipts</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
           {/* Search Bar */}
           <div className="relative">
               <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
               <input 
                 type="text" 
                 placeholder="Search products or IDs..." 
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
                 className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full"
               />
           </div>

           {/* Filter Tabs */}
           <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm overflow-x-auto">
             {['ALL', 'INVOICE', 'CREDIT_NOTE', 'RECEIPT'].map((f) => (
               <button
                 key={f}
                 onClick={() => setFilterType(f as any)}
                 className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
                   filterType === f ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:bg-slate-50'
                 }`}
               >
                 {f.replace('_', ' ')}S
               </button>
             ))}
           </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
           <div className="p-12 text-center text-slate-500">Scanning blockchain for financial events...</div>
        ) : (
           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">
                 <tr>
                   <th className="px-6 py-4">Date / Doc No</th>
                   <th className="px-6 py-4">Type</th>
                   <th className="px-6 py-4">Particulars</th>
                   <th className="px-6 py-4">Party Info</th>
                   <th className="px-6 py-4 text-right">Amount</th>
                   <th className="px-6 py-4 text-center">Action</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 text-sm">
                 {filteredTransactions.map((tx, idx) => (
                   <tr key={idx} className="hover:bg-slate-50">
                     <td className="px-6 py-4">
                       <p className="font-bold text-slate-700">{new Date(tx.date).toLocaleDateString()}</p>
                       <p className="font-mono text-xs text-slate-400">{tx.id}</p>
                     </td>
                     <td className="px-6 py-4">
                       <span className={`px-2 py-1 rounded text-xs font-bold ${
                         tx.type === 'INVOICE' ? 'bg-blue-100 text-blue-700' :
                         tx.type === 'CREDIT_NOTE' ? 'bg-orange-100 text-orange-700' :
                         'bg-emerald-100 text-emerald-700'
                       }`}>
                         {tx.type.replace('_', ' ')}
                       </span>
                     </td>
                     <td className="px-6 py-4">
                       <p className="font-medium text-slate-800">{tx.product}</p>
                       <p className="text-xs text-slate-500 truncate max-w-[200px]">{tx.remarks}</p>
                     </td>
                     <td className="px-6 py-4">
                       <div className="flex flex-col">
                         <span className="font-medium text-slate-700">{tx.partnerName}</span>
                         <span className="text-[10px] text-slate-400 font-mono">
                            {tx.type === 'CREDIT_NOTE' ? 'Returned From: ' : 'Party: '} 
                            {tx.partnerGLN}
                         </span>
                       </div>
                     </td>
                     <td className="px-6 py-4 text-right">
                        <div className={`font-bold text-lg flex items-center justify-end ${
                            tx.direction === 'IN' ? 'text-emerald-600' : 'text-slate-700'
                        }`}>
                            {tx.direction === 'IN' ? '+' : '-'} <IndianRupee size={14} className="mx-0.5" />
                            {tx.amount.toLocaleString()}
                        </div>
                        {tx.tax > 0 && <p className="text-[10px] text-slate-400">Incl. Tax: {tx.tax}</p>}
                     </td>
                     <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => handlePrint(tx)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Print Document"
                        >
                           <Printer size={18} />
                        </button>
                     </td>
                   </tr>
                 ))}
                 {filteredTransactions.length === 0 && (
                   <tr>
                     <td colSpan={6} className="p-8 text-center text-slate-400">
                       No records found matching your filters.
                     </td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>
        )}
      </div>
    </div>
  );
};

export default FinancialRecords;
