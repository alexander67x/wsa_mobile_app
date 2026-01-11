import { fetchJson } from '@/lib/http';

export type CheckEventType = 'check_in' | 'check_out';

export interface CheckEventPayload {
  type: CheckEventType;
  occurred_at?: string;
  latitude?: number;
  longitude?: number;
  location_label?: string;
}

export interface AttendanceCoords {
  latitude: number;
  longitude: number;
}

export interface AttendanceSession {
  id: string;
  date?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
  location?: string | null;
  hoursWorked?: number | null;
  startLocationLabel?: string | null;
  endLocationLabel?: string | null;
  startCoords?: AttendanceCoords | null;
  endCoords?: AttendanceCoords | null;
  apiId?: string | null;
  status?: string | null;
  checkInAt?: string | null;
  checkOutAt?: string | null;
}

interface AttendanceSessionResponse {
  session: AttendanceSession;
}

const ATTENDANCE_PATH = '/attendance/checks';

const normalizeSession = (session: AttendanceSession): AttendanceSession => ({
  ...session,
  apiId: session.apiId ?? session.id ?? null,
});

export async function createAttendanceCheck(payload: CheckEventPayload): Promise<AttendanceSession> {
  const response = await fetchJson<AttendanceSessionResponse, CheckEventPayload>(ATTENDANCE_PATH, {
    method: 'POST',
    body: payload,
  });

  return normalizeSession(response.session);
}

export async function listAttendanceChecks(params?: {
  from?: string;
  to?: string;
}): Promise<AttendanceSession[]> {
  const queryParams = new URLSearchParams();
  if (params?.from) queryParams.append('from', params.from);
  if (params?.to) queryParams.append('to', params.to);

  const queryString = queryParams.toString();
  const url = queryString ? `${ATTENDANCE_PATH}?${queryString}` : ATTENDANCE_PATH;
  const response = await fetchJson<AttendanceSession[] | { sessions: AttendanceSession[] }>(url);

  const sessions = Array.isArray(response) ? response : response.sessions || [];
  return sessions.map(normalizeSession);
}

export async function getAttendanceCheck(id: string): Promise<AttendanceSession> {
  const response = await fetchJson<AttendanceSession | AttendanceSessionResponse>(`${ATTENDANCE_PATH}/${id}`);
  const session = 'session' in response ? response.session : response;
  return normalizeSession(session);
}
