
import React, { useState, useEffect } from 'react';
import { User, UserRole, Sector, ProductionOrder, InventoryItem, SaleOrder } from '../types';
import { ERPService } from '../services/erpService';
import { 
  Factory, Package, ShoppingCart, TrendingUp, AlertCircle, 
  Settings, Database, CheckCircle2, FlaskConical, Wine, Leaf, 
  ShoppingCart as PosIcon, History, BarChart3, Clock, MapPin, 
  Warehouse, Truck, IndianRupee, Scan, X, Plus, Play, Check, Trash2
} from 'lucide-react';
import { toast } from 'react-toastify';

interface ERPModuleProps {
  user: User;
}

const ERPModule: React.FC<ERPModuleProps> = ({ user }) => {
  const [production, setProduction] = useState<ProductionOrder[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [sales, setSales] = useState<SaleOrder[]>([]);
  const [activeSubTab, setActiveSubTab] = useState('DASHBOARD');
  
  // Modal States
  const [showPOModal, setShowPOModal] = useState(false);
  const [showInvModal, setShowInvModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);

  const refreshData = () => {
    setProduction(ERPService.getProductionOrders(user));
    setInventory(ERPService.getInventory(user));
    setSales(ERPService.getSales(user));
  };

  useEffect(() => {
    refreshData();
  }, [user]);

  const handleStartProduction = (id: string) => {
    ERPService.updateProductionStatus(user, id, 'IN_PROGRESS');
    toast.info("Production run started on floor.");
    refreshData();
  };

  const handleCompleteProduction = (id: string, qty: number) => {
    ERPService.updateProductionStatus(user, id, 'COMPLETED', qty);
    toast.success("Batch production completed and logged.");
    refreshData();
  };

  const handleAdjustInventory = (sku: string, adj: number) => {
    ERPService.updateInventoryLevel(user, sku, adj);
    toast.success(`Inventory adjusted for ${sku}`);
    refreshData();
  };

  const renderManufacturerERP = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Live Production</p>
          <h4 className="text-2xl font-black text-slate-800">{production.filter(p => p.status === 'IN_PROGRESS').length} Orders</h4>
          <div className="mt-4 flex items-center gap-2 text-xs text-indigo-600 font-bold">
            <Clock size={14} />
            <span>Shift: Day Rotation A</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Quality Passes</p>
          <h4 className="text-2xl font-black text-emerald-600">98.4%</h4>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <span>Last 24 hours</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Efficiency (OEE)</p>
          <h4 className="text-2xl font-black text-blue-600">82%</h4>
          <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full w-[82%]"></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Factory size={20} className="text-indigo-600" />
            <span>Production Floor</span>
          </h3>
          <button 
            onClick={() => setShowPOModal(true)}
            className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            <Plus size={14} /> New Batch Run
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Yield (Plan/Act)</th>
                <th className="px-6 py-4">Sector Context</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {production.map(p => (
                <tr key={p.id} className="text-sm hover:bg-slate-50">
                  <td className="px-6 py-4 font-mono font-bold text-slate-600">{p.id}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">{p.productName}</td>
                  <td className="px-6 py-4">
                    <div className="text-xs">{p.actualQty} / {p.plannedQty}</div>
                    <div className="w-24 h-1 bg-slate-100 rounded-full mt-1">
                      <div className="bg-indigo-500 h-full" style={{width: `${(p.actualQty/p.plannedQty)*100}%`}}></div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(p.sectorSpecifics).map(([k, v]) => (
                        <span key={k} className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded font-mono uppercase text-slate-500">
                          {k}: {v}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {p.status === 'PENDING' && (
                      <button onClick={() => handleStartProduction(p.id)} className="text-indigo-600 hover:text-indigo-800 font-bold text-xs flex items-center justify-end gap-1 ml-auto">
                        <Play size={12} /> Start
                      </button>
                    )}
                    {p.status === 'IN_PROGRESS' && (
                      <button onClick={() => handleCompleteProduction(p.id, p.plannedQty)} className="text-emerald-600 hover:text-emerald-800 font-bold text-xs flex items-center justify-end gap-1 ml-auto">
                        <Check size={12} /> Finish
                      </button>
                    )}
                    {p.status === 'COMPLETED' && (
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Archive</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderDistributorERP = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Warehouse size={20} className="text-indigo-600" />
              <span>Inventory Management (FEFO)</span>
            </h3>
            <div className="flex gap-2">
               <button className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"><BarChart3 size={16} /></button>
               <button 
                onClick={() => setShowInvModal(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
               >
                 <Plus size={14} /> Stock Adjustment
               </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50">
                <tr>
                  <th className="px-6 py-4">SKU</th>
                  <th className="px-6 py-4">Item Name</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Adjust</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventory.map(item => (
                  <tr key={item.id} className="text-sm hover:bg-slate-50">
                    <td className="px-6 py-4 font-mono text-slate-500">{item.sku}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">{item.name}</td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${item.stockLevel < item.minLevel ? 'text-red-600' : 'text-slate-800'}`}>
                        {item.stockLevel} {item.unit}
                      </span>
                      {item.stockLevel < item.minLevel && <span className="ml-2 text-[10px] text-red-500 font-bold uppercase tracking-tighter">Low Stock</span>}
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2 text-xs text-slate-500">
                         <div className={`w-2 h-2 rounded-full ${item.stockLevel < item.minLevel ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                         {item.stockLevel < item.minLevel ? 'Replenish' : 'Optimized'}
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleAdjustInventory(item.sku, 10)} className="w-8 h-8 rounded border border-slate-200 hover:bg-indigo-50 text-indigo-600 font-bold transition-colors">+</button>
                        <button onClick={() => handleAdjustInventory(item.sku, -10)} className="w-8 h-8 rounded border border-slate-200 hover:bg-red-50 text-red-600 font-bold transition-colors">-</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="space-y-6">
           <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-900/20">
              <Truck size={32} className="mb-4 opacity-50" />
              <h4 className="text-xs font-bold uppercase opacity-80 mb-1">Today's Fulfillment</h4>
              <p className="text-3xl font-black">142</p>
              <p className="text-[10px] mt-2 opacity-60">Shipments out for delivery</p>
           </div>
           <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">Stock Heatmap</h4>
              <div className="space-y-4">
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600">Cold-Chain Storage</span>
                    <span className="font-bold text-emerald-600">Optimal</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600">Dry Storage</span>
                    <span className="font-bold text-amber-600">85% Full</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );

  const renderRetailerERP = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl border-2 border-slate-900 shadow-xl overflow-hidden flex flex-col min-h-[500px]">
           <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-xl">Smart POS</h3>
                <p className="text-xs text-slate-400">Blockchain-Verified Checkout</p>
              </div>
              <PosIcon size={28} />
           </div>
           <div className="p-8 flex-1 flex flex-col justify-center items-center text-center space-y-6">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center border-4 border-dashed border-slate-300 text-slate-400">
                <Scan size={40} />
              </div>
              <div>
                <p className="text-slate-500 text-sm max-w-[250px] mx-auto leading-relaxed">Scan the E-Ledger Secure Label to add items to the cart and verify authenticity in real-time.</p>
              </div>
              <button 
                onClick={() => setShowSaleModal(true)}
                className="w-full max-w-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-transform active:scale-95"
              >
                Create New Invoice
              </button>
           </div>
           <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <div className="flex gap-2">
                 <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">P</div>
                 <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">G</div>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">v2.1 Secured</span>
           </div>
        </div>

        <div className="space-y-6">
           <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                 <History size={18} className="text-slate-400" />
                 <span>Recent Sales Flow</span>
              </h3>
              <div className="space-y-4">
                 {sales.map(s => (
                   <div key={s.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                      <div>
                         <p className="font-bold text-sm text-slate-800">{s.customerName}</p>
                         <p className="text-[10px] text-slate-400 font-mono uppercase">{s.date.split('T')[0]} • {s.items[0]?.name || 'Misc Item'}</p>
                      </div>
                      <div className="text-right">
                         <p className="font-black text-slate-900 text-sm">₹{s.totalAmount.toLocaleString()}</p>
                         <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${s.syncStatus === 'SYNCED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                           {s.syncStatus}
                         </span>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl">
              <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                 <TrendingUp size={18} />
                 <span>Replenishment AI</span>
              </h4>
              <p className="text-xs text-indigo-700 leading-relaxed">
                Based on current velocity in {user.country}, you should re-order 4 cases of {user.sector === Sector.PHARMA ? 'Products' : 'Premium Spirits'} by Thursday to avoid stockouts.
              </p>
           </div>
        </div>
      </div>
    </div>
  );

  const renderInspectionERP = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Pending Requests</p>
          <h4 className="text-2xl font-black text-slate-800">12</h4>
          <div className="mt-4 flex items-center gap-2 text-xs text-indigo-600 font-bold">
            <Clock size={14} />
            <span>Avg Wait: 4h</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Certificates Issued</p>
          <h4 className="text-2xl font-black text-emerald-600">845</h4>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <span>This Month</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Revenue</p>
          <h4 className="text-2xl font-black text-blue-600">$12.4k</h4>
          <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full w-[65%]"></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Scan size={20} className="text-indigo-600" />
            <span>Inspection Queue</span>
          </h3>
          <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-2">
            <Plus size={14} /> New Audit
          </button>
        </div>
        <div className="p-12 text-center text-slate-400">
            <Scan size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-sm font-bold">No pending inspections in queue.</p>
            <p className="text-xs opacity-60">Connect to the Network Panel to receive requests.</p>
        </div>
      </div>
    </div>
  );

  const renderFinancierERP = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <IndianRupee size={20} className="text-emerald-600" />
                    <span>Trade Finance Exposure</span>
                </h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Letters of Credit (Active)</span>
                        <span className="font-bold text-slate-900">$4.2M</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Invoice Factoring</span>
                        <span className="font-bold text-slate-900">$1.8M</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
                        <div className="bg-emerald-500 h-full w-[45%]"></div>
                    </div>
                </div>
            </div>
            <div className="bg-indigo-900 text-white p-6 rounded-2xl shadow-xl">
                <h3 className="font-bold text-lg mb-2">Risk Assessment AI</h3>
                <p className="text-indigo-200 text-xs mb-6">Real-time credit scoring based on E-Ledger transaction history.</p>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-indigo-400 flex items-center justify-center font-bold text-sm">A+</div>
                    <div>
                        <p className="font-bold text-sm">Portfolio Health</p>
                        <p className="text-[10px] text-indigo-300">Updated 14m ago</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );

  return (
    <div className="w-full space-y-8 pb-20 relative">
      
      {/* Production Order Modal */}
      {showPOModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <h3 className="font-bold text-xl">Create Production Order</h3>
              <button onClick={() => setShowPOModal(false)}><X size={24} /></button>
            </div>
            <form className="p-6 space-y-4" onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as any;
              
              let sectorSpecifics = {};
              if (user.sector === Sector.EXCISE) {
                  sectorSpecifics = { abv: 42.8, vatId: form.context.value };
              } else if (user.sector === Sector.AGRICULTURE) {
                  sectorSpecifics = { harvestDate: new Date().toISOString(), farmId: form.context.value };
              } else if (user.sector === Sector.TEXTILE) {
                  sectorSpecifics = { fabricType: 'Cotton', batchId: form.context.value };
              } else {
                  sectorSpecifics = { temp: 'Standard', lotId: form.context.value };
              }

              ERPService.createProductionOrder(user, {
                productName: form.productName.value,
                plannedQty: parseInt(form.plannedQty.value),
                sectorSpecifics
              });
              toast.success("New production run scheduled.");
              setShowPOModal(false);
              refreshData();
            }}>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Product Name</label>
                <input name="productName" required className="w-full border p-3 rounded-xl outline-none focus:ring-2 ring-indigo-500" placeholder="e.g. Product Name" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Planned Quantity</label>
                <input name="plannedQty" type="number" required className="w-full border p-3 rounded-xl outline-none focus:ring-2 ring-indigo-500" placeholder="5000" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    {user.sector === Sector.EXCISE ? 'Vat ID' : 
                     user.sector === Sector.AGRICULTURE ? 'Farm ID' :
                     user.sector === Sector.TEXTILE ? 'Batch ID' : 'Lot Number'}
                </label>
                <input name="context" required className="w-full border p-3 rounded-xl outline-none focus:ring-2 ring-indigo-500 font-mono" placeholder="ID-123" />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg mt-4">Release to Floor</button>
            </form>
          </div>
        </div>
      )}

      {/* Sale / Invoice Modal */}
      {showSaleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <h3 className="font-bold text-xl">Create Direct Invoice</h3>
              <button onClick={() => setShowSaleModal(false)}><X size={24} /></button>
            </div>
            <form className="p-6 space-y-4" onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as any;
              ERPService.createSale(user, {
                customerName: form.cust.value,
                totalAmount: parseInt(form.amt.value),
                items: [{ name: 'Fulfillment Order', qty: 1, price: parseInt(form.amt.value) }]
              });
              toast.success("Internal invoice generated.");
              setShowSaleModal(false);
              refreshData();
            }}>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Customer / Party Name</label>
                <input name="cust" required className="w-full border p-3 rounded-xl outline-none focus:ring-2 ring-indigo-500" placeholder="ABC Enterprises" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Total Bill Value (₹)</label>
                <input name="amt" type="number" required className="w-full border p-3 rounded-xl outline-none focus:ring-2 ring-indigo-500 font-bold" placeholder="25000" />
              </div>
              <p className="text-[10px] text-slate-400 text-center italic">Note: This creates an internal ERP record. Use "Network Panel" to publish to Blockchain.</p>
              <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg mt-4">Finalize Billing</button>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <Database className="text-indigo-600" size={32} />
            <span>E-ERP Core <span className="text-slate-300 font-light">|</span> {user.sector}</span>
          </h2>
          <p className="text-sm text-slate-500 font-medium">Internal Enterprise Resource Planning for {user.positionLabel}</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
           <button 
             onClick={() => setActiveSubTab('DASHBOARD')}
             className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeSubTab === 'DASHBOARD' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
           >
             Overview
           </button>
           <button 
             onClick={() => setActiveSubTab('FINANCE')}
             className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeSubTab === 'FINANCE' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
           >
             Treasury
           </button>
           <button className="p-2 text-slate-400 hover:text-slate-600">
             <Settings size={18} />
           </button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-3 text-amber-800 shadow-sm">
        <AlertCircle size={20} className="shrink-0" />
        <p className="text-xs font-bold leading-tight uppercase tracking-tight">
          Manual ERP Mode: Internal state will be used to auto-populate Blockchain Events for {user.country} compliance.
        </p>
      </div>

      {activeSubTab === 'DASHBOARD' && (
        <>
          {user.role === UserRole.MANUFACTURER && renderManufacturerERP()}
          {user.role === UserRole.DISTRIBUTOR && renderDistributorERP()}
          {user.role === UserRole.RETAILER && renderRetailerERP()}
          {user.role === UserRole.INSPECTION_AGENCY && renderInspectionERP()}
          {user.role === UserRole.FINANCIER && renderFinancierERP()}
        </>
      )}

      {activeSubTab === 'FINANCE' && (
        <div className="bg-white rounded-3xl p-12 text-center border-4 border-dashed border-slate-100 min-h-[400px] flex flex-col justify-center items-center animate-in zoom-in-95 duration-500">
            <div className="p-4 bg-blue-50 rounded-full mb-6 text-blue-600">
               <IndianRupee size={48} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">Internal Treasury System</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto">Track internal accounts payable/receivable, payroll, and duty liabilities before they are committed to the public ledger.</p>
            <div className="mt-8 flex gap-4">
               <button className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-xl">Setup Ledgers</button>
               <button className="border border-slate-200 px-8 py-3 rounded-xl font-bold text-sm">Download Tax Forms</button>
            </div>
        </div>
      )}
    </div>
  );
};

export default ERPModule;
