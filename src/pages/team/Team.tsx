import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Users,
  Plus,
  Briefcase,
  CreditCard,
  FileText,
  User,
  Crown,
  Pencil,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Mail,
  Shield,
} from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import DataTable from '../../components/data-table/DataTable';
import SearchBar from '../../components/search-bar/SearchBar';
import { StatCard } from '../../components/stat-card/StatCard';
import { DeleteModal } from '../../components/delete-modal/DeleteModal';
import AddTeamMemberModal from '../../components/add-team-member-modal/AddTeamMemberModal';
import {
  teamService,
  type TeamMember,
  type CreateTeamMemberPayload,
  type UpdateTeamMemberPayload,
} from '../../services/team.service';
import { UserRoleEnum } from '../../enums/UserRoleEnum';
import { ALL_PERMISSION_IDS } from '../../constants/permissions.constant';

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function Team() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<TeamMember | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notifications
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Fetch team members from backend
  const fetchMembers = useCallback(async () => {
    setActionError(null);
    try {
      const data = await teamService.getMembers();
      if (Array.isArray(data)) {
        setMembers(data);
      }
    } catch (err: any) {
      console.warn('Backend team members fetch failed:', err);
      setActionError(err.message || 'Failed to load team members.');
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Auto-dismiss success notification
  useEffect(() => {
    if (successMessage) {
      const t = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [successMessage]);

  // Statistics calculation for StatCards
  const stats = useMemo(() => {
    const total = members.length;
    const managers = members.filter((m) => m.role === UserRoleEnum.MANAGER).length;
    const cashiers = members.filter((m) => m.role === UserRoleEnum.CASHIER).length;
    const accountants = members.filter((m) => m.role === UserRoleEnum.ACCOUNTANT).length;

    return { total, managers, cashiers, accountants };
  }, [members]);

  // Filter members based on search term & role filter
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        (m.full_name || '').toLowerCase().includes(term) ||
        (m.email || '').toLowerCase().includes(term) ||
        (m.role || '').toLowerCase().includes(term) ||
        (m.permissions && m.permissions.some((p) => p.toLowerCase().includes(term)));

      const matchesRole =
        roleFilter === 'all' ||
        m.role.toLowerCase() === roleFilter.toLowerCase();

      return matchesSearch && matchesRole;
    });
  }, [members, searchTerm, roleFilter]);

  const openAddModal = () => {
    setMemberToEdit(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (member: TeamMember) => {
    setMemberToEdit(member);
    setIsAddModalOpen(true);
  };

  const handleDeleteClick = (member: TeamMember) => {
    setMemberToDelete(member);
    setIsDeleteModalOpen(true);
  };

  // Submit Add or Edit
  const handleModalSubmit = async (
    data: CreateTeamMemberPayload | UpdateTeamMemberPayload,
    isEdit: boolean
  ) => {
    if (isEdit && memberToEdit) {
      await teamService.updateMember(memberToEdit._id, data);
      setSuccessMessage(`Updated role and permissions for ${data.full_name || memberToEdit.full_name}.`);
    } else {
      await teamService.createMember(data as CreateTeamMemberPayload);
      setSuccessMessage(`Successfully added ${data.full_name} to the team.`);
    }
    fetchMembers();
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!memberToDelete) return;
    setIsDeleting(true);
    setActionError(null);
    try {
      await teamService.deleteMember(memberToDelete._id);
      setSuccessMessage(`Removed ${memberToDelete.full_name} from the team.`);
      setIsDeleteModalOpen(false);
      setMemberToDelete(null);
      fetchMembers();
    } catch (err: any) {
      setActionError(err.message || 'Failed to remove team member.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper for role badge display
  const renderRoleBadge = (role: UserRoleEnum | string) => {
    if (role === UserRoleEnum.ADMIN || (role as string) === 'admin') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
          <Crown size={12} className="text-amber-600" />
          <span>Business Owner</span>
        </span>
      );
    }
    if (role === UserRoleEnum.MANAGER) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Briefcase size={12} className="text-indigo-600" />
          <span>Manager</span>
        </span>
      );
    }
    if (role === UserRoleEnum.CASHIER) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CreditCard size={12} className="text-emerald-600" />
          <span>Cashier</span>
        </span>
      );
    }
    if (role === UserRoleEnum.ACCOUNTANT) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <FileText size={12} className="text-blue-600" />
          <span>Accountant</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        <User size={12} className="text-slate-500" />
        <span>Staff</span>
      </span>
    );
  };

  // Helper to summarize granted permissions for a member
  const renderPermissionsSummary = (member: TeamMember) => {
    const isOwner = member.role === UserRoleEnum.ADMIN || (member.role as string) === 'admin';
    if (isOwner) {
      return (
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck size={12} className="text-emerald-600" />
            Full Access (All Modules)
          </span>
        </div>
      );
    }

    const perms = member.permissions || [];
    const hasSales = perms.some((p) => p.startsWith('sales:'));
    const hasInventory = perms.some((p) => p.startsWith('inventory:'));
    const hasExpenses = perms.some((p) => p.startsWith('expenses:'));
    const hasReports = perms.some((p) => p.startsWith('reports:'));
    const hasOperations = perms.some((p) => p.startsWith('suppliers:') || p.startsWith('categories:'));

    return (
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-1">
          {hasSales && (
            <span
              className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
              title="Sales & POS checkout access"
            >
              Sales
            </span>
          )}
          {hasInventory && (
            <span
              className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200"
              title="Inventory catalog access"
            >
              Inventory
            </span>
          )}
          {hasExpenses && (
            <span
              className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200"
              title="Expenses & finance access"
            >
              Expenses
            </span>
          )}
          {hasReports && (
            <span
              className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200"
              title="Financial analytics reports"
            >
              Reports
            </span>
          )}
          {hasOperations && (
            <span
              className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200"
              title="Suppliers & categories"
            >
              Suppliers
            </span>
          )}
          {perms.length === 0 && (
            <span className="text-[11px] text-gray-400 italic">No permissions granted</span>
          )}
        </div>
        <div className="text-[10px] text-gray-400 font-medium">
          {perms.length} of {ALL_PERMISSION_IDS.length} permissions active
        </div>
      </div>
    );
  };

  // Define DataTable columns
  const columns = useMemo<ColumnDef<TeamMember>[]>(
    () => [
      {
        accessorKey: 'full_name',
        header: 'Team Member',
        cell: ({ row }) => {
          const m = row.original;
          const isOwner = m.role === UserRoleEnum.ADMIN || (m.role as string) === 'admin';

          return (
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-2xs ${
                  isOwner
                    ? 'bg-linear-to-tr from-amber-600 to-amber-500'
                    : m.role === UserRoleEnum.MANAGER
                    ? 'bg-linear-to-tr from-indigo-600 to-indigo-500'
                    : m.role === UserRoleEnum.CASHIER
                    ? 'bg-linear-to-tr from-emerald-600 to-emerald-500'
                    : m.role === UserRoleEnum.ACCOUNTANT
                    ? 'bg-linear-to-tr from-blue-600 to-blue-500'
                    : 'bg-linear-to-tr from-slate-600 to-slate-500'
                }`}
              >
                {getInitials(m.full_name || 'User')}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-gray-900 text-sm truncate">
                    {m.full_name}
                  </span>
                  {isOwner && (
                    <span className="inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                      Owner
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-400 truncate flex items-center gap-1">
                  <Mail size={11} className="shrink-0 text-gray-400" />
                  <span className="truncate">{m.email}</span>
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'role',
        header: 'Assigned Role',
        cell: ({ row }) => renderRoleBadge(row.original.role),
      },
      {
        id: 'permissions',
        header: 'Active Permissions',
        cell: ({ row }) => renderPermissionsSummary(row.original),
      },
      {
        accessorKey: 'createdAt',
        header: 'Joined Date',
        cell: ({ row }) => {
          const val = row.original.createdAt;
          if (!val) return <span className="text-xs text-gray-400">Registered</span>;
          const d = new Date(val);
          return (
            <span className="text-xs text-gray-600 font-medium">
              {d.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const m = row.original;
          const isOwner = m.role === UserRoleEnum.ADMIN || (m.role as string) === 'admin';

          return (
            <div className="flex items-center gap-1">
              <button
                onClick={() => openEditModal(m)}
                className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                title={isOwner ? 'Edit details & permissions' : 'Change role or custom permissions'}
                aria-label="Edit team member"
              >
                <Pencil size={16} />
              </button>

              {!isOwner ? (
                <button
                  onClick={() => handleDeleteClick(m)}
                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Remove team member"
                  aria-label="Remove team member"
                >
                  <Trash2 size={16} />
                </button>
              ) : (
                <div
                  className="p-1.5 text-gray-300"
                  title="Primary Owner account cannot be deleted"
                >
                  <Shield size={16} />
                </div>
              )}
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-gray-400 mb-1">
            <Users size={15} className="text-gray-500" />
            <span className="text-[11px] font-bold tracking-wider text-gray-500 uppercase">
              STAFF &amp; PERMISSIONS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Team Members
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage staff accounts, assign operational roles, and customize permissions
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 bg-black text-white hover:bg-gray-800 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-xs cursor-pointer w-full sm:w-auto"
        >
          <Plus size={18} />
          <span>Add Team Member</span>
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <span className="font-semibold">{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-red-600 hover:text-red-800 text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Members"
          value={stats.total}
          subtitle="Registered staff accounts"
          icon={<Users size={20} className="text-gray-400" />}
        />
        <StatCard
          title="Store Managers"
          value={stats.managers}
          subtitle="Operations & management"
          icon={<Briefcase size={20} className="text-indigo-500" />}
        />
        <StatCard
          title="Cashiers & Sales"
          value={stats.cashiers}
          subtitle="POS & transaction checkout"
          icon={<CreditCard size={20} className="text-emerald-500" />}
        />
        <StatCard
          title="Finance & Accounts"
          value={stats.accountants}
          subtitle="Expenditures & reports"
          icon={<FileText size={20} className="text-blue-500" />}
        />
      </div>

      {/* Filter and Search Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="w-full md:max-w-md">
          <SearchBar
            placeholder="Search team members by name, email, or role..."
            value={searchTerm}
            onChange={setSearchTerm}
            className="w-full"
          />
        </div>

        {/* Role Filter Pills matching Reports design */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'All Roles' },
            { id: 'admin', label: 'Owners' },
            { id: 'manager', label: 'Managers' },
            { id: 'cashier', label: 'Cashiers' },
            { id: 'accountant', label: 'Accountants' },
            { id: 'staff', label: 'Staff' },
          ].map((tab) => {
            const isActive = roleFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRoleFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-black text-white shadow-xs'
                    : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Team Members DataTable Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Users size={20} className="text-gray-900" />
            <h2 className="text-base font-semibold text-gray-900">
              Staff Directory &amp; Permissions
            </h2>
          </div>
          <span className="text-xs text-gray-500 font-normal">
            {filteredMembers.length} of {members.length} members
          </span>
        </div>

        {/* Data Table */}
        <DataTable columns={columns} data={filteredMembers} />
      </div>

      {/* Add / Edit Team Member Modal */}
      <AddTeamMemberModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setMemberToEdit(null);
        }}
        onSubmit={handleModalSubmit}
        member={memberToEdit}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setMemberToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Remove Team Member"
        description="Are you sure you want to remove this staff member? They will immediately lose access to this business and all assigned permissions."
        itemName={memberToDelete ? `${memberToDelete.full_name} (${memberToDelete.email})` : ''}
        confirmText="Remove Member"
        isLoading={isDeleting}
      />
    </div>
  );
}
