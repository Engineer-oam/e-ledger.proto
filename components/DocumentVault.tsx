import React, { useState } from 'react';
import { FileText, Lock, ShieldCheck, Eye, Download, Hash, CheckCircle2 } from 'lucide-react';

interface Document {
  id: string;
  name: string;
  type: string;
  date: string;
  hash: string;
  status: 'ANCHORED' | 'PENDING' | 'VERIFIED';
  size: string;
}

const MOCK_DOCS: Document[] = [
  { id: 'DOC-001', name: 'Commercial Invoice #INV-2024-001', type: 'Invoice', date: '2024-10-15', hash: '0x8f2...a91', status: 'ANCHORED', size: '1.2 MB' },
  { id: 'DOC-002', name: 'Packing List #PL-882', type: 'Packing List', date: '2024-10-16', hash: '0x7b1...c22', status: 'ANCHORED', size: '0.8 MB' },
  { id: 'DOC-003', name: 'Certificate of Origin', type: 'Cert', date: '2024-10-17', hash: '0x3d4...f55', status: 'VERIFIED', size: '2.4 MB' },
];

const DocumentVault: React.FC = () => {
  const [docs] = useState<Document[]>(MOCK_DOCS);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <div>
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Lock size={20} className="text-indigo-600" />
                <span>Off-Chain Secure Vault</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">Documents stored securely off-chain. Only hashes are committed to the ledger.</p>
        </div>
        <div className="flex gap-2">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase flex items-center gap-1">
                <ShieldCheck size={12} /> AES-256 Encrypted
            </span>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50">
            <tr>
              <th className="px-6 py-4">Document Name</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Ledger Hash (Proof)</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {docs.map(doc => (
              <tr key={doc.id} className="text-sm hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <FileText size={18} />
                        </div>
                        <div>
                            <p className="font-bold text-slate-800">{doc.name}</p>
                            <p className="text-[10px] text-slate-400">{doc.size} • {doc.date}</p>
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4">
                    <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">{doc.type}</span>
                </td>
                <td className="px-6 py-4">
                    <div className="flex items-center gap-2 font-mono text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-200 w-fit">
                        <Hash size={12} />
                        {doc.hash}
                    </div>
                </td>
                <td className="px-6 py-4">
                    {doc.status === 'VERIFIED' ? (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                            <CheckCircle2 size={14} /> Verified
                        </span>
                    ) : (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-600">
                            <Lock size={14} /> Anchored
                        </span>
                    )}
                </td>
                <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                        <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="View Metadata">
                            <Eye size={16} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Download Secure Copy">
                            <Download size={16} />
                        </button>
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DocumentVault;
