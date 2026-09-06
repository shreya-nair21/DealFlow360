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
  ShoppingCart,
  Percent
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
    badgeColor: 'bg-black text-white border-black',
    headerBadge: 'bg-black text-white border-black',
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
    <div className="space-y-6 text-left">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-[#e2e2e2] p-5 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-2xl font-bold text-black flex items-center gap-2">
            My Quotations & Loyalty Tier
          </h2>
          <p className="text-xs md:text-sm text-[#5e5e5e] mt-0.5">
            Create custom pricing proposals, monitor loyalty discount ceilings, and submit quotes for instant approval.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border ${tierInfo.headerBadge} flex items-center gap-1.5 shadow-2xs`}>
            <span>{currentTier.toUpperCase()} TIER ({currentOrders} ORDERS)</span>
          </span>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-black hover:bg-[#282828] text-white px-5 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Create New Quotation</span>
          </button>
        </div>
      </div>
          
      {/* ================= CUSTOMER LOYALTY TIER STATUS & MILESTONES ================= */}
      <div className="bg-white rounded-2xl p-6 border border-[#e2e2e2] shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e2e2e2] pb-4">
          <div>
            <h3 className="text-xl font-bold text-black flex items-center gap-2">
              <span>Customer Tier: {currentTier} Member ({currentOrders} Orders Completed)</span>
            </h3>
            <p className="text-xs text-[#5e5e5e] mt-0.5">
              Your discount privileges scale with your completed orders: <strong>3 Orders (Bronze)</strong> • <strong>5 Orders (Silver)</strong> • <strong>8 Orders (Gold)</strong> • <strong>10+ Orders (Platinum)</strong>.
            </p>
          </div>

          {/* Quick Tier Switcher / Order Simulator */}
          <div className="flex items-center gap-2 p-2 bg-[#fafafa] border border-[#e2e2e2] rounded-full self-start md:self-auto shrink-0">
            <span className="text-[11px] font-semibold text-[#5e5e5e] px-2 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-black" /> Orders:
            </span>
            <button
              onClick={() => updateCustomerOrderCount(customerRecord.id, Math.max(0, currentOrders - 1))}
              title="Decrease order count (-1 Order)"
              className="w-7 h-7 rounded-full bg-white border border-[#e2e2e2] hover:bg-[#efefef] flex items-center justify-center font-bold text-xs text-black shadow-2xs cursor-pointer transition-all"
            >
              -
            </button>
            <span className="font-mono font-bold text-xs px-2 min-w-[28px] text-center text-black">
              {currentOrders}
            </span>
            <button
              onClick={() => updateCustomerOrderCount(customerRecord.id, currentOrders + 1)}
              title="Increase order count (+1 Order)"
              className="w-7 h-7 rounded-full bg-black text-white hover:bg-[#282828] flex items-center justify-center font-bold text-xs shadow-2xs cursor-pointer transition-all"
            >
              +
            </button>

            <div className="h-4 w-[1px] bg-[#e2e2e2] mx-1 hidden sm:block" />

            {/* Quick Jump Buttons for 3, 5, 8, 10 */}
            <div className="hidden sm:flex items-center gap-1 text-[10px]">
              {[
                { count: 3, tier: 'Bronze' },
                { count: 5, tier: 'Silver' },
                { count: 8, tier: 'Gold' },
                { count: 10, tier: 'Platinum' }
              ].map(t => (
                <button
                  key={t.tier}
                  onClick={() => updateCustomerOrderCount(customerRecord.id, t.count)}
                  title={`Jump to ${t.count} orders (${t.tier} Tier)`}
                  className={`px-2.5 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                    currentOrders === t.count
                      ? 'bg-black text-white shadow-2xs font-bold'
                      : 'bg-white border border-[#e2e2e2] hover:bg-[#efefef] text-black'
                  }`}
                >
                  {t.tier} ({t.count})
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
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-left relative overflow-hidden ${
                  isCurrent
                    ? 'border-2 border-black bg-[#fafafa] shadow-xs'
                    : isReached
                    ? 'border-black bg-white hover:border-black'
                    : 'border-[#e2e2e2] bg-[#fafafa] hover:border-[#afafaf] opacity-70'
                }`}
              >
                {isCurrent && (
                  <span className="absolute top-2 right-2 text-[9px] font-bold bg-black text-white px-2 py-0.5 rounded-full">
                    CURRENT
                  </span>
                )}

                <div className="mb-2">
                  <div className="font-bold text-sm text-black flex items-center gap-1.5">
                    {m.tier} Tier
                  </div>
                  <span className="text-[10px] text-[#5e5e5e] font-mono">{m.count}+ Orders</span>
                </div>

                <div className="space-y-1.5 text-xs pt-1 border-t border-[#e2e2e2]">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#5e5e5e]">Discount Ceiling:</span>
                    <strong className="text-black font-mono">{m.ceiling}</strong>
                  </div>
                  <div className="text-[10px] text-[#5e5e5e] line-clamp-1">
                    {m.desc}
                  </div>
                  <div className="pt-1">
                    {isReached ? (
                      <span className="text-[10px] font-bold text-black flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-black" /> Unlocked
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-[#5e5e5e]">
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
        <div className="p-4 bg-[#fafafa] border border-[#e2e2e2] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="w-full sm:w-2/3 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-black flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-black" /> Overall Loyalty Progress
              </span>
              <span className="text-[#5e5e5e] font-mono">
                {currentOrders} / 10 Orders to Maximum Tier (Platinum)
              </span>
            </div>
            <div className="h-2.5 w-full bg-[#e2e2e2] rounded-full overflow-hidden">
              <div 
                className="h-full bg-black rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((currentOrders / 10) * 100))}%` }}
              />
            </div>
          </div>

          <div className="w-full sm:w-auto text-right text-xs">
            {tierInfo.nextTier ? (
              <span className="text-[#5e5e5e]">
                Next Upgrade: <strong className="text-black">{tierInfo.nextTier}</strong> in <strong>{ordersNeeded}</strong> more order{ordersNeeded > 1 ? 's' : ''}!
              </span>
            ) : (
              <span className="text-black font-bold flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-black" /> Max Platinum Tier Unlocked!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="bg-white rounded-2xl p-6 border border-[#e2e2e2] shadow-xs space-y-5">
        
        {/* Quotations List Header */}
        <div className="flex items-center justify-between border-b border-[#e2e2e2] pb-4">
          <div>
            <h3 className="text-xl font-bold text-black flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-black" /> Quotations & Proposals
            </h3>
            <p className="text-xs text-[#5e5e5e] mt-0.5">
              Select a quotation below to inspect breakdown details and negotiate terms.
            </p>
          </div>
          <span className="badge bg-[#efefef] border border-[#e2e2e2] text-black text-xs font-semibold px-3 py-1 rounded-full">
            {userQuotes.length} Proposal{userQuotes.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Empty State */}
        {userQuotes.length === 0 ? (
          <div className="border-2 border-dashed border-[#e2e2e2] rounded-2xl py-16 px-6 flex flex-col items-center justify-center text-center my-4 bg-[#fafafa]">
            <div className="w-14 h-14 rounded-full bg-[#efefef] text-black flex items-center justify-center mb-3.5 shadow-2xs border border-[#e2e2e2]">
              <FilePlus2 className="w-7 h-7 text-black" />
            </div>
            <h4 className="text-base font-bold text-black">
              No quotations found.
            </h4>
            <p className="text-xs text-[#5e5e5e] max-w-md mt-1 mb-5 leading-relaxed">
              You haven't created any custom quotations yet. Click below to start building your first quotation.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-black hover:bg-[#282828] text-white px-6 py-2.5 rounded-full text-xs font-semibold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" />
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
                      'Approved': 'bg-black text-white border-black',
                      'Pending Approval': 'bg-[#efefef] text-black border-black',
                      'Confirmed': 'bg-black text-white border-black',
                      'Draft': 'bg-[#efefef] text-[#5e5e5e] border-[#e2e2e2]'
                    };
                    const statusClass = statusColors[quote.status] || statusColors['Draft'];
                    const displayTotal = quote.grandTotal || (quote.lines || []).reduce((s, l) => s + ((l.quantity || 1) * (l.unitPrice || 0)), 0);

                    return (
                      <div
                        key={quote.id}
                        onClick={() => setSelectedQuoteId(quote.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                          isSelected 
                            ? 'border-2 border-black bg-[#fafafa] shadow-xs' 
                            : 'border-[#e2e2e2] bg-white hover:border-black'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono font-bold text-xs text-black">{quote.code}</span>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusClass}`}>
                            {quote.status}
                          </span>
                        </div>
                        <div className="font-bold text-xs text-black truncate mb-1">
                          {quote.title || 'Enterprise Proposal'}
                        </div>
                        <div className="text-base font-bold text-black">
                          ${Number(displayTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-[11px] text-[#5e5e5e] mt-1 flex items-center justify-between">
                          <span>{(quote.lines || []).length} Item{(quote.lines || []).length !== 1 ? 's' : ''}</span>
                          <span className="text-[10px] flex items-center gap-1 font-mono text-[#5e5e5e]">
                            <Clock className="w-3 h-3 text-[#5e5e5e]" /> {quote.validUntil || 'Active'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Active Quote Inspector */}
                {activeQuote && (
                  <div className="border border-[#e2e2e2] rounded-2xl p-6 bg-white space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e2e2e2] pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-black">{activeQuote.code}</span>
                          <span className="bg-black text-white text-xs font-bold px-3 py-0.5 rounded-full">{activeQuote.status}</span>
                        </div>
                        <h4 className="text-base font-bold text-black mt-1">
                          {activeQuote.title || 'Custom Enterprise Quotation'}
                        </h4>
                        <p className="text-xs text-[#5e5e5e]">
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
                          className="btn btn-primary btn-md flex items-center gap-2 shadow-xs bg-black hover:bg-[#282828] border-black text-white rounded-full cursor-pointer px-5 py-2 font-semibold"
                        >
                          <CheckCircle2 className="w-4 h-4 text-white" /> Confirm & Accept Quotation
                        </button>
                      )}
                    </div>

                    {/* Scope / Description */}
                    {activeQuote.scope && (
                      <div className="p-3.5 bg-[#fafafa] border border-[#e2e2e2] rounded-xl text-xs space-y-1">
                        <span className="font-bold text-[#5e5e5e] text-[10px] uppercase tracking-wider block">Scope Description:</span>
                        <p className="text-black">{activeQuote.scope}</p>
                      </div>
                    )}

                    {/* Line Items Table */}
                    <div className="overflow-x-auto bg-white rounded-2xl border border-[#e2e2e2]">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-[#e2e2e2] bg-[#fafafa] text-black text-[11px] font-semibold">
                            <th className="py-2.5 px-4 font-semibold">Product / Service</th>
                            <th className="py-2.5 px-4 font-semibold">Description</th>
                            <th className="py-2.5 px-4 font-semibold text-center">Qty</th>
                            <th className="py-2.5 px-4 font-semibold text-right">Unit Price</th>
                            <th className="py-2.5 px-4 font-semibold text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e2e2e2]">
                          {(activeQuote.lines || []).map((line, idx) => {
                            const lineTotal = line.total || ((line.quantity || 1) * (line.unitPrice || 0));
                            return (
                              <tr key={idx} className="hover:bg-[#fafafa]">
                                <td className="py-3 px-4 font-semibold text-black">{line.name || line.productId}</td>
                                <td className="py-3 px-4 text-[#5e5e5e]">{line.description || '—'}</td>
                                <td className="py-3 px-4 text-center font-mono text-black">{line.quantity || 1}</td>
                                <td className="py-3 px-4 text-right font-mono text-black">${Number(line.unitPrice || 0).toFixed(2)}</td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-black">${Number(lineTotal).toFixed(2)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      {/* Financial Calculation Bar in quote viewer */}
                      <div className="p-4 border-t border-[#e2e2e2] bg-[#fafafa] flex flex-col sm:flex-row items-end justify-between gap-4 text-xs">
                        <div className="text-[#5e5e5e]">
                          {activeQuote.discountPct > 0 && (
                            <span>Applied Discount: <strong className="text-black font-mono font-bold">{activeQuote.discountPct}%</strong></span>
                          )}
                        </div>
                        <div className="flex items-center gap-6 text-right">
                          <div>
                            <span className="text-[10px] text-[#5e5e5e] block uppercase">Subtotal</span>
                            <span className="font-mono font-bold text-black">${Number(activeQuote.subtotal || (activeQuote.lines || []).reduce((s,l)=>s+((l.quantity || 1)*(l.unitPrice || 0)),0)).toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#5e5e5e] block uppercase">Tax (10%)</span>
                            <span className="font-mono font-bold text-black">${Number(activeQuote.tax || (activeQuote.subtotal || 0) * 0.1).toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#5e5e5e] block uppercase">Grand Total</span>
                            <span className="font-mono font-bold text-base text-black">${Number(activeQuote.grandTotal || (activeQuote.subtotal || 0) * 1.1).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Negotiation Thread */}
                    <div className="bg-white border border-[#e2e2e2] p-5 rounded-2xl space-y-4">
                      <h5 className="text-xs font-bold text-black flex items-center gap-2 border-b border-[#e2e2e2] pb-2">
                        <MessageSquare className="w-3.5 h-3.5 text-black" /> Remarks & Proposal Negotiation
                      </h5>

                      <div className="space-y-2 max-h-[160px] overflow-y-auto">
                        {(activeQuote.comments || []).length === 0 ? (
                          <p className="text-xs text-[#5e5e5e] italic">No remarks recorded yet.</p>
                        ) : (
                          activeQuote.comments.map(c => (
                            <div key={c.id} className="p-2.5 rounded-xl border border-[#e2e2e2] bg-[#fafafa] text-xs space-y-1">
                              <div className="flex items-center justify-between font-semibold">
                                <span className="text-black font-bold">
                                  {c.sender} {c.role !== 'customer' && '(Admin)'}
                                </span>
                                <span className="text-[10px] text-[#5e5e5e] font-mono">{new Date(c.timestamp).toLocaleTimeString()}</span>
                              </div>
                              <p className="text-black text-xs">{c.text}</p>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Counter Discount Proposal & Change Request Form (PDF B8 & Quick Test Step 7) */}
                      <div className="pt-3 border-t border-[#e2e2e2] space-y-3">
                        <div className="p-4 bg-[#fafafa] border border-[#e2e2e2] rounded-2xl space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <label className="text-xs font-bold text-black flex items-center gap-1.5">
                              <Percent className="w-3.5 h-3.5 text-black" />
                              <span>Propose Counter Discount Percentage:</span>
                            </label>
                            <span className="text-[11px] text-[#5e5e5e]">
                              Current: <strong className="text-black">{activeQuote.discountPct || 0}%</strong> • {currentTier} Max: <strong className="text-black">{data.discountRules?.globalTierCeilings?.[currentTier] || 10}%</strong>
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
                                className="input text-xs font-bold font-mono pl-7 w-full bg-white border border-[#e2e2e2] rounded-full text-black"
                                placeholder="Target discount %"
                              />
                              <span className="absolute left-3 top-2 text-xs text-[#5e5e5e] font-bold">%</span>
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
                              className="bg-black hover:bg-[#282828] text-white flex items-center gap-1.5 text-xs px-4 py-2 rounded-full font-semibold shadow-xs cursor-pointer shrink-0 transition-all"
                              title="Submit counter-discount proposal and automatically re-route quotation back to approval queue"
                            >
                              <Send className="w-3.5 h-3.5 text-white" />
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
                            className="input text-xs flex-1 bg-white border border-[#e2e2e2] rounded-full px-4 text-black" 
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
                            className="bg-[#efefef] hover:bg-[#e2e2e2] text-black border border-[#e2e2e2] rounded-full text-xs px-4 py-2 font-semibold flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-black" />
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

      {/* ================= MODAL: CREATE NEW QUOTATION ================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-[#e2e2e2] rounded-2xl max-w-3xl w-full p-7 shadow-2xl space-y-5 text-left my-8">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#e2e2e2] pb-3">
              <div>
                <h3 className="text-2xl font-bold text-black">
                  Create New Quotation
                </h3>
                <p className="text-xs text-[#5e5e5e] mt-0.5">
                  Add line items, quantities, and pricing to generate a proposal.
                </p>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-[#5e5e5e] hover:text-black p-1 rounded-full hover:bg-[#efefef] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Header Fields Grid: Customer Name & Company Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-black mb-1.5">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Google User"
                  className="w-full border border-[#e2e2e2] rounded-xl px-3.5 py-2 text-xs text-black bg-white focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-black mb-1.5">
                  Company Name <span className="text-black font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Google User Corp"
                  className="w-full border border-[#e2e2e2] rounded-xl px-3.5 py-2 text-xs text-black bg-white focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                  required
                />
              </div>
            </div>

            {/* Quotation Title & Valid Until Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-black mb-1.5">
                  Quotation Title <span className="text-black font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={quotationTitle}
                  onChange={(e) => setQuotationTitle(e.target.value)}
                  placeholder="Custom Enterprise Quotation"
                  className="w-full border border-[#e2e2e2] rounded-xl px-3.5 py-2 text-xs text-black bg-white focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-black mb-1.5">
                  Valid Until Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={validUntilDate}
                    onChange={(e) => setValidUntilDate(e.target.value)}
                    className="w-full border border-[#e2e2e2] rounded-xl px-3.5 py-2 text-xs text-black bg-white focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                  />
                </div>
              </div>
            </div>

            {/* Proposal Description / Scope */}
            <div>
              <label className="block text-xs font-semibold text-black mb-1.5">
                Proposal Description / Scope
              </label>
              <textarea
                value={proposalScope}
                onChange={(e) => setProposalScope(e.target.value)}
                placeholder="Request for enterprise software licenses and implementation services."
                rows={2}
                className="w-full border border-[#e2e2e2] rounded-xl px-3.5 py-2 text-xs font-mono text-black bg-white focus:outline-none focus:ring-1 focus:ring-black focus:border-black resize-y"
              />
            </div>

            {/* Line Items Section */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-black">
                  Product / Service Line Items
                </span>
                <button
                  type="button"
                  onClick={handleAddLineItem}
                  className="border border-black text-black hover:bg-[#efefef] rounded-full px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
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
                      className="p-2.5 bg-white border border-[#e2e2e2] rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-xs shadow-2xs"
                    >
                      {/* Item Name */}
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateLineItem(item.id, 'name', e.target.value)}
                        placeholder="Item name (e.g. Software License)"
                        className="flex-1 border border-[#e2e2e2] rounded-lg px-3 py-1.5 text-xs text-black bg-white focus:outline-none focus:ring-1 focus:ring-black"
                      />

                      {/* Description */}
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleUpdateLineItem(item.id, 'description', e.target.value)}
                        placeholder="Description (e.g. Annual subscription)"
                        className="flex-1 border border-[#e2e2e2] rounded-lg px-3 py-1.5 text-xs text-black bg-white focus:outline-none focus:ring-1 focus:ring-black"
                      />

                      {/* Quantity */}
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateLineItem(item.id, 'quantity', e.target.value)}
                        placeholder="Qty"
                        className="w-16 border border-[#e2e2e2] rounded-lg px-2 py-1.5 text-xs text-center font-mono text-black bg-white focus:outline-none focus:ring-1 focus:ring-black"
                      />

                      {/* Unit Price */}
                      <input
                        type="number"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => handleUpdateLineItem(item.id, 'unitPrice', e.target.value)}
                        placeholder="Price"
                        className="w-24 border border-[#e2e2e2] rounded-lg px-2.5 py-1.5 text-xs font-mono text-black bg-white focus:outline-none focus:ring-1 focus:ring-black"
                      />

                      {/* Row Total Display */}
                      <div className="w-24 text-right font-bold text-xs text-black font-mono px-1">
                        ${rowTotal.toFixed(2)}
                      </div>

                      {/* Delete Icon */}
                      <button
                        type="button"
                        onClick={() => handleRemoveLineItem(item.id)}
                        className="text-[#5e5e5e] hover:text-black p-1.5 rounded-lg hover:bg-[#efefef] transition-colors cursor-pointer shrink-0"
                        title="Delete line item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Financial Bar */}
            <div className="bg-[#fafafa] rounded-2xl p-4 border border-[#e2e2e2] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <label className="block text-xs font-medium text-[#5e5e5e]">
                    Discount (%)
                  </label>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tierInfo.badgeColor} flex items-center gap-1`}>
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
                  className="w-28 border border-[#e2e2e2] rounded-lg px-3 py-1.5 text-xs font-mono text-black bg-white focus:outline-none focus:ring-1 focus:ring-black"
                />
                {parseFloat(discountPercent) > parseInt(tierInfo.discountCeiling) && (
                  <span className="text-[10px] text-[#5e5e5e] block mt-1 font-medium">
                    ⚠️ Above your {currentTier} ceiling ({tierInfo.discountCeiling}). Will route for Sales Manager review.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-6 self-end sm:self-center">
                <div className="text-right">
                  <span className="block text-[11px] text-[#5e5e5e]">Subtotal</span>
                  <span className="font-mono font-bold text-xs sm:text-sm text-black">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="block text-[11px] text-[#5e5e5e]">Tax (10%)</span>
                  <span className="font-mono font-bold text-xs sm:text-sm text-black">
                    ${taxAmount.toFixed(2)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="block text-[11px] text-[#5e5e5e]">Grand Total</span>
                  <span className="font-mono font-bold text-base sm:text-lg text-black">
                    ${grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#e2e2e2]">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-xs font-semibold text-[#5e5e5e] hover:text-black transition-colors cursor-pointer rounded-full"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveQuotation('Draft')}
                className="border border-black text-black hover:bg-[#efefef] rounded-full px-5 py-2 text-xs font-semibold transition-all cursor-pointer"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => handleSaveQuotation('Pending Approval')}
                className="bg-black hover:bg-[#282828] text-white rounded-full px-6 py-2 text-xs font-semibold shadow-xs transition-all cursor-pointer"
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
