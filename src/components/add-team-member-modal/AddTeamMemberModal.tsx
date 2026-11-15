"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Briefcase,
  BadgeCheck,
  UserCheck,
  Check,
  Sliders,
  Shield,
  CreditCard,
  Box,
  Receipt,
  BarChart3,
  Folder,
  Users as UsersIcon,
  RotateCcw,
} from 'lucide-react';
import { UserRoleEnum } from '../../enums/UserRoleEnum';
import type { TeamMember, CreateTeamMemberPayload, UpdateTeamMemberPayload } from '../../services/team.service';
import {
  PERMISSION_MODULES,
  DEFAULT_ROLE_PERMISSIONS,
  ALL_PERMISSION_IDS,
} from '../../constants/permissions.constant';

export interface AddTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTeamMemberPayload | UpdateTeamMemberPayload, isEdit: boolean) => Promise<void>;
  member?: TeamMember | null;
}

export const ROLE_OPTIONS = [
  {
    value: UserRoleEnum.MANAGER,
    label: 'Store / Operations Manager',
    badge: 'Manager',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    description: 'Full operational access to sales, inventory, expenses, and staff management.',
  },
  {
    value: UserRoleEnum.CASHIER,
    label: 'Cashier / Sales Representative',
    badge: 'Cashier',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'Point of Sale (POS) checkout, recording multi-product transactions, and receipts.',
  },
  {
    value: UserRoleEnum.ACCOUNTANT,
    label: 'Accountant / Financial Officer',
    badge: 'Accountant',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'Track business expenses, analyze financial health, and export profit & loss reports.',
  },
  {
    value: UserRoleEnum.STAFF,
    label: 'General Staff',
    badge: 'Staff',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    description: 'Standard operational team member with basic day-to-day access.',
  },
  {
    value: UserRoleEnum.ADMIN,
    label: 'Co-Owner / Administrator',
    badge: 'Admin',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-300',
    description: 'Full business administration privileges alongside the primary owner.',
  },
];

