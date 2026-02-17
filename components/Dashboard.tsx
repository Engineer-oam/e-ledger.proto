import React from 'react';
import { User, UserRole } from '../types';
import ManufacturerDashboard from './dashboards/ManufacturerDashboard';
import RegulatorDashboard from './dashboards/RegulatorDashboard';
import DistributorDashboard from './DistributorDashboard';
import RetailerDashboard from './RetailerDashboard';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  // Role-Based Routing
  if (user.role === UserRole.MANUFACTURER) {
    return <ManufacturerDashboard user={user} />;
  }
  
  if (user.role === UserRole.REGULATOR || user.role === UserRole.AUDITOR) {
    return <RegulatorDashboard user={user} />;
  }

  if (user.role === UserRole.DISTRIBUTOR) {
    return <DistributorDashboard user={user} />;
  }

  if (user.role === UserRole.RETAILER) {
    return <RetailerDashboard user={user} />;
  }

  // Fallback for unknown roles (e.g. basic view)
  return (
    <div className="p-8 text-center">
      <h2 className="text-2xl font-bold text-slate-800">Welcome, {user.name}</h2>
      <p className="text-slate-500">Your role dashboard is being provisioned.</p>
    </div>
  );
};

export default Dashboard;