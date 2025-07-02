'use client';

import { useState, useEffect } from "react";
import { Customer, DashboardState, PlatformMetrics } from "./types";
import { filterCustomers, sortCustomers, paginateCustomers, calculateTotalPages } from "./utils/dataUtils";
import CustomerStatsChart from "../components/CustomerStatsChart";
import ChatHistoryModal from "../components/ChatHistoryModal";
import { useCustomers, CustomerData } from "../hooks/useCustomers";

export default function Home() {
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const { customers: supabaseCustomers, loading, error } = useCustomers();

  const customers: Customer[] = supabaseCustomers.map((c: any) => ({
    ...c,
    id: c.id ? String(c.id) : '',
    sessionId: c.session_id ? String(c.session_id) : null,
  }));

  const [state, setState] = useState<DashboardState>({
    customers: [],
    platformMetrics: {},
    activeUsers: 0,
    filters: {
      search: '',
      platform: null,
      status: null,
      sortBy: 'newest',
      sortOrder: 'desc'
    },
    pagination: {
      currentPage: 1,
      totalPages: 1,
      pageSize: 10
    }
  });

  // Calculate statistics
  const calculateMetrics = (customersList: Customer[]) => {
    const platformCounts: Record<string, number> = {};
    let activeCount = 0;

    customersList.forEach((customer) => {
      platformCounts[customer.platform] = (platformCounts[customer.platform] || 0) + 1;
      if (customer.accountStatus === 'Active') activeCount++;
    });

    const metrics: Record<string, PlatformMetrics> = {};
    for (const platform in platformCounts) {
      const count = platformCounts[platform];
      const percent = customersList.length > 0 ? (count / customersList.length) * 100 : 0;
      metrics[platform] = {
        total: count,
        growth: parseFloat(percent.toFixed(1)),
        activeUsers: 0,
        conversionRate: 0
      };
    }

    return { metrics, activeCount };
  };

  // Update dashboard state after customer data is loaded
  useEffect(() => {
    if (!loading) {
      setState(prev => {
        // Avoid duplicate setState
        const prevIds = prev.customers.map(c => c.id).join(',');
        const newIds = customers.map(c => c.id).join(',');
  
        if (prevIds === newIds) return prev; // Don't update if unchanged
  
        const { metrics, activeCount } = calculateMetrics(customers);
  
        return {
          ...prev,
          customers,
          platformMetrics: metrics,
          activeUsers: activeCount,
          pagination: {
            ...prev.pagination,
            totalPages: calculateTotalPages(customers.length, prev.pagination.pageSize)
          }
        };
      });
    }
  }, [customers, loading]);

  const handleSearch = (search: string) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, search },
      pagination: { ...prev.pagination, currentPage: 1 }
    }));
  };

  const handleSort = (sortBy: string) => {
    setState(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        sortBy,
        sortOrder: sortBy === 'newest' ? 'desc' : 'asc'
      }
    }));
  };

  const handlePageChange = (page: number) => {
    setState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, currentPage: page }
    }));
  };

  const handleCustomerClick = (customer: Customer) => {
    // 只有当客户有session_id时才打开聊天模态框
    if (customer.sessionId) {
      setSelectedCustomer(customer);
      setIsChatModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsChatModalOpen(false);
    setSelectedCustomer(null);
  };

  const filteredCustomers = filterCustomers(state.customers, state.filters);
  const sortedCustomers = sortCustomers(filteredCustomers, 'id', state.filters.sortOrder);
  const paginatedCustomers = paginateCustomers(
    sortedCustomers,
    state.pagination.currentPage,
    state.pagination.pageSize
  );

  if (loading) {
    return <main className="p-8"><div className="text-center text-gray-600">Loading...</div></main>;
  }

  if (error) {
    return <main className="p-8"><div className="text-center text-red-600">Error: {error}</div></main>;
  }

  return (
    <main className="p-8">
      {/* Top statistics cards */}
      <div className="flex flex-col xl:flex-row gap-8 mb-8">
        <div className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(state.platformMetrics).map(([platform, metrics]) => (
              <div key={platform} className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-gray-500 mb-2">{platform.toLowerCase()}</h3>
                <p className="text-2xl font-bold">{metrics.total.toLocaleString()}</p>
                <span className="text-green-500">{metrics.growth}%</span>
              </div>
            ))}
            <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col items-start justify-center">
              <h2 className="text-xl font-bold mb-2">Active Now</h2>
              <p className="text-3xl font-bold text-[#16A34A]">{state.activeUsers}</p>
            </div>
          </div>
        </div>
        <div className="w-full xl:w-[480px] xl:flex-shrink-0">
          <CustomerStatsChart customers={state.customers} />
        </div>
      </div>

      {/* Customer table */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Customers</h2>
          <div className="flex gap-4">
            <input type="text" placeholder="Search..." className="px-4 py-2 border rounded-lg" value={state.filters.search} onChange={(e) => handleSearch(e.target.value)} />
            <select className="px-4 py-2 border rounded-lg" value={state.filters.sortBy} onChange={(e) => handleSort(e.target.value)}>
              <option value="newest">Sort by Newest</option>
              <option value="oldest">Sort by Oldest</option>
            </select>
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-4">Customer Name</th>
              <th className="text-left py-4">Platform</th>
              <th className="text-left py-4 pl-4">Phone Number</th>
              <th className="text-left py-4">Conversation Summary</th>
              <th className="text-left py-4">Interaction Stage</th>
              <th className="text-left py-4">Account Status</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCustomers.map((customer) => (
              <tr key={customer.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => handleCustomerClick(customer)}>
                <td className="py-4 font-medium">{customer.name}</td>
                <td className="py-4">{customer.platform}</td>
                <td className="py-4 pl-4">{customer.phone}</td>
                <td className="py-4 max-w-xs truncate" title={customer.conversationSummary}>{customer.conversationSummary}</td>
                <td className="py-4">
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    customer.interactionStage === 'Ongoing' ? 'bg-blue-100 text-blue-800' :
                    customer.interactionStage === 'Escalated' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'}`}>
                    {customer.interactionStage}
                  </span>
                </td>
                <td className="py-4">
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    customer.accountStatus === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {customer.accountStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination controls */}
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-500">
            Page {state.pagination.currentPage} of {state.pagination.totalPages}
          </div>
          <div className="flex gap-2">
            {Array.from({ length: state.pagination.totalPages }, (_, i) => i + 1).map((page) => (
              <button key={page} className={`px-3 py-1 rounded ${
                page === state.pagination.currentPage
                  ? 'bg-[#6C5DD3] text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`} onClick={() => handlePageChange(page)}>
                {page}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat modal */}
      <ChatHistoryModal
        isOpen={isChatModalOpen}
        onClose={handleCloseModal}
        customerId={selectedCustomer?.sessionId || ''}
        customerName={selectedCustomer?.name || ''}
      />
    </main>
  );
}
