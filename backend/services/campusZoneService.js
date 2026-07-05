const campusZones = require('../config/campusZones');
const locationHelper = require('../utils/locationHelper');

/**
 * Returns the nearest campus zone based on predefined coordinates.
 */
const getCampusZone = (lat, lng) => {
  const normLat = locationHelper.normalizeCoordinate(lat);
  const normLng = locationHelper.normalizeCoordinate(lng);
  
  if (normLat === null || normLng === null) {
    return 'Unknown';
  }

  return locationHelper.findNearestZone(normLat, normLng, campusZones);
};

module.exports = {
  getCampusZone
};
