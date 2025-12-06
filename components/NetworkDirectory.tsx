
import React, { useState } from 'react';
import { MOCK_USERS } from '../constants';
import { UserRole } from '../types';
import { Search, Building2, MapPin, BadgeCheck, Shield } from 'lucide-react';

const NetworkDirectory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Using Mock Data from Constants, but in a real app this hits the Identity Service
  const filteredUsers = MOCK_USERS.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.orgName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.gln.includes(searchTerm)
  );

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
             <Building2 className="text-blue-600" />
             <span>Authorized Trading Partners (ATP)</span>
           </h2>
           <p className="text-slate-500 text-sm mt-1">Network Directory of verified GLNs and licenses.</p>
        </div>
        <div className="relative w-full md:w-96">
           <Search className="absolute left-3 top-3 text-slate-400" size={18} />
           <input 
             type="text" 
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
             className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
             placeholder="Search by Name, Org, or GLN..."
           />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {filteredUsers.map(user => (
          <div key={user.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:border-blue-300 transition-colors flex items-start space-x-4">
             <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 shrink-0">
               {user.role === UserRole.MANUFACTURER ? <Building2 size={24} /> : 
                user.role === UserRole.REGULATOR ? <Shield size={24} /> : <BadgeCheck size={24} />}
             </div>
             <div className="flex-1">
               <div className="flex justify-between items-start">
                 <div>
                   <h3 className="font-bold text-slate-800">{user.orgName}</h3>
                   <p className="text-sm text-slate-500">{user.name}</p>
                 </div>
                 <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide shrink-0">
                   Verified ATP
                 </span>
               </div>
               
               <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                 <div className="bg-slate-50 px-2 py-1.5 rounded border border-slate-100 overflow-hidden">
                   <span className="text-xs text-slate-400 block uppercase">Role</span>
                   <span className="font-medium text-slate-700 truncate block">{user.role}</span>
                 </div>
                 <div className="bg-slate-50 px-2 py-1.5 rounded border border-slate-100 overflow-hidden">
                   <span className="text-xs text-slate-400 block uppercase">GLN</span>
                   <span className="font-mono font-medium text-slate-700 truncate block">{user.gln}</span>
                 </div>
               </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NetworkDirectory;
