import React from 'react';
import { User, UserRole } from '../types';
import ManufacturerDashboard from './dashboards/ManufacturerDashboard';
import RegulatorDashboard from './dashboards/RegulatorDashboard';
import DistributorDashboard from './dashboards/DistributorDashboard';
import RetailerDashboard from './dashboards/RetailerDashboard';
import { ShieldQuestion } from 'lucide-react';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  switch (user.role) {
    case UserRole.MANUFACTURER:
    case UserRole.EXPORTER:
    case UserRole.DISTILLERY:
    case UserRole.BREWERY:
      return <ManufacturerDashboard user={user} />;
    
    case UserRole.DISTRIBUTOR:
    case UserRole.IMPORTER:
    case UserRole.LOGISTICS_PROVIDER:
    case UserRole.WHOLESALER:
      return <DistributorDashboard user={user} />;
    
    case UserRole.RETAILER:
    case UserRole.RETAIL_VEND:
    case UserRole.BAR_RESTAURANT:
      return <RetailerDashboard user={user} />;
    
    case UserRole.REGULATOR:
    case UserRole.AUDITOR:
    case UserRole.CUSTOMS_OFFICIAL:
    case UserRole.PORT_OPERATOR:
    case UserRole.SYSTEM_ADMIN:
    case UserRole.STATE_EXCISE_COMMISSIONER:
    case UserRole.DISTRICT_EXCISE_OFFICER:
      return <RegulatorDashboard user={user} />;
      
    default:
      return (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center p-8 bg-white rounded-3xl border border-slate-200 shadow-sm m-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-slate-50 p-6 rounded-full mb-6 shadow-inner">
            <ShieldQuestion size={64} className="text-slate-300" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Unrecognized Role</h2>
          <p className="text-slate-500 mt-3 max-w-md text-lg leading-relaxed">
            The system cannot provision a dashboard for <span className="font-mono font-bold bg-slate-100 px-2 py-1 rounded text-slate-700 text-base">{user.role}</span>.
          </p>
          <p className="text-xs font-bold text-slate-400 mt-8 uppercase tracking-widest">
            Contact Network Administrator
          </p>
        </div>
      );
  }
};

export default Dashboard;