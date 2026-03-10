
import React, { useEffect, useRef } from 'react';
import { X, Camera } from 'lucide-react';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const scannerRef = useRef<any>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    // Check if library is loaded globally
    // @ts-ignore
    if (!window.Html5QrcodeScanner) {
      console.error("Html5QrcodeScanner library not found");
      return;
    }

    const startScanner = () => {
      try {
        // @ts-ignore
        const scanner = new window.Html5QrcodeScanner(
          "qr-reader",
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true,
            rememberLastUsedCamera: true
          },
          false // verbose
        );
        
        scannerRef.current = scanner;

        scanner.render((decodedText: string) => {
          if (isMounted.current) {
            onScan(decodedText);
            // Attempt to clear, but wrap in try-catch as it might fail if already clearing
            try {
              if (scannerRef.current) {
                scannerRef.current.clear().catch((err: any) => console.warn("Scanner clear warning:", err));
              }
            } catch (e) {
               // ignore
            }
          }
        }, (error: any) => {
          // ignore scanning errors (happens every frame if no QR found)
        });
      } catch (err) {
        console.error("Scanner initialization failed:", err);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(startScanner, 100);

    return () => {
      isMounted.current = false;
      clearTimeout(timer);
      if (scannerRef.current) {
        try {
           scannerRef.current.clear().catch((e: any) => console.log("Scanner cleanup", e));
        } catch (e) {
           // ignore cleanup errors
        }
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-300 ring-1 ring-white/10">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
           <h3 className="font-bold text-slate-800 flex items-center gap-2">
             <Camera size={20} className="text-indigo-600" />
             <span>Scan Security QR</span>
           </h3>
           <button 
             onClick={onClose}
             className="p-2 bg-white hover:bg-slate-100 rounded-full text-slate-500 transition-colors border border-slate-200"
           >
             <X size={20} />
           </button>
        </div>
        
        <div className="p-0 bg-black relative min-h-[320px] flex items-center justify-center">
           <div id="qr-reader" className="w-full h-full"></div>
        </div>

        <div className="p-4 text-center bg-slate-50 text-xs text-slate-500 border-t border-slate-100">
          <p className="font-semibold text-slate-700">Official Scanner</p>
          <p>Align the 2D DataMatrix or Hologram QR within the box.</p>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
