import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  FilePlus2, 
  Plus, 
  CheckCircle2, 
  MessageSquare, 
  Send, 
  Clock, 
  X,
  Users,
  Trash2,
  Calendar,
  Building2,
  FileCheck,
  Crown,
  Award,
  Medal,
  Sparkles,
  Shield,
  TrendingUp,
  Gift,
  ShoppingCart
} from 'lucide-react';

export const CustomerPortalView = () => {
  const { 
    data, 
    currentUser, 
    logout, 
    updateActiveQuote, 
    addApprovalLog, 
    showToast, 
    setData,
    calculateCustomerTier,
    TIER_CONFIG,
    updateCustomerOrderCount,
    incrementCustomerOrders,
    setView
  } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState(null);

  // Form State for "Create New Quotation" matching screenshot
  const [customerName, setCustomerName] = useState(currentUser?.name || 'Google User');
  const [companyName, setCompanyName] = useState('Google User Corp');
  const [quotationTitle, setQuotationTitle] = useState('Custom Enterprise Quotation');
  const [validUntilDate, setValidUntilDate] = useState('2026-09-19');
  const [proposalScope, setProposalScope] = useState('Request for enterprise software licenses and implementation services.');
  
  const [lineItems, setLineItems] = useState([
    { id: '1', name: 'Software Enterprise License', description: 'Annual subscription', quantity: 1, unitPrice: 1200 },
    { id: '2', name: 'Onboarding & Setup Service', description: 'Dedicated engineer setup', quantity: 1, unitPrice: 450 }
  ]);
  const [discountPercent, setDiscountPercent] = useState(0);

  // Negotiation Remarks State
  const [commentText, setCommentText] = useState('');
  const [counterDiscount, setCounterDiscount] = useState(15);

  // Find user's customer record in data.customers
  const customerRecord = (data.customers || []).find(c => 
    c.id === currentUser?.id || 
    c.email === currentUser?.email || 
    (currentUser?.role === 'customer' && c.id === 'c-client')
  ) || {
    id: currentUser?.id || 'c-client',
    name: customerName || currentUser?.name || 'Saurav (Client)',
    email: currentUser?.email || 'client@dealflow.com',
    orderCount: 5,
    tier: 'Silver'
  };

  const currentOrders = customerRecord.orderCount !== undefined ? customerRecord.orderCount : 5;
  const currentTier = calculateCustomerTier ? calculateCustomerTier(currentOrders) : (customerRecord.tier || 'Silver');
  const tierInfo = (TIER_CONFIG && TIER_CONFIG[currentTier]) || {
    label: currentTier,
    discountCeiling: '10%',
    badgeColor: 'bg-slate-200 text-slate-800 border-slate-400',
    headerBadge: 'bg-slate-200 text-slate-900 border-slate-400',
    emoji: '🥈',
    nextTier: 'Gold',
    nextThreshold: 8,
    description: 'Silver Customer Tier (5–7 orders). 8 orders unlocks Gold!'
  };

  const nextTierName = tierInfo.nextTier;
  const nextThreshold = tierInfo.nextThreshold;
  const ordersNeeded = nextThreshold ? Math.max(0, nextThreshold - currentOrders) : 0;

  const milestones = [
    { tier: 'Bronze', count: 3, ceiling: '5%', emoji: '🥉', desc: 'Standard Tier (5% max discount)' },
    { tier: 'Silver', count: 5, ceiling: '10%', emoji: '🥈', desc: 'Silver Tier (10% max discount)' },
    { tier: 'Gold', count: 8, ceiling: '15%', emoji: '🥇', desc: 'Gold Tier (15% max discount)' },
    { tier: 'Platinum', count: 10, ceiling: '20%', emoji: '💎', desc: 'Platinum VIP (20% max discount & instant approval)' }
  ];

  // Find user's quotations
  const userQuotes = (data.quotations || []).filter(q => 
    q.customerId === currentUser?.id || 
    q.customerId === 'c-client' || 
    (currentUser?.email && q.customerEmail === currentUser.email) ||
    q.customerName === currentUser?.name
  );

  const activeQuote = (data.quotations || []).find(q => q.id === (selectedQuoteId || userQuotes[0]?.id));

  // Calculations for Create Modal
  const subtotal = lineItems.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return sum + (qty * price);
  }, 0);

  const discountVal = parseFloat(discountPercent) || 0;
  const discountAmt = subtotal * (discountVal / 100);
  const discountedSubtotal = subtotal - discountAmt;
  const taxAmount = discountedSubtotal * 0.10; // 10% Tax
  const grandTotal = discountedSubtotal + taxAmount;

  // Add line item
  const handleAddLineItem = () => {
    setLineItems(prev => [
      ...prev,
      { id: Date.now().toString(), name: '', description: '', quantity: 1, unitPrice: 0 }
    ]);
  };

  // Remove line item
  const handleRemoveLineItem = (id) => {
    if (lineItems.length === 1) {
      showToast('A quotation must have at least one line item.', 'warning');
      return;
    }
    setLineItems(prev => prev.filter(item => item.id !== id));
  };

  // Update line item
  const handleUpdateLineItem = (id, field, value) => {
    setLineItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // Submit/Save Quotation
  const handleSaveQuotation = (status = 'Pending Approval') => {
    if (!companyName.trim()) {
      showToast('Please enter a Company Name.', 'warning');
      return;
    }
    if (!quotationTitle.trim()) {
      showToast('Please enter a Quotation Title.', 'warning');
      return;
    }
    if (lineItems.length === 0) {
      showToast('Please add at least one line item.', 'warning');
      return;
    }

    const newQuoteId = 'q-' + Date.now();
    const newCode = `QT-2026-${String(data.quotations.length + 1).padStart(3, '0')}`;
    
    const newQuote = {
      id: newQuoteId,
      code: newCode,
      title: quotationTitle,
      companyName: companyName,
      customerName: customerName || currentUser?.name || 'Google User',
      customerEmail: currentUser?.email || 'client@dealflow.com',
      customerId: currentUser?.id || 'c-client',
      validUntil: validUntilDate,
      scope: proposalScope,
      status: status,
      discountPct: discountVal,
      subtotal: subtotal,
      tax: taxAmount,
      grandTotal: grandTotal,
      lines: lineItems.map((item, idx) => ({
        id: `ql-${Date.now()}-${idx}`,
        name: item.name || 'Custom Product / Service',
        description: item.description || '',
        quantity: parseFloat(item.quantity) || 1,
        unitPrice: parseFloat(item.unitPrice) || 0,
        total: (parseFloat(item.quantity) || 1) * (parseFloat(item.unitPrice) || 0),
        discountPct: discountVal
      })),
      comments: proposalScope ? [{
        id: 'cm-' + Date.now(),
        sender: customerName || currentUser?.name || 'Google User',
        role: 'customer',
        text: `Proposal Scope: ${proposalScope}`,
        timestamp: new Date().toISOString()
      }] : []
    };

    setData(prev => ({
      ...prev,
      quotations: [newQuote, ...prev.quotations],
      activeQuoteId: newQuoteId
    }));

    if (status === 'Pending Approval') {
      addApprovalLog({
        quoteId: newQuoteId,
        user: customerName || currentUser?.name || 'Google User',
        role: 'customer',
        action: 'Submitted Quotation for Approval',
        blendedRiskScore: discountVal > 10 ? 14.5 : 4.2,
        reason: `New client proposal: "${quotationTitle}" from ${companyName}. Total: $${grandTotal.toFixed(2)}`
      });
    }

    setShowCreateModal(false);
    setSelectedQuoteId(newQuoteId);
    showToast(
      status === 'Pending Approval'
        ? `Quotation "${quotationTitle}" submitted for Approval!`
        : `Quotation "${quotationTitle}" saved as Draft!`,
      'success'
    );
  };

  const getInitials = (name) => {
    if (!name) return 'GU';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex min-h-screen bg-[#faf8f5] text-charcoal font-sans">
      
      {/* ================= PURPLE CLIENT SIDEBAR ================= */}
      <aside className="w-64 bg-[#380e43] text-white flex flex-col justify-between p-5 shrink-0 select-none shadow-xl">
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="border-b border-purple-800/60 pb-5">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              DealFlow360
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-widest text-purple-300 block mt-1">
              CLIENT PORTAL
            </span>
          </div>

          {/* Nav Section */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300/60 block px-3">
              CLIENT WORKSPACE
            </span>
            <button
              onClick={() => setSelectedQuoteId(null)}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-[#521860] text-white font-semibold text-xs shadow-inner transition-all hover:bg-[#5f1c6f]"
            >
              <Users className="w-4 h-4 text-purple-200" />
              <span>My Quotations</span>
            </button>
            <button
              onClick={() => setView('builder')}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl bg-purple-950/40 text-purple-200 hover:text-white hover:bg-[#521860] font-medium text-xs transition-all border border-purple-400/20"
              title="Go to Quotations Tab"
            >
              <ShoppingCart className="w-4 h-4 text-amber-300" />
              <span>Quotations Tab</span>
            </button>
          </div>

          {/* Sidebar Customer Loyalty Box */}
          <div className="p-3.5 bg-[#521860]/80 border border-purple-400/20 rounded-xl space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-200">
                Loyalty Tier
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tierInfo.badgeColor} flex items-center gap-1 shadow-2xs`}>
                <span>{tierInfo.emoji}</span>
                <span>{currentTier}</span>
              </span>
            </div>
            
            <div className="text-[11px] text-purple-100 flex items-center justify-between">
              <span className="text-purple-300">Orders Completed:</span>
              <span className="font-mono font-bold text-white">{currentOrders} Orders</span>
            </div>

            {/* Progress to Next Tier */}
            {tierInfo.nextTier ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-purple-300">
                  <span>Next: {tierInfo.nextTier}</span>
                  <span>{currentOrders} / {tierInfo.nextThreshold}</span>
                </div>
                <div className="h-1.5 w-full bg-purple-950/60 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (currentOrders / tierInfo.nextThreshold) * 100)}%` }}
                  />
                </div>
                <span className="text-[9px] text-purple-200/90 block mt-0.5">
                  {ordersNeeded} more order{ordersNeeded > 1 ? 's' : ''} to {tierInfo.nextTier}!
                </span>
              </div>
            ) : (
              <div className="text-[10px] text-purple-200 font-semibold flex items-center gap-1">
                <span>💎</span> Top Tier (Platinum) Achieved!
              </div>
            )}
          </div>
        </div>

        {/* User Pill at Bottom */}
        <div className="pt-4 border-t border-purple-800/60 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-[#521860] border border-purple-400/30 text-white font-bold text-xs flex items-center justify-center shrink-0">
            {getInitials(customerName || currentUser?.name)}
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-bold text-white truncate">
              {customerName || currentUser?.name || 'Google User'}
            </div>
            <div className="text-[10px] text-purple-300 truncate">
              Customer Account
            </div>
          </div>
        </div>
      </aside>

      {/* ================= MAIN CONTENT WRAPPER ================= */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-[#eceae4] px-8 flex items-center justify-between shrink-0 shadow-2xs">
          <div>
            <h2 className="text-lg font-bold text-charcoal leading-tight">
              Customer Portal
            </h2>
            <p className="text-xs text-muted">
              Self-service quotation management and submission
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${tierInfo.headerBadge} flex items-center gap-1.5 shadow-2xs`}>
              <span>{tierInfo.emoji}</span>
              <span>{currentTier.toUpperCase()} TIER ({currentOrders} ORDERS)</span>
            </span>
            <span className="bg-[#edeaf4] text-[#4f3b78] text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
              CUSTOMER ACCOUNT
            </span>
            <span className="text-xs font-semibold text-charcoal">
              {customerName || currentUser?.name || 'Google User'}
            </span>
            <span className="text-muted text-xs">|</span>
            <button
              onClick={() => setView('builder')}
              className="btn btn-xs bg-[#521860] hover:bg-[#3d1248] text-white py-1 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer border border-purple-400/30"
              title="Open Quotations Workspace to evaluate badges and configure pricing"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-amber-300" />
              <span>Quotations Tab</span>
            </button>
            <span className="text-muted text-xs">|</span>
            <button
              onClick={logout}
              className="text-xs text-charcoal/80 hover:text-danger font-medium transition-colors cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* View Body */}
        <main className="flex-1 p-8 overflow-y-auto max-w-6xl w-full mx-auto space-y-6">
          
          {/* ================= CUSTOMER LOYALTY TIER STATUS & MILESTONES ================= */}
          <div className="bg-white rounded-2xl p-6 border border-[#eceae4] shadow-xs space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#f2efe9] pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-purple-100 text-purple-800 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-purple-200 flex items-center gap-1">
                    <Crown className="w-3 h-3" /> LOYALTY & REWARDS PROGRAM
                  </span>
                  <span className="text-xs text-muted">Tier Status Engine</span>
                </div>
                <h3 className="text-xl font-bold text-charcoal tracking-tight flex items-center gap-2">
                  <span>{tierInfo.emoji}</span>
                  <span>Customer Tier: {currentTier} Member ({currentOrders} Orders Completed)</span>
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Your discount privileges scale with your completed orders: <strong>3 Orders (Bronze)</strong> • <strong>5 Orders (Silver)</strong> • <strong>8 Orders (Gold)</strong> • <strong>10+ Orders (Platinum)</strong>.
                </p>
              </div>

              {/* Quick Tier Switcher / Order Simulator */}
              <div className="flex items-center gap-2 p-2 bg-[#faf9f6] border border-[#eceae4] rounded-xl self-start md:self-auto shrink-0">
                <span className="text-[11px] font-semibold text-muted px-1 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-charcoal" /> Orders:
                </span>
                <button
                  onClick={() => updateCustomerOrderCount(customerRecord.id, Math.max(0, currentOrders - 1))}
                  title="Decrease order count (-1 Order)"
                  className="w-7 h-7 rounded-lg bg-white border border-warm hover:bg-charcoal-03 flex items-center justify-center font-bold text-xs text-charcoal shadow-2xs cursor-pointer transition-all"
                >
                  -
                </button>
                <span className="font-mono font-bold text-xs px-2 min-w-[28px] text-center text-charcoal">
                  {currentOrders}
                </span>
                <button
                  onClick={() => updateCustomerOrderCount(customerRecord.id, currentOrders + 1)}
                  title="Increase order count (+1 Order)"
                  className="w-7 h-7 rounded-lg bg-charcoal text-white hover:bg-black flex items-center justify-center font-bold text-xs shadow-2xs cursor-pointer transition-all"
                >
                  +
                </button>

                <div className="h-4 w-[1px] bg-warm mx-1 hidden sm:block" />

                {/* Quick Jump Buttons for 3, 5, 8, 10 */}
                <div className="hidden sm:flex items-center gap-1 text-[10px]">
                  {[
                    { count: 3, tier: 'Bronze', emoji: '🥉' },
                    { count: 5, tier: 'Silver', emoji: '🥈' },
                    { count: 8, tier: 'Gold', emoji: '🥇' },
                    { count: 10, tier: 'Platinum', emoji: '💎' }
                  ].map(t => (
                    <button
                      key={t.tier}
                      onClick={() => updateCustomerOrderCount(customerRecord.id, t.count)}
                      title={`Jump to ${t.count} orders (${t.tier} Tier)`}
                      className={`px-2 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                        currentOrders === t.count
                          ? 'bg-charcoal text-white shadow-2xs font-bold'
                          : 'bg-white border border-[#e5e0d8] hover:bg-charcoal-03 text-charcoal'
                      }`}
                    >
                      {t.emoji} {t.count}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Milestone Cards Grid (4 Milestones) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {milestones.map((m) => {
                const isReached = currentOrders >= m.count;
                const isCurrent = currentTier === m.tier;

                return (
                  <div
                    key={m.tier}
                    onClick={() => updateCustomerOrderCount(customerRecord.id, m.count)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer text-left relative overflow-hidden ${
                      isCurrent
                        ? 'border-charcoal bg-charcoal-03 ring-2 ring-charcoal/20 shadow-xs'
                        : isReached
                        ? 'border-emerald-200 bg-emerald-50/40 hover:border-emerald-300'
                        : 'border-[#eceae4] bg-white hover:border-warm opacity-80'
                    }`}
                  >
                    {isCurrent && (
                      <span className="absolute top-2 right-2 text-[9px] font-bold bg-charcoal text-white px-2 py-0.5 rounded-full">
                        CURRENT
                      </span>
                    )}

                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{m.emoji}</span>
                      <div>
                        <div className="font-bold text-xs text-charcoal flex items-center gap-1.5">
                          {m.tier} Tier
                        </div>
                        <span className="text-[10px] text-muted font-mono">{m.count}+ Orders</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs pt-1 border-t border-[#f0ede6]">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted">Discount Ceiling:</span>
                        <strong className="text-charcoal font-mono">{m.ceiling}</strong>
                      </div>
                      <div className="text-[10px] text-muted line-clamp-1">
                        {m.desc}
                      </div>
                      <div className="pt-1">
                        {isReached ? (
                          <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Unlocked
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-muted">
                            {m.count - currentOrders} more order{m.count - currentOrders > 1 ? 's' : ''} needed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Overall Progression Bar */}
            <div className="p-3.5 bg-[#faf9f6] border border-[#eceae4] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="w-full sm:w-2/3 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-charcoal flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Overall Loyalty Progress
                  </span>
                  <span className="text-muted font-mono">
                    {currentOrders} / 10 Orders to Maximum Tier (Platinum)
                  </span>
                </div>
                <div className="h-2 w-full bg-[#e8e4dc] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 via-emerald-500 to-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((currentOrders / 10) * 100))}%` }}
                  />
                </div>
              </div>

              <div className="w-full sm:w-auto text-right text-xs">
                {tierInfo.nextTier ? (
                  <span className="text-muted">
                    Next Upgrade: <strong className="text-charcoal">{tierInfo.nextTier}</strong> in <strong>{ordersNeeded}</strong> more order{ordersNeeded > 1 ? 's' : ''}!
                  </span>
                ) : (
                  <span className="text-purple-700 font-bold flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-purple-600" /> Max Platinum Tier Unlocked!
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Main Container Card */}
          <div className="bg-white rounded-2xl p-6 border border-[#eceae4] shadow-xs space-y-5">
            
            {/* Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#f2efe9] pb-4">
              <div>
                <span className="inline-block bg-[#e6f4ea] text-[#137333] text-[10px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full mb-1.5">
                  CLIENT SELF-SERVICE PORTAL
                </span>
                <h3 className="text-2xl font-bold text-charcoal tracking-tight">
                  My Quotations
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Create custom pricing proposals, save drafts, and submit for instant Admin review.
                </p>
              </div>

              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-[#053125] hover:bg-[#094233] text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-all shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Quotation</span>
              </button>
            </div>

            {/* Empty State */}
            {userQuotes.length === 0 ? (
              <div className="border-2 border-dashed border-[#dfdbd3] rounded-2xl py-16 px-6 flex flex-col items-center justify-center text-center my-4 bg-[#faf9f6]/50">
                <div className="w-14 h-14 rounded-2xl bg-[#ebf5f1] text-[#2c7a68] flex items-center justify-center mb-3.5 shadow-2xs">
                  <FilePlus2 className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-charcoal">
                  No quotations found.
                </h4>
                <p className="text-xs text-muted max-w-md mt-1 mb-5 leading-relaxed">
                  You haven't created any custom quotations yet. Click below to start building your first quotation.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-[#387a6c] hover:bg-[#2c6559] text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Your First Quotation</span>
                </button>
              </div>
            ) : (
              /* Quotation List & Details */
              <div className="space-y-6">
                
                {/* Quotation Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {userQuotes.map(quote => {
                    const isSelected = activeQuote?.id === quote.id;
                    const statusColors = {
                      'Approved': 'bg-emerald-50 text-emerald-700 border-emerald-200',
                      'Pending Approval': 'bg-amber-50 text-amber-700 border-amber-200',
                      'Confirmed': 'bg-blue-50 text-blue-700 border-blue-200',
                      'Draft': 'bg-gray-100 text-gray-700 border-gray-200'
                    };
                    const statusClass = statusColors[quote.status] || statusColors['Draft'];
                    const displayTotal = quote.grandTotal || (quote.lines || []).reduce((s, l) => s + ((l.quantity || 1) * (l.unitPrice || 0)), 0);

                    return (
                      <div
                        key={quote.id}
                        onClick={() => setSelectedQuoteId(quote.id)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
                          isSelected 
                            ? 'border-charcoal bg-charcoal-03 ring-1 ring-charcoal/20 shadow-xs' 
                            : 'border-[#eceae4] bg-white hover:border-warm'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono font-bold text-xs text-charcoal">{quote.code}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusClass}`}>
                            {quote.status}
                          </span>
                        </div>
                        <div className="font-bold text-xs text-charcoal truncate mb-1">
                          {quote.title || 'Enterprise Proposal'}
                        </div>
                        <div className="text-base font-bold text-charcoal">
                          ${Number(displayTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-[11px] text-muted mt-1 flex items-center justify-between">
                          <span>{(quote.lines || []).length} Item{(quote.lines || []).length !== 1 ? 's' : ''}</span>
                          <span className="text-[10px] flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3" /> {quote.validUntil || 'Active'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Active Quote Inspector */}
                {activeQuote && (
                  <div className="border border-[#eceae4] rounded-2xl p-6 bg-[#faf9f6]/40 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#eceae4] pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-charcoal">{activeQuote.code}</span>
                          <span className="badge badge-warning text-xs font-semibold">{activeQuote.status}</span>
                        </div>
                        <h4 className="text-base font-bold text-charcoal mt-1">
                          {activeQuote.title || 'Custom Enterprise Quotation'}
                        </h4>
                        <p className="text-xs text-muted">
                          Prepared for <strong>{activeQuote.companyName || activeQuote.customerName}</strong> • Valid until {activeQuote.validUntil || '19-09-2026'}
                        </p>
                      </div>

                      {/* Confirmation action if approved or draft */}
                      {(activeQuote.status === 'Approved' || activeQuote.status === 'Draft' || activeQuote.status === 'In Negotiation') && (
                        <button 
                          onClick={() => {
                            const allowedCeiling = data.discountRules?.globalTierCeilings?.[currentTier] || 10;
                            const currentDiscount = activeQuote.discountPct || 0;
                            const exceedsCeiling = currentDiscount > allowedCeiling;

                            if (exceedsCeiling) {
                              updateActiveQuote(q => { q.status = 'Pending Approval'; });
                              addApprovalLog({
                                quoteId: activeQuote.id,
                                user: activeQuote.customerName || customerName || 'Client User',
                                role: 'customer',
                                action: 'Quotation Re-entered Approval Flow',
                                blendedRiskScore: 14.5,
                                reason: `Customer confirmed quote terms, but final discount (${currentDiscount}%) exceeds ${currentTier} status ceiling (${allowedCeiling}%). Automatically re-routed for Manager/Finance approval per Section B8.`
                              });
                              showToast(`⚠️ Final terms exceed ${currentTier} ceiling (${allowedCeiling}%). Quotation automatically re-entered Approval Flow!`, 'warning');
                            } else {
                              updateActiveQuote(q => { 
                                q.status = 'Confirmed'; 
                                q.fulfillmentStatus = 'Ready for Fulfillment';
                              });
                              if (incrementCustomerOrders) {
                                incrementCustomerOrders(customerRecord.id);
                              }
                              addApprovalLog({
                                quoteId: activeQuote.id,
                                user: activeQuote.customerName || customerName || 'Client User',
                                role: 'customer',
                                action: 'Confirmed & Accepted Quotation (Order Placed)',
                                blendedRiskScore: 0,
                                reason: `Customer confirmed quote within allowed ${currentTier} limit (${currentDiscount}% <= ${allowedCeiling}%). Order moved directly to fulfillment.`
                              });
                              showToast('🎉 Quotation confirmed! Order passed governance and moved directly to fulfillment.', 'success');
                            }
                          }}
                          className="btn btn-primary btn-md flex items-center gap-2 shadow-sm bg-emerald-800 hover:bg-emerald-900 border-emerald-800 text-white cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Confirm & Accept Quotation
                        </button>
                      )}
                    </div>

                    {/* Scope / Description */}
                    {activeQuote.scope && (
                      <div className="p-3 bg-white border border-[#eceae4] rounded-xl text-xs space-y-1">
                        <span className="font-bold text-muted text-[10px] uppercase tracking-wider block">Scope Description:</span>
                        <p className="text-charcoal">{activeQuote.scope}</p>
                      </div>
                    )}

                    {/* Line Items Table */}
                    <div className="overflow-x-auto bg-white rounded-xl border border-[#eceae4]">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-[#eceae4] bg-cream text-muted text-[11px]">
                            <th className="py-2.5 px-4 font-medium">Product / Service</th>
                            <th className="py-2.5 px-4 font-medium">Description</th>
                            <th className="py-2.5 px-4 font-medium text-center">Qty</th>
                            <th className="py-2.5 px-4 font-medium text-right">Unit Price</th>
                            <th className="py-2.5 px-4 font-medium text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#eceae4]">
                          {(activeQuote.lines || []).map((line, idx) => {
                            const lineTotal = line.total || ((line.quantity || 1) * (line.unitPrice || 0));
                            return (
                              <tr key={idx} className="hover:bg-charcoal-03/40">
                                <td className="py-3 px-4 font-semibold text-charcoal">{line.name || line.productId}</td>
                                <td className="py-3 px-4 text-muted">{line.description || '—'}</td>
                                <td className="py-3 px-4 text-center font-mono">{line.quantity || 1}</td>
                                <td className="py-3 px-4 text-right font-mono">${Number(line.unitPrice || 0).toFixed(2)}</td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-charcoal">${Number(lineTotal).toFixed(2)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      {/* Financial Calculation Bar in quote viewer */}
                      <div className="p-4 border-t border-[#eceae4] bg-[#f4f7f6] flex flex-col sm:flex-row items-end justify-between gap-4 text-xs">
                        <div className="text-muted">
                          {activeQuote.discountPct > 0 && (
                            <span>Applied Discount: <strong className="text-emerald-700 font-mono">{activeQuote.discountPct}%</strong></span>
                          )}
                        </div>
                        <div className="flex items-center gap-6 text-right">
                          <div>
                            <span className="text-[10px] text-muted block uppercase">Subtotal</span>
                            <span className="font-mono font-bold text-charcoal">${Number(activeQuote.subtotal || (activeQuote.lines || []).reduce((s,l)=>s+((l.quantity || 1)*(l.unitPrice || 0)),0)).toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted block uppercase">Tax (10%)</span>
                            <span className="font-mono font-bold text-charcoal">${Number(activeQuote.tax || (activeQuote.subtotal || 0) * 0.1).toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted block uppercase">Grand Total</span>
                            <span className="font-mono font-bold text-base text-[#1a705e]">${Number(activeQuote.grandTotal || (activeQuote.subtotal || 0) * 1.1).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Negotiation Thread */}
                    <div className="bg-white border border-[#eceae4] p-4 rounded-xl space-y-3">
                      <h5 className="text-xs font-bold text-charcoal flex items-center gap-2 border-b border-[#eceae4] pb-2">
                        <MessageSquare className="w-3.5 h-3.5 text-charcoal" /> Remarks & Proposal Negotiation
                      </h5>

                      <div className="space-y-2 max-h-[160px] overflow-y-auto">
                        {(activeQuote.comments || []).length === 0 ? (
                          <p className="text-xs text-muted italic">No remarks recorded yet.</p>
                        ) : (
                          activeQuote.comments.map(c => (
                            <div key={c.id} className="p-2 rounded-lg border border-[#eceae4] bg-cream text-xs space-y-1">
                              <div className="flex items-center justify-between font-semibold">
                                <span className={c.role === 'customer' ? 'text-charcoal' : 'text-purple-700'}>
                                  {c.sender} {c.role !== 'customer' && '(Admin)'}
                                </span>
                                <span className="text-[10px] text-muted font-mono">{new Date(c.timestamp).toLocaleTimeString()}</span>
                              </div>
                              <p className="text-charcoal text-xs">{c.text}</p>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Counter Discount Proposal & Change Request Form (PDF B8 & Quick Test Step 7) */}
                      <div className="pt-3 border-t border-[#eceae4] space-y-3">
                        <div className="p-3 bg-cream/70 border border-warm rounded-xl space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <label className="text-xs font-bold text-charcoal flex items-center gap-1.5">
                              <Percent className="w-3.5 h-3.5 text-amber-700" />
                              <span>Propose Counter Discount Percentage:</span>
                            </label>
                            <span className="text-[11px] text-muted">
                              Current: <strong>{activeQuote.discountPct || 0}%</strong> • {currentTier} Max: <strong>{data.discountRules?.globalTierCeilings?.[currentTier] || 10}%</strong>
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <input 
                                type="number" 
                                min="0" 
                                max="100" 
                                value={counterDiscount}
                                onChange={(e) => setCounterDiscount(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                                className="input text-xs font-bold font-mono pl-7 w-full bg-white"
                                placeholder="Target discount %"
                              />
                              <span className="absolute left-2.5 top-2 text-xs text-muted font-bold">%</span>
                            </div>

                            <button 
                              type="button"
                              onClick={() => {
                                const proposed = Math.max(0, Math.min(100, parseFloat(counterDiscount) || 0));
                                const allowedCeiling = data.discountRules?.globalTierCeilings?.[currentTier] || 10;
                                const isRisky = proposed > allowedCeiling;

                                updateActiveQuote(q => {
                                  q.status = 'Pending Approval';
                                  q.discountPct = proposed;
                                  (q.lines || []).forEach(l => {
                                    l.discountPct = proposed;
                                  });
                                  q.comments.push({
                                    id: 'cm-' + Date.now(),
                                    sender: customerName || currentUser?.name || 'Client',
                                    role: 'customer',
                                    text: `Customer proposed a counter-discount of ${proposed}% (Current ${currentTier} Limit: ${allowedCeiling}%). Remarks: ${commentText.trim() || 'Requesting revised commercial terms.'}`,
                                    timestamp: new Date().toISOString()
                                  });
                                });

                                addApprovalLog({
                                  quoteId: activeQuote.id,
                                  user: customerName || currentUser?.name || 'Client',
                                  role: 'customer',
                                  action: 'Submitted Counter Discount Proposal',
                                  blendedRiskScore: isRisky ? 15.0 : 4.0,
                                  reason: `Customer countered with ${proposed}% discount (exceeds ${currentTier} ceiling: ${isRisky ? 'Yes' : 'No'}). Automatically routed back to Approval Queue per PDF Section B8.`
                                });

                                setCommentText('');
                                showToast(`📩 Counter-discount proposal (${proposed}%) submitted! Quotation automatically returned to Manager Approval Queue.`, 'info');
                              }}
                              className="btn btn-sm btn-primary bg-charcoal text-white hover:bg-black flex items-center gap-1.5 text-xs px-3 shadow-2xs cursor-pointer shrink-0"
                              title="Submit counter-discount proposal and automatically re-route quotation back to approval queue"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Submit Request</span>
                            </button>
                          </div>
                        </div>

                        {/* Line Level Remarks input */}
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            className="input text-xs flex-1 bg-white" 
                            placeholder="Optional line-level question or negotiation remarks for the Sales Manager..."
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              if (!commentText.trim()) return;
                              updateActiveQuote(q => {
                                q.comments.push({
                                  id: 'cm-' + Date.now(),
                                  sender: customerName || currentUser?.name || 'Client',
                                  role: 'customer',
                                  text: commentText.trim(),
                                  timestamp: new Date().toISOString()
                                });
                                q.status = 'In Negotiation';
                              });
                              setCommentText('');
                              showToast('Remarks posted to Sales Rep.', 'info');
                            }}
                            className="btn btn-sm btn-outline text-xs px-2.5 flex items-center gap-1 text-charcoal hover:bg-cream"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Post Note</span>
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

              </div>
            )}

          </div>
        </main>
      </div>

      {/* ================= MODAL: CREATE NEW QUOTATION (EXACT SCREENSHOT IMPLEMENTATION) ================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 overflow-y-auto">
          <div className="bg-white border border-[#eceae4] rounded-2xl max-w-3xl w-full p-7 shadow-2xl space-y-5 text-left my-8">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#eceae4] pb-3">
              <div>
                <h3 className="text-2xl font-bold text-charcoal tracking-tight">
                  Create New Quotation
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Add line items, quantities, and pricing to generate a proposal.
                </p>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-muted hover:text-charcoal p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Header Fields Grid: Customer Name & Company Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1.5">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Google User"
                  className="w-full border border-[#d8d5cf] rounded-xl px-3.5 py-2 text-xs text-charcoal bg-white focus:outline-none focus:ring-1 focus:ring-charcoal focus:border-charcoal"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1.5">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Google User Corp"
                  className="w-full border border-[#d8d5cf] rounded-xl px-3.5 py-2 text-xs text-charcoal bg-white focus:outline-none focus:ring-1 focus:ring-charcoal focus:border-charcoal"
                  required
                />
              </div>
            </div>

            {/* Quotation Title & Valid Until Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1.5">
                  Quotation Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={quotationTitle}
                  onChange={(e) => setQuotationTitle(e.target.value)}
                  placeholder="Custom Enterprise Quotation"
                  className="w-full border border-[#d8d5cf] rounded-xl px-3.5 py-2 text-xs text-charcoal bg-white focus:outline-none focus:ring-1 focus:ring-charcoal focus:border-charcoal"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1.5">
                  Valid Until Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={validUntilDate}
                    onChange={(e) => setValidUntilDate(e.target.value)}
                    className="w-full border border-[#d8d5cf] rounded-xl px-3.5 py-2 text-xs text-charcoal bg-white focus:outline-none focus:ring-1 focus:ring-charcoal focus:border-charcoal"
                  />
                </div>
              </div>
            </div>

            {/* Proposal Description / Scope */}
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1.5">
                Proposal Description / Scope
              </label>
              <textarea
                value={proposalScope}
                onChange={(e) => setProposalScope(e.target.value)}
                placeholder="Request for enterprise software licenses and implementation services."
                rows={2}
                className="w-full border border-[#d8d5cf] rounded-xl px-3.5 py-2 text-xs font-mono text-charcoal bg-white focus:outline-none focus:ring-1 focus:ring-charcoal focus:border-charcoal resize-y"
              />
            </div>

            {/* Line Items Section */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-charcoal">
                  Product / Service Line Items
                </span>
                <button
                  type="button"
                  onClick={handleAddLineItem}
                  className="border border-[#265e52] text-[#265e52] hover:bg-[#265e52]/10 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>

              {/* Line Items Rows */}
              <div className="space-y-2">
                {lineItems.map((item) => {
                  const qty = parseFloat(item.quantity) || 0;
                  const price = parseFloat(item.unitPrice) || 0;
                  const rowTotal = qty * price;

                  return (
                    <div 
                      key={item.id}
                      className="p-2.5 bg-white border border-[#eceae4] rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-xs shadow-2xs"
                    >
                      {/* Item Name */}
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateLineItem(item.id, 'name', e.target.value)}
                        placeholder="Item name (e.g. Software License)"
                        className="flex-1 border border-[#d8d5cf] rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-charcoal"
                      />

                      {/* Description */}
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleUpdateLineItem(item.id, 'description', e.target.value)}
                        placeholder="Description (e.g. Annual subscription)"
                        className="flex-1 border border-[#d8d5cf] rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-charcoal"
                      />

                      {/* Quantity */}
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateLineItem(item.id, 'quantity', e.target.value)}
                        placeholder="Qty"
                        className="w-16 border border-[#d8d5cf] rounded-lg px-2 py-1.5 text-xs text-center font-mono bg-white focus:outline-none focus:ring-1 focus:ring-charcoal"
                      />

                      {/* Unit Price */}
                      <input
                        type="number"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => handleUpdateLineItem(item.id, 'unitPrice', e.target.value)}
                        placeholder="Price"
                        className="w-24 border border-[#d8d5cf] rounded-lg px-2.5 py-1.5 text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-charcoal"
                      />

                      {/* Row Total Display */}
                      <div className="w-24 text-right font-bold text-xs text-charcoal font-mono px-1">
                        ${rowTotal.toFixed(2)}
                      </div>

                      {/* Delete Icon */}
                      <button
                        type="button"
                        onClick={() => handleRemoveLineItem(item.id)}
                        className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                        title="Delete line item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Financial Bar (Matches screenshot with Discount, Subtotal, Tax 10%, Grand Total) */}
            <div className="bg-[#f4f7f6] rounded-xl p-4 border border-[#e2ece8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <label className="block text-xs font-medium text-muted">
                    Discount (%)
                  </label>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tierInfo.badgeColor} flex items-center gap-1`}>
                    <span>{tierInfo.emoji}</span>
                    <span>{currentTier} Max: {tierInfo.discountCeiling}</span>
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  placeholder="0"
                  className="w-28 border border-[#d8d5cf] rounded-lg px-3 py-1.5 text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-charcoal"
                />
                {parseFloat(discountPercent) > parseInt(tierInfo.discountCeiling) && (
                  <span className="text-[10px] text-amber-700 block mt-1 font-medium">
                    ⚠️ Above your {currentTier} ceiling ({tierInfo.discountCeiling}). Will route for Sales Manager review.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-6 self-end sm:self-center">
                <div className="text-right">
                  <span className="block text-[11px] text-muted">Subtotal</span>
                  <span className="font-mono font-bold text-xs sm:text-sm text-charcoal">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="block text-[11px] text-muted">Tax (10%)</span>
                  <span className="font-mono font-bold text-xs sm:text-sm text-charcoal">
                    ${taxAmount.toFixed(2)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="block text-[11px] text-muted">Grand Total</span>
                  <span className="font-mono font-bold text-base sm:text-lg text-[#236b5d]">
                    ${grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#eceae4]">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-xs font-medium text-muted hover:text-charcoal transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveQuotation('Draft')}
                className="border border-[#265e52] text-[#265e52] hover:bg-[#265e52]/10 rounded-lg px-4 py-2 text-xs font-semibold transition-all cursor-pointer"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => handleSaveQuotation('Pending Approval')}
                className="bg-[#063327] hover:bg-[#0b4737] text-white rounded-lg px-5 py-2 text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                Submit for Approval
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
