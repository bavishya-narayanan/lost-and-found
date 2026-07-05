const CEG_BOUNDS = {
  minLat: 13.0000,
  maxLat: 13.0200,
  minLng: 80.2300,
  maxLng: 80.2450
};

const isWithinCampus = (lat, lng) => {
  if (lat == null || lng == null) return false;
  return lat >= CEG_BOUNDS.minLat && lat <= CEG_BOUNDS.maxLat &&
         lng >= CEG_BOUNDS.minLng && lng <= CEG_BOUNDS.maxLng;
};

// Haversine formula returning distance in meters
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371e3; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const normalizeCoordinate = (val) => {
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
};

const findNearestZone = (lat, lng, zones) => {
  let nearest = 'Unknown';
  let minDistance = Infinity;

  for (const zone of zones) {
    const dist = calculateDistance(lat, lng, zone.centerLat, zone.centerLng);
    // If within radius, or just find the absolute nearest if we wanted to (here we require being within radius or closest match)
    if (dist <= zone.radius && dist < minDistance) {
      minDistance = dist;
      nearest = zone.name;
    }
  }
  return nearest;
};

module.exports = {
  isWithinCampus,
  calculateDistance,
  normalizeCoordinate,
  findNearestZone,
  CEG_BOUNDS
};
