import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ClipboardList, 
  Settings, 
  Activity, 
  Search, 
  Filter, 
  MoreVertical,
  UserPlus,
  MessageCircle,
  BarChart3,
  Cpu,
  Battery,
  Wifi,
  Navigation,
  ShieldCheck,
  Clock,
  AlertCircle,
  ShieldAlert
} from 'lucide-react';
import { UserProfile, ServiceRequest, Drone, AuthLog } from '../types';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import IntegrationsPage from './IntegrationsPage';
import DroneMap from './DroneMap';

interface AdminPortalProps {
  profile: UserProfile;
}

export default function AdminPortal({ profile }: AdminPortalProps) {
  const [farmers, setFarmers] = useState<UserProfile[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [drones, setDrones] = useState<Drone[]>([]);
  const [authLogs, setAuthLogs] = useState<AuthLog[]>([]);
  const [activeTab, setActiveTab] = useState<'farmers' | 'requests' | 'drones' | 'integrations' | 'auth_logs'>('farmers');
  const [requestFilter, setRequestFilter] = useState<ServiceRequest['status'] | 'all'>('all');
  const [requestSort, setRequestSort] = useState<'newest' | 'oldest' | 'type'>('newest');

  useEffect(() => {
    const unsubFarmers = onSnapshot(query(collection(db, 'users')), (snap) => {
      setFarmers(snap.docs.map(doc => doc.data() as UserProfile).filter(u => u.role === 'Farmer'));
    }, (error) => {
      console.error("Error fetching farmers:", error);
    });

    let requestsQuery = query(collection(db, 'serviceRequests'));
    if (requestSort === 'newest') requestsQuery = query(requestsQuery, orderBy('createdAt', 'desc'));
    else if (requestSort === 'oldest') requestsQuery = query(requestsQuery, orderBy('createdAt', 'asc'));
    else if (requestSort === 'type') requestsQuery = query(requestsQuery, orderBy('serviceType', 'asc'));

    const unsubRequests = onSnapshot(requestsQuery, (snap) => {
      let data = snap.docs.map(doc => ({ ...doc.data(), requestId: doc.id } as ServiceRequest));
      if (requestFilter !== 'all') {
        data = data.filter(r => r.status === requestFilter);
      }
      setRequests(data);
    }, (error) => {
      console.error("Error fetching requests:", error);
    });

    const unsubDrones = onSnapshot(query(collection(db, 'drones')), (snap) => {
      setDrones(snap.docs.map(doc => ({ ...doc.data(), droneId: doc.id } as Drone)));
    }, (error) => {
      console.error("Error fetching drones:", error);
    });

    const unsubAuthLogs = onSnapshot(query(collection(db, 'auth_logs'), orderBy('timestamp', 'desc'), limit(50)), (snap) => {
      setAuthLogs(snap.docs.map(doc => doc.data() as AuthLog));
    }, (error) => {
      console.error("Error fetching auth logs:", error);
    });

    return () => {
      unsubFarmers();
      unsubRequests();
      unsubDrones();
      unsubAuthLogs();
    };
  }, [requestFilter, requestSort]);

  const stats = [
    { label: 'Total Farmers', value: farmers.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Active Requests', value: requests.filter(r => r.status !== 'completed').length, icon: ClipboardList, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: 'Drone Fleet', value: drones.length, icon: Cpu, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Auth Alerts', value: authLogs.length, icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-100' },
  ];

  const chartData = [
    { name: 'Mon', value: 40 },
    { name: 'Tue', value: 30 },
    { name: 'Wed', value: 65 },
    { name: 'Thu', value: 45 },
    { name: 'Fri', value: 90 },
    { name: 'Sat', value: 70 },
    { name: 'Sun', value: 85 },
  ];

  return (
    <div className="space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">Admin Dashboard</h2>
          <p className="text-stone-500">System-wide overview and management</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white border border-stone-200 px-4 py-2 rounded-xl text-sm font-bold text-stone-600 hover:bg-stone-50 transition-all">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
            <UserPlus className="w-4 h-4" />
            Add Farmer
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">+12%</span>
            </div>
            <p className="text-sm font-medium text-stone-500">{stat.label}</p>
            <h4 className="text-2xl font-bold text-stone-900">{stat.value}</h4>
          </div>
        ))}
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-stone-900">Service Request Trends</h3>
            <select className="bg-stone-50 border-none text-xs font-bold text-stone-500 rounded-lg focus:ring-0">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
          <h3 className="font-bold text-stone-900 mb-6">System Alerts</h3>
          <div className="space-y-4">
            {[
              { title: 'Drone #04 Battery Low', time: '2 mins ago', type: 'warning' },
              { title: 'New Farmer Registered', time: '15 mins ago', type: 'info' },
              { title: 'Service Request Overdue', time: '1 hour ago', type: 'error' },
              { title: 'Weather Update: Rain Expected', time: '3 hours ago', type: 'info' },
            ].map((alert, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-2xl hover:bg-stone-50 transition-colors">
                <div className={`mt-1 w-2 h-2 rounded-full ${
                  alert.type === 'error' ? 'bg-red-500' : alert.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                }`} />
                <div>
                  <p className="text-sm font-bold text-stone-900">{alert.title}</p>
                  <p className="text-xs text-stone-500">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Management Tabs */}
      <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-stone-100 overflow-x-auto">
          {(['farmers', 'requests', 'drones', 'integrations', 'auth_logs'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab 
                  ? 'text-emerald-600 border-emerald-600 bg-emerald-50/50' 
                  : 'text-stone-400 border-transparent hover:text-stone-600'
              }`}
            >
              {tab === 'auth_logs' ? 'Auth Logs' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'integrations' && <IntegrationsPage />}
          {activeTab === 'auth_logs' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-stone-900 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-500" />
                  Authentication Security Logs
                </h3>
                <span className="text-xs text-stone-400">Showing last 50 events</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                      <th className="pb-4 px-4">Timestamp</th>
                      <th className="pb-4 px-4">User</th>
                      <th className="pb-4 px-4">Error Code</th>
                      <th className="pb-4 px-4">Mode</th>
                      <th className="pb-4 px-4">Domain</th>
                      <th className="pb-4 px-4">Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {authLogs.length > 0 ? authLogs.map((log, i) => (
                      <tr key={i} className="group hover:bg-stone-50 transition-colors">
                        <td className="py-4 px-4 text-xs text-stone-500 whitespace-nowrap">
                          {format(new Date(log.timestamp), 'MMM d, HH:mm:ss')}
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-xs font-bold text-stone-900">{log.email || 'Anonymous'}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2 py-1 rounded-lg bg-red-50 text-red-600 text-[10px] font-bold border border-red-100">
                            {log.errorCode}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-xs text-stone-500 uppercase">{log.mode}</td>
                        <td className="py-4 px-4 text-xs text-stone-400 truncate max-w-[150px]">{log.domain}</td>
                        <td className="py-4 px-4 text-xs text-stone-600 max-w-xs truncate">{log.message}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-stone-400 italic">No authentication logs found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {activeTab === 'farmers' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                    <th className="pb-4 px-4">Farmer</th>
                    <th className="pb-4 px-4">Email</th>
                    <th className="pb-4 px-4">Joined</th>
                    <th className="pb-4 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {farmers.map((farmer, i) => (
                    <tr key={i} className="group hover:bg-stone-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-xs">
                            {farmer.displayName?.[0]}
                          </div>
                          <span className="font-bold text-stone-900">{farmer.displayName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-stone-600">{farmer.email}</td>
                      <td className="py-4 px-4 text-sm text-stone-500">{format(new Date(farmer.createdAt), 'MMM d, yyyy')}</td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <button className="p-2 text-stone-400 hover:text-emerald-600 transition-colors">
                            <MessageCircle className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-stone-400 hover:text-stone-600 transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                  {(['all', 'pending', 'assigned', 'in-progress', 'completed'] as const).map(status => (
                    <button
                      key={status}
                      onClick={() => setRequestFilter(status)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all capitalize ${
                        requestFilter === status 
                          ? 'bg-emerald-600 text-white shadow-md' 
                          : 'bg-stone-50 text-stone-500 hover:bg-stone-100'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-stone-400">Sort By:</span>
                  <select 
                    value={requestSort}
                    onChange={(e) => setRequestSort(e.target.value as any)}
                    className="bg-stone-50 border-none text-xs font-bold text-stone-600 rounded-xl focus:ring-0 px-4 py-2"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="type">Service Type</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {requests.length > 0 ? requests.map(req => (
                  <div key={req.requestId} className="bg-stone-50/50 p-6 rounded-3xl border border-stone-100 hover:border-emerald-200 transition-all group">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                          <ClipboardList className="w-6 h-6 text-stone-400 group-hover:text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-bold text-stone-900 capitalize">{req.serviceType}</p>
                          <p className="text-xs text-stone-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(req.createdAt), 'MMM d, HH:mm')}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        req.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        req.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                        req.status === 'assigned' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                    <p className="text-sm text-stone-600 line-clamp-2 mb-6">{req.details}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-stone-200 rounded-full" />
                        <span className="text-xs font-bold text-stone-500">Farmer ID: {req.farmerId.slice(0, 6)}...</span>
                      </div>
                      <button className="text-emerald-600 text-xs font-bold hover:underline">Manage Request</button>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-full py-12 text-center border-2 border-dashed border-stone-100 rounded-3xl">
                    <p className="text-stone-400">No service requests found matching your filters.</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {activeTab === 'drones' && (
            <div className="space-y-8">
              <div className="h-[400px] bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
                <DroneMap 
                  drones={drones} 
                  center={drones.length > 0 && drones[0].location ? [drones[0].location.lat, drones[0].location.lng] : [-1.286389, 36.817223]} 
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {drones.length > 0 ? drones.map(drone => (
                <div key={drone.droneId} className="p-6 border border-stone-100 rounded-3xl hover:border-emerald-200 transition-all group">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                      <Cpu className="w-6 h-6 text-stone-400 group-hover:text-emerald-600" />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      drone.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                      drone.status === 'maintenance' ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-600'
                    }`}>
                      {drone.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-stone-900 mb-1">{drone.name}</h4>
                  <p className="text-xs text-stone-500 mb-6">{drone.specs}</p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-stone-500">
                        <Battery className="w-3 h-3" />
                        Battery
                      </div>
                      <span className={`font-bold ${drone.battery < 20 ? 'text-red-500' : 'text-emerald-600'}`}>{drone.battery}%</span>
                    </div>
                    <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${drone.battery < 20 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${drone.battery}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs pt-2">
                      <div className="flex items-center gap-2 text-stone-500">
                        <Wifi className="w-3 h-3" />
                        Signal
                      </div>
                      <span className="font-bold text-stone-900">Strong</span>
                    </div>
                  </div>
                  
                  <button className="w-full mt-6 py-3 bg-stone-50 text-stone-600 rounded-xl text-sm font-bold hover:bg-emerald-50 hover:text-emerald-700 transition-all">
                    View Flight Logs
                  </button>
                </div>
              )) : (
                <div className="col-span-full py-12 text-center border-2 border-dashed border-stone-100 rounded-3xl">
                  <p className="text-stone-400">No drones in the fleet yet.</p>
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
