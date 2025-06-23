import { Customer, DashboardState } from '../types';

export const filterCustomers = (
  customers: Customer[],
  filters: DashboardState['filters']
): Customer[] => {
  return customers.filter(customer => {
    // Search filter
    const searchMatch = !filters.search || 
      customer.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      customer.phone.toLowerCase().includes(filters.search.toLowerCase());

    // Platform filter
    const platformMatch = !filters.platform || 
      customer.platform.toLowerCase() === filters.platform.toLowerCase();

    // Status filter
    const statusMatch = !filters.status || 
      customer.accountStatus === filters.status;

    return searchMatch && platformMatch && statusMatch;
  });
};

export const sortCustomers = (
  customers: Customer[],
  sortBy: string,
  sortOrder: 'asc' | 'desc'
): Customer[] => {
  return [...customers].sort((a, b) => {
    const aValue = a[sortBy as keyof Customer];
    const bValue = b[sortBy as keyof Customer];

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrder === 'asc' 
        ? aValue - bValue
        : bValue - aValue;
    }

    return 0;
  });
};

export const paginateCustomers = (
  customers: Customer[],
  currentPage: number,
  pageSize: number
): Customer[] => {
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return customers.slice(startIndex, endIndex);
};

export const calculateTotalPages = (
  totalItems: number,
  pageSize: number
): number => {
  return Math.ceil(totalItems / pageSize);
}; 