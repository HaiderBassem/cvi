import PLACES from './places.json';

export interface GeoPlace {
  key: string;
  name: string;
  lat: number;
  lng: number;
  radius_m: number;
  /** True when the point is a city reference point, not an exact project site. */
  approximate: boolean;
  matches: string[];
}

export const GEO_PLACES = PLACES as GeoPlace[];

/** Map a free-text project location ("Iraq - Najaf", "baghdad") to a prepared city-context place. */
export function placeForLocation(location: string | null | undefined): GeoPlace | null {
  const loc = (location || '').toLowerCase();
  if (!loc) return null;
  return GEO_PLACES.find((p) => p.matches.some((m) => loc.includes(m))) ?? null;
}

export function studioPlace(): GeoPlace {
  return GEO_PLACES.find((p) => p.key === 'studio')!;
}
