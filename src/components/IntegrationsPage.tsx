import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  MessageSquare, 
  Cloud, 
  Map as MapIcon, 
  TrendingUp, 
  Save, 
  CheckCircle2, 
  XCircle,
  Loader2,
  ShieldCheck,
  Server
} from 'lucide-react';
import { IntegrationStatus } from '../types';

export default function IntegrationsPage() {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [config, setConfig] = useState({
    email: { smtpHost: '', smtpPort: '', user: '', pass: '' },
    sms: { accountSid: '', authToken: '', fromNumber: '' },
    weather: { apiKey: '' },
    maps: { apiKey: '' },
    market: { apiKey: '' }
  });

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/integrations/status');
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error("Error fetching status:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (type: string) => {
    setSaving(type);
    try {
      const res = await fetch('/api/integrations/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, config: config[type as keyof typeof config] })
      });
      if (res.ok) {
        await fetchStatus();
        alert(`${type.toUpperCase()} integration updated successfully.`);
      }
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-emerald-600" /></div>;

  const sections = [
    { 
      id: 'email', 
      title: 'Email Provider', 
      icon: Mail, 
      desc: 'Used for sending OTP and password reset codes.',
      fields: [
        { key: 'smtpHost', label: 'SMTP Host', placeholder: 'smtp.gmail.com' },
        { key: 'smtpPort', label: 'SMTP Port', placeholder: '587' },
        { key: 'user', label: 'Username / Email', placeholder: 'user@example.com' },
        { key: 'pass', label: 'Password / App Key', placeholder: '••••••••', type: 'password' },
      ]
    },
    { 
      id: 'sms', 
      title: 'SMS Provider (Twilio)', 
      icon: MessageSquare, 
      desc: 'Used for sending OTP via SMS worldwide.',
      fields: [
        { key: 'accountSid', label: 'Account SID', placeholder: 'AC...' },
        { key: 'authToken', label: 'Auth Token', placeholder: '••••••••', type: 'password' },
        { key: 'fromNumber', label: 'From Number', placeholder: '+1234567890' },
      ]
    },
    { 
      id: 'weather', 
      title: 'Weather API', 
      icon: Cloud, 
      desc: 'Personalized weather data for farmers based on GPS.',
      fields: [
        { key: 'apiKey', label: 'API Key', placeholder: 'Enter Weather API Key', type: 'password' },
      ]
    },
    { 
      id: 'maps', 
      title: 'Maps & Geocoding', 
      icon: MapIcon, 
      desc: 'Used for field boundaries and reverse geocoding.',
      fields: [
        { key: 'apiKey', label: 'API Key', placeholder: 'Enter Maps API Key', type: 'password' },
      ]
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-emerald-600" />
          System Integrations
        </h2>
        <p className="text-stone-500">Securely manage API keys and messaging providers</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {sections.map((section) => (
          <div key={section.id} className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-stone-50 flex items-center justify-between bg-stone-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                  <section.icon className="w-6 h-6 text-stone-400" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900">{section.title}</h3>
                  <p className="text-xs text-stone-500">{section.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {status?.[section.id as keyof IntegrationStatus] ? (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    <CheckCircle2 className="w-3 h-3" /> Connected
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    <XCircle className="w-3 h-3" /> Not Configured
                  </span>
                )}
              </div>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.fields.map((field) => (
                <div key={field.key} className="space-y-1">
                  <label className="text-xs font-bold text-stone-500 uppercase ml-1">{field.label}</label>
                  <input
                    type={field.type || 'text'}
                    placeholder={field.placeholder}
                    value={(config[section.id as keyof typeof config] as any)[field.key]}
                    onChange={(e) => {
                      const newConfig = { ...config };
                      (newConfig[section.id as keyof typeof config] as any)[field.key] = e.target.value;
                      setConfig(newConfig);
                    }}
                    className="w-full bg-stone-50 border-stone-100 rounded-2xl py-3 px-4 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              ))}
              <div className="md:col-span-2 flex justify-end mt-4">
                <button
                  onClick={() => handleSave(section.id)}
                  disabled={saving === section.id}
                  className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-emerald-700 transition-all disabled:opacity-50"
                >
                  {saving === section.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 flex items-start gap-4">
        <Server className="w-6 h-6 text-amber-600 mt-1" />
        <div>
          <h4 className="font-bold text-amber-900">Security Note</h4>
          <p className="text-sm text-amber-800 mt-1">
            API keys and credentials are stored securely on the server and are never exposed to the client-side browser. 
            Ensure you use environment variables for production deployments.
          </p>
        </div>
      </div>
    </div>
  );
}
