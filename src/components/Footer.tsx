import React from 'react';
import { LogoImage } from './LogoImage';

interface FooterProps {
  onNavigate?: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = () => {
  return (
    <footer className="bg-slate-900 text-gray-400 py-6 mt-auto border-t border-slate-800 text-xs text-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-1">
        <div className="flex items-center justify-center space-x-2">
          <LogoImage className="w-5 h-5 object-contain" />
          <span className="font-bold text-white">Arabiyya Members</span>
          <span className="text-slate-600">•</span>
          <span className="text-gray-300 font-semibold">Arabiyya Rover Network</span>
        </div>
        <div className="text-[11px] text-gray-500">
          © 2006 - {new Date().getFullYear()} Arabiyya Rover Network. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
};
