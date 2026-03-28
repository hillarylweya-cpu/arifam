import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Drone } from '../types';
import { Cpu } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

// Fix for default marker icons in Leaflet with React
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface DroneMapProps {
  drones: Drone[];
  center?: [number, number];
  zoom?: number;
}

const DroneIcon = (status: string) => {
  const color = status === 'active' ? '#10b981' : status === 'maintenance' ? '#f59e0b' : '#6b7280';
  const html = renderToStaticMarkup(
    <div style={{ 
      backgroundColor: color, 
      padding: '8px', 
      borderRadius: '12px', 
      color: 'white',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      border: '2px solid white'
    }}>
      <Cpu size={20} />
    </div>
  );
  
  return L.divIcon({
    html,
    className: 'custom-drone-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
};

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export default function DroneMap({ drones, center = [-1.286389, 36.817223], zoom = 13 }: DroneMapProps) {
  return (
    <MapContainer 
      center={center} 
      zoom={zoom} 
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ChangeView center={center} zoom={zoom} />
      {drones.map(drone => (
        drone.location && (
          <Marker 
            key={drone.droneId} 
            position={[drone.location.lat, drone.location.lng]}
            icon={DroneIcon(drone.status)}
          >
            <Popup>
              <div className="p-2">
                <h4 className="font-bold text-stone-900">{drone.name}</h4>
                <p className="text-xs text-stone-500 mb-2">{drone.specs}</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`w-2 h-2 rounded-full ${drone.status === 'active' ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                  <span className="font-bold capitalize">{drone.status}</span>
                  <span className="text-stone-400">|</span>
                  <span className="font-bold text-emerald-600">{drone.battery}% Battery</span>
                </div>
              </div>
            </Popup>
          </Marker>
        )
      ))}
    </MapContainer>
  );
}
