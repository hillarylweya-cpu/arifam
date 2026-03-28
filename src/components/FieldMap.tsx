import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Use CDN for Leaflet icons to avoid build issues
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: iconUrl,
    shadowUrl: shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface FieldMapProps {
  center: [number, number];
  zoom?: number;
  fields?: { name: string; location: { lat: number; lng: number }; boundary?: { lat: number; lng: number }[] }[];
}

export default function FieldMap({ center, zoom = 13, fields = [] }: FieldMapProps) {
  return (
    <div className="h-full w-full rounded-2xl overflow-hidden border border-stone-200 shadow-inner">
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {fields.map((field, idx) => (
          <React.Fragment key={idx}>
            <Marker position={[field.location.lat, field.location.lng]}>
              <Popup>
                <div className="p-2">
                  <h4 className="font-bold text-stone-900">{field.name}</h4>
                  <p className="text-xs text-stone-500">Active Field</p>
                </div>
              </Popup>
            </Marker>
            {field.boundary && (
              <Polygon 
                positions={field.boundary.map(p => [p.lat, p.lng])} 
                pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2 }}
              />
            )}
          </React.Fragment>
        ))}
      </MapContainer>
    </div>
  );
}
