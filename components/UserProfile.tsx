
import React, { useState } from 'react';
import { User } from '../types';
import { AuthService } from '../services/authService';
import { UserCircle, Building2, MapPin, Shield, Save, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

interface UserProfileProps {
  user: User;
  onUpdate: (user: User) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    orgName: user.orgName
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updatedUser = await AuthService.updateUser({
        id: user.id,
        name: formData.name,
        orgName: formData.orgName
      });
      onUpdate(updatedUser);
      toast.success('Profile updated successfully.');
    } catch (error) {
      toast.error('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">User Profile</h2>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header / Banner */}
        <div className="bg-slate-900 p-8 text-white flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-3xl font-bold shrink-0">
            {user.name.charAt(0)}
          </div>
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-bold">{user.name}</h3>
            <div className="flex items-center justify-center md:justify-start space-x-2 text-slate-400 mt-1">
              <Shield size={16} />
              <span className="text-sm font-medium">{user.role}</span>
            </div>
          </div>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Read Only Fields */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">GLN (Identity)</label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    disabled
                    value={user.gln}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 font-mono text-sm cursor-not-allowed"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Global Location Number cannot be changed.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Role</label>
                <div className="relative">
                  <Shield size={18} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    disabled
                    value={user.role}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-sm cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Editable Fields */}
              <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                <h4 className="text-sm font-semibold text-slate-800 mb-4">Editable Information</h4>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Full Name</label>
                <div className="relative">
                  <UserCircle size={18} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Organization Name</label>
                <div className="relative">
                  <Building2 size={18} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    name="orgName"
                    value={formData.orgName}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-70 shadow-sm"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
