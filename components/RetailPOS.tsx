import React, { useState, useEffect } from 'react';
import { User, Batch, BatchStatus } from '../types';
import { LedgerService } from '../services/ledgerService';
import { Store, Search, CheckCircle2, AlertTriangle, ShoppingCart, DollarSign, Package, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const RetailPOS: React.FC<{ user: User }> = ({ user }) => {
  const [scanId, setScanId] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [cart, setCart] = useState<Batch[]>([]);
  const [inventory, setInventory] = useState<Batch[]>([]);

  useEffect(() => {
    loadInventory();
  }, [user]);

  const loadInventory = async () => {
    const allBatches = await LedgerService.exportLedger();
    const myInventory = allBatches.filter(b => b.currentOwnerGLN === user.gln && b.status !== BatchStatus.SOLD);
    setInventory(myInventory);
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanId.trim()) return;

    setIsScanning(true);
    try {
      const batch = inventory.find(b => b.batchID === scanId.trim() || b.gtin === scanId.trim());
      
      if (!batch) {
        toast.error('Item not found in your inventory or already sold.');
      } else if (cart.find(item => item.batchID === batch.batchID)) {
        toast.warn('Item is already in the cart.');
      } else {
        setCart([...cart, batch]);
        setScanId('');
        toast.success('Item added to cart.');
      }
    } catch (err) {
      toast.error('Error scanning item.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleRemoveFromCart = (batchID: string) => {
    setCart(cart.filter(item => item.batchID !== batchID));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      for (const item of cart) {
        await LedgerService.sellBatch(item.batchID, user);
      }
      toast.success(`Successfully sold ${cart.length} item(s).`);
      setCart([]);
      loadInventory();
    } catch (err) {
      toast.error('Checkout failed. Please try again.');
    }
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.unitPrice || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Left Column: Scanner & Inventory */}
        <div className="flex-1 space-y-8">
          <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-5"><Store size={200} /></div>
            
            <div className="relative z-10">
              <h2 className="text-3xl font-black tracking-tight mb-2">Retail POS Dispensing</h2>
              <p className="text-slate-400 max-w-lg">
                Scan bottles to add them to the cart. Checkout will mark them as SOLD on the blockchain, preventing counterfeit reuse.
              </p>
            </div>

            <form onSubmit={handleScan} className="relative z-10 mt-8">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  autoFocus
                  className="block w-full pl-12 pr-32 py-4 bg-white/10 border border-white/20 rounded-2xl text-lg text-white placeholder-slate-400 focus:ring-4 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none font-mono"
                  placeholder="Scan GTIN or Batch ID..."
                  value={scanId}
                  onChange={(e) => setScanId(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={isScanning || !scanId.trim()}
                  className="absolute inset-y-2 right-2 px-6 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isScanning ? 'Scanning...' : 'Add'}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <Package className="text-indigo-600" />
              Available Inventory ({inventory.length})
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
              {inventory.map(item => (
                <div key={item.batchID} className="p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors flex justify-between items-center group">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{item.productName}</p>
                    <p className="text-[10px] font-mono text-slate-500 mt-1">{item.batchID}</p>
                  </div>
                  <button 
                    onClick={() => {
                      if (!cart.find(c => c.batchID === item.batchID)) {
                        setCart([...cart, item]);
                      }
                    }}
                    disabled={!!cart.find(c => c.batchID === item.batchID)}
                    className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cart.find(c => c.batchID === item.batchID) ? 'Added' : 'Add'}
                  </button>
                </div>
              ))}
              {inventory.length === 0 && (
                <div className="col-span-2 text-center py-8 text-slate-400">
                  <Package size={32} className="mx-auto mb-2 opacity-20" />
                  <p>No inventory available for sale.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Cart & Checkout */}
        <div className="w-full md:w-96 flex flex-col gap-6">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 flex flex-col h-full">
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
              <ShoppingCart className="text-emerald-600" />
              Current Sale
            </h3>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4 min-h-[300px]">
              {cart.map((item, index) => (
                <div key={item.batchID} className="flex justify-between items-start p-4 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 text-sm">{item.productName}</p>
                    <p className="text-[10px] font-mono text-slate-500 mt-1">{item.batchID}</p>
                    <p className="text-xs font-bold text-emerald-600 mt-2">₹{item.unitPrice || 0}</p>
                  </div>
                  <button 
                    onClick={() => handleRemoveFromCart(item.batchID)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              ))}
              
              {cart.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                  <ShoppingCart size={48} className="mb-4" />
                  <p className="text-sm font-bold">Cart is empty</p>
                  <p className="text-xs mt-1">Scan items to add them</p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Amount</span>
                <span className="text-3xl font-black text-slate-800 flex items-center">
                  ₹{totalAmount.toLocaleString()}
                </span>
              </div>
              
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black text-lg py-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={24} />
                Complete Sale
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RetailPOS;
