import React, { useState } from 'react';
import { X, UserPlus, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { AwardGoal, ProgressionLevel, RoleSection } from '../types';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  // 22 Tracked Fields
  const [fullName, setFullName] = useState('');
  const [commonName, setCommonName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('scout123');
  const [idCardNumber, setIdCardNumber] = useState('');
  const [dob, setDob] = useState('2006-01-01');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [role, setRole] = useState<RoleSection>('Rover');
  const [awardGoal, setAwardGoal] = useState<AwardGoal>('President Scout Award');
  const [level, setLevel] = useState<ProgressionLevel>('Square');

  const [permAddress, setPermAddress] = useState('');
  const [permCity, setPermCity] = useState('');
  const [permState, setPermState] = useState('');
  const [permCountry, setPermCountry] = useState('Maldives');

  const [sameAsPerm, setSameAsPerm] = useState(false);
  const [currAddress, setCurrAddress] = useState('');
  const [currCity, setCurrCity] = useState('');
  const [currState, setCurrState] = useState('');
  const [currCountry, setCurrCountry] = useState('Maldives');

  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelationship, setEmergencyRelationship] = useState('Parent');
  const [emergencyNumber, setEmergencyNumber] = useState('');

  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [telegramNumber, setTelegramNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [instagramTag, setInstagramTag] = useState('');

  const [investitureDate, setInvestitureDate] = useState(new Date().toISOString().split('T')[0]);
  const [resignationDate, setResignationDate] = useState('');
  const [term, setTerm] = useState('2024-2026');
  const [status, setStatus] = useState('Investiture');
  const [attendanceWithoutExcused, setAttendanceWithoutExcused] = useState('0%');
  const [attendanceWithExcused, setAttendanceWithExcused] = useState('0%');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const structuredPermanentAddress = {
        country: permCountry || 'Maldives',
        state: permState || '',
        city: permCity || '',
        district: 'N/A',
        addressLine: permAddress || ''
      };

      const structuredCurrentAddress = sameAsPerm ? structuredPermanentAddress : {
        country: currCountry || 'Maldives',
        state: currState || '',
        city: currCity || '',
        district: 'N/A',
        addressLine: currAddress || ''
      };

      const res = await fetch('/api/admin/members/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          commonName: commonName || fullName.split(' ')[0],
          username: username || fullName.toLowerCase().replace(/[^a-z0-9]/g, ''),
          password,
          idCardNumber: idCardNumber.trim().toUpperCase(),
          dob,
          age,
          gender,
          role,
          awardGoal,
          currentLevel: level,
          permanentAddress: structuredPermanentAddress,
          currentAddress: structuredCurrentAddress,
          emergencyName,
          emergencyRelationship,
          emergencyNumber,
          email,
          mobileNumber: mobileNumber,
          phoneNumber: mobileNumber,
          telegramNumber,
          telegramTag: telegramNumber,
          whatsappNumber: whatsappNumber || mobileNumber,
          instagramTag,
          investitureDate,
          resignationDate,
          term,
          status,
          overallAttendanceWithoutExcused: attendanceWithoutExcused,
          overallAttendanceWithExcused: attendanceWithExcused
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create member.');

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error creating member account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 bg-darkblue text-white rounded-t-3xl flex items-center justify-between sticky top-0 z-20">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-sky-300">
              Arabiyya Scout Group Roster
            </div>
            <h3 className="text-lg font-bold">Add Member (All 22 Tracked Fields)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 font-bold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Identification */}
          <div className="bg-gray-50/70 border border-gray-200 p-4 rounded-2xl space-y-3">
            <div className="font-bold text-darkblue text-xs uppercase tracking-wider">
              1. Member Identity & Identification
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ahmed Rasheed"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Common Name</label>
                <input
                  type="text"
                  value={commonName}
                  onChange={(e) => setCommonName(e.target.value)}
                  placeholder="e.g. Rasheed"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">National ID Card *</label>
                <input
                  type="text"
                  required
                  value={idCardNumber}
                  onChange={(e) => setIdCardNumber(e.target.value)}
                  placeholder="A123456"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Age</label>
                <input
                  type="text"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 20"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Username (Member Login)</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                  placeholder="Only letters and numbers"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Password</label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Membership & Scouting Term */}
          <div className="bg-sky-50/70 border border-sky-200 p-4 rounded-2xl space-y-3">
            <div className="font-bold text-darkblue text-xs uppercase tracking-wider">
              2. Membership, Term & Investiture
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Section</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as RoleSection)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white"
                >
                  <option value="Rover">Rover (18+)</option>
                  <option value="Explorer">Explorer (16-18)</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Term</label>
                <input
                  type="text"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="e.g. 2024-2026"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white font-semibold"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Membership Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white"
                >
                  <option value="Investiture">Investiture</option>
                  <option value="Active">Active</option>
                  <option value="Resigned">Resigned</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Investiture Date</label>
                <input
                  type="date"
                  value={investitureDate}
                  onChange={(e) => setInvestitureDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Resignation Date (If Any)</label>
                <input
                  type="date"
                  value={resignationDate}
                  onChange={(e) => setResignationDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Award Goal</label>
                <select
                  value={awardGoal}
                  onChange={(e) => setAwardGoal(e.target.value as AwardGoal)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white"
                >
                  <option value="President Scout Award">President Scout Award</option>
                  <option value="Baden-Powell Award">Baden-Powell Award</option>
                  <option value="None">None</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Progression Level</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as ProgressionLevel)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white"
                >
                  <option value="Square">Square</option>
                  <option value="Scout Standard">Scout Standard</option>
                  <option value="Advanced Scout Standard">Advanced Scout Standard</option>
                  <option value="Bushman's Thong">Bushman's Thong</option>
                  <option value="President Scout Award">President Scout Award</option>
                  <option value="President Scout Award Holder">President Scout Award Holder</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Contact & Communication */}
          <div className="bg-gray-50/70 border border-gray-200 p-4 rounded-2xl space-y-3">
            <div className="font-bold text-darkblue text-xs uppercase tracking-wider">
              3. Contact Channels & Messaging
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Mobile Number</label>
                <input
                  type="text"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="+960 7901122"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="member@arabiyyarovers.net"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">WhatsApp Number</label>
                <input
                  type="text"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="+960 7901122"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Telegram Number / Tag</label>
                <input
                  type="text"
                  value={telegramNumber}
                  onChange={(e) => setTelegramNumber(e.target.value.replace(/@/g, ''))}
                  placeholder="username or phone"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Instagram Tag</label>
                <input
                  type="text"
                  value={instagramTag}
                  onChange={(e) => setInstagramTag(e.target.value.replace(/@/g, ''))}
                  placeholder="username"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Addresses */}
          <div className="bg-gray-50/70 border border-gray-200 p-4 rounded-2xl space-y-4">
            <div className="font-bold text-darkblue text-xs uppercase tracking-wider">
              4. Permanent & Current Residential Addresses
            </div>

            {/* Permanent Address */}
            <div className="bg-white p-3.5 rounded-xl border border-gray-200 space-y-3">
              <div className="text-[11px] font-bold text-darkblue uppercase tracking-wider">
                Permanent Registered Address
              </div>
              <div>
                <label className="block font-bold text-gray-700 text-xs mb-1">House Name / Flat / Street / Address Line</label>
                <input
                  type="text"
                  value={permAddress}
                  onChange={(e) => setPermAddress(e.target.value)}
                  placeholder="e.g. M. Rose, Henveiru"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white text-xs"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-bold text-gray-700 text-xs mb-1">City / Island</label>
                  <input
                    type="text"
                    value={permCity}
                    onChange={(e) => setPermCity(e.target.value)}
                    placeholder="e.g. Male'"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 text-xs mb-1">State / Atoll</label>
                  <input
                    type="text"
                    value={permState}
                    onChange={(e) => setPermState(e.target.value)}
                    placeholder="e.g. Kaafu Atoll"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 text-xs mb-1">Country</label>
                  <input
                    type="text"
                    value={permCountry}
                    onChange={(e) => setPermCountry(e.target.value)}
                    placeholder="e.g. Maldives"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Current Address */}
            <div className="bg-white p-3.5 rounded-xl border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-darkblue uppercase tracking-wider">
                  Current Residential Address
                </span>
                <label className="flex items-center space-x-1.5 text-xs text-gray-600 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={sameAsPerm}
                    onChange={(e) => {
                      setSameAsPerm(e.target.checked);
                      if (e.target.checked) {
                        setCurrAddress(permAddress);
                        setCurrCity(permCity);
                        setCurrState(permState);
                        setCurrCountry(permCountry);
                      }
                    }}
                    className="rounded text-maroon focus:ring-maroon h-3.5 w-3.5"
                  />
                  <span>Same as permanent address</span>
                </label>
              </div>

              {!sameAsPerm && (
                <>
                  <div>
                    <label className="block font-bold text-gray-700 text-xs mb-1">House Name / Flat / Street / Address Line</label>
                    <input
                      type="text"
                      value={currAddress}
                      onChange={(e) => setCurrAddress(e.target.value)}
                      placeholder="e.g. Flat 1204, Oceanic Tower, Hulhumale Phase 1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block font-bold text-gray-700 text-xs mb-1">City / Island</label>
                      <input
                        type="text"
                        value={currCity}
                        onChange={(e) => setCurrCity(e.target.value)}
                        placeholder="e.g. Hulhumale"
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 text-xs mb-1">State / Atoll</label>
                      <input
                        type="text"
                        value={currState}
                        onChange={(e) => setCurrState(e.target.value)}
                        placeholder="e.g. Kaafu Atoll"
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 text-xs mb-1">Country</label>
                      <input
                        type="text"
                        value={currCountry}
                        onChange={(e) => setCurrCountry(e.target.value)}
                        placeholder="e.g. Maldives"
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white text-xs"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Section 5: Emergency & Attendance */}
          <div className="bg-red-50/60 border border-red-200 p-4 rounded-2xl space-y-3">
            <div className="font-bold text-maroon text-xs uppercase tracking-wider">
              5. Emergency Contacts & Attendance Performance
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Emergency Contact Name</label>
                <input
                  type="text"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  placeholder="e.g. Hassan Rasheed"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Relationship</label>
                <input
                  type="text"
                  value={emergencyRelationship}
                  onChange={(e) => setEmergencyRelationship(e.target.value)}
                  placeholder="Parent / Guardian"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Emergency Number</label>
                <input
                  type="text"
                  value={emergencyNumber}
                  onChange={(e) => setEmergencyNumber(e.target.value)}
                  placeholder="+960 7712345"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-red-100">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Overall Attendance (Without Excused)
                </label>
                <input
                  type="text"
                  value={attendanceWithoutExcused}
                  onChange={(e) => setAttendanceWithoutExcused(e.target.value)}
                  placeholder="e.g. 88%"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Overall Attendance (With Excused)
                </label>
                <input
                  type="text"
                  value={attendanceWithExcused}
                  onChange={(e) => setAttendanceWithExcused(e.target.value)}
                  placeholder="e.g. 96%"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-gray-200 flex justify-end space-x-2 sticky bottom-0 bg-white py-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-xl font-bold hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-maroon text-white font-bold rounded-xl hover:bg-[#660000] disabled:opacity-50 flex items-center space-x-1.5 shadow-xs"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Creating Member...</span>
                </>
              ) : (
                <span>Save Member (All Fields)</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
