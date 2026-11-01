import { useState, useMemo, useEffect } from 'react';
import {
  ShieldAlert,
  Building2,
  CheckCircle2,
  Ban,
  DollarSign,
  Boxes,
  ShoppingCart,
  Search,
  X,
  Loader2,
  AlertTriangle,
  ChevronRight,
  Receipt,
  RotateCcw,
} from 'lucide-react';
import { StatCard } from '../../components/stat-card/StatCard';
import {
  superAdminService,
  type PlatformStats,
  type RegisteredBusiness,
  type BusinessStatsDetails,
} from '../../services/super-admin.service';
import { getCurrencySymbol } from '../../services/currency.service';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [businesses, setBusinesses] = useState<RegisteredBusiness[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');

  // Detailed Business Stats Modal State
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [businessDetails, setBusinessDetails] = useState<BusinessStatsDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false);
  const [activeDetailsTab, setActiveDetailsTab] = useState<'overview' | 'sales' | 'products'>('overview');

  // Action Modals State
  const [businessToBlock, setBusinessToBlock] = useState<RegisteredBusiness | null>(null);
  const [businessToUnblock, setBusinessToUnblock] = useState<RegisteredBusiness | null>(null);
  const [blockReason, setBlockReason] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Load platform stats and businesses list
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsData, bizData] = await Promise.all([
        superAdminService.getStats(),
        superAdminService.getBusinesses(),
      ]);
      setStats(statsData);
      if (Array.isArray(bizData)) {
        setBusinesses(bizData);
      }
    } catch (err: any) {
      console.warn('Super Admin fetch error:', err);
      setFeedbackMessage({
        type: 'error',
        text: err.message || 'Failed to fetch platform business data.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered businesses based on search term & status
  const filteredBusinesses = useMemo(() => {
    return businesses.filter((b) => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        (b.name || '').toLowerCase().includes(term) ||
        (b.type || '').toLowerCase().includes(term) ||
        (b.owner?.full_name || '').toLowerCase().includes(term) ||
        (b.owner?.email || '').toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && b.status !== 'blocked') ||
        (statusFilter === 'blocked' && b.status === 'blocked');

      return matchesSearch && matchesStatus;
    });
  }, [businesses, searchTerm, statusFilter]);

  // Handle clicking on a business to view its live statistics and performance
  const handleOpenBusinessDetails = async (biz: RegisteredBusiness) => {
    setSelectedBusinessId(biz._id);
    setActiveDetailsTab('overview');
    setDetailsLoading(true);
    try {
      const details = await superAdminService.getBusinessDetails(biz._id);
      setBusinessDetails(details);
    } catch (err: any) {
      console.warn('Failed to fetch business details:', err);
      // Fallback with current business metadata
      setBusinessDetails({
        ...biz,
        stats: {
          products_count: biz.products_count,
          total_inventory_stock: 0,
          low_stock_count: 0,
          sales_count: biz.sales_count,
          total_revenue: biz.total_revenue,
          avg_order_value: biz.sales_count > 0 ? biz.total_revenue / biz.sales_count : 0,
        },
        products: [],
        sales: [],
      });
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCloseBusinessDetails = () => {
    setSelectedBusinessId(null);
    setBusinessDetails(null);
  };

  // Handle Block Business Confirmation
  const handleConfirmBlock = async () => {
    if (!businessToBlock) return;
    setActionLoading(true);
    try {
      const updated = await superAdminService.updateBusinessStatus(
        businessToBlock._id,
        'blocked',
        blockReason || 'Suspended by Super Administrator'
      );

      // Update main list
      setBusinesses((prev) =>
        prev.map((item) =>
          item._id === businessToBlock._id
            ? {
                ...item,
                status: 'blocked',
                block_reason: updated.block_reason || blockReason,
                blocked_at: updated.blocked_at,
              }
            : item
        )
      );

      // Update details view if currently open
      if (businessDetails && businessDetails._id === businessToBlock._id) {
        setBusinessDetails((prev) =>
          prev
            ? {
                ...prev,
                status: 'blocked',
                block_reason: updated.block_reason || blockReason,
                blocked_at: updated.blocked_at,
              }
            : null
        );
      }

      // Refresh platform stats
      const newStats = await superAdminService.getStats();
      setStats(newStats);

      setFeedbackMessage({
        type: 'success',
        text: `Business "${businessToBlock.name}" has been blocked. Its owner and admins can no longer log in.`,
      });
      setBusinessToBlock(null);
      setBlockReason('');
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err.message || 'Failed to block business.',
      });
    } finally {
      setActionLoading(false);
      setTimeout(() => setFeedbackMessage(null), 6000);
    }
  };

  // Handle Unblock Business Confirmation
  const handleConfirmUnblock = async () => {
    if (!businessToUnblock) return;
    setActionLoading(true);
    try {
      await superAdminService.updateBusinessStatus(
        businessToUnblock._id,
        'active'
      );

      // Update main list
      setBusinesses((prev) =>
        prev.map((item) =>
          item._id === businessToUnblock._id
            ? {
                ...item,
                status: 'active',
                block_reason: '',
                blocked_at: null,
              }
            : item
        )
      );

      // Update details view if currently open
      if (businessDetails && businessDetails._id === businessToUnblock._id) {
        setBusinessDetails((prev) =>
          prev
            ? {
                ...prev,
                status: 'active',
                block_reason: '',
                blocked_at: null,
              }
            : null
        );
      }

      // Refresh platform stats
      const newStats = await superAdminService.getStats();
      setStats(newStats);

      setFeedbackMessage({
        type: 'success',
        text: `Business "${businessToUnblock.name}" has been reactivated. Login access has been restored.`,
      });
      setBusinessToUnblock(null);
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err.message || 'Failed to unblock business.',
      });
    } finally {
      setActionLoading(false);
      setTimeout(() => setFeedbackMessage(null), 6000);
    }
  };

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Feedback Message */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-2xl border text-sm flex items-center justify-between shadow-xs transition-all ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle size={18} className="text-red-600 shrink-0" />
            )}
            <span className="font-medium">{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Platform Businesses Dashboard
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-900 text-white shadow-xs">
              <ShieldAlert size={12} />
              Super Admin
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Global management: click on any business below to inspect its live performance statistics, products, sales, and control access
          </p>
        </div>

        <button
          onClick={loadData}
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <RotateCcw size={14} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Platform Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Businesses"
          value={stats?.total_businesses ?? businesses.length}
          subtitle="All registered stores"
          icon={<Building2 />}
        />
        <StatCard
          title="Active Businesses"
          value={stats?.active_businesses ?? businesses.filter((b) => b.status !== 'blocked').length}
          subtitle="Healthy operational accounts"
          icon={<CheckCircle2 />}
        />
        <StatCard
          title="Blocked Accounts"
          value={stats?.blocked_businesses ?? businesses.filter((b) => b.status === 'blocked').length}
          subtitle="Access suspended"
          icon={<Ban />}
          negative={(stats?.blocked_businesses ?? 0) > 0}
        />
        <StatCard
          title="Total Platform Revenue"
          value={`Rs ${(stats?.total_revenue ?? 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          subtitle={`${stats?.total_orders ?? 0} total customer orders`}
          icon={<DollarSign />}
        />
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Search size={16} />
          </div>
          <input
            type="text"
            placeholder="Search by business name, owner name, email, type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All ({businesses.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Active ({businesses.filter((b) => b.status !== 'blocked').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('blocked')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer ${
              statusFilter === 'blocked'
                ? 'bg-white text-red-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Blocked ({businesses.filter((b) => b.status === 'blocked').length})
          </button>
        </div>
      </div>

      {/* Businesses List Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Building2 size={20} className="text-gray-900" />
            <h2 className="text-base font-semibold text-gray-900">
              Registered Businesses ({filteredBusinesses.length})
            </h2>
          </div>
          <span className="text-xs text-gray-500 font-normal">
            Tip: Click any business row or &ldquo;View Stats&rdquo; to inspect full store metrics & perform actions
          </span>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="animate-spin text-gray-600" size={28} />
            <span className="text-sm">Loading registered businesses...</span>
          </div>
        ) : filteredBusinesses.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Building2 size={36} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-medium text-gray-600">No businesses found</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Try adjusting your search criteria or filter options
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[11px] border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Business</th>
                  <th className="py-3 px-4 font-semibold">Owner</th>
                  <th className="py-3 px-4 font-semibold">Business Type</th>
                  <th className="py-3 px-4 font-semibold text-center">Products</th>
                  <th className="py-3 px-4 font-semibold text-right">Revenue</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBusinesses.map((biz) => {
                  const isBlocked = biz.status === 'blocked';
                  const cSymbol = getCurrencySymbol(biz.currency);

                  return (
                    <tr
                      key={biz._id}
                      onClick={() => handleOpenBusinessDetails(biz)}
                      className={`hover:bg-gray-50/80 transition-colors cursor-pointer group ${
                        isBlocked ? 'bg-red-50/30' : ''
                      }`}
                    >
                      {/* Business Brand */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center text-xs font-bold overflow-hidden shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                            {biz.logo ? (
                              <img
                                src={biz.logo}
                                alt={biz.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              biz.name.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-gray-900 block truncate group-hover:text-blue-600 transition-colors">
                              {biz.name}
                            </span>
                            <span className="text-[11px] text-gray-400 block font-mono">
                              ID: {biz._id.slice(-6).toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Owner Information */}
                      <td className="py-3.5 px-4">
                        <div className="min-w-0">
                          <span className="font-medium text-gray-800 block truncate">
                            {biz.owner?.full_name || 'No Owner'}
                          </span>
                          <span className="text-xs text-gray-500 block truncate">
                            {biz.owner?.email || 'N/A'}
                          </span>
                        </div>
                      </td>

                      {/* Business Type */}
                      <td className="py-3.5 px-4 text-xs text-gray-600">
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-gray-100 font-medium text-gray-700">
                          {biz.type || 'Standard'}
                        </span>
                      </td>

                      {/* Products Count */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-xs font-semibold text-gray-800 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                          {biz.products_count}
                        </span>
                      </td>

                      {/* Revenue & Sales */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-semibold text-gray-900 block">
                          {cSymbol}
                          {(biz.total_revenue || 0).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        <span className="text-[11px] text-gray-400 block">
                          {biz.sales_count} {biz.sales_count === 1 ? 'order' : 'orders'}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 text-center">
                        {isBlocked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                            <Ban size={12} />
                            Blocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 size={12} />
                            Active
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenBusinessDetails(biz)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition cursor-pointer"
                            title="Inspect complete business statistics"
                          >
                            <span>Stats & Info</span>
                            <ChevronRight size={13} />
                          </button>

                          {/* Block / Unblock Toggle Button */}
                          {isBlocked ? (
                            <button
                              type="button"
                              onClick={() => setBusinessToUnblock(biz)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition shadow-xs cursor-pointer"
                              title="Unblock and restore login access"
                            >
                              <CheckCircle2 size={13} />
                              <span>Unblock</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setBusinessToBlock(biz)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg transition cursor-pointer"
                              title="Block business and suspend login access"
                            >
                              <Ban size={13} />
                              <span>Block</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Full Business Stats, Records & Actions */}
      {selectedBusinessId && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto"
          onClick={handleCloseBusinessDetails}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-gray-100 overflow-hidden my-6 transition-all max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-gray-200 bg-gray-50/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center text-sm font-bold overflow-hidden shadow-xs shrink-0">
                  {businessDetails?.logo ? (
                    <img
                      src={businessDetails.logo}
                      alt={businessDetails.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    (businessDetails?.name || 'BH').slice(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                      {businessDetails?.name}
                    </h3>
                    {businessDetails?.status === 'blocked' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                        <Ban size={12} /> Blocked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 size={12} /> Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <span>Type: {businessDetails?.type}</span>
                    <span>•</span>
                    <span>Currency: {businessDetails?.currency}</span>
                    <span>•</span>
                    <span>ID: {selectedBusinessId}</span>
                  </div>
                </div>
              </div>

              {/* Top Action Buttons inside Details Modal */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                {businessDetails?.status === 'blocked' ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (businessDetails) setBusinessToUnblock(businessDetails);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <CheckCircle2 size={14} />
                    <span>Unblock Business</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (businessDetails) setBusinessToBlock(businessDetails);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <Ban size={14} />
                    <span>Block Business</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCloseBusinessDetails}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-xl transition cursor-pointer"
                  aria-label="Close dialog"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body with Scroll */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {detailsLoading ? (
                <div className="py-20 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="animate-spin text-gray-600" size={32} />
                  <span className="text-sm font-medium">Fetching complete business records & statistics...</span>
                </div>
              ) : businessDetails ? (
                <>
                  {/* Block Alert Banner if blocked */}
                  {businessDetails.status === 'blocked' && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 space-y-1">
                      <div className="flex items-center gap-2 font-bold text-sm text-red-900">
                        <Ban size={16} className="text-red-600" />
                        <span>This Business Account Is Currently Blocked</span>
                      </div>
                      <p className="text-red-700">
                        Reason: &ldquo;{businessDetails.block_reason || 'Suspended by Super Administrator'}&rdquo;
                      </p>
                      {businessDetails.blocked_at && (
                        <p className="text-gray-500 text-[11px]">
                          Suspended on: {new Date(businessDetails.blocked_at).toLocaleString()}
                        </p>
                      )}
                      <p className="text-red-600 font-medium pt-1">
                        Notice: The store owner ({businessDetails.owner?.email}) is strictly blocked from logging in.
                      </p>
                    </div>
                  )}

                  {/* 6 Key Performance Metrics Cards */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                      Business Performance Statistics
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 text-center">
                        <DollarSign size={18} className="mx-auto text-emerald-600 mb-1" />
                        <span className="text-[11px] text-gray-500 block">Total Revenue</span>
                        <span className="font-bold text-gray-900 text-sm">
                          {getCurrencySymbol(businessDetails.currency)}
                          {(businessDetails.stats?.total_revenue || 0).toLocaleString()}
                        </span>
                      </div>

                      <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 text-center">
                        <ShoppingCart size={18} className="mx-auto text-blue-600 mb-1" />
                        <span className="text-[11px] text-gray-500 block">Total Orders</span>
                        <span className="font-bold text-gray-900 text-sm">
                          {businessDetails.stats?.sales_count || 0}
                        </span>
                      </div>

                      <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 text-center">
                        <Boxes size={18} className="mx-auto text-purple-600 mb-1" />
                        <span className="text-[11px] text-gray-500 block">Active Products</span>
                        <span className="font-bold text-gray-900 text-sm">
                          {businessDetails.stats?.products_count || 0}
                        </span>
                      </div>

                      <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 text-center">
                        <Boxes size={18} className="mx-auto text-indigo-600 mb-1" />
                        <span className="text-[11px] text-gray-500 block">Stock Units</span>
                        <span className="font-bold text-gray-900 text-sm">
                          {businessDetails.stats?.total_inventory_stock || 0}
                        </span>
                      </div>

                      <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 text-center">
                        <AlertTriangle size={18} className="mx-auto text-amber-500 mb-1" />
                        <span className="text-[11px] text-gray-500 block">Low Stock Items</span>
                        <span className="font-bold text-gray-900 text-sm">
                          {businessDetails.stats?.low_stock_count || 0}
                        </span>
                      </div>

                      <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 text-center">
                        <Receipt size={18} className="mx-auto text-teal-600 mb-1" />
                        <span className="text-[11px] text-gray-500 block">Avg Order Value</span>
                        <span className="font-bold text-gray-900 text-xs">
                          {getCurrencySymbol(businessDetails.currency)}
                          {(businessDetails.stats?.avg_order_value || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Owner & Business Profile Details */}
                  <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-200/80">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Store & Owner Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-gray-400 block">Store Owner</span>
                        <span className="font-semibold text-gray-900">{businessDetails.owner?.full_name || 'N/A'}</span>
                        <span className="text-gray-500 block text-[11px]">{businessDetails.owner?.email}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Contact Phone</span>
                        <span className="font-semibold text-gray-900">{businessDetails.contact_phone || 'None'}</span>
                        <span className="text-gray-500 block text-[11px]">Email: {businessDetails.contact_email || businessDetails.owner?.email}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Physical Address</span>
                        <span className="font-semibold text-gray-900">{businessDetails.address || 'No address provided'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Registration Date</span>
                        <span className="font-semibold text-gray-900">
                          {new Date(businessDetails.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tabs: Navigation for Sales & Products */}
                  <div>
                    <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                      <button
                        type="button"
                        onClick={() => setActiveDetailsTab('overview')}
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer ${
                          activeDetailsTab === 'overview'
                            ? 'bg-black text-white'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        Recent Sales ({businessDetails.sales?.length || 0})
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveDetailsTab('products')}
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer ${
                          activeDetailsTab === 'products'
                            ? 'bg-black text-white'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        Products Catalog ({businessDetails.products?.length || 0})
                      </button>
                    </div>

                    {/* Tab 1: Recent Sales Records */}
                    {activeDetailsTab === 'overview' && (
                      <div className="mt-3 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                        {businessDetails.sales && businessDetails.sales.length > 0 ? (
                          <div className="overflow-x-auto max-h-64">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] sticky top-0 border-b border-gray-200">
                                <tr>
                                  <th className="py-2.5 px-3 font-semibold">Receipt / Date</th>
                                  <th className="py-2.5 px-3 font-semibold">Item</th>
                                  <th className="py-2.5 px-3 text-center font-semibold">Qty</th>
                                  <th className="py-2.5 px-3 text-right font-semibold">Unit Price</th>
                                  <th className="py-2.5 px-3 text-right font-semibold">Total</th>
                                  <th className="py-2.5 px-3 font-semibold text-center">Payment</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {businessDetails.sales.map((s: any) => (
                                  <tr key={s._id} className="hover:bg-gray-50">
                                    <td className="py-2.5 px-3">
                                      <span className="font-mono text-gray-900 block font-medium">
                                        {s.receipt_no || s._id.slice(-6)}
                                      </span>
                                      <span className="text-[10px] text-gray-400">
                                        {s.date ? s.date.split('T')[0] : 'N/A'}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 font-medium text-gray-900">{s.product_name}</td>
                                    <td className="py-2.5 px-3 text-center text-gray-700">{s.quantity}</td>
                                    <td className="py-2.5 px-3 text-right text-gray-600">
                                      {getCurrencySymbol(businessDetails.currency)}
                                      {Number(s.unit_price || 0).toFixed(2)}
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-bold text-gray-900">
                                      {getCurrencySymbol(businessDetails.currency)}
                                      {Number(s.total_amount || 0).toFixed(2)}
                                    </td>
                                    <td className="py-2.5 px-3 text-center">
                                      <span className="inline-block px-2 py-0.5 rounded-full bg-gray-100 text-[10px] text-gray-700 font-medium">
                                        {s.payment_method || 'Cash'}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="py-10 text-center text-gray-400 text-xs">
                            No sales transactions recorded yet by this store.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab 2: Products Catalog */}
                    {activeDetailsTab === 'products' && (
                      <div className="mt-3 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                        {businessDetails.products && businessDetails.products.length > 0 ? (
                          <div className="overflow-x-auto max-h-64">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] sticky top-0 border-b border-gray-200">
                                <tr>
                                  <th className="py-2.5 px-3 font-semibold">Product Name</th>
                                  <th className="py-2.5 px-3 font-semibold">SKU</th>
                                  <th className="py-2.5 px-3 font-semibold">Category</th>
                                  <th className="py-2.5 px-3 text-right font-semibold">Price</th>
                                  <th className="py-2.5 px-3 text-center font-semibold">In Stock</th>
                                  <th className="py-2.5 px-3 text-center font-semibold">Stock Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {businessDetails.products.map((p: any) => {
                                  const stock = Number(p.quantity || 0);
                                  const threshold = Number(p.low_stock_threshold || 10);
                                  const isLow = stock <= threshold && stock > 0;
                                  const isOut = stock <= 0;

                                  return (
                                    <tr key={p._id} className="hover:bg-gray-50">
                                      <td className="py-2.5 px-3 font-medium text-gray-900">{p.name}</td>
                                      <td className="py-2.5 px-3 font-mono text-gray-500">{p.sku}</td>
                                      <td className="py-2.5 px-3 text-gray-600">{p.category}</td>
                                      <td className="py-2.5 px-3 text-right font-semibold text-gray-900">
                                        {getCurrencySymbol(businessDetails.currency)}
                                        {Number(p.price || 0).toFixed(2)}
                                      </td>
                                      <td className="py-2.5 px-3 text-center font-medium text-gray-800">{stock}</td>
                                      <td className="py-2.5 px-3 text-center">
                                        {isOut ? (
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700">
                                            Out of Stock
                                          </span>
                                        ) : isLow ? (
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">
                                            Low Stock
                                          </span>
                                        ) : (
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                                            In Stock
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="py-10 text-center text-gray-400 text-xs">
                            No products added yet by this store.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
              <span className="text-xs text-gray-400">Super Admin Business Inspector</span>
              <button
                type="button"
                onClick={handleCloseBusinessDetails}
                className="px-5 py-2 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Block Confirmation */}
      {businessToBlock && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-60 p-4 overflow-y-auto"
          onClick={() => setBusinessToBlock(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden p-6 space-y-4 animate-in fade-in duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Ban size={24} />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                Block &ldquo;{businessToBlock.name}&rdquo;?
              </h3>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                Blocking this business will immediately terminate active sessions. The owner (
                <strong className="text-gray-800">{businessToBlock.owner?.email}</strong>) and any
                associated users will <span className="text-red-600 font-semibold">NOT be able to log in</span> to their accounts.
              </p>
            </div>

            {/* Optional Reason Input */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold text-gray-700">
                Reason for blocking (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Terms of service violation, unpaid dues, fraudulent activity..."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black bg-gray-50 focus:bg-white resize-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setBusinessToBlock(null)}
                className="flex-1 py-2.5 px-4 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmBlock}
                className="flex-1 py-2.5 px-4 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
                <span>Block Business</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Unblock Confirmation */}
      {businessToUnblock && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-60 p-4 overflow-y-auto"
          onClick={() => setBusinessToUnblock(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden p-6 space-y-4 animate-in fade-in duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 size={24} />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                Unblock &ldquo;{businessToUnblock.name}&rdquo;?
              </h3>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                This will reactivate the business and immediately restore full login access for{' '}
                <strong className="text-gray-800">{businessToUnblock.owner?.email}</strong>.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setBusinessToUnblock(null)}
                className="flex-1 py-2.5 px-4 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmUnblock}
                className="flex-1 py-2.5 px-4 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                <span>Reactivate Business</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
