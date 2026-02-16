import type { Request, RequestApiResponse } from '@/lib/types/request';

export const mapRequest = (data: RequestApiResponse): Request => ({
  id: data.id,
  title: data.title,
  disasterId: data.disaster_id,
  typeOfNeed: data.type_of_need,
  description: data.description ?? undefined,
  media: (data.media ?? []).map((item) => ({
    url: item.url,
    name: item.name ?? undefined,
    size: item.size ?? undefined,
    type: 'type' in item ? item.type ?? undefined : undefined,
  })),
  location: data.location
    ? {
        lat: data.location.lat ?? undefined,
        lng: data.location.lng ?? undefined,
        address: data.location.address ?? undefined,
      }
    : undefined,
  autoExtract: data.auto_extract ?? undefined,
  status: data.status ?? undefined,
  assignedTaskId: data.assigned_task_id ?? undefined,
  createdBy: data.created_by,
  createdAt: data.created_at ?? undefined,
  updatedAt: data.updated_at ?? undefined,
});
