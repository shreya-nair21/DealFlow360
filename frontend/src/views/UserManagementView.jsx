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
      badgeClass: 'bg-black text-white border-black',
      description: 'Full administrative access: rule configurations, discount ceilings, user role governance, and approvals.',
      icon: ShieldCheck
    },
    sales_manager: {
      label: 'Sales Manager',
      badgeClass: 'bg-[#efefef] text-black border-black',
      description: 'Approval queue management, risk escalation reviews, pipeline supervision, and deal health tracking.',
      icon: Shield
    },
    sales_rep: {
      label: 'Sales Rep',
      badgeClass: 'bg-[#efefef] text-[#5e5e5e] border-[#e2e2e2]',
      description: 'Quotation drafting, customer catalog browsing, discount proposals, and deal negotiation handling.',
      icon: Briefcase
    },
    finance: {
      label: 'Finance / Ops',
      badgeClass: 'bg-black text-white border-black',
      description: 'Multi-warehouse fulfillment allocation, backorder resolution, hybrid invoice releases, and recurring billing.',
      icon: Lock
    },
    customer: {
      label: 'Customer / Client',
      badgeClass: 'bg-[#efefef] text-black border-[#e2e2e2]',
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

  const handleRoleChange = (userIdOrEmail, targetRole) => {
    if (updateUserRole) {
      updateUserRole(userIdOrEmail, targetRole);
      showToast(`User role successfully changed to ${roleDefinitions[targetRole]?.label || targetRole}.`, 'success');
    }
  };

  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      showToast('Please fill all required user fields.', 'error');
      return;
    }

    const created = registerUser({
      name: newName.trim(),
      email: newEmail.trim(),
      password: newPassword,
      role: newRole
    });

    if (created) {
      showToast(`User ${newName} provisioned with role "${roleDefinitions[newRole]?.label}".`, 'success');
      setShowAddModal(false);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('sales_rep');
    }
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 bg-white border border-[#e2e2e2] p-6 md:p-8 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="bg-black text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
              Admin Governance
            </span>
            <span className="text-xs text-muted font-medium">Role-Based Access Control (RBAC)</span>
          </div>
          <h2 className="text-xl font-bold text-black flex items-center gap-2.5">
            <Users className="w-5 h-5 text-black" /> User Management & Role Assignment
          </h2>
          <p className="text-xs text-[#5e5e5e] mt-1 max-w-2xl leading-relaxed">
            Admin console to audit all active platform users. Assign or reassign roles in real time to grant or restrict access to sales operations workspaces and client portals.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-black hover:bg-[#282828] text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer px-4 py-2 rounded-full transition-all"
        >
          <UserPlus className="w-4 h-4 text-white" /> Provision New User
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4 bg-white border border-[#e2e2e2] rounded-2xl shadow-2xs">
          <span className="text-[#5e5e5e] text-xs font-bold uppercase tracking-wider block">Total Accounts</span>
          <span className="text-2xl font-bold text-black mt-1 block">{registeredUsers?.length || 0}</span>
        </div>
        <div className="card p-4 bg-white border border-[#e2e2e2] rounded-2xl shadow-2xs">
          <span className="text-[#5e5e5e] text-xs font-bold uppercase tracking-wider block">Enterprise Staff</span>
          <span className="text-2xl font-bold text-black mt-1 block">{staffCount}</span>
        </div>
        <div className="card p-4 bg-white border border-[#e2e2e2] rounded-2xl shadow-2xs">
          <span className="text-[#5e5e5e] text-xs font-bold uppercase tracking-wider block">Client Users</span>
          <span className="text-2xl font-bold text-black mt-1 block">{clientCount}</span>
        </div>
        <div className="card p-4 bg-white border border-[#e2e2e2] rounded-2xl shadow-2xs">
          <span className="text-[#5e5e5e] text-xs font-bold uppercase tracking-wider block">Access Tiers</span>
          <span className="text-2xl font-bold text-black mt-1 block">5 Roles</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-warm p-5 rounded-2xl shadow-2xs">
        <div className="relative w-full sm:w-96">
          <Search className="w-5 h-5 text-muted absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2.5 text-sm md:text-base rounded-xl border border-warm bg-[#efefef] focus:bg-white focus:outline-none focus:ring-1 focus:ring-charcoal"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-sm text-muted flex items-center gap-1.5 font-bold shrink-0">
            <Filter className="w-4 h-4" /> Filter:
          </span>
          {['all', 'admin', 'sales_manager', 'sales_rep', 'finance', 'customer'].map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3.5 py-1.5 rounded-full text-xs md:text-sm font-semibold shrink-0 transition-all ${
                roleFilter === r
                  ? 'bg-charcoal text-white shadow-xs'
                  : 'bg-[#efefef] text-muted border border-warm hover:text-charcoal'
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
          <table className="w-full text-sm md:text-base text-left">
            <thead>
              <tr className="bg-[#efefef] border-b border-warm text-charcoal text-xs md:text-sm uppercase tracking-wider font-bold">
                <th className="py-4 px-6">User & Identity</th>
                <th className="py-4 px-6">Work Email</th>
                <th className="py-4 px-6">Current Role</th>
                <th className="py-4 px-6">Assign / Change Role</th>
                <th className="py-4 px-6">Access Scope Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm">
              {filteredUsers.map((user) => {
                const roleMeta = roleDefinitions[user.role] || roleDefinitions['customer'];
                const isCurrentUser = currentUser?.id === user.id || currentUser?.email === user.email;

                return (
                  <tr key={user.id || user.email} className="hover:bg-charcoal-03/60 transition-colors">
                    {/* User Identity */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3.5">
                        <div className="h-11 w-11 rounded-full bg-charcoal text-white font-bold text-sm md:text-base flex items-center justify-center shrink-0 shadow-sm">
                          {getInitials(user.name)}
                        </div>
                        <div>
                          <div className="font-bold text-charcoal text-sm md:text-base flex items-center gap-2">
                            {user.name}
                            {isCurrentUser && (
                              <span className="text-xs bg-charcoal text-white px-2 py-0.5 rounded-full font-semibold">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-xs md:text-sm text-muted font-mono block mt-0.5">ID: {user.id || 'usr-auto'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-4 px-6 font-mono text-charcoal text-sm md:text-base font-medium">
                      {user.email}
                    </td>

                    {/* Current Role Badge */}
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 text-xs md:text-sm font-bold px-3.5 py-1.5 rounded-full border ${roleMeta.badgeClass}`}>
                        <roleMeta.icon className="w-4 h-4" />
                        {roleMeta.label}
                      </span>
                    </td>

                    {/* Role Selector / Assignment Dropdown */}
                    <td className="py-4 px-6">
                      <select
                        value={user.role || 'customer'}
                        onChange={(e) => handleRoleChange(user.id || user.email, e.target.value)}
                        className="border border-[#c8c4bb] rounded-xl px-4 py-2.5 text-sm md:text-base font-semibold bg-white text-charcoal focus:outline-none focus:ring-2 focus:ring-charcoal shadow-2xs cursor-pointer hover:border-charcoal transition-colors"
                      >
                        <option value="admin">⚙️ Admin (System Governance)</option>
                        <option value="sales_manager">👔 Sales Manager (Approvals)</option>
                        <option value="sales_rep">👤 Sales Rep (Quotations)</option>
                        <option value="finance">💰 Finance / Ops (Fulfillment & Billing)</option>
                        <option value="customer">🤝 Customer / Client (Client Portal)</option>
                      </select>
                    </td>

                    {/* Access Scope Description */}
                    <td className="py-4 px-6 text-[#4b4b4b] text-xs md:text-sm max-w-sm leading-relaxed font-normal">
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
      <div className="bg-white border border-warm rounded-2xl p-6 md:p-8 space-y-4 shadow-xs">
        <h4 className="text-base md:text-lg font-bold text-charcoal flex items-center gap-2.5">
          <Info className="w-5 h-5 text-charcoal" /> Role Permission Reference Matrix
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(roleDefinitions).map(([roleKey, meta]) => {
            const Icon = meta.icon;
            return (
              <div key={roleKey} className="p-4 bg-[#f8f8f8] border border-warm rounded-2xl space-y-2 shadow-2xs text-left">
                <div className="flex items-center gap-2 font-bold text-sm md:text-base text-charcoal">
                  <Icon className="w-4 h-4 text-charcoal shrink-0" /> {meta.label}
                </div>
                <p className="text-xs md:text-sm text-[#4b4b4b] leading-relaxed">
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
