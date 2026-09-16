import React from 'react';
import { Award, Sparkles, X, CheckCircle2 } from 'lucide-react';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  awardName: string;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({ isOpen, onClose, awardName }) => {
  if (!isOpen) return null;

  const displayAward = awardName.includes('President Scout') 
    ? 'President Scout Award' 
    : awardName;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-amber-200 p-6 text-center animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 border-2 border-amber-400 flex items-center justify-center text-amber-600 shadow-inner">
          <Award className="w-9 h-9" />
        </div>

        <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-50 text-amber-800 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border border-amber-200">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Award Achievement Recognized</span>
        </div>

        <p className="text-base font-semibold text-darkblue leading-relaxed my-4">
          Congratulations! Holding the <strong className="text-maroon font-bold">{displayAward}</strong> reflects extraordinary dedication and leadership.
        </p>

        <button
          onClick={onClose}
          className="w-full py-3 px-4 bg-maroon hover:bg-[#660000] text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center space-x-2 mt-2"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>Continue Application</span>
        </button>
      </div>
    </div>
  );
};
