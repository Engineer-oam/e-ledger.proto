

import { User, UserRole, Sector, ERPType } from '../types';
import { MOCK_USERS } from '../constants';

interface UserWithPassword extends User {
  password?: string;
}

const USERS_STORAGE_KEY = 'eledger_users';
const isRemote = () => localStorage.getItem('ELEDGER_USE_REMOTE') === 'true';
const API_URL = localStorage.getItem('ELEDGER_API_URL') || 'http://localhost:3001/api';

export const AuthService = {
  getUsersLocal: (): UserWithPassword[] => {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    if (!stored) {
      const initialUsers: UserWithPassword[] = MOCK_USERS.map(u => ({ ...u, password: 'password', erpType: ERPType.MANUAL, erpStatus: 'CONNECTED' }));
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initialUsers));
      return initialUsers;
    }
    return JSON.parse(stored);
  },

  login: async (gln: string, password: string): Promise<User | null> => {
    if (isRemote()) {
      try {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gln, password })
        });
        if (!res.ok) throw new Error('Invalid credentials');
        return await res.json();
      } catch (e) {
        throw new Error("Backend connection failed.");
      }
    }

    await new Promise(resolve => setTimeout(resolve, 600));
    const users = AuthService.getUsersLocal();
    const user = users.find(u => u.gln === gln.trim() && u.password === password.trim());
    
    if (user) {
      const { password: _, ...safeUser } = user;
      return safeUser;
    }
    return null;
  },

  signup: async (
    name: string, 
    orgName: string, 
    gln: string, 
    role: UserRole, 
    password: string,
    context: { 
      country: string, 
      state?: string,
      sector: Sector, 
      positionLabel: string, 
      erpType: ERPType, 
      erpStatus: any, 
      subCategories?: string[],
      drugLicenseNo?: string,
      pharmacistRegNo?: string,
      gstin?: string
    }
  ): Promise<User> => {
    if (isRemote()) {
      try {
        const res = await fetch(`${API_URL}/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, orgName, gln, role, password, ...context })
        });
        if (!res.ok) throw new Error('Signup failed');
        return await res.json();
      } catch (e) {
        throw new Error("Backend connection failed.");
      }
    }

    await new Promise(resolve => setTimeout(resolve, 800));
    const users = AuthService.getUsersLocal();
    if (users.find(u => u.gln === gln)) throw new Error('GLN already registered');
    
    const newUser: UserWithPassword = {
      id: `user-${Date.now()}`,
      name, 
      orgName, 
      gln, 
      role, 
      password,
      ...context
    };
    users.push(newUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    const { password: _, ...safeUser } = newUser;
    return safeUser;
  },

  getPublicProfile: async (gln: string): Promise<User | null> => {
    // Simulate lookup
    await new Promise(resolve => setTimeout(resolve, 600));
    const users = AuthService.getUsersLocal();
    const user = users.find(u => u.gln === gln);
    if (user) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...safeUser } = user;
        return safeUser;
    }
    return null;
  },

  generateGLN: (): string => '049' + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0') + '0',
  generateGTIN: (): string => '0' + Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0') + '0',
  generateSSCC: (gln: string): string => '1' + gln.substring(0,7) + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0') + '0',
  updateUser: async (data: any) => data,
  checkUser: async (gln: string) => {
    const users = AuthService.getUsersLocal();
    return !!users.find(u => u.gln === gln);
  },
  resetPassword: async (gln: string, p: string) => true
};