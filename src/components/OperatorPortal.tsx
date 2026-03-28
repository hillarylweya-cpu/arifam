import React, { useState, useEffect } from 'react';
import { 
  Navigation, 
  Battery, 
  Wifi, 
  Map as MapIcon, 
  AlertCircle, 
  CheckCircle2, 
  Play, 
  Square,
  MessageSquare,
  Send,
  Loader2,
  ClipboardList
} from 'lucide-react';
import { UserProfile, Drone, ServiceRequest } from '../types';
import { collection, onSnapshot, query, where, updateDoc, doc, addDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { format } from 'date-fns';
import DroneMap from './DroneMap';

interface OperatorPortalProps {
  profile: UserProfile;
}

export default function OperatorPortal({ profile }: OperatorPortalProps) {
  const [assignedDrones, setAssignedDrones] = useState<Drone[]>([]);
  const [activeMissions, setActiveMissions] = useState<ServiceRequest[]>([]);
  const [selectedDrone, setSelectedDrone] = useState<Drone | null>(null);
  const [updateMsg, setUpdateMsg] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const unsubDrones = onSnapshot(query(collection(db, 'drones'), where('assignedOperatorId', '==', profile.uid)), (snap) => {
      const droneList = snap.docs.map(doc => ({ ...doc.data(), droneId: doc.id } as Drone));
      setAssignedDrones(droneList);
      if (droneList.length > 0 && !selectedDrone) setSelectedDrone(droneList[0]);
    }, (error) => {
      console.error("Error fetching drones:", error);
    });

    const unsubMissions = onSnapshot(query(collection(db, 'serviceRequests'), where('assignedOperatorId', '==', profile.uid), where('status', 'in', ['assigned', 'in-progress'])), (snap) => {
      setActiveMissions(snap.docs.map(doc => ({ ...doc.data(), requestId: doc.id } as ServiceRequest)));
    }, (error) => {
      console.error("Error fetching missions:", error);
    });

    return () => {
      unsubDrones();
      unsubMissions();
    };
  }, [profile.uid]);

  const handleStatusUpdate = async (droneId: string, status: Drone['status']) => {
    try {
      await updateDoc(doc(db, 'drones', droneId), { status });
    } catch (err) {
      console.error("Error updating drone status:", err);
    }
  };

  const sendUpdateToAdmin = async () => {
    if (!updateMsg.trim() || !selectedDrone) return;
    setIsSending(true);
    try {
      const alertRef = doc(collection(db, 'alerts'));
      await setDoc(alertRef, {
        alertId: alertRef.id,
        userId: 'admin_id', // In a real app, this would be the admin's UID
        type: 'drone',
        message: `Operator ${profile.displayName}: ${selectedDrone.name} - ${updateMsg}`,
        severity: 'medium',
        createdAt: new Date().toISOString()
      });
      setUpdateMsg('');
    } catch (err) {
      console.error("Error sending update:", err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">Operator Dashboard</h2>
          <p className="text-stone-500">Manage your assigned drones and missions</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl font-bold text-sm">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          Active Session
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Drone Status Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-stone-100 shadow-sm p-6">
            <h3 className="font-bold text-stone-900 mb-6 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-emerald-600" />
              Assigned Drones
            </h3>
            <div className="h-[300px] mb-6 rounded-2xl overflow-hidden border border-stone-100">
              <DroneMap 
                drones={assignedDrones} 
                center={selectedDrone?.location ? [selectedDrone.location.lat, selectedDrone.location.lng] : [-1.286389, 36.817223]} 
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignedDrones.map(drone => (
                <div 
                  key={drone.droneId}
                  onClick={() => setSelectedDrone(drone)}
                  className={`p-6 rounded-3xl border-2 transition-all cursor-pointer ${
                    selectedDrone?.droneId === drone.droneId 
                      ? 'border-emerald-500 bg-emerald-50/30' 
                      : 'border-stone-100 hover:border-emerald-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-bold text-stone-900">{drone.name}</h4>
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                      drone.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'
                    }`}>
                      {drone.status}
                    </span>
                  </div>
                  <div className="flex gap-4 mb-6">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-stone-600">
                      <Battery className={`w-4 h-4 ${drone.battery < 20 ? 'text-red-500' : 'text-emerald-500'}`} />
                      {drone.battery}%
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-stone-600">
                      <Wifi className="w-4 h-4 text-emerald-500" />
                      Strong
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleStatusUpdate(drone.droneId, 'active'); }}
                      className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1"
                    >
                      <Play className="w-3 h-3" /> Start
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleStatusUpdate(drone.droneId, 'offline'); }}
                      className="flex-1 py-2 bg-stone-100 text-stone-600 rounded-xl text-xs font-bold hover:bg-stone-200 transition-colors flex items-center justify-center gap-1"
                    >
                      <Square className="w-3 h-3" /> Stop
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Missions */}
          <div className="bg-white rounded-3xl border border-stone-100 shadow-sm p-6">
            <h3 className="font-bold text-stone-900 mb-6 flex items-center gap-2">
              <MapIcon className="w-5 h-5 text-emerald-600" />
              Active Missions
            </h3>
            <div className="space-y-4">
              {activeMissions.length > 0 ? activeMissions.map(mission => (
                <div key={mission.requestId} className="p-4 border border-stone-100 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                      <ClipboardList className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-bold text-stone-900 capitalize">{mission.serviceType}</p>
                      <p className="text-xs text-stone-500">Requested: {format(new Date(mission.createdAt), 'MMM d, HH:mm')}</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors">
                    Update Status
                  </button>
                </div>
              )) : (
                <div className="text-center py-8 text-stone-400">
                  <p className="text-sm">No active missions assigned.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Communication Panel */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-stone-100 shadow-sm p-6 h-full flex flex-col">
            <h3 className="font-bold text-stone-900 mb-6 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              Mission Updates
            </h3>
            <div className="flex-1 bg-stone-50 rounded-2xl p-4 mb-4 overflow-y-auto">
              <p className="text-xs text-stone-400 text-center mb-4">Send real-time updates to the Admin hub</p>
              {/* Mock message history */}
              <div className="space-y-3">
                <div className="bg-white p-3 rounded-xl shadow-sm border border-stone-100">
                  <p className="text-xs font-bold text-emerald-600 mb-1">System</p>
                  <p className="text-xs text-stone-700 italic">Connected to Admin Hub</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <textarea
                value={updateMsg}
                onChange={(e) => setUpdateMsg(e.target.value)}
                placeholder="Type mission update..."
                className="w-full bg-stone-50 border-stone-100 rounded-2xl p-4 text-sm focus:ring-emerald-500 focus:border-emerald-500 min-h-[100px]"
              />
              <button 
                onClick={sendUpdateToAdmin}
                disabled={isSending || !selectedDrone}
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                Send to Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
