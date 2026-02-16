// lib/utils/mapDisaster.ts

import type { Disaster, DisasterApiResponse, DisasterSeverity, DisasterStatus } from '@/lib/types';

const asSeverity = (value?: string | null): DisasterSeverity => {
  if (value === 'High' || value === 'Medium' || value === 'Low') {
    return value;
  }
  return 'Medium';
};

const asStatus = (value?: string | null): DisasterStatus => {
  if (value === 'Registered' || value === 'Pending' || value === 'Rejected') {
    return value;
  }
  return 'Registered';
};

export const mapDisaster = (disaster: DisasterApiResponse): Disaster => ({
  id: disaster.id,
  name: disaster.name,
  description: disaster.description,
  severity: asSeverity(disaster.severity),
  type: disaster.type ?? 'Unknown',
  location: {
    latitude: disaster.location?.lat ?? 0,
    longitude: disaster.location?.lng ?? 0,
    address: disaster.location?.address ?? undefined,
  },
  createdAt: disaster.created_at ?? new Date().toISOString(),
  status: asStatus(disaster.status),
  imageUrl: disaster.image_urls?.[0],
});
