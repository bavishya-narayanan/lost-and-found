export const CEG_BOUNDS = {
  minLat: 13.0000,
  maxLat: 13.0200,
  minLng: 80.2300,
  maxLng: 80.2450
};

export const generateGoogleNavigation = (lat, lng) => {
  if (!lat || !lng) return '#';
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
};

export const generateGoogleSearch = (query) => {
  if (!query) return '#';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};

// Returns distance in meters
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  if (!lat1 || !lng1 || !lat2 || !lng2) return null;
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371e3; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

export const formatCoordinates = (lat, lng) => {
  if (!lat || !lng) return '';
  return `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}`;
};
