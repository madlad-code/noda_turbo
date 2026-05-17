// FILE: apps/web/components/views/overview/SystemsMap.tsx
// FINAL, CORRECTED FILE: This version uses lucide-react icons for the map markers,
// creating a beautiful, modern, and informative map experience.
'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Building } from '@/lib/graphql/types';
import { MapPin } from 'lucide-react';
import ReactDOMServer from 'react-dom/server';

// --- THE DEFINITIVE FIX for custom icons ---
// We create a function that generates a custom DivIcon using lucide-react icons.
// This gives us complete control over the marker's appearance and bypasses all
// default icon path issues.
const createCustomIcon = (status: string | null) => {
  let color = 'var(--color-brand-primary)'; // Default color for unknown status
  if (status === 'optimal') color = 'var(--color-accent-green)';
  if (status === 'warning') color = 'var(--color-accent-yellow)';
  if (status === 'alert') color = 'var(--color-accent-red)';

  const iconHtml = ReactDOMServer.renderToString(
    // Increase the icon size for better visibility on the map
    <MapPin style={{ color: color }} size={32} />
  );

  return L.divIcon({
    html: iconHtml,
    // FIX: The className is now empty, removing the circular background,
    // border, and shadow, leaving only the icon itself.
    className: '', 
    iconSize: [32, 32], // Match the icon size
    iconAnchor: [16, 16], // Center the icon
  });
};


interface SystemsMapProps {
  buildings: Building[];
}

export function SystemsMap({ buildings }: SystemsMapProps) {
  // Filter for buildings that have valid coordinates
  const markers = buildings.filter(
    (building) => building.asset_latitude != null && building.asset_longitude != null
  );
  
  // UPDATED: Default center for the map is now Mölndal, Sweden
  const defaultCenter: [number, number] = [57.6563, 12.0137]; // Mölndal, Sweden

  return (
    <MapContainer 
        center={defaultCenter} 
        zoom={12} // Adjusted zoom for a city view
        scrollWheelZoom={false} 
        style={{ height: '100%', width: '100%', borderRadius: 'var(--radius)' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((building) => (
        <Marker 
            key={building.uuid} 
            position={[building.asset_latitude!, building.asset_longitude!]}
            // Each marker now gets a beautiful, custom lucide-react icon
            icon={createCustomIcon(building.asset_status)}
        >
          <Popup>
            <b>{building.name}</b><br />
            Status: {building.asset_status}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}