import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { 
  LayoutDashboard, 
  Package, 
  Truck, 
  FileText, 
  LogOut, 
  Bot,
  Activity,
  ScanLine,
  Box,
  ShieldCheck,
  Building2,
  Menu,
  X,
  Wallet,
  Settings,
  Wine,
  Stamp
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

const NavItem = ({ to, icon: Icon, label, active }: { to: string; icon: any; label: string; active: boolean }) => (
  <Link
    to={to}
    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
      active 
        ? 'bg-indigo-600 text-white shadow-md' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    <Icon size={20} className="shrink-0" />
    <span className="font-medium">{label}</span>
  </Link>
);

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Role Checks
  const isAuthority = user.role === UserRole.REGULATOR || user.role === UserRole.AUDITOR;
  const isDistillery = user.role === UserRole.MANUFACTURER;
  const isWarehouse = user.role === UserRole.DISTRIBUTOR;
  
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-auto
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-500 p-2 rounded-lg">
              <Stamp size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">ExciseLedger</h1>
              <p className="text-xs text-slate-400">State Excise Chain</p>
            </div>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)} 
            className="lg:hidden text-slate-400 hover:text-white p-1"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Control Dashboard" active={location.pathname === '/dashboard'} />
          <NavItem to="/batches" icon={Wine} label="Spirits Inventory" active={location.pathname === '/batches'} />
          
          {!isAuthority && (
            <NavItem to="/transfers" icon={Truck} label="Logistics & Permits" active={location.pathname === '/transfers'} />
          )}

          <NavItem to="/financials" icon={Wallet} label="Duty & Tax Logs" active={location.pathname === '/financials'} />

          {!isAuthority && (
            <NavItem to="/vrs" icon={ShieldCheck} label="Returns / Seizures" active={location.pathname === '/vrs'} />
          )}

          {(isDistillery || isWarehouse) && (
            <NavItem to="/sscc" icon={Box} label="Palletization" active={location.pathname === '/sscc'} />
          )}
          
          <NavItem to="/network" icon={Building2} label="License Directory" active={location.pathname === '/network'} />

          {isAuthority && (
            <NavItem to="/reports" icon={FileText} label="Enforcement Reports" active={location.pathname === '/reports'} />
          )}

          <NavItem to="/verify" icon={ScanLine} label="Verify Hologram" active={location.pathname === '/verify'} />
          <NavItem to="/assistant" icon={Bot} label="Audit Assistant" active={location.pathname === '/assistant'} />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Link to="/settings" className="block group mb-2">
             <div className="flex items-center space-x-3 px-4 py-2 text-slate-400 hover:text-white transition-colors">
               <Settings size={18} />
               <span className="text-sm">Node Settings</span>
             </div>
          </Link>
          
          <Link to="/profile" className="block group">
            <div className="flex items-center space-x-3 px-4 py-3 mb-2 bg-slate-800 rounded-lg group-hover:bg-slate-700 transition-colors">
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white shrink-0">
                {user.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate text-white">{user.name}</p>
                <p className="text-xs text-slate-400 truncate">
                  {user.role === 'MANUFACTURER' ? 'Distillery' : 
                   user.role === 'REGULATOR' ? 'Excise Officer' : 
                   user.role === 'DISTRIBUTOR' ? 'Bonded Warehouse' : user.role}
                </p>
              </div>
            </div>
          </Link>
          <button 
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-2 text-slate-400 hover:text-red-400 transition-colors"
          >
            <LogOut size={18} />
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden w-full relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shadow-sm shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-semibold text-slate-700 capitalize truncate">
              {location.pathname.replace('/', '') || 'Dashboard'}
            </h2>
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-4">
             <span className="hidden sm:inline-block text-xs font-mono bg-slate-100 text-slate-500 px-2 py-1 rounded border border-slate-200">
               License/GLN: {user.gln}
             </span>
             <span className="hidden md:inline-block text-xs font-mono bg-indigo-50 text-indigo-600 px-2 py-1 rounded border border-indigo-200">
               Govt Node: Connected
             </span>
             <span className="md:hidden w-3 h-3 bg-green-500 rounded-full border border-white shadow-sm" title="Connected"></span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;