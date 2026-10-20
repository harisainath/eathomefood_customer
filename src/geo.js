import * as Location from 'expo-location';

/** Straight-line distance in km between two { lat, lng } points. */
export function distanceKm(a, b) {
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);

/**
 * Ask permission and read the phone's current location.
 * Resolves { coords: { lat, lng }, place: { label, subtitle, city, pincode } }.
 * Rejects with error.code = 'denied' when the user refuses permission.
 */
export async function getDeviceLocation() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    const err = new Error('Location permission denied');
    err.code = 'denied';
    throw err;
  }

  let position = null;
  try {
    position = await withTimeout(Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }), 12000);
  } catch {
    position = await Location.getLastKnownPositionAsync();
  }
  if (!position) {
    const err = new Error("Couldn't find your location. Make sure location (GPS) is turned on.");
    err.code = 'unavailable';
    throw err;
  }

  const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
  return { coords, place: await describe(coords) };
}

/** Readable name for coordinates, using the phone's built-in geocoder (free). */
async function describe({ lat, lng }) {
  try {
    const [p] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    if (!p) throw new Error('no result');
    const subtitle = p.formattedAddress
      || [p.name, p.street, p.district, p.city, p.postalCode].filter(Boolean).join(', ');
    return {
      label: p.district || p.city || p.subregion || 'Current location',
      subtitle,
      city: p.city || p.subregion || null,
      pincode: p.postalCode || null,
    };
  } catch {
    return { label: 'Current location', subtitle: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, city: null, pincode: null };
  }
}
