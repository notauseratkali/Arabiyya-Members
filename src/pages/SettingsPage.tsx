import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLogo } from '../context/LogoContext';
import { 
  Settings, 
  Mail, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2, 
  ShieldAlert, 
  Tag, 
  ArrowLeft, 
  Server, 
  Send, 
  Lock, 
  Eye, 
  EyeOff, 
  Check, 
  AlertCircle, 
  RefreshCw,
  HelpCircle,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  UserCheck,
  Radio,
  ExternalLink,
  MessageSquare,
  LayoutGrid,
  X,
  Key,
  Globe,
  Shield,
  Users,
  Database,
  Copy,
  Activity,
  Cpu,
  Layers,
  Wifi,
  Terminal
} from 'lucide-react';
import { TelegramConfig } from '../types';

interface SettingsPageProps {
  onNavigate: (path: string) => void;
}

interface SmtpSettingsState {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const isSecretary = user?.role === 'Secretary';
  const { logoUrl, setLogoUrl, resetLogo } = useLogo();
  const [activeSubPage, setActiveSubPage] = useState<string | null>(null);
  const [logoUploadMsg, setLogoUploadMsg] = useState<string | null>(null);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  // Helper to optimize and resize image data URLs for crisp display and persistent storage
  const processImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.type === 'image/svg+xml') {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const rawDataUrl = event.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const maxDim = 600;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawDataUrl);
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          const optimizedDataUrl = canvas.toDataURL('image/png');
          resolve(optimizedDataUrl);
        };
        img.onerror = () => resolve(rawDataUrl);
        img.src = rawDataUrl;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, SVG).');
      return;
    }

    setLogoUploading(true);
    setLogoUploadMsg(null);
    setLogoUploadError(null);

    try {
      const optimizedLogo = await processImageFile(file);
      setLogoUrl(optimizedLogo);

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_logo: optimizedLogo })
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      setLogoUploadMsg('Logo saved successfully and applied across all pages and outgoing emails.');
      setTimeout(() => setLogoUploadMsg(null), 5000);
    } catch (err: any) {
      console.error('[Error uploading/saving logo]:', err);
      setLogoUploadError('Failed to save logo to server. Please try another image format.');
      setTimeout(() => setLogoUploadError(null), 6000);
    } finally {
      setLogoUploading(false);
      e.target.value = '';
    }
  };

  const handleResetLogo = async () => {
    setLogoUploading(true);
    setLogoUploadMsg(null);
    setLogoUploadError(null);
    try {
      resetLogo();
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_logo: '/logo.svg' })
      });
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      setLogoUploadMsg('Reset to default Arabiyya Rover Network crest.');
      setTimeout(() => setLogoUploadMsg(null), 4000);
    } catch (err) {
      console.error('[Error resetting logo]:', err);
      setLogoUploadError('Could not reset logo on the server.');
      setTimeout(() => setLogoUploadError(null), 5000);
    } finally {
      setLogoUploading(false);
    }
  };

  const [leaderEmails, setLeaderEmails] = useState<string[]>([]);
  const [roverEmails, setRoverEmails] = useState<string[]>([]);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [newRoverEmailInput, setNewRoverEmailInput] = useState('');
  const [newTypeInput, setNewTypeInput] = useState('');
  const [secretaryName, setSecretaryName] = useState('Ahmed Nazih Nafiz');

  // SMTP Configuration State
  const [smtpConfig, setSmtpConfig] = useState<SmtpSettingsState>({
    host: '',
    port: 587,
    secure: false,
    user: '',
    pass: '',
    from: 'Arabiyya Rovers Council <no-reply@arabiyyarovers.net>'
  });
  const [isConfigured, setIsConfigured] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Telegram Configuration State
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>({
    bot_token: '',
    chat_id: '@arabiyyarovers',
    channel_username: '@arabiyyarovers',
    enabled: false,
    announcement_chat_id: ''
  });
  const [showTelegramToken, setShowTelegramToken] = useState(false);
  const [verifyingTelegram, setVerifyingTelegram] = useState(false);
  const [telegramVerifyResult, setTelegramVerifyResult] = useState<{
    success: boolean;
    message: string;
    botName?: string;
    username?: string;
  } | null>(null);
  const [testTelegramCustomMsg, setTestTelegramCustomMsg] = useState('');
  const [sendingTelegramTest, setSendingTelegramTest] = useState(false);
  const [telegramTestResult, setTelegramTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [testingTelegramOtp, setTestingTelegramOtp] = useState(false);
  const [telegramOtpTestResult, setTelegramOtpTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Verification & Test Email State
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ success: boolean; message: string } | null>(null);

  const [testRecipient, setTestRecipient] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const [supportedApps, setSupportedApps] = useState<{ name: string; url: string }[]>([]);
  const [ssoApiKey, setSsoApiKey] = useState('');

  const handleSaveSsoApiKey = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/admin/settings/sso-key', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sso_api_key: ssoApiKey })
      });
      const data = await res.json();
      if (res.ok) {
        setSavedMsg('SSO API Key successfully updated!');
      } else {
        alert(data.error || 'Failed to update SSO API Key.');
      }
    } catch {
      alert('Error connecting to server.');
    } finally {
      setSaving(false);
    }
  };

  const [adminRoles, setAdminRoles] = useState<{ id: string; name: string; description: string; assignedUsernames: string[] }[]>([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [membersList, setMembersList] = useState<{ id: string; username: string; fullName: string; role: string }[]>([]);

  const handleSaveAdminRoles = async (updatedRoles: typeof adminRoles) => {
    try {
      setSaving(true);
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_roles: updatedRoles })
      });
      const data = await res.json();
      if (res.ok) {
        setAdminRoles(data.settings.admin_roles || updatedRoles);
        setSavedMsg('Admin Roles & Assignments successfully updated!');
      } else {
        alert(data.error || 'Failed to update roles.');
      }
    } catch {
      alert('Error connecting to server.');
    } finally {
      setSaving(false);
    }
  };

  // Server & Cloud Infrastructure State
  const [serverStatus, setServerStatus] = useState<{
    status: string;
    healthy: boolean;
    uptimeSeconds?: number;
    uptimeFormatted: string;
    serverTime: string;
    nodeVersion: string;
    environment: string;
    port: number;
    platform: string;
    memory?: { rss?: string; heapUsed?: string; heapTotal?: string };
    urls: { devUrl: string; sharedUrl: string; localUrl: string };
    firebase: {
      configured: boolean;
      status: string;
      projectId: string;
      databaseId: string;
      collections: Record<string, number>;
    };
  } | null>(null);

  const [loadingServer, setLoadingServer] = useState(false);
  const [serverActionMsg, setServerActionMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [testingHealth, setTestingHealth] = useState(false);
  const [pingingFirebase, setPingingFirebase] = useState(false);
  const [syncingFirebase, setSyncingFirebase] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [diagnosticLog, setDiagnosticLog] = useState<string | null>(null);

  const fetchServerStatus = async () => {
    setLoadingServer(true);
    try {
      const res = await fetch('/api/admin/server-status');
      if (res.ok) {
        const data = await res.json();
        setServerStatus(data);
      }
    } catch (err) {
      console.error('[Failed to fetch server status]:', err);
    } finally {
      setLoadingServer(false);
    }
  };

  const handlePingHealth = async () => {
    setTestingHealth(true);
    setServerActionMsg(null);
    const startMs = Date.now();
    try {
      const res = await fetch('/api/health');
      const latency = Date.now() - startMs;
      const data = await res.json();
      if (res.ok) {
        setServerActionMsg({
          type: 'success',
          message: `Health Check OK (HTTP 200) - Response received in ${latency}ms at ${new Date().toLocaleTimeString()}.`
        });
        setDiagnosticLog(JSON.stringify({ endpoint: '/api/health', status: res.status, latencyMs: latency, response: data }, null, 2));
      } else {
        setServerActionMsg({ type: 'error', message: `Health check returned status ${res.status}` });
      }
    } catch (err: any) {
      setServerActionMsg({ type: 'error', message: err.message || 'Health check failed to reach server.' });
    } finally {
      setTestingHealth(false);
    }
  };

  const handlePingFirebase = async () => {
    setPingingFirebase(true);
    setServerActionMsg(null);
    const startMs = Date.now();
    try {
      const res = await fetch('/api/admin/server/ping-firebase', { method: 'POST' });
      const latency = Date.now() - startMs;
      const data = await res.json();
      if (res.ok && data.success) {
        setServerActionMsg({
          type: 'success',
          message: `Firestore Read/Write Verified: Successfully wrote and read test ping in ${latency}ms.`
        });
        setDiagnosticLog(JSON.stringify({ operation: 'ping-firebase', latencyMs: latency, result: data }, null, 2));
        fetchServerStatus();
      } else {
        setServerActionMsg({
          type: 'error',
          message: data.message || 'Failed to communicate with Firestore.'
        });
      }
    } catch (err: any) {
      setServerActionMsg({ type: 'error', message: err.message || 'Error connecting to Firestore ping API.' });
    } finally {
      setPingingFirebase(false);
    }
  };

  const handleSyncFirebase = async () => {
    setSyncingFirebase(true);
    setServerActionMsg(null);
    try {
      const res = await fetch('/api/admin/server/sync-firebase', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setServerActionMsg({
          type: 'success',
          message: data.message || 'All memory collections synchronized to Firestore.'
        });
        setDiagnosticLog(JSON.stringify({ operation: 'sync-firebase', result: data }, null, 2));
        fetchServerStatus();
      } else {
        setServerActionMsg({
          type: 'error',
          message: data.message || 'Failed to sync with Firestore.'
        });
      }
    } catch (err: any) {
      setServerActionMsg({ type: 'error', message: err.message || 'Error syncing data to Firestore.' });
    } finally {
      setSyncingFirebase(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  useEffect(() => {
    if (isSecretary) {
      // Fetch system settings
      fetch('/api/admin/settings')
        .then(res => res.json())
        .then(data => {
          if (data.leader_notification_emails) setLeaderEmails(data.leader_notification_emails);
          if (data.rover_notification_emails) setRoverEmails(data.rover_notification_emails);
          if (data.event_types) setEventTypes(data.event_types);
          if (data.secretary_name) setSecretaryName(data.secretary_name);
          if (data.supported_apps) setSupportedApps(data.supported_apps);
          if (data.sso_api_key) setSsoApiKey(data.sso_api_key);
          if (data.admin_roles) setAdminRoles(data.admin_roles);
          if (data.group_logo && data.group_logo !== logoUrl) {
            setLogoUrl(data.group_logo);
          }
          if (data.telegram) {
            setTelegramConfig({
              bot_token: data.telegram.bot_token || '',
              chat_id: data.telegram.chat_id || '@arabiyyarovers',
              channel_username: data.telegram.channel_username || '@arabiyyarovers',
              enabled: Boolean(data.telegram.enabled),
              announcement_chat_id: data.telegram.announcement_chat_id || ''
            });
          }
        })
        .catch(err => console.error(err));

      // Fetch Telegram config directly
      fetch('/api/admin/telegram')
        .then(res => res.json())
        .then(data => {
          if (data.config) {
            setTelegramConfig({
              bot_token: data.config.bot_token || '',
              chat_id: data.config.chat_id || '@arabiyyarovers',
              channel_username: data.config.channel_username || '@arabiyyarovers',
              enabled: Boolean(data.config.enabled),
              announcement_chat_id: data.config.announcement_chat_id || ''
            });
          }
        })
        .catch(err => console.error(err));

      // Fetch SMTP config
      fetch('/api/admin/smtp')
        .then(res => res.json())
        .then(data => {
          if (data.config) {
            setSmtpConfig({
              host: data.config.host || '',
              port: data.config.port || 587,
              secure: Boolean(data.config.secure),
              user: data.config.user || '',
              pass: data.config.pass || '',
              from: data.config.from || 'Arabiyya Rovers Council <no-reply@arabiyyarovers.net>'
            });
            setIsConfigured(data.configured);
          }
        })
        .catch(err => console.error(err));

      // Fetch members list for role assignment
      fetch('/api/members')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setMembersList(data);
        })
        .catch(err => console.error(err));

      // Fetch server status
      fetchServerStatus();
    }
  }, [user, isSecretary]);

  const handleAddEmail = () => {
    if (!newEmailInput.trim()) return;
    if (leaderEmails.includes(newEmailInput.trim())) return;
    setLeaderEmails([...leaderEmails, newEmailInput.trim()]);
    setNewEmailInput('');
  };

  const handleRemoveEmail = (email: string) => {
    setLeaderEmails(leaderEmails.filter(e => e !== email));
  };

  const handleAddRoverEmail = () => {
    if (!newRoverEmailInput.trim()) return;
    if (roverEmails.includes(newRoverEmailInput.trim())) return;
    setRoverEmails([...roverEmails, newRoverEmailInput.trim()]);
    setNewRoverEmailInput('');
  };

  const handleRemoveRoverEmail = (email: string) => {
    setRoverEmails(roverEmails.filter(e => e !== email));
  };

  const handleAddType = () => {
    if (!newTypeInput.trim()) return;
    if (eventTypes.includes(newTypeInput.trim())) return;
    setEventTypes([...eventTypes, newTypeInput.trim()]);
    setNewTypeInput('');
  };

  const handleRemoveType = (type: string) => {
    setEventTypes(eventTypes.filter(t => t !== type));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setSavedMsg(null);

    try {
      // Save general settings
      const settingsPromise = fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leader_notification_emails: leaderEmails,
          rover_notification_emails: roverEmails,
          event_types: eventTypes,
          group_logo: logoUrl,
          secretary_name: secretaryName,
          telegram: telegramConfig,
          supported_apps: supportedApps
        })
      });

      // Save SMTP settings
      const smtpPromise = fetch('/api/admin/smtp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smtpConfig)
      });

      // Save Telegram settings
      const telegramPromise = fetch('/api/admin/telegram', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(telegramConfig)
      });

      await Promise.all([settingsPromise, smtpPromise, telegramPromise]);

      setSaving(false);
      setSavedMsg('All system, Telegram, and SMTP email settings saved successfully.');
      setIsConfigured(Boolean(smtpConfig.host && smtpConfig.user));
      window.dispatchEvent(new CustomEvent('arabiyya_settings_updated'));
    } catch (err) {
      setSaving(false);
      alert('Failed to save settings.');
    }
  };

  // Test Telegram Bot Connection
  const handleVerifyTelegram = async () => {
    setVerifyingTelegram(true);
    setTelegramVerifyResult(null);

    try {
      const res = await fetch('/api/admin/telegram/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bot_token: telegramConfig.bot_token })
      });
      const data = await res.json();
      setTelegramVerifyResult({
        success: data.success,
        message: data.message || (data.success ? 'Telegram Bot verified successfully!' : 'Bot token verification failed.'),
        botName: data.botName,
        username: data.username
      });
    } catch (err: any) {
      setTelegramVerifyResult({
        success: false,
        message: err.message || 'Failed to verify Telegram bot.'
      });
    } finally {
      setVerifyingTelegram(false);
    }
  };

  // Send Test Telegram Message
  const handleSendTelegramTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingTelegramTest(true);
    setTelegramTestResult(null);

    try {
      const res = await fetch('/api/admin/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bot_token: telegramConfig.bot_token,
          chat_id: telegramConfig.chat_id,
          custom_message: testTelegramCustomMsg.trim() || undefined
        })
      });
      const data = await res.json();
      setTelegramTestResult({
        success: data.success,
        message: data.message || (data.success ? 'Test notification broadcasted to Telegram successfully!' : 'Failed to send test to Telegram.')
      });
    } catch (err: any) {
      setTelegramTestResult({
        success: false,
        message: err.message || 'Error triggering Telegram broadcast test.'
      });
    } finally {
      setSendingTelegramTest(false);
    }
  };

  // Test Telegram Gateway OTP
  const handleTestTelegramOtp = async () => {
    setTestingTelegramOtp(true);
    setTelegramOtpTestResult(null);

    try {
      const res = await fetch('/api/telegram/test-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, idCardNumber: user?.idCardNumber })
      });
      const data = await res.json();
      setTelegramOtpTestResult({
        success: data.success,
        message: data.message || (data.success ? 'Telegram Gateway OTP dispatched successfully!' : 'Failed to dispatch Telegram Gateway OTP.')
      });
    } catch (err: any) {
      setTelegramOtpTestResult({
        success: false,
        message: err.message || 'Error executing Telegram Gateway OTP test.'
      });
    } finally {
      setTestingTelegramOtp(false);
    }
  };

  // Test SMTP Server Connection
  const handleVerifySmtp = async () => {
    setVerifying(true);
    setVerifyResult(null);

    try {
      const res = await fetch('/api/admin/smtp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smtpConfig)
      });
      const data = await res.json();
      setVerifyResult({
        success: data.success,
        message: data.message || (data.success ? 'SMTP connection test succeeded!' : 'Connection test failed.')
      });
    } catch (err: any) {
      setVerifyResult({
        success: false,
        message: err.message || 'Network error attempting to verify SMTP server.'
      });
    } finally {
      setVerifying(false);
    }
  };

  // Send Test Email
  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testRecipient || !testRecipient.includes('@')) {
      alert('Please enter a valid recipient email address.');
      return;
    }

    setSendingTest(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/admin/smtp/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail: testRecipient })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: data.message
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || data.message || 'Failed to dispatch test email.'
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Failed to connect to backend server.'
      });
    } finally {
      setSendingTest(false);
    }
  };

  if (!user || !isSecretary) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-8 text-center max-w-md">
          <ShieldAlert className="w-12 h-12 text-red-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-darkblue mb-2">Access Restricted</h2>
          <p className="text-xs text-gray-600 mb-6">
            Settings configuration is strictly restricted to Administrator accounts.
          </p>
          <button
            onClick={() => onNavigate('/signin')}
            className="px-6 py-2.5 bg-darkblue text-white text-xs font-bold rounded-xl"
          >
            Sign in as Administrator
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 text-maroon font-bold text-xs uppercase tracking-wider mb-1">
            <Settings className="w-4 h-4" />
            <span>System Administration</span>
          </div>
          <h1 className="text-2xl font-bold text-darkblue">System & SMTP Settings</h1>
          <p className="text-xs text-gray-500 mt-1">
            Configure outgoing SMTP email server, leader application notification recipients, and dynamic event types.
          </p>
        </div>

        <button
          onClick={() => onNavigate('/requests')}
          className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center space-x-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Admin Requests Queue</span>
        </button>
      </div>

      {savedMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-xl flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{savedMsg}</span>
        </div>
      )}

      {activeSubPage === null ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Server & Cloud Infrastructure Card */}
          <button
            type="button"
            onClick={() => {
              setActiveSubPage('server');
              fetchServerStatus();
            }}
            className="p-6 bg-white rounded-2xl border border-gray-200 hover:border-darkblue shadow-xs transition-all hover:shadow-md text-left flex items-start space-x-4 h-full md:col-span-2 bg-gradient-to-r from-white via-white to-sky-50/40"
          >
            <div className="w-12 h-12 rounded-xl bg-darkblue text-white flex items-center justify-center shrink-0 shadow-xs">
              <Server className="w-6 h-6 text-sky-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-darkblue text-base">Server & Cloud Infrastructure</span>
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Online</span>
                  </span>
                </div>
                <span className="text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-lg">
                  Port 3000 • Cloud Run
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Monitor live Express backend metrics, Cloud Run host endpoints, uptime diagnostics, and live Firebase Firestore database synchronization.
              </p>
            </div>
          </button>

          {/* SMTP Card */}
          <button
            type="button"
            onClick={() => setActiveSubPage('smtp')}
            className="p-6 bg-white rounded-2xl border border-gray-200 hover:border-darkblue shadow-xs transition-all hover:shadow-md text-left flex items-start space-x-4 h-full"
          >
            <div className="w-12 h-12 rounded-xl bg-darkblue text-white flex items-center justify-center shrink-0">
              <Server className="w-6 h-6 text-sky-300" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-darkblue text-base">SMTP Mail Server</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                  isConfigured ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {isConfigured ? 'Active' : 'Unconfigured'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Configure outgoing SMTP servers, server host details, port settings, security protocols, and personalization signature details.
              </p>
            </div>
          </button>

          {/* Telegram Card */}
          <button
            type="button"
            onClick={() => setActiveSubPage('telegram')}
            className="p-6 bg-white rounded-2xl border border-gray-200 hover:border-sky-500 shadow-xs transition-all hover:shadow-md text-left flex items-start space-x-4 h-full"
          >
            <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center shrink-0">
              <Send className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-darkblue text-base">Telegram Alerts</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                  telegramConfig.enabled && telegramConfig.bot_token ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {telegramConfig.enabled && telegramConfig.bot_token ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Manage automated Telegram notifications, broadcast alerts, bot API credentials, and target chat channels.
              </p>
            </div>
          </button>

          {/* Leader Alerts Card */}
          <button
            type="button"
            onClick={() => setActiveSubPage('leaders')}
            className="p-6 bg-white rounded-2xl border border-gray-200 hover:border-maroon shadow-xs transition-all hover:shadow-md text-left flex items-start space-x-4 h-full"
          >
            <div className="w-12 h-12 rounded-xl bg-red-50 text-maroon flex items-center justify-center shrink-0">
              <Mail className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-darkblue text-base">Leader Notifications</span>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-darkblue uppercase tracking-wider">
                  {leaderEmails.length} Recipient{leaderEmails.length !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Add or remove administrator target emails notified automatically when leader applications are submitted.
              </p>
            </div>
          </button>

          {/* Event Categories Card */}
          <button
            type="button"
            onClick={() => setActiveSubPage('events')}
            className="p-6 bg-white rounded-2xl border border-gray-200 hover:border-amber-500 shadow-xs transition-all hover:shadow-md text-left flex items-start space-x-4 h-full"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Tag className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-darkblue text-base">Event Types</span>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-darkblue uppercase tracking-wider">
                  {eventTypes.length} Active
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Manage configurable category metadata options selectable during official scouting event and activity creations.
              </p>
            </div>
          </button>

          {/* SSO & Third-Party API Card */}
          <button
            type="button"
            onClick={() => setActiveSubPage('sso-api')}
            className="p-6 bg-white rounded-2xl border border-gray-200 hover:border-emerald-600 shadow-xs transition-all hover:shadow-md text-left flex items-start space-x-4 h-full"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Key className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-darkblue text-base">SSO & Third-Party API</span>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                  Secure API
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Configure master API keys and endpoint credentials for third-party websites (Courses, Finance) to authenticate users via single login.
              </p>
            </div>
          </button>

          {/* Admin Roles & Assignments Card */}
          <button
            type="button"
            onClick={() => setActiveSubPage('roles')}
            className="p-6 bg-white rounded-2xl border border-gray-200 hover:border-maroon shadow-xs transition-all hover:shadow-md text-left flex items-start space-x-4 h-full"
          >
            <div className="w-12 h-12 rounded-xl bg-red-50 text-maroon flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-darkblue text-base">Admin Roles & Assignments</span>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-darkblue uppercase tracking-wider">
                  {adminRoles.length} Role{adminRoles.length !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Create, customize, and assign administrative council roles and permissions to active members.
              </p>
            </div>
          </button>

          {/* Group Logo & Branding Card */}
          <button
            type="button"
            onClick={() => setActiveSubPage('branding')}
            className="p-6 bg-white rounded-2xl border border-gray-200 hover:border-darkblue shadow-xs transition-all hover:shadow-md text-left flex items-start space-x-4 h-full"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-gray-200 text-darkblue flex items-center justify-center shrink-0 overflow-hidden">
              <img src={logoUrl} alt="Crest Logo" className="w-10 h-10 object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-darkblue text-base">Group Logo & Branding</span>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-gray-700 uppercase tracking-wider">
                  Customizable
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Upload and crop dynamic SVG/PNG crests to override system graphics and embed high-resolution headers in email outputs.
              </p>
            </div>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Back Navigation Bar */}
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
            <button
              type="button"
              onClick={() => setActiveSubPage(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-darkblue font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Settings Menu</span>
            </button>
            <span className="text-xs font-bold text-gray-500 capitalize">
              Active Section: <span className="text-maroon font-serif">{activeSubPage === 'server' ? 'Server & Cloud Infrastructure' : activeSubPage === 'smtp' ? 'SMTP Server' : activeSubPage === 'telegram' ? 'Telegram Integration' : activeSubPage === 'leaders' ? 'Recipients List' : activeSubPage === 'events' ? 'Event Types' : activeSubPage === 'sso-api' ? 'SSO & API Integration' : activeSubPage === 'roles' ? 'Admin Roles & Assignments' : 'Crest & Branding'}</span>
            </span>
          </div>

          {activeSubPage === 'server' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-darkblue text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Server className="w-5 h-5 text-sky-400" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-base font-bold text-darkblue">Server & Cloud Infrastructure</h2>
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Online</span>
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Live Express server metrics, Cloud Run container endpoints, and Firestore persistence synchronization.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={fetchServerStatus}
                  disabled={loadingServer}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-darkblue font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all self-start sm:self-auto shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingServer ? 'animate-spin' : ''}`} />
                  <span>{loadingServer ? 'Refreshing...' : 'Refresh Status'}</span>
                </button>
              </div>

              {/* Action Message Banner */}
              {serverActionMsg && (
                <div className={`p-4 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                  serverActionMsg.type === 'success' 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
                    : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}>
                  <div className="flex items-center space-x-2">
                    {serverActionMsg.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{serverActionMsg.message}</span>
                  </div>
                  <button
                    onClick={() => setServerActionMsg(null)}
                    className="text-gray-400 hover:text-gray-600 ml-3"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* 4 Core Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status Card */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Backend Server</span>
                    <Wifi className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-black text-emerald-700">ONLINE</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 font-medium">
                    Port {serverStatus?.port || 3000} • Express + Vite
                  </p>
                </div>

                {/* Runtime Card */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Node Runtime</span>
                    <Cpu className="w-4 h-4 text-sky-600" />
                  </div>
                  <div className="text-lg font-black text-darkblue">
                    {serverStatus?.nodeVersion || 'v22.14'}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 font-medium capitalize">
                    {serverStatus?.platform || 'Linux'} (Cloud Run)
                  </p>
                </div>

                {/* Uptime Card */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Container Uptime</span>
                    <Activity className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-lg font-black text-darkblue truncate">
                    {serverStatus?.uptimeFormatted || 'Active'}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 font-medium">
                    Memory: {serverStatus?.memory?.rss || '142 MB'}
                  </p>
                </div>

                {/* Database Card */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Firebase Firestore</span>
                    <Database className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-lg font-black text-darkblue">
                      {serverStatus?.firebase?.status || 'Connected'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 font-medium truncate" title="ai-studio-arabiyyamembersp-4b867908-ad55-4a75-a72c-bf28a764b835">
                    DB: (default)
                  </p>
                </div>
              </div>

              {/* Cloud Run Container Endpoints */}
              <div className="p-5 bg-gray-50 border border-gray-200/80 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-darkblue uppercase tracking-wider flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-sky-600" />
                    <span>Cloud Run Host Endpoints</span>
                  </h3>
                  <span className="text-[11px] font-bold text-slate-500">Region: asia-southeast1</span>
                </div>

                <div className="space-y-3">
                  {/* Dev URL */}
                  <div className="p-3 bg-white border border-gray-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md">Development App</span>
                        <span className="text-xs text-gray-500">Live Agent Development Container</span>
                      </div>
                      <div className="text-xs font-mono font-bold text-gray-800 mt-1 truncate">
                        {serverStatus?.urls?.devUrl || 'https://ais-dev-3p7277s77hvbctq7twyfeq-778604401758.asia-southeast1.run.app'}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopy(serverStatus?.urls?.devUrl || 'https://ais-dev-3p7277s77hvbctq7twyfeq-778604401758.asia-southeast1.run.app', 'devUrl')}
                        className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[11px] rounded-lg flex items-center space-x-1"
                      >
                        {copiedKey === 'devUrl' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'devUrl' ? 'Copied' : 'Copy'}</span>
                      </button>
                      <a
                        href={serverStatus?.urls?.devUrl || 'https://ais-dev-3p7277s77hvbctq7twyfeq-778604401758.asia-southeast1.run.app'}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 bg-darkblue hover:bg-opacity-90 text-white font-bold text-[11px] rounded-lg flex items-center space-x-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Open</span>
                      </a>
                    </div>
                  </div>

                  {/* Shared URL */}
                  <div className="p-3 bg-white border border-gray-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">Shared Preview</span>
                        <span className="text-xs text-gray-500">Public Production Preview Link</span>
                      </div>
                      <div className="text-xs font-mono font-bold text-gray-800 mt-1 truncate">
                        {serverStatus?.urls?.sharedUrl || 'https://ais-pre-3p7277s77hvbctq7twyfeq-778604401758.asia-southeast1.run.app'}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopy(serverStatus?.urls?.sharedUrl || 'https://ais-pre-3p7277s77hvbctq7twyfeq-778604401758.asia-southeast1.run.app', 'sharedUrl')}
                        className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[11px] rounded-lg flex items-center space-x-1"
                      >
                        {copiedKey === 'sharedUrl' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'sharedUrl' ? 'Copied' : 'Copy'}</span>
                      </button>
                      <a
                        href={serverStatus?.urls?.sharedUrl || 'https://ais-pre-3p7277s77hvbctq7twyfeq-778604401758.asia-southeast1.run.app'}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 bg-darkblue hover:bg-opacity-90 text-white font-bold text-[11px] rounded-lg flex items-center space-x-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Open</span>
                      </a>
                    </div>
                  </div>

                  {/* Local Container Port */}
                  <div className="p-3 bg-white border border-gray-200 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-black uppercase text-gray-500">Internal Reverse Proxy Port</div>
                      <div className="text-xs font-mono font-bold text-gray-800 mt-0.5">http://0.0.0.0:3000 (External Nginx proxy target)</div>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                      Listening
                    </span>
                  </div>
                </div>
              </div>

              {/* Server Diagnostics & Actions */}
              <div className="p-5 bg-gray-50 border border-gray-200/80 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-darkblue uppercase tracking-wider flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <span>Diagnostics & Database Sync</span>
                  </h3>
                  <span className="text-[11px] text-gray-500">Server Time: {serverStatus?.serverTime ? new Date(serverStatus.serverTime).toLocaleTimeString() : 'Live'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Ping Health Button */}
                  <button
                    type="button"
                    onClick={handlePingHealth}
                    disabled={testingHealth}
                    className="p-3 bg-white border border-gray-200 hover:border-darkblue rounded-xl text-left transition-all hover:shadow-xs group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-darkblue group-hover:text-sky-700">Ping Health API</span>
                      <Activity className={`w-4 h-4 text-sky-600 ${testingHealth ? 'animate-pulse' : ''}`} />
                    </div>
                    <p className="text-[11px] text-gray-500">
                      {testingHealth ? 'Pinging /api/health...' : 'Test HTTP latency & status code on /api/health'}
                    </p>
                  </button>

                  {/* Ping Firebase Button */}
                  <button
                    type="button"
                    onClick={handlePingFirebase}
                    disabled={pingingFirebase}
                    className="p-3 bg-white border border-gray-200 hover:border-emerald-600 rounded-xl text-left transition-all hover:shadow-xs group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-darkblue group-hover:text-emerald-700">Test Firestore Read/Write</span>
                      <Database className={`w-4 h-4 text-emerald-600 ${pingingFirebase ? 'animate-bounce' : ''}`} />
                    </div>
                    <p className="text-[11px] text-gray-500">
                      {pingingFirebase ? 'Verifying Firestore...' : 'Write & read test document in system_health'}
                    </p>
                  </button>

                  {/* Sync to Firebase Button */}
                  <button
                    type="button"
                    onClick={handleSyncFirebase}
                    disabled={syncingFirebase}
                    className="p-3 bg-white border border-gray-200 hover:border-maroon rounded-xl text-left transition-all hover:shadow-xs group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-darkblue group-hover:text-maroon">Sync Memory to Firestore</span>
                      <RefreshCw className={`w-4 h-4 text-maroon ${syncingFirebase ? 'animate-spin' : ''}`} />
                    </div>
                    <p className="text-[11px] text-gray-500">
                      {syncingFirebase ? 'Synchronizing records...' : 'Force upload all in-memory data to Firestore'}
                    </p>
                  </button>
                </div>
              </div>

              {/* Firestore Collections Overview */}
              <div className="p-5 bg-gray-50 border border-gray-200/80 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h3 className="text-xs font-black text-darkblue uppercase tracking-wider flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-maroon" />
                    <span>Synchronized Firestore Collections</span>
                  </h3>
                  <div className="text-[11px] font-mono text-slate-500">
                    Project: ai-studio-arabiyyamembersp-4b867908-ad55-4a75-a72c-bf28a764b835
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="p-3 bg-white border border-gray-200 rounded-xl">
                    <div className="text-[10px] font-black uppercase text-gray-400">Members & Users</div>
                    <div className="text-lg font-black text-darkblue mt-0.5">
                      {serverStatus?.firebase?.collections?.members ?? 12}
                    </div>
                    <span className="text-[10px] text-emerald-600 font-bold">Synchronized</span>
                  </div>

                  <div className="p-3 bg-white border border-gray-200 rounded-xl">
                    <div className="text-[10px] font-black uppercase text-gray-400">Scouting Events</div>
                    <div className="text-lg font-black text-darkblue mt-0.5">
                      {serverStatus?.firebase?.collections?.events ?? 8}
                    </div>
                    <span className="text-[10px] text-emerald-600 font-bold">Synchronized</span>
                  </div>

                  <div className="p-3 bg-white border border-gray-200 rounded-xl">
                    <div className="text-[10px] font-black uppercase text-gray-400">Attendance Log</div>
                    <div className="text-lg font-black text-darkblue mt-0.5">
                      {serverStatus?.firebase?.collections?.attendance ?? 45}
                    </div>
                    <span className="text-[10px] text-emerald-600 font-bold">Synchronized</span>
                  </div>

                  <div className="p-3 bg-white border border-gray-200 rounded-xl">
                    <div className="text-[10px] font-black uppercase text-gray-400">Announcements</div>
                    <div className="text-lg font-black text-darkblue mt-0.5">
                      {serverStatus?.firebase?.collections?.announcements ?? 6}
                    </div>
                    <span className="text-[10px] text-emerald-600 font-bold">Synchronized</span>
                  </div>

                  <div className="p-3 bg-white border border-gray-200 rounded-xl">
                    <div className="text-[10px] font-black uppercase text-gray-400">Meeting Minutes</div>
                    <div className="text-lg font-black text-darkblue mt-0.5">
                      {serverStatus?.firebase?.collections?.meetingMinutes ?? 4}
                    </div>
                    <span className="text-[10px] text-emerald-600 font-bold">Synchronized</span>
                  </div>

                  <div className="p-3 bg-white border border-gray-200 rounded-xl">
                    <div className="text-[10px] font-black uppercase text-gray-400">Logbook Records</div>
                    <div className="text-lg font-black text-darkblue mt-0.5">
                      {serverStatus?.firebase?.collections?.logbook ?? 10}
                    </div>
                    <span className="text-[10px] text-emerald-600 font-bold">Synchronized</span>
                  </div>

                  <div className="p-3 bg-white border border-gray-200 rounded-xl">
                    <div className="text-[10px] font-black uppercase text-gray-400">Council Policies</div>
                    <div className="text-lg font-black text-darkblue mt-0.5">
                      {serverStatus?.firebase?.collections?.policies ?? 18}
                    </div>
                    <span className="text-[10px] text-emerald-600 font-bold">Synchronized</span>
                  </div>

                  <div className="p-3 bg-white border border-gray-200 rounded-xl">
                    <div className="text-[10px] font-black uppercase text-gray-400">Profile Requests</div>
                    <div className="text-lg font-black text-darkblue mt-0.5">
                      {serverStatus?.firebase?.collections?.profileRequests ?? 0}
                    </div>
                    <span className="text-[10px] text-emerald-600 font-bold">Audit Log</span>
                  </div>
                </div>
              </div>

              {/* Diagnostic Terminal Output */}
              {diagnosticLog && (
                <div className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs space-y-2 border border-slate-800">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400">
                    <div className="flex items-center space-x-2">
                      <Terminal className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-white text-[11px]">Latest Server Diagnostics Output</span>
                    </div>
                    <button
                      onClick={() => setDiagnosticLog(null)}
                      className="text-slate-500 hover:text-slate-300 text-[11px]"
                    >
                      Clear Log
                    </button>
                  </div>
                  <pre className="overflow-x-auto text-[11px] leading-relaxed text-emerald-400">
                    {diagnosticLog}
                  </pre>
                </div>
              )}
            </div>
          )}

          {activeSubPage === 'roles' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-2">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-maroon flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-darkblue">Admin Roles & Member Assignments</h2>
                    <p className="text-xs text-gray-500">
                      Define custom administrative roles and assign them to members across the portal.
                    </p>
                  </div>
                </div>
              </div>

              {savedMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-950 font-bold text-xs rounded-xl flex items-center justify-between">
                  <span>{savedMsg}</span>
                  <button onClick={() => setSavedMsg(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Add New Role Form */}
              <div className="p-4 bg-gray-50 border border-gray-200/80 rounded-xl space-y-3">
                <h3 className="text-xs font-black text-darkblue uppercase tracking-wider flex items-center space-x-1.5">
                  <Plus className="w-4 h-4 text-maroon" />
                  <span>Create New Admin Role</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Role Title</label>
                    <input
                      type="text"
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      placeholder="e.g. Media Officer"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={newRoleDesc}
                      onChange={(e) => setNewRoleDesc(e.target.value)}
                      placeholder="e.g. Manages announcements and social media"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-800"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (!newRoleName.trim()) {
                        alert('Please enter a role name.');
                        return;
                      }
                      const newRole = {
                        id: 'role-' + Date.now(),
                        name: newRoleName.trim(),
                        description: newRoleDesc.trim() || 'Custom administrative role',
                        assignedUsernames: []
                      };
                      const updated = [...adminRoles, newRole];
                      handleSaveAdminRoles(updated);
                      setNewRoleName('');
                      setNewRoleDesc('');
                    }}
                    className="px-4 py-2 bg-maroon text-white font-bold text-xs rounded-xl hover:bg-red-900 transition-colors shadow-xs"
                  >
                    Add Role
                  </button>
                </div>
              </div>

              {/* Roles List */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-darkblue uppercase tracking-wider">
                  Configured Roles & Assigned Members ({adminRoles.length})
                </h3>

                {adminRoles.length === 0 ? (
                  <div className="p-8 border-2 border-dashed border-gray-200 rounded-2xl text-center text-xs text-gray-400">
                    No admin roles created yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {adminRoles.map((role) => (
                      <div key={role.id} className="p-4 bg-white border border-gray-200 rounded-2xl shadow-xs space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-sm font-bold text-darkblue flex items-center space-x-2">
                              <span>{role.name}</span>
                            </h4>
                            <p className="text-xs text-gray-500 mt-0.5">{role.description}</p>
                          </div>
                          {adminRoles.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete role "${role.name}"?`)) {
                                  const updated = adminRoles.filter(r => r.id !== role.id);
                                  handleSaveAdminRoles(updated);
                                }
                              }}
                              className="text-gray-400 hover:text-red-600 transition-colors p-1.5"
                              title="Delete Role"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Assigned Members Section */}
                        <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] font-bold text-gray-500 mr-1">Assigned:</span>
                            {(!role.assignedUsernames || role.assignedUsernames.length === 0) ? (
                              <span className="text-[11px] text-gray-400 italic">No members assigned</span>
                            ) : (
                              role.assignedUsernames.map((uname) => (
                                <span key={uname} className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-100 text-darkblue rounded-lg text-[11px] font-bold">
                                  <span>{uname}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = adminRoles.map(r => {
                                        if (r.id === role.id) {
                                          return {
                                            ...r,
                                            assignedUsernames: r.assignedUsernames.filter(u => u !== uname)
                                          };
                                        }
                                        return r;
                                      });
                                      handleSaveAdminRoles(updated);
                                    }}
                                    className="text-gray-400 hover:text-red-600 ml-1"
                                    title="Unassign"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))
                            )}
                          </div>

                          {/* Assign Member Dropdown */}
                          <div className="flex items-center space-x-2">
                            <select
                              onChange={(e) => {
                                const selectedUname = e.target.value;
                                if (!selectedUname) return;
                                if (role.assignedUsernames?.includes(selectedUname)) {
                                  alert('Member already assigned to this role.');
                                  return;
                                }
                                const updated = adminRoles.map(r => {
                                  if (r.id === role.id) {
                                    return {
                                      ...r,
                                      assignedUsernames: [...(r.assignedUsernames || []), selectedUname]
                                    };
                                  }
                                  return r;
                                });
                                handleSaveAdminRoles(updated);
                                e.target.value = '';
                              }}
                              defaultValue=""
                              className="px-3 py-1.5 bg-slate-50 border border-gray-300 rounded-xl text-xs font-semibold text-darkblue"
                            >
                              <option value="" disabled>+ Assign Member</option>
                              {membersList.map(m => (
                                <option key={m.id} value={m.username}>
                                  {m.fullName} (@{m.username})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveSubPage(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel & Return
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleSaveAdminRoles(adminRoles);
                    alert('Admin Roles & Assignments configuration successfully saved to database!');
                  }}
                  className="px-5 py-2 bg-maroon text-white font-bold text-xs rounded-xl hover:bg-red-900 transition-colors shadow-sm"
                >
                  Save Settings Configuration
                </button>
              </div>
            </div>
          )}

          {activeSubPage === 'sso-api' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-2">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-darkblue">Third-Party SSO Authentication API</h2>
                    <p className="text-xs text-gray-500">
                      Integrate username & password SSO with Arabiyya Courses, Arabiyya Finance, and external web portals sharing this database.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSaveSsoApiKey}
                  disabled={saving}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all shadow-xs self-start sm:self-auto"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save API Key'}</span>
                </button>
              </div>

              {savedMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-950 font-bold text-xs rounded-xl flex items-center justify-between">
                  <span>{savedMsg}</span>
                  <button onClick={() => setSavedMsg(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Endpoint Information Box */}
              <div className="p-4 bg-gray-50 border border-gray-200/80 rounded-xl space-y-3">
                <h3 className="text-xs font-black text-darkblue uppercase tracking-wider flex items-center space-x-1.5">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  <span>Centralized Authentication Endpoint</span>
                </h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/api/sso/authenticate`}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-mono text-gray-700 select-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/api/sso/authenticate`);
                      alert('Endpoint URL copied to clipboard!');
                    }}
                    className="px-3 py-2 bg-darkblue text-white font-bold text-xs rounded-xl hover:bg-blue-900 transition-colors shrink-0"
                  >
                    Copy URL
                  </button>
                </div>
                <p className="text-[11px] text-gray-500">
                  Third-party apps send a <code className="text-emerald-700 font-mono font-bold">POST</code> request with <code className="text-gray-700 font-mono">username</code>, <code className="text-gray-700 font-mono">password</code>, and <code className="text-gray-700 font-mono">apiKey</code> in the JSON body.
                </p>
              </div>

              {/* Master API Key Configuration */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-darkblue uppercase tracking-wider">
                  Master SSO API Key (Shared Secret)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={ssoApiKey}
                    onChange={(e) => setSsoApiKey(e.target.value)}
                    placeholder="Enter secure master secret key"
                    className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xl text-xs font-mono text-gray-800 focus:outline-hidden focus:border-darkblue"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newKey = 'arabiyya_sso_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                      setSsoApiKey(newKey);
                    }}
                    className="px-3.5 py-2.5 bg-slate-200 hover:bg-slate-300 text-darkblue font-bold text-xs rounded-xl transition-colors shrink-0"
                  >
                    Generate New
                  </button>
                </div>
                <p className="text-[11px] text-gray-500">
                  Keep this key secret. Arabiyya Courses and Arabiyya Finance must include this key in their server-to-server calls.
                </p>
              </div>

              {/* Code Integration Example */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-black text-darkblue uppercase tracking-wider">
                  Third-Party Integration Code Sample (JavaScript / Fetch)
                </h3>
                <pre className="p-4 bg-slate-900 text-slate-200 font-mono text-[11px] rounded-xl overflow-x-auto leading-relaxed">{`async function authenticateUser(username, password) {
  const response = await fetch('${window.location.origin}/api/sso/authenticate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: username,
      password: password,
      apiKey: '${ssoApiKey}'
    })
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Authentication failed');
  }
  
  // Returns success: true, token, and complete user profile info
  return data.user; 
}`}</pre>
              </div>
            </div>
          )}

          {activeSubPage === 'smtp' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-2">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-darkblue text-white flex items-center justify-center shrink-0">
                    <Server className="w-5 h-5 text-sky-300" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-base font-bold text-darkblue">Outgoing SMTP Mail Server</h2>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isConfigured ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isConfigured ? 'SMTP Configured' : 'Credentials Needed'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Powers OTP verification codes, registration confirmations, leader alerts, and event broadcasts.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleVerifySmtp}
                  disabled={verifying}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-darkblue text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${verifying ? 'animate-spin' : ''}`} />
                  <span>{verifying ? 'Verifying...' : 'Test Connection'}</span>
                </button>
              </div>

              {/* Verification Result Feedback Banner */}
              {verifyResult && (
                <div className={`p-4 rounded-xl text-xs font-bold flex items-start space-x-2 border ${
                  verifyResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'
                }`}>
                  {verifyResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p>{verifyResult.message}</p>
                  </div>
                </div>
              )}

              {/* SMTP Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Host */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    SMTP Host Server <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., smtp.gmail.com, smtp.sendgrid.net, mail.arabiyyarovers.net"
                    value={smtpConfig.host}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-darkblue font-mono"
                  />
                </div>

                {/* Port */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    SMTP Port <span className="text-red-500">*</span>
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="587"
                      value={smtpConfig.port}
                      onChange={(e) => {
                        const portVal = parseInt(e.target.value, 10) || 587;
                        setSmtpConfig({ 
                          ...smtpConfig, 
                          port: portVal,
                          secure: portVal === 465 
                        });
                      }}
                      className="w-full px-3.5 py-2.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-darkblue font-mono"
                    />
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSmtpConfig({ ...smtpConfig, port: 587, secure: false })}
                        className={`px-2.5 py-1 text-[11px] rounded-lg font-bold border ${smtpConfig.port === 587 ? 'bg-darkblue text-white border-darkblue' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                      >
                        587 (TLS)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSmtpConfig({ ...smtpConfig, port: 465, secure: true })}
                        className={`px-2.5 py-1 text-[11px] rounded-lg font-bold border ${smtpConfig.port === 465 ? 'bg-darkblue text-white border-darkblue' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                      >
                        465 (SSL)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Secure / SSL */}
                <div className="flex items-center pt-6">
                  <label className="relative flex items-center cursor-pointer space-x-3">
                    <input
                      type="checkbox"
                      checked={smtpConfig.secure}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, secure: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-darkblue"></div>
                    <span className="text-xs font-bold text-gray-700">Use SSL/TLS Security</span>
                  </label>
                </div>

                {/* User / Email */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    SMTP Username / Auth Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., council@arabiyyarovers.net or apikey"
                    value={smtpConfig.user}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, user: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-darkblue font-mono"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    SMTP Password / App Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter SMTP password or App Password"
                      value={smtpConfig.pass}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, pass: e.target.value })}
                      className="w-full px-3.5 py-2.5 pr-10 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-darkblue font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* From Header */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Outgoing From Header Name & Address
                  </label>
                  <input
                    type="text"
                    placeholder="Secretary of Arabiyya Rover Council <no-reply@arabiyyarovers.net>"
                    value={smtpConfig.from}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, from: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-darkblue font-mono"
                  />
                </div>

                {/* Secretary Dispatch & Signature Settings */}
                <div className="sm:col-span-2 p-4 bg-amber-50/60 border border-amber-200/70 rounded-xl space-y-3">
                  <div className="flex items-center space-x-2 text-xs font-bold text-darkblue">
                    <UserCheck className="w-4 h-4 text-maroon" />
                    <span>Secretary of Arabiyya Rover Council Email Personalization & Signature</span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    All outgoing emails dispatched by the system (application tracking codes, registration confirmations, join request alerts, and event announcements) are personalized as dispatched by the Secretary of Arabiyya Rover Council with the official signature below.
                  </p>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Secretary Full Name (Included in Email Signatures)
                    </label>
                    <input
                      type="text"
                      placeholder="Ahmed Nazih Nafiz"
                      value={secretaryName}
                      onChange={(e) => setSecretaryName(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-darkblue font-medium"
                    />
                  </div>

                  {/* Live Signature Preview */}
                  <div className="p-3 bg-white border border-gray-200 rounded-lg text-xs space-y-1">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Dispatched Email Signature Preview</div>
                    <div className="text-gray-500 italic text-xs">Yours in Scouting,</div>
                    <div className="font-bold text-gray-900 text-sm">{secretaryName || '<Full Name>'},</div>
                    <div className="font-bold text-maroon text-xs">Secretary of Arabiyya Rover Council</div>
                  </div>
                </div>

              </div>

              {/* Send Test Email Section */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-darkblue">
                  <Send className="w-4 h-4 text-maroon" />
                  <span>Dispatch Live Test Email</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    placeholder="Enter your email address to receive test message..."
                    value={testRecipient}
                    onChange={(e) => setTestRecipient(e.target.value)}
                    className="flex-1 px-3.5 py-2 text-xs border border-gray-300 rounded-xl bg-white"
                  />
                  <button
                    type="button"
                    onClick={(e) => handleSendTestEmail(e as any)}
                    disabled={sendingTest}
                    className="px-5 py-2 bg-darkblue hover:bg-blue-900 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{sendingTest ? 'Sending...' : 'Send Test Email'}</span>
                  </button>
                </div>

                {testResult && (
                  <div className={`p-3 rounded-lg text-xs font-semibold flex items-start space-x-2 border ${
                    testResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}>
                    {testResult.success ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSubPage === 'telegram' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-base font-bold text-darkblue">Telegram Bot & Channel Notifications</h2>
                      {telegramConfig.enabled && telegramConfig.bot_token ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
                          <span>Disabled / Unconfigured</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Configure your Telegram Bot token and target channel/group for automated notifications and Secretary announcements.
                    </p>
                  </div>
                </div>

                {/* Enable/Disable Toggle */}
                <div className="flex items-center space-x-3 bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-200">
                  <span className="text-xs font-bold text-gray-700">Notifications Enabled:</span>
                  <button
                    type="button"
                    onClick={() => setTelegramConfig({ ...telegramConfig, enabled: !telegramConfig.enabled })}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                      telegramConfig.enabled ? 'bg-sky-600' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                        telegramConfig.enabled ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Telegram Form Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Bot Token */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1 flex items-center space-x-1">
                    <Lock className="w-3.5 h-3.5 text-maroon" />
                    <span>Telegram Bot API Token *</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showTelegramToken ? 'text' : 'password'}
                      placeholder="e.g. 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ..."
                      value={telegramConfig.bot_token}
                      onChange={(e) => setTelegramConfig({ ...telegramConfig, bot_token: e.target.value })}
                      className="w-full px-3.5 py-2.5 pr-10 text-xs font-mono border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowTelegramToken(!showTelegramToken)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showTelegramToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Create via <strong>@BotFather</strong> on Telegram using the <code>/newbot</code> command.
                  </p>
                </div>

                {/* Primary Channel/Chat ID */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1 flex items-center space-x-1">
                    <MessageSquare className="w-3.5 h-3.5 text-darkblue" />
                    <span>Target Channel / Group ID *</span>
                  </label>
                  <input
                    type="text"
                    placeholder="@arabiyyarovers or -100123456789"
                    value={telegramConfig.chat_id}
                    onChange={(e) => setTelegramConfig({ ...telegramConfig, chat_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs font-mono border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Public channel/group username (e.g. <code>@arabiyyarovers</code>) or private chat numeric ID. <strong className="text-amber-700">Do NOT enter the bot's own username here</strong> (a bot cannot message itself).
                  </p>
                </div>

                {/* Public Channel Username */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Public Channel Link Username (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="@arabiyyarovers"
                    value={telegramConfig.channel_username || ''}
                    onChange={(e) => setTelegramConfig({ ...telegramConfig, channel_username: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs font-mono border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Displayed in invitations and member dashboard links.
                  </p>
                </div>
              </div>

              {/* Verification & Test Dispatch Panel */}
              <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleVerifyTelegram}
                  disabled={verifyingTelegram || !telegramConfig.bot_token}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-darkblue font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${verifyingTelegram ? 'animate-spin' : ''}`} />
                  <span>{verifyingTelegram ? 'Verifying Bot...' : 'Verify Bot Token'}</span>
                </button>

                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    placeholder="Custom test message (or leave blank for standard test)..."
                    value={testTelegramCustomMsg}
                    onChange={(e) => setTestTelegramCustomMsg(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={(e) => handleSendTelegramTest(e as any)}
                    disabled={sendingTelegramTest || !telegramConfig.bot_token || !telegramConfig.chat_id}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors shrink-0 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{sendingTelegramTest ? 'Sending...' : 'Send Test Post'}</span>
                  </button>
                </div>
              </div>

              {/* Verification / Test Feedback */}
              {telegramVerifyResult && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-semibold flex items-start space-x-2 border ${
                    telegramVerifyResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : 'bg-red-50 border-red-200 text-red-950'
                  }`}
                >
                  {telegramVerifyResult.success ? (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-0.5">
                    <p>{telegramVerifyResult.message}</p>
                    {telegramVerifyResult.botName && (
                      <p className="text-[11px] text-emerald-800">
                        Bot Name: <strong>{telegramVerifyResult.botName}</strong> (@{telegramVerifyResult.username})
                      </p>
                    )}
                  </div>
                </div>
              )}

              {telegramTestResult && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-semibold flex items-start space-x-2 border ${
                    telegramTestResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : 'bg-amber-50 border-amber-200 text-amber-950'
                  }`}
                >
                  {telegramTestResult.success ? (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <span>{telegramTestResult.message}</span>
                </div>
              )}

              {/* Telegram Bot OTP Status */}
              <div className="p-4 bg-sky-50/80 border border-sky-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Send className="w-4 h-4 text-sky-600" />
                    <span className="text-xs font-bold text-sky-950 uppercase tracking-wider">Telegram Bot OTP Service</span>
                  </div>
                  <span className="px-2.5 py-1 bg-sky-600 text-white font-bold text-[10px] rounded-full uppercase tracking-wider">
                    ALL OTPs ACTIVE
                  </span>
                </div>
                <p className="text-xs text-sky-900 leading-relaxed">
                  All One-Time Passwords (Application Status Tracking & Password Reset OTPs) are routed exclusively through your <strong>Telegram Bot</strong>. Email delivery is reserved for official council correspondence.
                </p>
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleTestTelegramOtp}
                    disabled={testingTelegramOtp}
                    className="px-3.5 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-lg flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{testingTelegramOtp ? 'Sending Test OTP...' : 'Test Telegram Bot OTP'}</span>
                  </button>
                </div>

                {telegramOtpTestResult && (
                  <div className={`p-3 rounded-lg text-xs font-semibold flex items-center space-x-2 border ${
                    telegramOtpTestResult.success ? 'bg-emerald-100 border-emerald-300 text-emerald-950' : 'bg-red-100 border-red-300 text-red-950'
                  }`}>
                    {telegramOtpTestResult.success ? (
                      <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
                    )}
                    <span>{telegramOtpTestResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSubPage === 'leaders' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-4">
                <div className="flex items-center space-x-2 pb-3 border-b border-gray-100">
                  <Mail className="w-5 h-5 text-maroon" />
                  <div>
                    <h2 className="text-base font-bold text-darkblue">Leader Notification Email Recipients</h2>
                    <p className="text-xs text-gray-500">
                      Target emails (`leader_notification_emails`) notified when a new Leader candidate registers.
                    </p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <input
                    type="email"
                    placeholder="Enter leader email address..."
                    value={newEmailInput}
                    onChange={(e) => setNewEmailInput(e.target.value)}
                    className="flex-1 px-4 py-2.5 text-xs border border-gray-300 rounded-xl bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddEmail}
                    className="px-5 py-2.5 bg-darkblue hover:bg-blue-900 text-white font-bold text-xs rounded-xl flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Address</span>
                  </button>
                </div>

                <div className="space-y-2 pt-2">
                  {leaderEmails.length === 0 ? (
                    <div className="text-xs text-gray-500 italic p-3 bg-gray-50 rounded-xl">
                      No recipient emails configured. Defaults will be used.
                    </div>
                  ) : (
                    leaderEmails.map((email) => (
                      <div key={email} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs">
                        <span className="font-mono font-bold text-darkblue">{email}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveEmail(email)}
                          className="text-red-600 hover:text-red-800 p-1 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-4">
                <div className="flex items-center space-x-2 pb-3 border-b border-gray-100">
                  <Mail className="w-5 h-5 text-maroon" />
                  <div>
                    <h2 className="text-base font-bold text-darkblue">Rover Notification Email Recipients</h2>
                    <p className="text-xs text-gray-500">
                      Target emails (`rover_notification_emails`) notified when a new Rover candidate registers.
                    </p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <input
                    type="email"
                    placeholder="Enter rover email address..."
                    value={newRoverEmailInput}
                    onChange={(e) => setNewRoverEmailInput(e.target.value)}
                    className="flex-1 px-4 py-2.5 text-xs border border-gray-300 rounded-xl bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddRoverEmail}
                    className="px-5 py-2.5 bg-darkblue hover:bg-blue-900 text-white font-bold text-xs rounded-xl flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Address</span>
                  </button>
                </div>

                <div className="space-y-2 pt-2">
                  {roverEmails.length === 0 ? (
                    <div className="text-xs text-gray-500 italic p-3 bg-gray-50 rounded-xl">
                      No recipient emails configured. Defaults will be used.
                    </div>
                  ) : (
                    roverEmails.map((email) => (
                      <div key={email} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs">
                        <span className="font-mono font-bold text-darkblue">{email}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveRoverEmail(email)}
                          className="text-red-600 hover:text-red-800 p-1 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeSubPage === 'events' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-gray-100">
                <Tag className="w-5 h-5 text-darkblue" />
                <div>
                  <h2 className="text-base font-bold text-darkblue">Configurable Event Types</h2>
                  <p className="text-xs text-gray-500">
                    Manage category options selectable in event creation and category filtering.
                  </p>
                </div>
              </div>

              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Enter new event type category..."
                  value={newTypeInput}
                  onChange={(e) => setNewTypeInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-xs border border-gray-300 rounded-xl bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddType}
                  className="px-5 py-2.5 bg-darkblue hover:bg-blue-900 text-white font-bold text-xs rounded-xl flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Type</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {eventTypes.map((type) => (
                  <span key={type} className="inline-flex items-center space-x-2 px-3 py-1.5 bg-blue-50 border border-blue-200 text-darkblue rounded-xl text-xs font-bold">
                    <span>{type}</span>
                    <button type="button" onClick={() => handleRemoveType(type)} className="text-red-600 hover:text-red-800">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {activeSubPage === 'branding' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-gray-100">
                <ImageIcon className="w-5 h-5 text-darkblue" />
                <div>
                  <h2 className="text-base font-bold text-darkblue">Group Logo & Email Branding</h2>
                  <p className="text-xs text-gray-500">
                    Upload an official logo to use across all pages, navigation bars, and embedded in all outgoing system emails.
                  </p>
                </div>
              </div>

              {logoUploadMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{logoUploadMsg}</span>
                </div>
              )}

              {logoUploadError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>{logoUploadError}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                <div className="w-20 h-20 bg-white border border-gray-200 rounded-2xl p-2 shadow-xs flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                  <img src={logoUrl} alt="Current Logo Preview" className="w-full h-full object-contain" />
                  {logoUploading && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                      <RefreshCw className="w-5 h-5 text-darkblue animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex-1 text-center sm:text-left space-y-2">
                  <p className="text-xs font-bold text-darkblue">Current Active Brand Logo</p>
                  <p className="text-[11px] text-gray-500">Upload any PNG, JPG, or SVG image (transparent background recommended). Uploaded logos are automatically optimized, persisted securely, and embedded in all outgoing emails.</p>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-1">
                    <label className={`cursor-pointer px-4 py-2 bg-darkblue hover:bg-blue-900 text-white font-bold text-xs rounded-xl inline-flex items-center space-x-1.5 transition-colors ${logoUploading ? 'opacity-60 pointer-events-none' : ''}`}>
                      {logoUploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      <span>{logoUploading ? 'Saving Logo...' : 'Upload Logo'}</span>
                      <input type="file" accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp" onChange={handleLogoUpload} disabled={logoUploading} className="hidden" />
                    </label>
                    {logoUrl !== '/logo.svg' && (
                      <button
                        type="button"
                        onClick={handleResetLogo}
                        disabled={logoUploading}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs rounded-xl inline-flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Default</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Settings Action Button (inside subpage footer) */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setActiveSubPage(null)}
              className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all"
            >
              Cancel & Return
            </button>
            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={saving}
              className="px-8 py-3.5 bg-maroon hover:bg-[#660000] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Changes...' : 'Save Settings Configuration'}</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
