export interface Customer {
  id: string;
  sessionId?: string | null;
  name: string;
  platform: string;
  phone: string;
  conversationSummary: string;
  interactionStage: 'Ongoing' | 'Escalated' | 'Confirmed';
  accountStatus: 'Active' | 'Inactive';
}

export interface PlatformMetrics {
  total: number;
  growth: number;
  activeUsers: number;
  conversionRate: number;
}

export interface DashboardState {
  customers: Customer[];
  platformMetrics: Record<string, PlatformMetrics>;
  activeUsers: number;
  filters: {
    search: string;
    platform: string | null;
    status: string | null;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
  pagination: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
  };
} 