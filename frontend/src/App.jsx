import React from 'react';
import { useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { LoginLandingView } from './views/LoginLandingView';
import { QuoteBuilderView } from './views/QuoteBuilderView';
import { ApprovalView } from './views/ApprovalView';
import { FulfillmentView } from './views/FulfillmentView';
import { BillingView } from './views/BillingView';
import { CustomerPortalView } from './views/CustomerPortalView';
import { DealHealthView } from './views/DealHealthView';
import { BackendConfigView } from './views/BackendConfigView';

import { PipelineView } from './views/PipelineView';
import { UserManagementView } from './views/UserManagementView';

import { ToastContainer } from './components/ToastContainer';

export const AppContent = () => {
  const { currentUser, currentView } = useApp();

  // Auth Guard: Unauthenticated users are redirected to LoginLandingView
  if (!currentUser) {
    return <LoginLandingView />;
  }

  // Client / Customer Workspace: opens directly to Customer Portal by default
  if (currentUser.role === 'customer' && currentView !== 'builder' && currentView !== 'fulfillment') {
    return (
      <div className="min-h-screen bg-white">
        <ToastContainer />
        <CustomerPortalView />
      </div>
    );
  }

  // Internal Staff / Admin Workspace: Full Operations Dashboard
  const navItems = [
    { id: 'pipeline', roles: ['sales_rep', 'sales_manager', 'admin'] },
    { id: 'builder', roles: ['sales_rep', 'sales_manager', 'admin', 'customer'] },
    { id: 'approval', roles: ['sales_manager', 'finance', 'admin'] },
    { id: 'fulfillment', roles: ['finance', 'admin', 'sales_rep', 'customer'] },
    { id: 'billing', roles: ['finance', 'admin', 'sales_rep'] },
    { id: 'users', roles: ['admin'] },
    { id: 'portal', roles: ['customer', 'sales_rep', 'admin'] },
    { id: 'deal_health', roles: ['sales_manager', 'admin'] },
    { id: 'config', roles: ['admin', 'sales_manager'] }
  ];

  const userRole = currentUser?.role || 'admin';
  const allowedViews = navItems.filter(item => item.roles.includes(userRole)).map(i => i.id);
  const activeView = allowedViews.includes(currentView) ? currentView : (allowedViews[0] || 'builder');

  const renderView = () => {
    switch (activeView) {
      case 'pipeline': return <PipelineView />;
      case 'builder': return <QuoteBuilderView />;
      case 'approval': return <ApprovalView />;
      case 'fulfillment': return <FulfillmentView />;
      case 'billing': return <BillingView />;
      case 'users': return <UserManagementView />;
      case 'portal': return <CustomerPortalView />;
      case 'deal_health': return <DealHealthView />;
      case 'config': return <BackendConfigView />;
      default: return <QuoteBuilderView />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream text-charcoal">
      <ToastContainer />
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderView()}
      </main>
    </div>
  );
};