export default function AddTeamMemberModal({
  isOpen,
  onClose,
  onSubmit,
  member = null,
}: AddTeamMemberModalProps) {
  const isEdit = Boolean(member && member._id);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRoleEnum>(UserRoleEnum.CASHIER);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize or reset form on open / member change
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setShowPassword(false);
      setIsSubmitting(false);

      if (member) {
        setFullName(member.full_name || '');
        setEmail(member.email || '');
        setPassword('');
        const activeRole =
          member.role === UserRoleEnum.SUPER_ADMIN ? UserRoleEnum.ADMIN : member.role || UserRoleEnum.CASHIER;
        setRole(activeRole);

        if (Array.isArray(member.permissions) && member.permissions.length > 0) {
          setSelectedPermissions(member.permissions);
        } else {
          setSelectedPermissions(DEFAULT_ROLE_PERMISSIONS[activeRole] || []);
        }
      } else {
        setFullName('');
        setEmail('');
        setPassword('');
        setRole(UserRoleEnum.CASHIER);
        setSelectedPermissions(DEFAULT_ROLE_PERMISSIONS[UserRoleEnum.CASHIER] || []);
      }
    }
  }, [isOpen, member]);

  // When role changes, if user hasn't explicitly customized yet or wants defaults
  const handleRoleChange = (newRole: UserRoleEnum) => {
    setRole(newRole);
    // Pre-select the default permissions for the newly chosen role
    const defaults = DEFAULT_ROLE_PERMISSIONS[newRole] || [];
    setSelectedPermissions(defaults);
  };

  // Toggle single permission
  const handleTogglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) => {
      if (prev.includes(permissionId)) {
        return prev.filter((id) => id !== permissionId);
      }
      return [...prev, permissionId];
    });
  };

  // Toggle all permissions for a specific module
  const handleToggleModule = (modulePermissionIds: string[]) => {
    const allSelected = modulePermissionIds.every((id) => selectedPermissions.includes(id));
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((id) => !modulePermissionIds.includes(id)));
    } else {
      setSelectedPermissions((prev) => Array.from(new Set([...prev, ...modulePermissionIds])));
    }
  };

  // Reset to current role defaults
  const handleResetToRoleDefaults = () => {
    setSelectedPermissions(DEFAULT_ROLE_PERMISSIONS[role] || []);
  };

  // Select all permissions
  const handleSelectAll = () => {
    setSelectedPermissions(ALL_PERMISSION_IDS);
  };

  // Clear all permissions
  const handleClearAll = () => {
    setSelectedPermissions([]);
  };

  // Handle ESC key press
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyDown]);

  const selectedRoleConfig = ROLE_OPTIONS.find((r) => r.value === role) || ROLE_OPTIONS[1];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('A valid email address is required.');
      return;
    }

    if (!isEdit && (!password || password.length < 6)) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    // Strict safety check: Never permit SUPER_ADMIN
    if (role === UserRoleEnum.SUPER_ADMIN || (role as string) === 'super_admin') {
      setErrorMessage('Super Admin role cannot be created or assigned.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit) {
        const payload: UpdateTeamMemberPayload = {
          full_name: fullName.trim(),
          role,
          permissions: selectedPermissions,
        };
        if (password && password.length >= 6) {
          payload.password = password;
        }
        await onSubmit(payload, true);
      } else {
        const payload: CreateTeamMemberPayload = {
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
          permissions: selectedPermissions,
        };
        await onSubmit(payload, false);
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Operation failed. Please verify the information.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getModuleIcon = (iconName: string) => {
    switch (iconName) {
      case 'CreditCard':
        return <CreditCard size={15} className="text-emerald-600" />;
      case 'Box':
        return <Box size={15} className="text-amber-600" />;
      case 'Receipt':
        return <Receipt size={15} className="text-rose-600" />;
      case 'BarChart3':
        return <BarChart3 size={15} className="text-blue-600" />;
      case 'Folder':
        return <Folder size={15} className="text-purple-600" />;
      case 'Users':
        return <UsersIcon size={15} className="text-indigo-600" />;
      default:
        return <Shield size={15} className="text-gray-600" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 transition-opacity"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-2xl w-full max-w-2xl mx-auto shadow-2xl border border-gray-100 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-100 sticky top-0 bg-white z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center shadow-xs">
              <UserCheck size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                {isEdit ? 'Update Team Member' : 'Add Team Member'}
              </h2>
              <p className="text-xs text-gray-500">
                {isEdit
                  ? 'Adjust role permissions or member details'
                  : 'Assign an operational role and customize granular module permissions'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2.5">
              <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* SECTION 1: Member Credentials */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                <User size={13} className="text-gray-400" />
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Sarah Jenkins"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-black font-medium shadow-2xs"
                required
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                <Mail size={13} className="text-gray-400" />
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="e.g. sarah@business.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isEdit}
                className={`w-full px-3.5 py-2.5 text-xs border rounded-xl font-medium shadow-2xs ${
                  isEdit
                    ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed'
                    : 'bg-white text-gray-900 border-gray-200 focus:outline-none focus:ring-2 focus:ring-black'
                }`}
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                <Lock size={13} className="text-gray-400" />
                {isEdit ? 'New Password (Optional)' : 'Account Password'} {!isEdit && <span className="text-red-500">*</span>}
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={isEdit ? 'Leave blank to retain current' : 'Min. 6 characters'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-black font-medium shadow-2xs"
                  required={!isEdit}
                  minLength={isEdit && !password ? undefined : 6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 text-gray-400 hover:text-gray-700 transition cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                <Briefcase size={13} className="text-gray-400" />
                Primary Role <span className="text-red-500">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => handleRoleChange(e.target.value as UserRoleEnum)}
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-black cursor-pointer font-medium shadow-2xs"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selected Role Description Banner */}
          {selectedRoleConfig && (
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${selectedRoleConfig.badgeColor}`}
                >
                  {selectedRoleConfig.badge}
                </span>
                <span className="text-gray-600">{selectedRoleConfig.description}</span>
              </div>
            </div>
          )}

          {/* SECTION 2: Granular Permissions Matrix */}
          <div className="pt-2 border-t border-gray-100 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <Sliders size={14} className="text-gray-700" />
                  Custom Permissions Matrix
                </label>
                <p className="text-[11px] text-gray-500">
                  Granularly grant or restrict access per business module.
                </p>
              </div>

              {/* Quick actions */}
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleResetToRoleDefaults}
                  className="inline-flex items-center gap-1 text-[11px] text-gray-600 hover:text-black font-medium transition cursor-pointer"
                  title="Reset to recommended permissions for selected role"
                >
                  <RotateCcw size={11} />
                  <span>Role Defaults</span>
                </button>
                <span className="text-gray-300">•</span>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-medium transition cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-gray-300">•</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-[11px] text-gray-500 hover:text-gray-700 font-medium transition cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Permission Active Count Indicator */}
            <div className="flex items-center justify-between text-[11px] text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200/60">
              <span>
                Active Access Privileges: <strong className="text-gray-900 font-semibold">{selectedPermissions.length}</strong> of {ALL_PERMISSION_IDS.length} granted
              </span>
              {selectedPermissions.length === ALL_PERMISSION_IDS.length && (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <Check size={12} /> Full System Access
                </span>
              )}
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {PERMISSION_MODULES.map((module) => {
                const moduleIds = module.permissions.map((p) => p.id);
                const selectedCount = moduleIds.filter((id) => selectedPermissions.includes(id)).length;
                const isAllSelected = selectedCount === moduleIds.length;
                const isPartiallySelected = selectedCount > 0 && selectedCount < moduleIds.length;

                return (
                  <div
                    key={module.id}
                    className="p-3.5 bg-white border border-gray-200 rounded-xl space-y-2.5 transition hover:border-gray-300 shadow-2xs"
                  >
                    {/* Module Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        {getModuleIcon(module.iconName)}
                        <span className="font-semibold text-xs text-gray-900">
                          {module.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleModule(moduleIds)}
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded transition cursor-pointer ${
                          isAllSelected
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : isPartiallySelected
                            ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {selectedCount}/{moduleIds.length} Granted
                      </button>
                    </div>

                    {/* Module Permissions Checkboxes */}
                    <div className="space-y-2">
                      {module.permissions.map((perm) => {
                        const isChecked = selectedPermissions.includes(perm.id);
                        return (
                          <label
                            key={perm.id}
                            className={`flex items-start gap-2.5 p-1.5 rounded-lg text-xs cursor-pointer transition select-none ${
                              isChecked
                                ? 'bg-gray-50/80 hover:bg-gray-100/70'
                                : 'hover:bg-gray-50/50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleTogglePermission(perm.id)}
                              className="mt-0.5 h-3.5 w-3.5 rounded text-black border-gray-300 focus:ring-black cursor-pointer"
                            />
                            <div className="min-w-0">
                              <span className="block font-medium text-gray-900 text-xs leading-snug">
                                {perm.name}
                              </span>
                              <span className="block text-[10px] text-gray-500 leading-tight mt-0.5">
                                {perm.description}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sticky Actions Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-black hover:bg-gray-900 text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              <BadgeCheck size={14} />
              <span>{isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Team Member'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
