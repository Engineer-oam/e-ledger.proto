import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { 
  LayoutDashboard, 
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

const NavItem = ({ to, icon: Icon, label, active, onClick }: { to: string; icon: any; label: string; active: boolean; onClick?: () => void }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
      active 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    <Icon size={20} className={`shrink-0 ${active ? 'animate-pulse' : ''}`} />
    <span className="font-medium">{label}</span>
  </Link>
);

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close menu when route changes (fallback)
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  // Role Checks
  const isAuthority = user.role === UserRole.REGULATOR || user.role === UserRole.AUDITOR;
  const isDistillery = user.role === UserRole.MANUFACTURER;
  const isWarehouse = user.role === UserRole.DISTRIBUTOR;
  
  return (
    <div className="flex h-[100dvh] bg-slate-50 overflow-hidden">
      
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/80 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white flex flex-col shadow-2xl transition-transform duration-300 ease-out border-r border-slate-800
        lg:translate-x-0 lg:static lg:inset-auto
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex items-center justify-between border-b border-slate-800/50 bg-slate-900">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
              <Stamp size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">ExciseLedger</h1>
              <p className="text-[10px] font-medium text-indigo-400 uppercase tracking-wider">Govt of State Excise</p>
            </div>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)} 
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Control Dashboard" active={location.pathname === '/dashboard'} onClick={handleNavClick} />
          <NavItem to="/batches" icon={Wine} label="Spirits Inventory" active={location.pathname === '/batches'} onClick={handleNavClick} />
          
          {!isAuthority && (
            <NavItem to="/transfers" icon={Truck} label="Logistics & Permits" active={location.pathname === '/transfers'} onClick={handleNavClick} />
          )}

          <NavItem to="/financials" icon={Wallet} label="Duty & Tax Logs" active={location.pathname === '/financials'} onClick={handleNavClick} />

          {!isAuthority && (
            <NavItem to="/vrs" icon={ShieldCheck} label="Returns / Seizures" active={location.pathname === '/vrs'} onClick={handleNavClick} />
          )}

          {(isDistillery || isWarehouse) && (
            <NavItem to="/sscc" icon={Box} label="Palletization" active={location.pathname === '/sscc'} onClick={handleNavClick} />
          )}
          
          <NavItem to="/network" icon={Building2} label="License Directory" active={location.pathname === '/network'} onClick={handleNavClick} />

          {isAuthority && (
            <NavItem to="/reports" icon={FileText} label="Enforcement Reports" active={location.pathname === '/reports'} onClick={handleNavClick} />
          )}

          <NavItem to="/verify" icon={ScanLine} label="Verify Hologram" active={location.pathname === '/verify'} onClick={handleNavClick} />
          <NavItem to="/assistant" icon={Bot} label="Audit Assistant" active={location.pathname === '/assistant'} onClick={handleNavClick} />
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <Link to="/settings" className="block group mb-2" onClick={handleNavClick}>
             <div className="flex items-center space-x-3 px-4 py-2 text-slate-400 hover:text-white transition-colors">
               <Settings size={18} />
               <span className="text-sm font-medium">System Config</span>
             </div>
          </Link>
          
          <Link to="/profile" className="block group" onClick={handleNavClick}>
            <div className="flex items-center space-x-3 px-4 py-3 mb-2 bg-slate-800 rounded-xl border border-slate-700 group-hover:bg-slate-700/80 transition-all">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shrink-0 shadow-md">
                {user.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold truncate text-white group-hover:text-indigo-200 transition-colors">{user.name}</p>
                <p className="text-[10px] text-slate-400 truncate uppercase tracking-wide">
                  {user.role === 'MANUFACTURER' ? 'Distillery' : 
                   user.role === 'REGULATOR' ? 'Excise Officer' : 
                   user.role === 'DISTRIBUTOR' ? 'Bonded Warehouse' : user.role}
                </p>
              </div>
            </div>
          </Link>
          <button 
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-2 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Secure Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden w-full relative bg-slate-50">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shadow-sm shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-bold text-slate-800 capitalize truncate flex items-center gap-2">
              {location.pathname === '/dashboard' && <LayoutDashboard size={20} className="text-indigo-600"/>}
              {location.pathname.replace('/', '') || 'Dashboard'}
            </h2>
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-4">
             <div className="hidden sm:flex flex-col items-end">
               <span className="text-[10px] text-slate-400 font-bold uppercase">License ID</span>
               <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{user.gln}</span>
             </div>
             
             <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-100">
               <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
               </span>
               <span className="hidden md:inline text-xs font-bold uppercase tracking-wide">Mainnet</span>
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;