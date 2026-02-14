export type TabName =
  | 'Product'
  | 'Growth'
  | 'Marketing'
  | 'Tech'
  | 'Monetization'
  | 'Partnerships'
  | 'Bugs'
  | 'Analytics'
  | 'Experiments'
  | 'Content'
  | 'Context';

export type TaskCategory = TabName;

export type TaskStatus = 'backlog' | 'in_progress' | 'done';

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  linkedMetric: string;
  impactScore: number; // 1-5
  effortScore: number; // 1-5
  dueDate: string; // YYYY-MM-DD
  status: TaskStatus;
  createdAt: Date;
  completedAt?: Date;
}

export interface ShipLog {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  metricTargeted: string;
  resultNote: string;
  taskIds?: string[];
  createdAt: Date;
}

export interface ManualMetric {
  id: string;
  date: string; // YYYY-MM-DD
  revenue: number;
  notes: string;
  createdAt: Date;
}

export interface DashboardMetrics {
  dau: number;
  newUsers: number;
  retention7d: number;
  sharesPerUser: number;
  revenue7d: number;
}

export interface MetricTarget {
  dau: number;
  newUsers: number;
  retention7d: number;
  sharesPerUser: number;
  revenue7d: number;
}

export type ConstraintType = 'Growth' | 'Retention' | 'Monetization' | 'Product Velocity' | 'Unknown';

export interface Constraint {
  type: ConstraintType;
  metric: string;
  target: number;
  actual: number;
  gap: number;
  detectedAt: Date;
}

export interface ContextNote {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}
