import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CEG_BOUNDS } from '../utils/mapUtils';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet's default icon path issues in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

const DEFAULT_CENTER = [13.010236, 80.235870]; // CEG Center

function MapInteractions({ mode, onLocationChange }) {
  useMapEvents({
    click(e) {
      if (mode === 'select' && onLocationChange) {
        const { lat, lng } = e.latlng;
        // Simple bounding box check before allowing pin drop
        if (lat >= CEG_BOUNDS.minLat && lat <= CEG_BOUNDS.maxLat &&
            lng >= CEG_BOUNDS.minLng && lng <= CEG_BOUNDS.maxLng) {
          onLocationChange({ latitude: lat, longitude: lng });
        }
      }
    }
  });
  return null;
}

export default function CampusMap({ mode = 'view', value, onLocationChange }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  
  const position = value?.latitude && value?.longitude
    ? [value.latitude, value.longitude]
    : DEFAULT_CENTER;

  useEffect(() => {
    // Smooth animation when position changes externally
    if (markerRef.current && value?.latitude && value?.longitude) {
      const newPos = new L.LatLng(value.latitude, value.longitude);
      markerRef.current.setLatLng(newPos);
      
      // Auto-pan if map is initialized and out of view
      if (mapRef.current) {
         mapRef.current.panTo(newPos, { animate: true, duration: 1 });
      }
    }
  }, [value?.latitude, value?.longitude]);

  return (
    <div className="w-full h-full min-h-[300px] rounded-xl overflow-hidden border border-white/10 relative z-10">
      <MapContainer
        center={position}
        zoom={16}
        ref={mapRef}
        scrollWheelZoom={mode === 'select'}
        style={{ height: '100%', width: '100%', minHeight: '300px' }}
        maxBounds={[
          [CEG_BOUNDS.minLat - 0.01, CEG_BOUNDS.minLng - 0.01],
          [CEG_BOUNDS.maxLat + 0.01, CEG_BOUNDS.maxLng + 0.01]
        ]}
        maxBoundsViscosity={1.0}
        minZoom={14}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles-dark"
        />
        
        {value?.latitude && value?.longitude && (
          <Marker
            position={[value.latitude, value.longitude]}
            ref={markerRef}
            draggable={mode === 'select'}
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target;
                const pos = marker.getLatLng();
                if (pos.lat >= CEG_BOUNDS.minLat && pos.lat <= CEG_BOUNDS.maxLat &&
                    pos.lng >= CEG_BOUNDS.minLng && pos.lng <= CEG_BOUNDS.maxLng) {
                  onLocationChange?.({ latitude: pos.lat, longitude: pos.lng });
                } else {
                  // Snap back if out of bounds
                  marker.setLatLng(position);
                }
              }
            }}
          />
        )}
        <MapInteractions mode={mode} onLocationChange={onLocationChange} />
      </MapContainer>
      
      <style>{`
        .leaflet-marker-icon,
        .leaflet-marker-shadow {
          transition: transform 0.5s ease-in-out;
        }
        .map-tiles-dark {
          filter: grayscale(100%) invert(100%) hue-rotate(180deg) contrast(90%);
        }
      `}</style>
    </div>
  );
}
