
import React from 'react';
import { Printer, ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';
import { BatchStatus } from '../types';

interface BatchLabelProps {
  gtin: string;
  lot: string;
  expiry: string; 
  productName: string;
  status?: string; 
  hidePrintButton?: boolean;
}

const BatchLabel: React.FC<BatchLabelProps> = ({ gtin, lot, expiry, productName, status, hidePrintButton = false }) => {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '00/0000';
    try {
      const d = new Date(dateStr);
      const mm = (d.getMonth() + 1).toString().padStart(2, '0');
      const yyyy = d.getFullYear().toString();
      return `${mm}/${yyyy}`;
    } catch {
      return '00/0000';
    }
  };

  const expDate = formatDate(expiry);
  const mfgDate = formatDate(new Date().toISOString()); // Simulated
  const gs1Text = `(01)${gtin || '00'}(17)${expDate.replace('/','')}(10)${lot || '000'}`;
  const encodedText = encodeURIComponent(gs1Text);

  // Indian Pharma Label Colors
  // Schedule H/H1 typically has a red line or box.
  
  return (
    <div className={`relative w-full max-w-sm bg-white border border-slate-300 shadow-md group print:border-black print:shadow-none overflow-hidden`}>
        
        <div className="flex">
            {/* The Red Line (Schedule H Warning) */}
            <div className="w-1.5 bg-red-600 h-auto shrink-0 print:bg-black"></div>
            
            <div className="flex-1 p-3 flex flex-col gap-2">
                
                {/* Warning Text */}
                <div className="border border-red-600 p-1.5 mb-1">
                    <p className="text-[7px] text-red-600 font-bold leading-tight text-justify">
                        <span className="font-black">REGULATED PRODUCT - CAUTION:</span> Not to be sold by retail without valid authorization or prescription where applicable.
                    </p>
                </div>

                {/* Header / Product */}
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="font-bold text-sm text-slate-900 uppercase leading-none">{productName || 'Generic Product 500'}</h4>
                        <p className="text-[9px] text-slate-500 font-medium mt-0.5">Standard Unit</p>
                    </div>
                    <div className="text-right">
                        <div className="border border-black p-0.5 inline-block bg-white">
                            <img 
                                src={`https://bwipjs-api.metafloor.com/?bcid=datamatrix&text=${encodedText}&scale=2&includetext`}
                                alt="GS1 QR"
                                className="w-12 h-12 object-contain"
                            />
                        </div>
                    </div>
                </div>

                {/* Batch Details (Side by Side) */}
                <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="text-[9px] font-mono text-slate-800 space-y-0.5 leading-tight">
                        <p><span className="font-bold">B.No.:</span> {lot}</p>
                        <p><span className="font-bold">Mfg.Dt:</span> {mfgDate}</p>
                        <p><span className="font-bold">Exp.Dt:</span> {expDate}</p>
                    </div>
                    <div className="text-[9px] font-mono text-slate-800 space-y-0.5 leading-tight">
                        <p><span className="font-bold">M.R.P.:</span> 125.00</p>
                        <p className="text-[8px] text-slate-500">(Incl. of all taxes)</p>
                        <p className="mt-1"><span className="font-bold">GTIN:</span> {gtin.slice(0,14)}</p>
                    </div>
                </div>

                {/* Manufacturer */}
                <div className="border-t border-slate-200 pt-1 mt-1">
                    <p className="text-[8px] text-slate-500">Manufactured by:</p>
                    <p className="text-[9px] font-bold text-slate-800">NATIONAL SUPPLY CORP</p>
                    <p className="text-[8px] text-slate-500">Industrial Zone, Sector 4</p>
                    <p className="text-[8px] text-slate-500 font-mono">Lic. No.: M/765/2023</p>
                </div>
            </div>
        </div>
        
        {/* Actions (Hidden in Print) */}
        {!hidePrintButton && (
            <div className="bg-slate-50 p-2 flex justify-between items-center print:hidden border-t border-slate-200">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck size={12} className="text-emerald-600" />
                    Authentic
                </span>
                <button 
                    type="button"
                    onClick={() => window.print()}
                    className="text-slate-600 hover:text-indigo-600 text-xs font-bold flex items-center gap-1.5 bg-white border border-slate-300 px-2 py-1 rounded shadow-sm hover:shadow transition-all"
                >
                    <Printer size={12} /> 
                    <span>Print</span>
                </button>
            </div>
        )}
    </div>
  );
};

export default BatchLabel;
