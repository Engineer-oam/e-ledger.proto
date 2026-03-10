import React, { useState } from 'react';
import { User, Sector } from '../types';
import { 
  LayoutDashboard, Truck, FileText, LogOut, Bot, ScanLine, Box, ShieldCheck, 
  Menu, X, Wallet, Settings, Stamp, Pill, Globe, ShoppingBag, Link as LinkIcon, Database, Activity
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import Logo from './Logo';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

const NavItem = ({ to, icon: Icon, label, active }: { to: string; icon: any; label: string; active: boolean }) => (
  <Link
    to={to}
    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    <Icon size={20} className={active ? 'animate-pulse' : ''} />
    <span className="font-semibold text-sm">{label}</span>
  </Link>
);

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl lg:shadow-none`}>
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-1 rounded-xl shadow-lg shadow-emerald-500/20">
              <Logo size="sm" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter uppercase">
                {user.sector === Sector.PHARMA ? 'Pharma Ledger India' : 'State Excise E-Ledger'}
              </h1>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{user.state ? `${user.state} ` : ''}{user.sector} HUB</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Network Panel" active={location.pathname === '/dashboard'} />
          <NavItem to="/batches" icon={Pill} label="Inventory" active={location.pathname === '/batches'} />
          <NavItem to="/stakeholders" icon={Globe} label="Stakeholders" active={location.pathname === '/stakeholders'} />
          <NavItem to="/blockchain" icon={LinkIcon} label="Chain Explorer" active={location.pathname === '/blockchain'} />
          <NavItem to="/financials" icon={Wallet} label="Sales & Tax" active={location.pathname === '/financials'} />
          <NavItem to="/verify" icon={ScanLine} label="Verify Authenticity" active={location.pathname === '/verify'} />
          <NavItem to="/assistant" icon={Bot} label="Audit AI" active={location.pathname === '/assistant'} />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Link to="/profile" className="flex items-center space-x-3 p-3 bg-slate-800/50 hover:bg-slate-800 rounded-2xl mb-4 border border-slate-700/50 transition-colors group cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white shadow-lg group-hover:scale-105 transition-transform">{user.name.charAt(0)}</div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate text-slate-200 group-hover:text-white">{user.name}</p>
              <p className="text-[10px] text-slate-500 uppercase font-black truncate group-hover:text-slate-400">{user.orgName}</p>
            </div>
          </Link>
          <button onClick={onLogout} className="w-full flex items-center space-x-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-xl transition-colors">
            <LogOut size={18} />
            <span className="text-sm font-bold">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsOpen(true)} className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight truncate">
              {location.pathname.replace('/', '').replace('-', ' ') || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center gap-4 md:gap-6">
             <div className="hidden sm:flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
               <Activity size={14} className="text-emerald-600" />
               <span className="text-[10px] font-black uppercase text-emerald-800">{user.sector === Sector.PHARMA ? 'Pharma Regulatory Compliance' : 'State Excise Compliance'}</span>
             </div>
             <div className="flex flex-col items-end">
               <span className="text-[10px] text-slate-400 font-black uppercase">License ID</span>
               <span className="text-xs font-mono font-bold text-slate-700">{user.gln}</span>
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;