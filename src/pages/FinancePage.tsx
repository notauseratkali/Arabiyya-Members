import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Landmark, Clock, Receipt } from 'lucide-react';

interface FinancePageProps {
  onNavigate: (path: string) => void;
}

export const FinancePage: React.FC<FinancePageProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 shadow-2xs">
            <Landmark className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-darkblue tracking-tight">Finance</h1>
            <p className="text-xs text-gray-500 font-medium">
              View crew financial statements, expenditure reports, and budget allocations.
            </p>
          </div>
        </div>
      </div>

      {/* Blank / Placeholder State */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-12 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-100 shadow-xs">
            <Receipt className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-darkblue">Financial Records</h2>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Crew ledger statements, membership dues tracking, and financial accounts will be published here.
            </p>
          </div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-[11px] font-bold text-gray-600">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span>Coming Soon</span>
          </div>
        </div>
      </div>
    </div>
  );
};
