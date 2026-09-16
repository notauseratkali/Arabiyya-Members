import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { MemberApplication, ProfileUpdateRequest } from '../types';

interface ProfileUpdateDetailProps {
  request: ProfileUpdateRequest;
  currentMember: MemberApplication | undefined;
}

export const ProfileUpdateDetail: React.FC<ProfileUpdateDetailProps> = ({ request, currentMember }) => {
  const [expanded, setExpanded] = useState(false);

  if (!currentMember) {
    return <div className="text-xs text-red-500">Member details not found.</div>;
  }

  const { requestedChanges } = request;

  // Filter fields that actually changed
  const changedFields = Object.keys(requestedChanges).filter((key) => {
    const field = key as keyof typeof requestedChanges;
    const newValue = requestedChanges[field];
    const oldValue = currentMember[field as keyof MemberApplication];
    return newValue !== undefined && newValue !== oldValue;
  });

  if (changedFields.length === 0) {
    return <div className="text-xs text-gray-500 italic">No meaningful changes requested.</div>;
  }

  return (
    <div className="w-full">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs font-bold text-sky-700 flex items-center gap-1 hover:text-sky-800"
      >
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {expanded ? 'Hide Changes' : `View ${changedFields.length} Changes`}
      </button>

      {expanded && (
        <div className="mt-2 text-xs border-t border-gray-200 pt-2 space-y-2">
          {changedFields.map((key) => {
            const field = key as keyof typeof requestedChanges;
            const newValue = requestedChanges[field];
            const oldValue = currentMember[field as keyof MemberApplication];
            const fieldName = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());

            return (
              <div key={key} className="grid grid-cols-2 gap-2">
                <div className="text-gray-500 font-medium capitalize">
                  {fieldName}
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-gray-900 bg-gray-100 p-1 rounded">Old: {String(oldValue)}</div>
                  <div className="text-emerald-900 bg-emerald-50 p-1 rounded font-bold">New: {String(newValue)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
