export type RequestLocation = {
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
};

export type RequestMediaAttachment = {
  url: string;
  name?: string | null;
  size?: number | null;
  type?: string | null;
};

export type RequestApiResponse = {
  id: string;
  title: string;
  disaster_id: string;
  type_of_need: string;
  description?: string | null;
  media?: RequestMediaAttachment[] | null;
  location?: RequestLocation | null;
  auto_extract?: Record<string, unknown> | null;
  status?: string | null;
  assigned_task_id?: string | null;
  created_by: string;
  created_at?: string | null;
  updated_at?: string | null;
};

export type Request = {
  id: string;
  title: string;
  disasterId: string;
  typeOfNeed: string;
  description?: string;
  media: RequestMediaAttachment[];
  location?: RequestLocation;
  autoExtract?: Record<string, unknown>;
  status?: string;
  assignedTaskId?: string;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
};

export type RequestCreatePayload = {
  disaster_id: string;
  title: string;
  type_of_need: string;
  description?: string | null;
  location: RequestLocation;
  media?: RequestMediaAttachment[];
  auto_extract?: Record<string, unknown>;
};

export type RequestStatusUpdatePayload = {
  status: string;
  assigned_task_id?: string | null;
};
