export type Id = string;

export interface Project {
  id: Id;
  name: string;
  location: string;
  progress: number;
  status: 'active' | 'pending' | 'completed';
  dueDate: string;
  tasksCount?: number;
  reportsCount?: number;
}

export interface ProjectDetail {
  id: Id;
  name: string;
  location: string;
  progress: number;
  status: 'active' | 'pending' | 'completed';
  startDate: string;
  endDate: string;
  budget: string;
  manager: string;
  team: number;
  tasks: Array<{ id: Id; title: string; status: 'pending' | 'in_progress' | 'completed'; assignee: string; dueDate: string }>;
  reports: Array<{ id: Id; title: string; date: string; type: 'progress' | 'incident' | 'quality'; status: 'pending' | 'approved' | 'rejected' }>;
  materials: Array<{ id: Id; name: string; quantity: number; unit: string; status: 'requested' | 'approved' | 'delivered' }>;
}

export interface Report {
  id: Id;
  title: string;
  project: string;
  date: string;
  type: 'progress' | 'incident' | 'quality';
  status: 'pending' | 'approved' | 'rejected';
  progress?: number;
  authorId?: Id;
  authorName?: string;
}

export interface ReportDetail {
  id: Id;
  title: string;
  project: string;
  type: 'progress' | 'incident' | 'quality';
  status: 'pending' | 'approved' | 'rejected';
  progress?: number;
  author: string;
  date: string;
  location: string;
  description: string;
  observations?: string;
  images: string[];
  approvedBy?: string;
  approvedDate?: string;
  feedback?: string;
}

export interface MaterialRequest {
  id: Id;
  projectName: string;
  materialName: string;
  quantity: number;
  unit: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'delivered';
  priority: 'low' | 'medium' | 'high';
  observations?: string;
}

export interface CatalogItem { id: Id; name: string; unit: string }

export interface TeamMember {
  id: Id;
  name: string;
  role: 'worker' | 'supervisor';
  email?: string;
  phone?: string;
}

export interface KanbanCard { id: Id; title: string; authorId?: Id; createdAt?: string }
export type KanbanBoard = Record<string, KanbanCard[]>;
