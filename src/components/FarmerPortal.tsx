import React, { useState, useEffect, useRef } from 'react';
import { 
  Cloud, 
  Droplets, 
  Thermometer, 
  AlertTriangle, 
  Send, 
  Mic, 
  Volume2, 
  Plus, 
  MapPin,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Loader2,
  ClipboardList
} from 'lucide-react';
import { UserProfile, Field, ServiceRequest, WeatherData, Alert, MarketPrice } from '../types';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { getAgriAdvice, textToSpeech } from '../services/geminiService';
import { format } from 'date-fns';

import FieldMap from './FieldMap';

interface FarmerPortalProps {
  profile: UserProfile;
}

export default function FarmerPortal({ profile }: FarmerPortalProps) {
  const [weather, setWeather] = useState<WeatherData>({ temp: 24, humidity: 65, condition: 'Partly Cloudy', icon: 'cloud' });
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [view, setView] = useState<'dashboard' | 'fields' | 'requests' | 'ai' | 'alerts'>('dashboard');
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [newRequestFieldId, setNewRequestFieldId] = useState<string | null>(null);

  const handleRequestService = (fieldId: string) => {
    setNewRequestFieldId(fieldId);
    setView('requests');
    setSelectedField(null);
  };
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profile.uid) return;

    // Fetch Fields
    const fieldsQuery = query(collection(db, 'fields'), where('farmerId', '==', profile.uid));
    const unsubscribeFields = onSnapshot(fieldsQuery, (snapshot) => {
      const fieldsData = snapshot.docs.map(doc => {
        const data = doc.data() as Field;
        const size = calculateSize(data.boundary);
        return { 
          ...data, 
          fieldId: doc.id,
          sizeHectares: data.sizeHectares || size.hectares,
          sizeAcres: data.sizeAcres || size.acres
        };
      });
      setFields(fieldsData);
    }, (error) => {
      console.error("Error fetching fields:", error);
    });

    // Fetch Alerts
    const alertsQuery = query(collection(db, 'alerts'), where('userId', '==', profile.uid));
    const unsubscribeAlerts = onSnapshot(alertsQuery, (snapshot) => {
      setAlerts(snapshot.docs.map(doc => ({ ...doc.data(), alertId: doc.id } as Alert)));
    }, (error) => {
      console.error("Error fetching alerts:", error);
    });

    // Fetch Requests
    const requestsQuery = query(collection(db, 'serviceRequests'), where('farmerId', '==', profile.uid));
    const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ ...doc.data(), requestId: doc.id } as ServiceRequest)));
    }, (error) => {
      console.error("Error fetching requests:", error);
    });

    // Mock Market Prices
    setMarketPrices([
      { crop: 'Maize', price: 280, region: 'East Africa', trend: 'up' },
      { crop: 'Wheat', price: 340, region: 'Global', trend: 'down' },
      { crop: 'Soybeans', price: 520, region: 'Americas', trend: 'up' },
      { crop: 'Coffee', price: 410, region: 'Global', trend: 'up' },
    ]);

    return () => {
      unsubscribeFields();
      unsubscribeAlerts();
      unsubscribeRequests();
    };
  }, [profile.uid]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    try {
      const advice = await getAgriAdvice(userMessage, chatHistory);
      setChatHistory(prev => [...prev, { role: 'model', text: advice }]);
      
      const audio = await textToSpeech(advice);
      if (audio) setAudioUrl(audio);
    } catch (error) {
      console.error('Error in AI Assistant:', error);
      setChatHistory(prev => [...prev, { role: 'model', text: "I'm sorry, I'm having trouble connecting right now. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const calculateSize = (boundary: { lat: number, lng: number }[]) => {
    if (!boundary || boundary.length < 3) return { hectares: 0, acres: 0 };
    // Simple polygon area calculation (approximate for small areas)
    const earthRadius = 6371000; // meters
    let area = 0;
    for (let i = 0; i < boundary.length; i++) {
      const p1 = boundary[i];
      const p2 = boundary[(i + 1) % boundary.length];
      area += (p2.lng - p1.lng) * (2 + Math.sin(p1.lat * Math.PI / 180) + Math.sin(p2.lat * Math.PI / 180));
    }
    area = Math.abs(area * earthRadius * earthRadius / 2);
    const hectares = area / 10000;
    const acres = hectares * 2.47105;
    return { hectares: Number(hectares.toFixed(2)), acres: Number(acres.toFixed(2)) };
  };

  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
              <MapPin className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Active</span>
          </div>
          <p className="text-sm font-medium text-stone-500">My Fields</p>
          <h4 className="text-2xl font-bold text-stone-900">{fields.length}</h4>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-amber-600" />
            </div>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">{requests.filter(r => r.status === 'pending').length} New</span>
          </div>
          <p className="text-sm font-medium text-stone-500">Open Requests</p>
          <h4 className="text-2xl font-bold text-stone-900">{requests.filter(r => r.status !== 'completed').length}</h4>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
              <Cloud className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm font-medium text-stone-500">Current Weather</p>
          <h4 className="text-2xl font-bold text-stone-900">{weather.temp}°{profile.units === 'imperial' ? 'F' : 'C'}</h4>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <p className="text-sm font-medium text-stone-500">Active Alerts</p>
          <h4 className="text-2xl font-bold text-stone-900">{alerts.length}</h4>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weather & Alerts */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 text-white shadow-xl shadow-emerald-200 relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="text-center md:text-left">
                <p className="text-emerald-100 text-sm font-medium mb-2">Today's Forecast</p>
                <h3 className="text-6xl font-black mb-2">
                  {weather.temp}°{profile.units === 'imperial' ? 'F' : 'C'}
                </h3>
                <p className="text-xl font-medium text-emerald-50 opacity-90">{weather.condition}</p>
              </div>
              <div className="flex flex-col items-center gap-4">
                <Cloud className="w-24 h-24 text-emerald-100 opacity-80" />
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-2xl backdrop-blur-md border border-white/10">
                    <Droplets className="w-5 h-5" />
                    <span className="font-bold">{weather.humidity}%</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-2xl backdrop-blur-md border border-white/10">
                    <Thermometer className="w-5 h-5" />
                    <span className="font-bold">High 28°C</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -right-12 -top-12 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-stone-900 flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
                Recent Alerts
              </h3>
              <button 
                onClick={() => setView('alerts')}
                className="text-emerald-600 font-bold hover:underline text-sm"
              >
                View All
              </button>
            </div>
            <div className="space-y-4">
              {alerts.length > 0 ? alerts.slice(0, 3).map(alert => (
                <div key={alert.alertId} className={`p-5 rounded-2xl flex items-start gap-5 transition-all hover:scale-[1.01] ${
                  alert.severity === 'high' ? 'bg-red-50 border border-red-100' : 
                  alert.severity === 'medium' ? 'bg-amber-50 border border-amber-100' : 'bg-blue-50 border border-blue-100'
                }`}>
                  <div className={`mt-1 p-2 rounded-xl ${
                    alert.severity === 'high' ? 'bg-red-200 text-red-700' : 
                    alert.severity === 'medium' ? 'bg-amber-200 text-amber-700' : 'bg-blue-200 text-blue-700'
                  }`}>
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-stone-900">{alert.message}</p>
                    <p className="text-xs text-stone-500 mt-1">{format(new Date(alert.createdAt), 'MMM d, h:mm a')}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-12 text-stone-400 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-100">
                  <p className="text-sm">No active alerts. Your farm is safe!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Shortcuts & Market */}
        <div className="space-y-8">
          <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-sm">
            <h3 className="text-xl font-bold text-stone-900 mb-6">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setView('requests')}
                className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all group"
              >
                <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">New Request</span>
              </button>
              <button 
                onClick={() => setView('fields')}
                className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all group"
              >
                <MapPin className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">My Fields</span>
              </button>
              <button 
                onClick={() => setView('ai')}
                className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-purple-50 text-purple-700 hover:bg-purple-100 transition-all group"
              >
                <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">Agri AI</span>
              </button>
              <button className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all group">
                <ClipboardList className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">Reports</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-sm">
            <h3 className="text-xl font-bold text-stone-900 mb-6">Market Trends</h3>
            <div className="space-y-4">
              {marketPrices.slice(0, 4).map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl hover:bg-stone-50 transition-colors">
                  <div>
                    <p className="font-bold text-stone-900">{item.crop}</p>
                    <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">{item.region}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-emerald-600">${item.price}</p>
                    <p className={`text-[10px] font-bold ${item.trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {item.trend === 'up' ? '▲ 2.4%' : '▼ 1.1%'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFields = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-stone-900">My Fields</h3>
        <div className="flex items-center gap-4">
          <div className="flex bg-stone-100 p-1 rounded-xl">
            <button 
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white text-emerald-600 shadow-sm' : 'text-stone-500'}`}
            >
              List
            </button>
            <button 
              onClick={() => setViewMode('map')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'map' ? 'bg-white text-emerald-600 shadow-sm' : 'text-stone-500'}`}
            >
              Map
            </button>
          </div>
          <button className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
            <Plus className="w-4 h-4" />
            Add New Field
          </button>
        </div>
      </div>

      {viewMode === 'map' ? (
        <div className="h-[600px] bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
          <FieldMap 
            center={fields.length > 0 ? [fields[0].location.lat, fields[0].location.lng] : (profile.location ? [profile.location.lat, profile.location.lng] : [-1.286389, 36.817223])} 
            fields={fields}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fields.map(field => (
            <div 
              key={field.fieldId} 
              onClick={() => setSelectedField(field)}
              className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm hover:border-emerald-200 transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-stone-50 rounded-2xl flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                  <MapPin className="w-7 h-7 text-stone-400 group-hover:text-emerald-600" />
                </div>
                <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
              </div>
              <h4 className="text-lg font-bold text-stone-900 mb-1">{field.name}</h4>
              <p className="text-sm text-stone-500 mb-6">{field.placeName || 'Location set'}</p>
              
              <div className="flex gap-4">
                <div className="bg-stone-50 px-3 py-2 rounded-xl">
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Size</p>
                  <p className="text-sm font-bold text-stone-800">{field.sizeHectares || 0} ha</p>
                </div>
                <div className="bg-stone-50 px-3 py-2 rounded-xl">
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Crop</p>
                  <p className="text-sm font-bold text-stone-800">{field.cropType || 'N/A'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Field Details Modal */}
      {selectedField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="relative h-48 bg-emerald-600">
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <button 
                onClick={() => setSelectedField(null)}
                className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-md transition-colors"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
              <div className="absolute bottom-6 left-8 text-white">
                <h3 className="text-3xl font-black">{selectedField.name}</h3>
                <p className="text-emerald-50 opacity-90 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {selectedField.placeName}
                </p>
              </div>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-stone-50 p-4 rounded-3xl">
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-1">Hectares</p>
                  <p className="text-xl font-black text-stone-900">{selectedField.sizeHectares || 0}</p>
                </div>
                <div className="bg-stone-50 p-4 rounded-3xl">
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-1">Acres</p>
                  <p className="text-xl font-black text-stone-900">{selectedField.sizeAcres || 0}</p>
                </div>
                <div className="bg-stone-50 p-4 rounded-3xl">
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-1">Crop Type</p>
                  <p className="text-xl font-black text-emerald-600">{selectedField.cropType || 'None'}</p>
                </div>
                <div className="bg-stone-50 p-4 rounded-3xl">
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-1">Last Maint.</p>
                  <p className="text-sm font-bold text-stone-900">{selectedField.lastMaintenanceDate ? format(new Date(selectedField.lastMaintenanceDate), 'MMM d, yyyy') : 'Never'}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-stone-900 mb-3 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-emerald-600" />
                  Field Notes
                </h4>
                <div className="bg-stone-50 p-6 rounded-3xl text-stone-600 text-sm leading-relaxed min-h-[100px]">
                  {selectedField.notes || 'No notes added for this field yet.'}
                </div>
              </div>

              <div className="flex gap-4">
                <button className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
                  Edit Field
                </button>
                <button 
                  onClick={() => handleRequestService(selectedField.fieldId)}
                  className="flex-1 py-4 bg-stone-100 text-stone-600 rounded-2xl font-bold hover:bg-stone-200 transition-all"
                >
                  Request Service
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Role-based Navigation Tabs */}
      <div className="flex items-center gap-4 mb-10 overflow-x-auto pb-2 scrollbar-hide">
        <button 
          onClick={() => setView('dashboard')}
          className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${view === 'dashboard' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-white text-stone-500 hover:bg-stone-50'}`}
        >
          Dashboard
        </button>
        <button 
          onClick={() => setView('fields')}
          className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${view === 'fields' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-white text-stone-500 hover:bg-stone-50'}`}
        >
          My Fields
        </button>
        <button 
          onClick={() => setView('requests')}
          className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${view === 'requests' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-white text-stone-500 hover:bg-stone-50'}`}
        >
          Service Requests
        </button>
        <button 
          onClick={() => setView('ai')}
          className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${view === 'ai' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-white text-stone-500 hover:bg-stone-50'}`}
        >
          Agri AI Assistant
        </button>
      </div>

      {view === 'dashboard' && renderDashboard()}
      {view === 'fields' && renderFields()}
      {view === 'requests' && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-stone-900">Service Requests</h3>
            <button className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
              <Plus className="w-5 h-5" />
              New Request
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {requests.map(req => (
              <div key={req.requestId} className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm hover:border-emerald-200 transition-all group">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-stone-50 rounded-2xl flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                      <ClipboardList className="w-7 h-7 text-stone-400 group-hover:text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-stone-900 capitalize">{req.serviceType}</p>
                      <p className="text-xs text-stone-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(req.preferredDateTime), 'MMM d, HH:mm')}
                      </p>
                    </div>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    req.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                    req.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                    req.status === 'assigned' ? 'bg-purple-100 text-purple-700' : 'bg-stone-100 text-stone-600'
                  }`}>
                    {req.status}
                  </span>
                </div>
                <p className="text-sm text-stone-600 line-clamp-2 mb-6">{req.details || 'No additional details provided.'}</p>
                <div className="flex items-center justify-between pt-6 border-t border-stone-50">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-stone-200 border-2 border-white" />
                    <div className="w-8 h-8 rounded-full bg-stone-300 border-2 border-white" />
                  </div>
                  <button className="text-emerald-600 text-sm font-bold hover:underline">View Details</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {view === 'alerts' && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-stone-900">All Alerts</h3>
            <button 
              onClick={() => setView('dashboard')}
              className="text-emerald-600 font-bold hover:underline text-sm"
            >
              Back to Dashboard
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {alerts.map(alert => (
              <div key={alert.alertId} className={`p-6 rounded-3xl flex items-start gap-5 transition-all ${
                alert.severity === 'high' ? 'bg-red-50 border border-red-100' : 
                alert.severity === 'medium' ? 'bg-amber-50 border border-amber-100' : 'bg-blue-50 border border-blue-100'
              }`}>
                <div className={`mt-1 p-3 rounded-2xl ${
                  alert.severity === 'high' ? 'bg-red-200 text-red-700' : 
                  alert.severity === 'medium' ? 'bg-amber-200 text-amber-700' : 'bg-blue-200 text-blue-700'
                }`}>
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      alert.severity === 'high' ? 'bg-red-200 text-red-800' : 
                      alert.severity === 'medium' ? 'bg-amber-200 text-amber-800' : 'bg-blue-200 text-blue-800'
                    }`}>
                      {alert.severity} Priority
                    </span>
                    <p className="text-xs text-stone-500">{format(new Date(alert.createdAt), 'MMM d, yyyy')}</p>
                  </div>
                  <p className="font-bold text-stone-900 text-lg mb-2">{alert.message}</p>
                  <p className="text-sm text-stone-600 leading-relaxed">
                    This alert was issued for your farm location. Please take necessary precautions and check your fields.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {view === 'ai' && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-[40px] border border-stone-100 shadow-xl flex flex-col h-[700px] overflow-hidden">
            {/* AI Assistant UI (same as before but larger) */}
            <div className="p-8 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-stone-900">Agri AI Expert</h3>
                  <p className="text-sm text-emerald-600 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    Always here to help
                  </p>
                </div>
              </div>
              {audioUrl && (
                <button 
                  onClick={() => new Audio(audioUrl).play()}
                  className="p-3 bg-white text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all shadow-sm border border-stone-100"
                >
                  <Volume2 className="w-6 h-6" />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {chatHistory.length === 0 && (
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Mic className="w-10 h-10 text-stone-300" />
                  </div>
                  <h4 className="text-xl font-bold text-stone-900 mb-2">How can I help you today?</h4>
                  <p className="text-stone-400 max-w-sm mx-auto">Ask me about crop diseases, planting schedules, or soil health.</p>
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] p-5 rounded-3xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-emerald-600 text-white rounded-br-none shadow-lg shadow-emerald-100' 
                      : 'bg-stone-100 text-stone-800 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-stone-100 p-5 rounded-3xl rounded-bl-none">
                    <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-8 bg-stone-50/50 border-t border-stone-100">
              <div className="flex items-center gap-3 bg-white rounded-3xl p-3 shadow-sm border border-stone-100">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask your farming question..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-base px-4"
                />
                <button className="p-3 text-stone-400 hover:text-emerald-600 transition-colors">
                  <Mic className="w-6 h-6" />
                </button>
                <button 
                  onClick={handleSendMessage}
                  className="p-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                >
                  <Send className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

}
