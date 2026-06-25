/**
 * Backend Distance Service
 * Uses OSRM (free, no API key) for real road-based routing distance.
 * Falls back to Haversine straight-line formula if OSRM is unavailable.
 */

const https = require('https');
const http = require('http');

/**
 * Haversine straight-line distance in km
 */
function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Fetches real road-routing distance from OSRM (free, no API key required).
 * Returns distance in km. Throws on failure.
 */
function fetchOsrmDistanceKm(shopLat, shopLon, userLat, userLon) {
  return new Promise((resolve, reject) => {
    // OSRM expects coords in lon,lat order
    const url = `http://router.project-osrm.org/route/v1/driving/${shopLon},${shopLat};${userLon},${userLat}?overview=false`;

    const req = http.get(url, { timeout: 4000 }, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        try {
          const data = JSON.parse(raw);
          if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            const distanceMeters = data.routes[0].distance;
            resolve(distanceMeters / 1000); // convert to km
          } else {
            reject(new Error('OSRM returned no route'));
          }
        } catch (e) {
          reject(new Error('Failed to parse OSRM response'));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('OSRM request timed out'));
    });

    req.on('error', (e) => reject(e));
  });
}

/**
 * Gets road distance in km between shop and user address.
 * Tries OSRM first, then applies a 1.4x road correction factor to Haversine as fallback.
 *
 * @param {number} shopLat
 * @param {number} shopLon
 * @param {number} userLat
 * @param {number} userLon
 * @returns {Promise<number>} distance in km
 */
async function getRoadDistanceKm(shopLat, shopLon, userLat, userLon) {
  try {
    const roadKm = await fetchOsrmDistanceKm(shopLat, shopLon, userLat, userLon);
    return roadKm;
  } catch (err) {
    console.log(`[distanceService] OSRM failed (${err.message}), using Haversine fallback`);
    const straightKm = haversineDistanceKm(shopLat, shopLon, userLat, userLon);
    // Apply 1.4x factor to approximate road detours
    return straightKm * 1.4;
  }
}

module.exports = { getRoadDistanceKm, haversineDistanceKm };
