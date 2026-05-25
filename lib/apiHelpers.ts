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
