export type Id = string;

export interface Project {
  id: Id;
  name: string;
  location: string;
  progress: number;
  status: 'active' | 'pending' | 'completed';
  dueDate: string | null;
  deadline?: string | null;
  budget?: number | null;
  members?: ProjectMember[];
  tasksCount?: number;
  reportsCount?: number;
}

export interface ProjectDetail {
  id: Id;
  name: string;
  location: string;
  progress: number;
  status: 'active' | 'pending' | 'completed';
  startDate: string | null;
  endDate: string | null;
  deadline: string | null;
  budget: number | null;
  manager: string;
  team: number;
  members: ProjectMember[];
  tasks: Array<{
    id: Id;
    title: string;
    status: 'pending' | 'in_progress' | 'completed';
    assignee: string;
    dueDate: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    createdAt?: string;
    updatedAt?: string;
    responsible?: string;
  }>;
  reports: Array<{ id: Id; title: string; date: string; type: 'progress' | 'incident' | 'quality'; status: 'pending' | 'approved' | 'rejected' }>;
  materials: Array<{ id: Id; name: string; quantity: number; unit: string; status: 'requested' | 'approved' | 'delivered' }>;
}

export interface ProjectMember {
  id: Id;
  name: string;
  role?: string | null;
}

export interface Report {
  id: Id;
  title: string;
  project: string;
  date: string;
  type: 'progress' | 'incident' | 'quality';
  status: 'pending' | 'approved' | 'rejected';
  progress?: number;
  materialsUsed?: string;
  authorId?: Id;
  authorName?: string;
}

export interface ReportDetail {
  id: Id;
  title: string;
  project: string;
  projectId?: Id;
  type: 'progress' | 'incident' | 'quality';
  status: 'pending' | 'approved' | 'rejected';
  progress?: number;
  author: string;
  authorId?: Id;
  date: string;
  location: string;
  description: string;
  observations?: string;
  images: string[];
  approvedBy?: string;
  approvedDate?: string;
  rejectedBy?: string;
  rejectedDate?: string;
  feedback?: string;
  taskId?: Id;
  taskTitle?: string;
  taskDescription?: string;
  taskStatus?: string;
  difficulties?: string;
  materialsUsed?: string;
  materials?: Array<{
    materialId: Id;
    materialName?: string;
    quantity: number;
    unit: string;
    observations?: string;
  }>;
}

export type MaterialRequestStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'sent'
  | 'delivered'
  | 'rejected';

export interface MaterialDelivery {
  id: Id;
  requestItemId?: Id;
  quantity: number;
  lotId?: Id | null;
  lotNumber?: string | null;
  deliveredAt?: string;
  deliveredBy?: string;
  observations?: string;
}

export interface MaterialRequestItem {
  id: Id;
  materialId?: Id;
  materialName: string;
  unit?: string;
  requestedQty: number;
  approvedQty: number;
  deliveredQty: number;
  observations?: string;
  lotId?: Id | null;
  lotNumber?: string | null;
  deliveries?: MaterialDelivery[];
}

export interface MaterialRequest {
  id: Id;
  code?: string;
  projectId?: Id;
  projectName: string;
  requesterName?: string;
  requestDate: string;
  status: MaterialRequestStatus;
  statusLabel?: string;
  urgent: boolean;
  reason?: string;
  observations?: string;
  deliveryProgress?: number;
  totalItems?: number;
  totalApprovedQuantity?: number;
  totalDeliveredQuantity?: number;
  materialName?: string;
  quantity?: number;
  unit?: string;
}

export interface MaterialRequestDetail extends MaterialRequest {
  items: MaterialRequestItem[];
  deliveries?: MaterialDelivery[];
  approvedAt?: string;
  receivedAt?: string;
  rejectedAt?: string;
  updatedAt?: string;
  warehouseName?: string;
}

export interface CatalogItem {
  id: Id;
  name: string;
  unit: string;
  sku?: string;
  code?: string;
  description?: string;
  brand?: string;
  model?: string;
}

export interface TeamMember {
  id: Id;
  name: string;
  role: 'worker' | 'supervisor';
  email?: string;
  phone?: string;
}

export interface KanbanCard {
  id: Id;
  title: string;
  authorId?: Id;
  authorName?: string;
  description?: string;
  photos?: string[];
  createdAt?: string;
}
export type KanbanBoard = Record<string, KanbanCard[]>;
