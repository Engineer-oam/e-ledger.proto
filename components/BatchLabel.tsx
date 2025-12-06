
import React from 'react';
import { Printer, ShieldCheck } from 'lucide-react';

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
  const gs1Text = `(01)${gtin || '00'}(17)${expShort}(10)${lot || '000'}`;
  const encodedText = encodeURIComponent(gs1Text);

  return (
    <div className="relative w-full max-w-sm rounded-lg overflow-hidden border border-slate-300 shadow-md group print:border-black print:shadow-none">
        
        {/* Holographic Overlay Layer (CSS Simulation) */}
        <div className="absolute inset-0 z-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" style={{
            background: 'linear-gradient(135deg, rgba(255,0,0,0.1) 0%, rgba(0,255,0,0.1) 50%, rgba(0,0,255,0.1) 100%)',
            mixBlendMode: 'color-dodge'
        }}></div>
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        
        {/* Security Strip */}
        <div className="absolute top-0 right-4 w-2 h-full bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-300 opacity-60 z-10 print:opacity-30"></div>

        <div className="relative z-10 bg-white/90 p-3 flex flex-col gap-2">
            
            {/* Header: State Excise */}
            <div className="flex justify-between items-center border-b-2 border-slate-800 pb-2">
                 <div className="flex items-center gap-1.5">
                    <div className="p-1 bg-indigo-900 rounded-full">
                        <ShieldCheck size={14} className="text-white" />
                    </div>
                    <div>
                        <h4 className="font-black text-xs uppercase text-indigo-900 tracking-wider">State Excise</h4>
                        <p className="text-[8px] text-indigo-700 font-bold tracking-tight">GOVERNMENT OF INDIA</p>
                    </div>
                 </div>
                 <div className="text-[9px] font-bold font-mono text-slate-800 text-right leading-tight">
                    DUTY PAID<br/>NOT FOR SALE<br/>OUTSIDE STATE
                 </div>
            </div>
            
            <div className="flex items-center gap-3">
                {/* 2D Data Matrix */}
                <div className="shrink-0 border-2 border-black p-0.5 bg-white relative">
                    <img 
                        src={`https://bwipjs-api.metafloor.com/?bcid=datamatrix&text=${encodedText}&scale=2&includetext`}
                        alt="Excise QR"
                        className="w-20 h-20 object-contain"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>

                <div className="flex-1 space-y-1">
                     <p className="text-xs font-black text-slate-900 leading-tight uppercase">{productName || 'IMFL SPIRIT'}</p>
                     <div className="grid grid-cols-2 gap-1 text-[9px] font-mono text-slate-600">
                         <div>
                             <span className="block text-[7px] text-slate-400">GTIN</span>
                             <span className="font-bold text-slate-900">{gtin}</span>
                         </div>
                         <div>
                             <span className="block text-[7px] text-slate-400">BATCH</span>
                             <span className="font-bold text-slate-900">{lot}</span>
                         </div>
                     </div>
                     <div className="bg-slate-100 px-1 py-0.5 border border-slate-200 rounded text-[8px] text-center font-bold tracking-widest text-slate-500 truncate">
                         {encodedText.slice(0, 20)}...
                     </div>
                </div>
            </div>
        </div>
        
        {/* Actions (Hidden in Print) */}
        <div className="bg-slate-50 p-2 flex justify-between items-center print:hidden border-t border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                Secure Hologram
            </span>
            <button 
                type="button"
                onClick={() => window.print()}
                className="text-indigo-600 hover:text-indigo-800 text-xs font-bold flex items-center gap-1.5 bg-white border border-indigo-200 px-3 py-1 rounded shadow-sm hover:shadow transition-all"
            >
                <Printer size={14} /> 
                <span>Print Label</span>
            </button>
        </div>
    </div>
  );
};

export default BatchLabel;
