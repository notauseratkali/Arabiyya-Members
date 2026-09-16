import React from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpenCheck, Clock, Layers, ShieldCheck } from 'lucide-react';

interface SyllabusPageProps {
  onNavigate: (path: string) => void;
}

export const SyllabusPage: React.FC<SyllabusPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const isSecretary = user?.role === 'Secretary' || user?.isAdmin;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100 shadow-2xs">
            <BookOpenCheck className="w-5 h-5 text-purple-700" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black text-darkblue tracking-tight">Syllabus</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                Admin Tool
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium">
              Manage training syllabus schemes, section milestones, and qualification criteria.
            </p>
          </div>
        </div>
      </div>

      {/* Blank / Placeholder State */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-12 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center mx-auto border border-purple-100 shadow-xs">
            <Layers className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-darkblue">Syllabus Management</h2>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Official section syllabuses, badge curriculum schemas, and requirement structures can be configured here.
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
