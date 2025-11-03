import { USE_MOCKS } from '@/lib/config';
import { fetchJson } from '@/lib/http';
import { Report, ReportDetail } from '@/types/domain';
import { mockReports, mockReportDetail } from '@/mocks/reports';

export async function listReports(): Promise<Report[]> {
  if (USE_MOCKS) return Promise.resolve(mockReports);
  return fetchJson<Report[]>('/reports');
}

export async function getReport(id: string): Promise<ReportDetail> {
  if (USE_MOCKS) return Promise.resolve(mockReportDetail);
  return fetchJson<ReportDetail>(`/reports/${id}`);
}

export async function createReport(_payload: any): Promise<{ id: string }> {
  if (USE_MOCKS) return Promise.resolve({ id: 'mock' });
  return fetchJson<{ id: string }, any>('/reports', { method: 'POST', body: _payload });
}

