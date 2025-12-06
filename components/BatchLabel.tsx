import React from 'react';
import { Printer, ScanBarcode, ShieldCheck } from 'lucide-react';

interface BatchLabelProps {
  gtin: string;
  lot: string;
  expiry: string; 
  productName: string;
}

const BatchLabel: React.FC<BatchLabelProps> = ({ gtin, lot, expiry, productName }) => {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '000000';
    try {
      const d = new Date(dateStr);
      const yy = d.getFullYear().toString().slice(-2);
      const mm = (d.getMonth() + 1).toString().padStart(2, '0');
      const dd = d.getDate().toString().padStart(2, '0');
      return `${yy}${mm}${dd}`;
    } catch {
      return '000000';
    }
  };

  const expShort = formatDate(expiry);
  const gs1Text = `(01)${gtin || '00000000000000'}(17)${expShort}(10)${lot || '000'}`;
  const encodedText = encodeURIComponent(gs1Text);

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-200 border border-slate-400 p-2 w-full max-w-sm rounded shadow-sm relative overflow-hidden">
        {/* Hologram Effect Overlay */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-30 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-yellow-300/40 to-transparent rounded-bl-full pointer-events-none"></div>

        <div className="relative z-10 bg-white/90 border border-slate-300 p-3 rounded flex flex-col gap-2">
            
            {/* Header: State Excise */}
            <div className="flex justify-between items-center border-b border-slate-300 pb-2">
                 <div className="flex items-center gap-1.5">
                    <ShieldCheck size={18} className="text-indigo-800" />
                    <div>
                        <h4 className="font-black text-xs uppercase text-indigo-900 tracking-wider">State Excise</h4>
                        <p className="text-[8px] text-indigo-700 font-bold">DUTY PAID LIQUOR</p>
                    </div>
                 </div>
                 <div className="text-[8px] font-mono text-slate-500 text-right">
                    FOR SALE IN<br/>STATE ONLY
                 </div>
            </div>
            
            <div className="flex items-center gap-3">
                <div className="shrink-0 border border-slate-200 p-0.5 bg-white">
                    <img 
                        src={`https://bwipjs-api.metafloor.com/?bcid=datamatrix&text=${encodedText}&scale=2&includetext`}
                        alt="Excise QR"
                        className="w-20 h-20 object-contain"
                    />
                </div>

                <div className="flex-1 space-y-1">
                     <p className="text-xs font-bold text-slate-900 leading-tight">{productName || 'IMFL SPIRIT'}</p>
                     <p className="text-[10px] font-mono text-slate-600">GTIN: {gtin}</p>
                     <p className="text-[10px] font-mono text-slate-600">Batch: {lot}</p>
                     <p className="text-[10px] font-mono text-slate-600">Exp: {expShort}</p>
                </div>
            </div>
        </div>
        
        {/* Actions (Hidden in Print) */}
        <div className="mt-3 flex justify-between items-center print:hidden relative z-20">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Hologram Preview</span>
            <button 
                type="button"
                onClick={() => window.print()}
                className="text-indigo-600 hover:text-indigo-800 text-xs font-bold flex items-center gap-1.5 bg-indigo-50 px-3 py-1.5 rounded transition-colors"
            >
                <Printer size={14} /> 
                <span>Print</span>
            </button>
        </div>
    </div>
  );
};

export default BatchLabel;