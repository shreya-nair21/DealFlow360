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
  UserCheck,
  LogOut,
  Users
} from 'lucide-react';

export const Navbar = () => {
  const { currentRole, currentView, setView, currentUser, logout } = useApp();

  const navItems = [
    { id: 'pipeline', label: 'Pipeline', title: 'Deal Pipeline Kanban', icon: Kanban, roles: ['sales_rep', 'sales_manager', 'admin'] },
    { id: 'builder', label: 'Quotes', title: 'Quotations & Pricing Builder', icon: ShoppingCart, roles: ['sales_rep', 'sales_manager', 'admin', 'customer'] },
    { id: 'approval', label: 'Approvals', title: 'Discount Governance & Approval Queue', icon: ShieldCheck, roles: ['sales_manager', 'finance', 'admin'] },
    { id: 'fulfillment', label: 'Fulfillment', title: 'Warehouse Fulfillment & Stock Split', icon: Truck, roles: ['finance', 'admin', 'sales_rep', 'customer'] },
    { id: 'billing', label: 'Billing', title: 'Hybrid Billing & Subscriptions', icon: CreditCard, roles: ['finance', 'admin', 'sales_rep', 'customer'] },
    { id: 'users', label: 'Users', title: 'User Management & Role Permissions', icon: Users, roles: ['admin'] },
    { id: 'portal', label: 'Portal', title: 'Customer Negotiation Portal', icon: ExternalLink, roles: ['customer', 'sales_rep', 'admin'] },
    { id: 'deal_health', label: 'Health', title: 'Deal Health & Margin Protection', icon: Activity, roles: ['sales_manager', 'admin'] },
    { id: 'config', label: 'Setup', title: 'Backend Engine Configuration', icon: Sliders, roles: ['admin', 'sales_manager'] }
  ];

  const activeRole = currentUser?.role || currentRole;
  const visibleNavItems = navItems.filter(item => item.roles.includes(activeRole));

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#e2e2e2] px-4 py-1.5 shadow-2xs">
      <div className="w-full mx-auto flex items-center justify-between gap-3">
        
        {/* Left: Brand Logo & Title (Compact) */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="h-7 w-7 rounded-lg bg-black text-white flex items-center justify-center font-bold text-xs shadow-xs">
            DF
          </div>
          <span className="font-heading font-bold text-sm tracking-tight text-black hidden sm:inline">DealFlow360</span>
        </div>

        {/* Center: All Navigation Links fit perfectly in a single row */}
        <nav className="flex items-center gap-1 justify-center flex-1 max-w-4xl">
          {visibleNavItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                title={item.title}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs whitespace-nowrap transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-black text-white border border-black shadow-2xs font-bold' 
                    : 'bg-[#efefef] text-black hover:bg-[#e2e2e2] border border-transparent font-medium'
                }`}
              >
                <Icon className="w-3 h-3 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Combined User Profile Pill & Logout Button */}
        {currentUser && (
          <div className="flex items-center gap-1.5 shrink-0">
            {/* User Name & Role Pill */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#efefef] text-black border border-[#e2e2e2] text-xs font-semibold">
              <UserCheck className="w-3.5 h-3.5 text-black" />
              <span>{currentUser.name}</span>
              <span className="text-xs text-[#5e5e5e] uppercase font-bold tracking-wider">
                ({activeRole.replace('_', ' ')})
              </span>
            </span>

            {/* Compact Logout Button */}
            <button
              onClick={() => {
                localStorage.removeItem('dealflow360_user');
                logout();
              }}
              title="Sign out and close workspace"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black text-white hover:bg-[#282828] text-xs font-semibold border border-black cursor-pointer transition-all shrink-0"
            >
              <LogOut className="w-3 h-3" />
              <span>Log Out</span>
            </button>
          </div>
        )}

      </div>
    </header>
  );
};
