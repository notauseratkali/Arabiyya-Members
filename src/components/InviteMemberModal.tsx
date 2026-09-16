import React, { useState } from 'react';
import { X, Mail, Loader2, CheckCircle2 } from 'lucide-react';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleInvite = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (!res.ok) throw new Error('Failed to send invitation.');
      setSuccess(true);
    } catch (err) {
      setError('Failed to send invitation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-darkblue">Invite Member</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X /></button>
        </div>
        
        {success ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <p className="text-gray-700">Invitation sent successfully to {email}.</p>
            <button onClick={onClose} className="mt-4 px-4 py-2 bg-darkblue text-white rounded-xl text-xs font-bold">Close</button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                placeholder="name@example.com"
              />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              onClick={handleInvite}
              disabled={submitting || !email}
              className="w-full px-4 py-2 bg-maroon text-white rounded-xl text-xs font-bold hover:bg-maroon/90 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Send Invite'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
