import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Kanban,
  ShoppingCart, 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  ExternalLink, 
  Activity, 
  Sliders,
  RotateCcw,
  UserCheck,
  LogOut,
  Settings
} from 'lucide-react';

export const Navbar = () => {
  const { currentRole, currentView, setView, currentUser, logout } = useApp();

  const roleBadgeMap = {
    sales_rep: { label: '👤 Sales Rep', class: 'badge-neutral' },
    sales_manager: { label: '👔 Sales Manager', class: 'badge-warning' },
    finance: { label: '💰 Finance / Operations', class: 'badge-info' },
    customer: { label: '🤝 Customer Portal', class: 'badge-success' },
    admin: { label: '⚙️ Admin', class: 'badge-danger' }
  };

  const navItems = [
    { id: 'pipeline', label: 'Pipeline', icon: Kanban, roles: ['sales_rep', 'sales_manager', 'admin'] },
    { id: 'builder', label: 'Quotations', icon: ShoppingCart, roles: ['sales_rep', 'sales_manager', 'admin'] },
    { id: 'approval', label: 'Approval Queue', icon: ShieldCheck, roles: ['sales_manager', 'finance', 'admin'] },
    { id: 'fulfillment', label: 'Fulfillment & Split', icon: Truck, roles: ['finance', 'admin', 'sales_rep'] },
    { id: 'billing', label: 'Hybrid Billing', icon: CreditCard, roles: ['finance', 'admin', 'sales_rep'] },
    { id: 'portal', label: 'Customer Portal', icon: ExternalLink, roles: ['customer', 'sales_rep', 'admin'] },
    { id: 'deal_health', label: 'Deal Health', icon: Activity, roles: ['sales_manager', 'admin'] },
    { id: 'config', label: 'Backend Setup', icon: Sliders, roles: ['admin', 'sales_manager'] }
  ];

  const activeRole = currentUser?.role || currentRole;
  const visibleNavItems = navItems.filter(item => item.roles.includes(activeRole));
  const activeRoleBadge = roleBadgeMap[activeRole] || { label: activeRole, class: 'badge-neutral' };

  return (
    <header className="sticky top-0 z-40 bg-cream border-b border-warm px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-charcoal text-cream flex items-center justify-center font-bold text-lg shadow-sm">
            DF
          </div>
          <div>
            <span className="font-heading font-bold text-lg text-charcoal tracking-tight">DealFlow360</span>
            <span className="hidden sm:inline-block text-xs text-muted ml-2 px-2 py-0.5 rounded-full border border-warm bg-cream">
              React Deal Engine
            </span>
          </div>
        </div>

        {/* Navigation Tabs (Filtered by Role) */}
        <nav className="flex items-center gap-1 overflow-x-auto py-1">
          {visibleNavItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-ghost'} flex items-center gap-1.5`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* B1 Actions & User Badge */}
        <div className="flex items-center gap-2">
          {currentUser && (
            <div className="flex items-center gap-2">
              {/* User Name Pill */}
              <span className="badge badge-neutral text-xs py-1 px-2.5 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-semibold">{currentUser.name}</span>
              </span>
              
              {/* Fixed Read-Only Role Badge */}
              <span className={`badge ${activeRoleBadge.class} text-xs py-1 px-3 font-bold`}>
                {activeRoleBadge.label}
              </span>

              {/* B1 Action: Reload Data */}
              <button
                onClick={() => {
                  window.location.reload();
                }}
                title="Reload Data (Refreshes pricing, stock & approvals)"
                className="btn btn-sm btn-outline text-xs flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5 text-emerald-700" /> Reload Data
              </button>

              {/* B1 Action: Go to Back-end */}
              {(activeRole === 'admin' || activeRole === 'sales_manager') && (
                <button
                  onClick={() => setView('config')}
                  title="Go to Back-end Configuration"
                  className="btn btn-sm btn-cream text-xs flex items-center gap-1"
                >
                  <Settings className="w-3.5 h-3.5" /> Back-end
                </button>
              )}

              {/* B1 Action: Close Workspace / Sign Out */}
              <button
                onClick={() => {
                  localStorage.removeItem('dealflow360_user');
                  logout();
                }}
                title="Close Workspace (Ends current session)"
                className="btn btn-sm btn-outline text-xs text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" /> Close Workspace
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
