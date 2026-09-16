import React from 'react';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, BookOpen, Clock, Sparkles } from 'lucide-react';

interface CoursesPageProps {
  onNavigate: (path: string) => void;
}

export const CoursesPage: React.FC<CoursesPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-darkblue flex items-center justify-center border border-sky-100 shadow-2xs">
            <GraduationCap className="w-5 h-5 text-darkblue" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-darkblue tracking-tight">Courses</h1>
            <p className="text-xs text-gray-500 font-medium">
              Explore scout training modules, skill workshops, and leadership certifications.
            </p>
          </div>
        </div>
      </div>

      {/* Blank / Placeholder State */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-12 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 text-darkblue flex items-center justify-center mx-auto border border-sky-100 shadow-xs">
            <BookOpen className="w-8 h-8 text-darkblue" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-darkblue">No Courses Published Yet</h2>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Course modules and training curricula are currently being prepared. Check back soon for upcoming sessions.
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
