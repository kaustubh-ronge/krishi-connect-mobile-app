/** Unwrap standard mobile API responses: { success, data, error } */
export function unwrapData<T = unknown>(response: unknown): T {
  if (response && typeof response === 'object' && 'data' in (response as object)) {
    return (response as { data: T }).data;
  }
  return response as T;
}

/** Normalize Expo Router dynamic params (string | string[]) */
export function getRouteParam(param: string | string[] | undefined): string | undefined {
  if (param == null) return undefined;
  return Array.isArray(param) ? param[0] : param;
}

/** Readable location from profile/seller — never show raw lat/lng when address exists */
export function formatLocation(entity: {
  address?: string | null;
  city?: string | null;
  district?: string | null;
  region?: string | null;
  state?: string | null;
  pincode?: string | null;
} | null | undefined): string {
  if (!entity) return 'Location not available';

  if (entity.address?.trim()) {
    const parts = [
      entity.address.trim(),
      entity.city,
      entity.district,
      entity.state,
      entity.pincode,
    ].filter(Boolean);
    return parts.join(', ');
  }

  const regionParts = [entity.district, entity.region, entity.city, entity.state]
    .filter(Boolean)
    .join(', ');

  return regionParts || 'Location not available';
}

/** Haversine distance in KM */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return 0;
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return 0;

  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}
