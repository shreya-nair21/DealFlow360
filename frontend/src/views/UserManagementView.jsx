import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Users, 
  ShieldCheck, 
  UserPlus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Shield, 
  Lock, 
  Mail, 
  UserCheck, 
  ArrowRight,
  Briefcase,
  ExternalLink,
  Info
} from 'lucide-react';

export const UserManagementView = () => {
  const { registeredUsers, updateUserRole, currentUser, signup, showToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New user form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('password');
  const [newRole, setNewRole] = useState('sales_rep');

  const roleDefinitions = {
    admin: {
      label: 'Admin',
      badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
      description: 'Full administrative access: rule configurations, discount ceilings, user role governance, and approvals.',
      icon: ShieldCheck
    },
    sales_manager: {
      label: 'Sales Manager',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      description: 'Approval queue management, risk escalation reviews, pipeline supervision, and deal health tracking.',
      icon: Shield
    },
    sales_rep: {
      label: 'Sales Rep',
      badgeClass: 'bg-gray-100 text-gray-800 border-gray-200',
      description: 'Quotation drafting, customer catalog browsing, discount proposals, and deal negotiation handling.',
      icon: Briefcase
    },
    finance: {
      label: 'Finance / Ops',
      badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
      description: 'Multi-warehouse fulfillment allocation, backorder resolution, hybrid invoice releases, and recurring billing.',
      icon: Lock
    },
    customer: {
      label: 'Customer / Client',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      description: 'Self-service Customer Portal: building custom quote proposals, counter-offer remarks, and 1-click confirmation.',
      icon: ExternalLink
    }
  };

  const filteredUsers = (registeredUsers || []).filter(u => {
    const matchesSearch = (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (u.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = async (userId, targetRole) => {
    await updateUserRole(userId, targetRole);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      showToast('Please provide an email address.', 'warning');
      return;
    }

    await signup(newName || newEmail.split('@')[0], newEmail.trim(), newPassword, newRole);
    setShowAddModal(false);
    setNewName('');
    setNewEmail('');
    setNewPassword('password');
    setNewRole('sales_rep');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const clientCount = (registeredUsers || []).filter(u => u.role === 'customer').length;
  const staffCount = (registeredUsers || []).filter(u => u.role !== 'customer').length;

  return (
    <div className="space-y-6 text-left">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-cream border border-warm p-6 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-purple-100 text-purple-800 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-purple-200">
              Admin Governance
            </span>
            <span className="text-xs text-muted">Role-Based Access Control (RBAC)</span>
          </div>
          <h2 className="text-2xl font-bold text-charcoal flex items-center gap-2">
            <Users className="w-6 h-6 text-charcoal" /> User Management & Role Assignment
          </h2>
          <p className="text-xs text-muted mt-1 max-w-2xl">
            Admin console to audit all active platform users. Assign or reassign roles in real time to grant or restrict access to sales operations workspaces and client portals.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary btn-md flex items-center gap-2 shrink-0 shadow-sm cursor-pointer"
        >
          <UserPlus className="w-4 h-4" /> Provision New User
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4 bg-white border border-warm rounded-xl shadow-2xs">
          <span className="text-muted text-[11px] font-medium block">Total Registered Accounts</span>
          <span className="text-2xl font-bold text-charcoal">{registeredUsers?.length || 0}</span>
        </div>
        <div className="card p-4 bg-white border border-warm rounded-xl shadow-2xs">
          <span className="text-muted text-[11px] font-medium block">Enterprise Staff</span>
          <span className="text-2xl font-bold text-purple-900">{staffCount}</span>
        </div>
        <div className="card p-4 bg-white border border-warm rounded-xl shadow-2xs">
          <span className="text-muted text-[11px] font-medium block">Client / Customer Users</span>
          <span className="text-2xl font-bold text-emerald-800">{clientCount}</span>
        </div>
        <div className="card p-4 bg-white border border-warm rounded-xl shadow-2xs">
          <span className="text-muted text-[11px] font-medium block">Access Tiers Defined</span>
          <span className="text-2xl font-bold text-charcoal">5 Roles</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-warm p-4 rounded-xl shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-warm bg-cream focus:outline-none focus:ring-1 focus:ring-charcoal"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-muted flex items-center gap-1 font-semibold shrink-0">
            <Filter className="w-3.5 h-3.5" /> Role Filter:
          </span>
          {['all', 'admin', 'sales_manager', 'sales_rep', 'finance', 'customer'].map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                roleFilter === r
                  ? 'bg-charcoal text-white shadow-xs'
                  : 'bg-cream text-muted border border-warm hover:text-charcoal'
              }`}
            >
              {r === 'all' ? 'All Roles' : (roleDefinitions[r]?.label || r)}
            </button>
          ))}
        </div>
      </div>

      {/* Users & Roles Table */}
      <div className="bg-white border border-warm rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-cream border-b border-warm text-muted text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-3 px-5">User & Identity</th>
                <th className="py-3 px-5">Work Email</th>
                <th className="py-3 px-5">Current Role</th>
                <th className="py-3 px-5">Assign / Change Role</th>
                <th className="py-3 px-5">Access Scope Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm">
              {filteredUsers.map((user) => {
                const roleMeta = roleDefinitions[user.role] || roleDefinitions['customer'];
                const isCurrentUser = currentUser?.id === user.id || currentUser?.email === user.email;

                return (
                  <tr key={user.id || user.email} className="hover:bg-charcoal-03/40 transition-colors">
                    {/* User Identity */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-charcoal text-cream font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                          {getInitials(user.name)}
                        </div>
                        <div>
                          <div className="font-bold text-charcoal text-xs flex items-center gap-1.5">
                            {user.name}
                            {isCurrentUser && (
                              <span className="text-[9px] bg-charcoal text-white px-1.5 py-0.2 rounded-full font-semibold">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-muted font-mono">ID: {user.id || 'usr-auto'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-5 font-mono text-muted text-xs">
                      {user.email}
                    </td>

                    {/* Current Role Badge */}
                    <td className="py-3.5 px-5">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${roleMeta.badgeClass}`}>
                        <roleMeta.icon className="w-3 h-3" />
                        {roleMeta.label}
                      </span>
                    </td>

                    {/* Role Selector / Assignment Dropdown */}
                    <td className="py-3.5 px-5">
                      <select
                        value={user.role || 'customer'}
                        onChange={(e) => handleRoleChange(user.id || user.email, e.target.value)}
                        className="border border-[#c8c4bb] rounded-xl px-3 py-1.5 text-xs font-semibold bg-white text-charcoal focus:outline-none focus:ring-1 focus:ring-charcoal shadow-2xs cursor-pointer hover:border-charcoal transition-colors"
                      >
                        <option value="admin">⚙️ Admin (System Governance)</option>
                        <option value="sales_manager">👔 Sales Manager (Approvals)</option>
                        <option value="sales_rep">👤 Sales Rep (Quotations)</option>
                        <option value="finance">💰 Finance / Ops (Fulfillment & Billing)</option>
                        <option value="customer">🤝 Customer / Client (Client Portal)</option>
                      </select>
                    </td>

                    {/* Access Scope Description */}
                    <td className="py-3.5 px-5 text-muted text-[11px] max-w-xs leading-relaxed">
                      {roleMeta.description}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Permission Reference Card */}
      <div className="bg-cream border border-warm rounded-2xl p-6 space-y-4">
        <h4 className="text-sm font-bold text-charcoal flex items-center gap-2">
          <Info className="w-4 h-4 text-charcoal" /> Role Permission Reference Matrix
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.entries(roleDefinitions).map(([roleKey, meta]) => {
            const Icon = meta.icon;
            return (
              <div key={roleKey} className="p-3.5 bg-white border border-warm rounded-xl space-y-1.5 shadow-2xs text-left">
                <div className="flex items-center gap-1.5 font-bold text-xs text-charcoal">
                  <Icon className="w-3.5 h-3.5 text-charcoal" /> {meta.label}
                </div>
                <p className="text-[10px] text-muted leading-relaxed">
                  {meta.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Provision New User */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4">
          <div className="bg-white border border-warm rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 text-left">
            <div className="border-b border-warm pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-charcoal">Provision New User Account</h3>
                <p className="text-xs text-muted">Create an account with pre-assigned permissions.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-muted hover:text-charcoal p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="label font-semibold">Full Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Maya Lin"
                  className="input text-xs w-full"
                  required
                />
              </div>

              <div>
                <label className="label font-semibold">Email Address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. maya@dealflow.com"
                  className="input text-xs w-full"
                  required
                />
              </div>

              <div>
                <label className="label font-semibold">Initial Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input text-xs w-full"
                  required
                />
              </div>

              <div>
                <label className="label font-semibold">Assign Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="select text-xs w-full"
                >
                  <option value="sales_rep">Sales Rep</option>
                  <option value="sales_manager">Sales Manager</option>
                  <option value="finance">Finance / Operations</option>
                  <option value="customer">Customer / Client (Portal)</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-warm">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-ghost text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary text-xs flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Provision User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
