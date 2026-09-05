import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Package, 
  Trash2, 
  ShieldAlert, 
  Send, 
  Plus, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2,
  Truck,
  UserCheck,
  User,
  Users,
  TrendingUp,
  Crown,
  Award,
  Medal,
  Shield,
  Sliders,
  Percent
} from 'lucide-react';

export const QuoteBuilderView = () => {
  const { 
    data, 
    activeQuote, 
    setActiveQuoteId, 
    updateActiveQuote, 
    addQuotation, 
    addApprovalLog, 
    setView, 
    currentUser, 
    showToast,
    calculateCustomerTier,
    TIER_CONFIG,
    updateCustomerOrderCount,
    upsertCustomer
  } = useApp();

  const quote = activeQuote || data.quotations[0] || null;

  if (!quote) {
    return (
      <div className="card text-center py-12 space-y-4">
        <Package className="w-12 h-12 text-muted mx-auto" />
        <h3 className="text-lg font-bold text-charcoal">No Quotations Available</h3>
        <p className="text-xs text-muted">Create a new quotation to get started.</p>
        <button
          onClick={() => {
            const newQ = {
              id: 'q-' + Date.now(),
              code: `QT-2026-ABC-01`,
              customerId: 'c-abc',
              repId: 'u-rahul',
              repName: currentUser?.name || 'Rahul',
              status: 'Draft',
              lines: [
                { id: 'ql-default', productId: 'p-laptop', quantity: 10, unitPrice: 1200, discountPct: 5 }
              ],
              comments: []
            };
            addQuotation(newQ);
          }}
          className="btn btn-primary btn-sm mx-auto flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Create Quotation
        </button>
      </div>
    );
  }

  const customer = (data.customers || []).find(c => c.id === quote.customerId) || {
    id: quote.customerId || 'c-abc',
    name: quote.companyName || quote.customerName || 'ABC Company',
    email: quote.customerEmail || 'procurement@abccorp.com',
    orderCount: 3,
    tier: 'Bronze'
  };

  const customerOrders = customer.orderCount !== undefined ? customer.orderCount : 3;
  const tier = calculateCustomerTier ? calculateCustomerTier(customerOrders) : (customer.tier || 'Bronze');
  const tierMeta = (TIER_CONFIG && TIER_CONFIG[tier]) || {
    label: tier,
    discountCeiling: '5%',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    emoji: '🥉',
    nextTier: 'Silver',
    nextThreshold: 5
  };

  // Helper to determine allowed discount percentage based on customer badge status AND particular product category
  const getAllowedDiscountForProduct = (product, tierName = tier) => {
    const category = product?.category || 'Hardware';
    const categoryCeilings = (data.discountRules && data.discountRules.categoryCeilings && data.discountRules.categoryCeilings[category]) || (data.discountRules && data.discountRules.categoryCeilings && data.discountRules.categoryCeilings['Hardware']) || {};
    return categoryCeilings[tierName] !== undefined 
      ? categoryCeilings[tierName] 
      : (data.discountRules?.globalTierCeilings?.[tierName] || 5);
  };

  const categoryCeilings = {
    Hardware: getAllowedDiscountForProduct({ category: 'Hardware' }),
    Service: getAllowedDiscountForProduct({ category: 'Service' }),
    Subscription: getAllowedDiscountForProduct({ category: 'Subscription' })
  };

  const handleCustomerFieldChange = (field, value) => {
    if (field === 'orderCount') {
      const num = Math.max(0, parseInt(value, 10) || 0);
      const newTier = calculateCustomerTier ? calculateCustomerTier(num) : 'Bronze';
      if (upsertCustomer) upsertCustomer({ ...customer, orderCount: num, tier: newTier });
      updateActiveQuote(q => {
        q.customerTier = newTier;
      });
    } else {
      if (upsertCustomer) upsertCustomer({ ...customer, [field]: value });
      updateActiveQuote(q => {
        if (field === 'name') {
          q.customerName = value;
          q.companyName = value;
        }
        if (field === 'email') q.customerEmail = value;
      });
    }
  };

  const handleSelectCustomer = (customerId) => {
    if (customerId === 'new') {
      const newId = 'c-' + Date.now();
      const newCust = {
        id: newId,
        name: 'New Corporate Client',
        email: 'client@company.com',
        orderCount: 3,
        tier: 'Bronze',
        repId: currentUser?.id || 'u-rahul'
      };
      if (upsertCustomer) upsertCustomer(newCust);
      updateActiveQuote(q => {
        q.customerId = newId;
        q.customerName = newCust.name;
        q.companyName = newCust.name;
        q.customerEmail = newCust.email;
        q.customerTier = 'Bronze';
      });
      showToast('Created new customer profile for quotation.', 'info');
      return;
    }

    const selected = (data.customers || []).find(c => c.id === customerId);
    if (selected) {
      updateActiveQuote(q => {
        q.customerId = selected.id;
        q.customerName = selected.name;
        q.companyName = selected.name;
        q.customerEmail = selected.email;
        q.customerTier = selected.tier || (calculateCustomerTier ? calculateCustomerTier(selected.orderCount || 0) : 'Bronze');
      });
      showToast(`Selected customer "${selected.name}" (${selected.tier || 'Bronze'} Status)`, 'info');
    }
  };

  const handleSetCustomerOrders = (newCount) => {
    const num = Math.max(0, parseInt(newCount, 10) || 0);
    const newTier = calculateCustomerTier ? calculateCustomerTier(num) : 'Bronze';
    if (upsertCustomer) upsertCustomer({ ...customer, orderCount: num, tier: newTier });
    updateActiveQuote(q => {
      q.customerTier = newTier;
    });
    showToast(`Order count set to ${num} -> Status: ${newTier}!`, 'success');
  };

  const handleApplyAllTierDiscounts = () => {
    updateActiveQuote(q => {
      (q.lines || []).forEach(line => {
        const prod = data.products.find(p => p.id === line.productId);
        const allowed = getAllowedDiscountForProduct(prod, tier);
        line.discountPct = allowed;
      });
    });
    showToast(`✨ Automatically assigned recommended ${tier} status discounts to all products!`, 'success');
  };

  const handleAddProductToQuote = (product, discount = 0) => {
    updateActiveQuote(q => {
      const existing = (q.lines || []).find(l => l.productId === product.id);
      if (existing) {
        existing.quantity += 1;
        if (discount > 0) existing.discountPct = discount;
      } else {
        q.lines.push({
          id: 'ql-' + Date.now(),
          productId: product.id,
          name: product.name,
          quantity: 1,
          unitPrice: product.listPrice,
          discountPct: discount
        });
      }
    });
    showToast(
      discount > 0 
        ? `Added "${product.name}" with ${tier} tier discount (${discount}%)!` 
        : `Added "${product.name}" to quotation!`,
      'success'
    );
  };

  let totalListAmount = 0;
  let totalNetRevenue = 0;
  let totalCost = 0;
  let lineRiskSum = 0;
  let maxSingleLineOverage = 0;

  const lineDetails = (quote.lines || []).map(line => {
    const product = data.products.find(p => p.id === line.productId) || {
      id: line.productId || line.id,
      name: line.name || 'Custom Product / Service',
      category: 'Hardware',
      listPrice: line.unitPrice || 0,
      costPrice: (line.unitPrice || 0) * 0.6
    };

    const listUnitPrice = line.unitPrice || product.listPrice || 0;
    const qty = line.quantity || 1;
    const discountPct = line.discountPct || 0;
    const costPrice = product.costPrice || (listUnitPrice * 0.6);

    const lineListTotal = listUnitPrice * qty;
    const lineNetTotal = listUnitPrice * (1 - discountPct / 100) * qty;
    const lineTotalCost = costPrice * qty;

    const allowedDiscountPct = getAllowedDiscountForProduct(product, tier);
    const overagePct = Math.max(0, discountPct - allowedDiscountPct);

    if (overagePct > maxSingleLineOverage) maxSingleLineOverage = overagePct;
    lineRiskSum += overagePct * lineNetTotal;

    totalListAmount += lineListTotal;
    totalNetRevenue += lineNetTotal;
    totalCost += lineTotalCost;

    return {
      ...line,
      product,
      allowedDiscountPct,
      overagePct,
      lineNetTotal,
      hasViolation: overagePct > 0
    };
  }).filter(Boolean);

  const blendedRiskScore = totalNetRevenue > 0 
    ? parseFloat(((lineRiskSum / totalNetRevenue) * 10 + (maxSingleLineOverage * 0.5)).toFixed(1))
    : 0;

  const overallGrossMarginPct = totalNetRevenue > 0 
    ? (((totalNetRevenue - totalCost) / totalNetRevenue) * 100)
    : 0;

  const requiresApproval = blendedRiskScore > 0 || maxSingleLineOverage > 0;

  const cartProductIds = (quote.lines || []).map(l => l.productId);
  const applicableUpsells = (data.upsellRules || []).filter(r => 
    cartProductIds.includes(r.triggerProductId) && !cartProductIds.includes(r.suggestedProductId)
  );

  return (
    <div className="space-y-6">
      {/* Sales Rep Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-cream border border-warm p-4 rounded-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <select 
            value={quote.id}
            onChange={(e) => setActiveQuoteId(e.target.value)}
            className="select text-sm font-semibold border-warm bg-cream"
          >
            {data.quotations.map(q => (
              <option key={q.id} value={q.id}>
                {q.code} - {data.customers.find(c => c.id === q.customerId)?.name || 'Custom Deal'} ({q.status})
              </option>
            ))}
          </select>

          <span className="badge badge-warning text-xs">{quote.status}</span>
          
          <span className="text-xs text-muted font-medium flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            Handling Rep: <strong>{quote.repName || currentUser?.name || 'Rahul'}</strong>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => {
              const newQ = {
                id: 'q-' + Date.now(),
                code: `QT-2026-ABC-${data.quotations.length + 1}`,
                customerId: 'c-abc',
                repId: 'u-rahul',
                repName: 'Rahul',
                status: 'Draft',
                portalToken: 'token-' + Date.now(),
                daysInactive: 0,
                lines: [
                  { id: 'ql-1', productId: 'p-laptop', quantity: 20, unitPrice: 1200, discountPct: 10 },
                  { id: 'ql-2', productId: 'p-install', quantity: 1, unitPrice: 1500, discountPct: 15 }
                ],
                comments: []
              };
              addQuotation(newQ);
            }}
            className="btn btn-sm btn-outline"
          >
            <Plus className="w-4 h-4" /> Create New Quote
          </button>

          {quote.status === 'Draft' ? (
            requiresApproval ? (
              <button 
                onClick={() => {
                  updateActiveQuote(q => { q.status = 'Pending Approval'; });
                  addApprovalLog({
                    quoteId: quote.id,
                    user: quote.repName || currentUser?.name || 'Rahul',
                    role: 'sales_rep',
                    action: 'Routed Risky Quote for Approval',
                    blendedRiskScore,
                    reason: `Service line discount exceeds allowed ceiling by ${maxSingleLineOverage} points.`
                  });
                  showToast('Risky quotation submitted into Manager Approval Queue.', 'warning');
                }}
                className="btn btn-sm btn-primary bg-amber-800 hover:bg-amber-900 border-amber-900 flex items-center gap-1.5"
              >
                <ShieldAlert className="w-4 h-4" /> Submit Risky Quote for Approval
              </button>
            ) : (
              <button 
                onClick={() => {
                  updateActiveQuote(q => { q.status = 'Approved'; });
                  addApprovalLog({
                    quoteId: quote.id,
                    user: quote.repName || currentUser?.name || 'Rahul',
                    role: 'sales_rep',
                    action: 'Submitted Standard Quote',
                    blendedRiskScore: 0,
                    reason: 'Quote passes pricing governance rules.'
                  });
                  showToast('Quotation submitted successfully!', 'success');
                }}
                className="btn btn-sm btn-primary flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" /> Submit Quotation
              </button>
            )
          ) : (
            <span className="badge badge-success text-xs py-1 px-3 font-semibold">
              Quotation Submitted ({quote.status})
            </span>
          )}
        </div>
      </div>

      {/* ================= CUSTOMER PROFILE & TIER BADGE DETERMINATION ================= */}
      <div className="card bg-white border border-warm rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-warm pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-charcoal text-cream flex items-center justify-center font-bold text-xs shadow-2xs">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-charcoal flex items-center gap-2">
                Customer Details & Loyalty Badge Determination
              </h3>
              <p className="text-[11px] text-muted">
                Enter customer profile & order count to evaluate their status badge and assign compliant discounts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted font-medium">Saved Accounts:</span>
            <select
              value={quote.customerId || ''}
              onChange={(e) => handleSelectCustomer(e.target.value)}
              className="select text-xs font-semibold border-warm bg-cream py-1 px-2.5 h-8"
            >
              {(data.customers || []).map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.tier || 'Bronze'} • {c.orderCount || 0} orders)
                </option>
              ))}
              <option value="new">+ Enter Custom / New Customer</option>
            </select>
          </div>
        </div>

        {/* 3 Columns: 1) Details, 2) Order Count Stepper & Milestones, 3) Assigned Badge & Discount Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          
          {/* Col 1: Customer Name & Email (4 cols) */}
          <div className="md:col-span-4 space-y-3">
            <div>
              <label className="label text-[11px] font-semibold text-charcoal">Customer / Company Name</label>
              <input
                type="text"
                value={customer.name}
                onChange={(e) => handleCustomerFieldChange('name', e.target.value)}
                placeholder="e.g. Acme Global Corp"
                className="input text-xs py-1.5 px-3 w-full"
              />
            </div>
            <div>
              <label className="label text-[11px] font-semibold text-charcoal">Work Email Address</label>
              <input
                type="email"
                value={customer.email || ''}
                onChange={(e) => handleCustomerFieldChange('email', e.target.value)}
                placeholder="procurement@acme.com"
                className="input text-xs py-1.5 px-3 w-full"
              />
            </div>
          </div>

          {/* Col 2: Completed Orders & Milestone Engine (4 cols) */}
          <div className="md:col-span-4 p-3.5 bg-cream/70 rounded-xl border border-warm space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-charcoal flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                Completed Orders History
              </label>
              <span className="text-[10px] font-mono text-muted">Tier Trigger</span>
            </div>

            {/* Stepper Input */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSetCustomerOrders(Math.max(0, customerOrders - 1))}
                className="w-8 h-8 rounded-lg bg-white border border-warm hover:bg-charcoal-03 flex items-center justify-center font-bold text-sm text-charcoal shadow-2xs transition-all cursor-pointer"
                title="Decrease order count"
              >
                -
              </button>
              <input
                type="number"
                min="0"
                value={customerOrders}
                onChange={(e) => handleSetCustomerOrders(e.target.value)}
                className="input text-xs py-1 px-2 text-center font-mono font-bold w-20 bg-white"
              />
              <button
                type="button"
                onClick={() => handleSetCustomerOrders(customerOrders + 1)}
                className="w-8 h-8 rounded-lg bg-charcoal text-white hover:bg-black flex items-center justify-center font-bold text-sm shadow-2xs transition-all cursor-pointer"
                title="Increase order count"
              >
                +
              </button>

              <span className="text-xs font-semibold text-charcoal">
                Order{customerOrders !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Quick Milestone Buttons */}
            <div>
              <span className="text-[10px] text-muted block mb-1">Quick Milestone Jump:</span>
              <div className="grid grid-cols-4 gap-1 text-[10px]">
                {[
                  { count: 3, tier: 'Bronze', emoji: '🥉' },
                  { count: 5, tier: 'Silver', emoji: '🥈' },
                  { count: 8, tier: 'Gold', emoji: '🥇' },
                  { count: 10, tier: 'Platinum', emoji: '💎' }
                ].map(t => (
                  <button
                    key={t.tier}
                    type="button"
                    onClick={() => handleSetCustomerOrders(t.count)}
                    className={`p-1 rounded text-center font-semibold transition-all border cursor-pointer ${
                      customerOrders === t.count
                        ? 'bg-charcoal text-white border-charcoal font-bold shadow-2xs'
                        : 'bg-white border-warm text-charcoal hover:bg-charcoal-03'
                    }`}
                  >
                    {t.emoji} {t.count} ({t.tier})
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[10px] text-muted leading-tight">
              Thresholds: <strong>3</strong>=Bronze • <strong>5</strong>=Silver • <strong>8</strong>=Gold • <strong>10+</strong>=Platinum
            </p>
          </div>

          {/* Col 3: Determined Badge & Category Discount Policy (4 cols) */}
          <div className="md:col-span-4 p-3.5 bg-white rounded-xl border border-warm space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
                Determined Badge
              </span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${tierMeta.badgeColor} flex items-center gap-1 shadow-2xs`}>
                <span>{tierMeta.emoji}</span>
                <span>{tier.toUpperCase()} BADGE</span>
              </span>
            </div>

            {/* Allowed discount per product category */}
            <div className="space-y-1 text-xs pt-1 border-t border-warm">
              <div className="text-[11px] font-semibold text-charcoal mb-1 flex items-center justify-between">
                <span>Product Discount Ceilings:</span>
                <span className="text-[10px] text-muted">Status: {tier}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                <div className="p-1.5 rounded bg-cream border border-warm">
                  <span className="text-muted block">Hardware</span>
                  <strong className="text-charcoal font-mono text-xs">{categoryCeilings['Hardware']}%</strong>
                </div>
                <div className="p-1.5 rounded bg-cream border border-warm">
                  <span className="text-muted block">Service</span>
                  <strong className="text-charcoal font-mono text-xs">{categoryCeilings['Service']}%</strong>
                </div>
                <div className="p-1.5 rounded bg-cream border border-warm">
                  <span className="text-muted block">Subscription</span>
                  <strong className="text-charcoal font-mono text-xs">{categoryCeilings['Subscription']}%</strong>
                </div>
              </div>
            </div>

            {/* Master Action Button */}
            <button
              type="button"
              onClick={handleApplyAllTierDiscounts}
              className="w-full btn btn-sm btn-primary text-xs py-1.5 flex items-center justify-center gap-1.5 bg-charcoal text-cream hover:bg-black shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Assign {tier} Discounts to All Products</span>
            </button>
          </div>

        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Product Catalog Picker (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="card">
            <div className="card-header border-b border-warm pb-3">
              <div>
                <h3 className="text-base font-bold text-charcoal flex items-center gap-2">
                  <Package className="w-4 h-4 text-charcoal" /> Product & Service Catalog
                </h3>
                <p className="text-[11px] text-muted">
                  Discounts tailored for customer status: <strong className="text-charcoal">{tierMeta.emoji} {tier}</strong>
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-muted">
                {data.products.length} Products
              </span>
            </div>
            
            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1 mt-3">
              {data.products.map(product => {
                const prodAllowedDiscount = getAllowedDiscountForProduct(product, tier);
                const categoryBadgeClass = 
                  product.category === 'Hardware' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                  product.category === 'Service' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                  'bg-amber-50 text-amber-800 border-amber-200';

                return (
                  <div key={product.id} className="p-3 border border-warm rounded-xl hover:border-interactive transition-all bg-cream/70 hover:bg-white shadow-2xs space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-xs text-charcoal">{product.name}</h4>
                          <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border ${categoryBadgeClass}`}>
                            {product.category}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted font-mono">{product.sku}</p>
                      </div>
                      <span className="font-bold text-xs text-charcoal bg-warm/30 px-2 py-0.5 rounded">
                        ${product.listPrice.toLocaleString()}
                      </span>
                    </div>

                    <p className="text-[11px] text-muted line-clamp-2 leading-relaxed">{product.description}</p>

                    {/* Status & Category Ceiling Info */}
                    <div className="flex items-center justify-between text-[10px] bg-white p-1.5 rounded-lg border border-warm/60">
                      <span className="text-muted flex items-center gap-1">
                        <span>{tierMeta.emoji}</span>
                        <span>{tier} Ceiling ({product.category}):</span>
                      </span>
                      <strong className="text-emerald-700 font-mono font-bold">
                        {prodAllowedDiscount}% max discount
                      </strong>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <button 
                        type="button"
                        onClick={() => handleAddProductToQuote(product, 0)}
                        className="btn btn-sm btn-outline py-1 px-2 text-[11px] flex-1 text-charcoal hover:bg-cream"
                        title="Add to quote without discount"
                      >
                        + Add (0%)
                      </button>

                      <button 
                        type="button"
                        onClick={() => handleAddProductToQuote(product, prodAllowedDiscount)}
                        className="btn btn-sm btn-primary py-1 px-2.5 text-[11px] flex-1 bg-emerald-800 hover:bg-emerald-900 border-emerald-800 flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                        title={`Add with recommended ${prodAllowedDiscount}% ${tier} tier discount`}
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Add ({prodAllowedDiscount}%)</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Cart & Live Margin Meter (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="card">
            <div className="card-header border-b border-warm pb-3">
              <div>
                <h3 className="text-base font-bold text-charcoal flex items-center gap-2">
                  <span>{customer?.name || 'Customer'} Cart</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tierMeta.badgeColor}`}>
                    {tierMeta.emoji} {tier}
                  </span>
                </h3>
                <p className="text-xs text-muted">
                  Assign line discounts based on customer status & product policy
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleApplyAllTierDiscounts}
                  className="btn btn-xs btn-outline py-1 px-2 text-[10px] flex items-center gap-1 bg-white hover:bg-charcoal hover:text-white"
                  title="Set all line items to maximum allowed tier discount"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Set All Max</span>
                </button>
                <span className="text-xs font-mono font-bold text-charcoal bg-cream px-2 py-1 rounded border border-warm">
                  {(quote.lines || []).length} Items
                </span>
              </div>
            </div>

            <div className="space-y-3 my-4 max-h-[420px] overflow-y-auto pr-1">
              {(quote.lines || []).length === 0 ? (
                <div className="text-center py-10 text-muted space-y-2">
                  <Package className="w-8 h-8 mx-auto text-warm" />
                  <p className="text-xs">No line items in this quotation.</p>
                  <p className="text-[11px]">Select a product from the catalog on the left to add items.</p>
                </div>
              ) : lineDetails.map(line => (
                <div 
                  key={line.id} 
                  className={`p-3 border rounded-xl space-y-2.5 transition-all shadow-2xs ${
                    line.hasViolation 
                      ? 'border-amber-400 bg-amber-50/40' 
                      : 'border-warm bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-charcoal">{line.product.name}</span>
                        <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-charcoal-03 text-muted border border-warm">
                          {line.product.category}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-[11px] text-muted font-mono">
                          ${line.unitPrice} / {line.product.unit || 'unit'}
                        </span>
                        
                        {line.hasViolation ? (
                          <span className="badge badge-warning text-[10px] py-0.5 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Over {tier} Limit: {line.allowedDiscountPct}% (+{line.overagePct}%)
                          </span>
                        ) : (
                          <span className="badge badge-success text-[10px] py-0.5 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {tier} Status Ceiling: {line.allowedDiscountPct}%
                          </span>
                        )}
                      </div>
                    </div>

                    <button 
                      type="button"
                      onClick={() => {
                        updateActiveQuote(q => {
                          q.lines = (q.lines || []).filter(l => l.id !== line.id);
                        });
                      }}
                      className="text-muted hover:text-red-600 p-1 transition-colors cursor-pointer"
                      title="Remove product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quick Discount Assignment Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-cream/70 rounded-lg border border-warm/60 text-[10px]">
                    <span className="text-muted font-semibold">Assign Discount:</span>
                    
                    <button
                      type="button"
                      onClick={() => {
                        updateActiveQuote(q => {
                          const l = (q.lines || []).find(item => item.id === line.id);
                          if (l) l.discountPct = 0;
                        });
                      }}
                      className={`px-1.5 py-0.5 rounded border transition-all cursor-pointer font-medium ${
                        line.discountPct === 0 
                          ? 'bg-charcoal text-white border-charcoal font-bold shadow-2xs' 
                          : 'bg-white border-warm text-charcoal hover:bg-cream'
                      }`}
                    >
                      0% (List)
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const half = Math.round(line.allowedDiscountPct / 2);
                        updateActiveQuote(q => {
                          const l = (q.lines || []).find(item => item.id === line.id);
                          if (l) l.discountPct = half;
                        });
                      }}
                      className={`px-1.5 py-0.5 rounded border transition-all cursor-pointer font-medium ${
                        line.discountPct === Math.round(line.allowedDiscountPct / 2) && line.discountPct > 0
                          ? 'bg-charcoal text-white border-charcoal font-bold shadow-2xs' 
                          : 'bg-white border-warm text-charcoal hover:bg-cream'
                      }`}
                    >
                      Half ({Math.round(line.allowedDiscountPct / 2)}%)
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        updateActiveQuote(q => {
                          const l = (q.lines || []).find(item => item.id === line.id);
                          if (l) l.discountPct = line.allowedDiscountPct;
                        });
                      }}
                      className={`px-2 py-0.5 rounded border transition-all cursor-pointer flex items-center gap-1 ${
                        line.discountPct === line.allowedDiscountPct
                          ? 'bg-emerald-700 text-white border-emerald-700 font-bold shadow-2xs' 
                          : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 font-semibold'
                      }`}
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>Set {tier} Max ({line.allowedDiscountPct}%)</span>
                    </button>
                  </div>

                  {/* Quantity, Discount Input & Calculated Net Total */}
                  <div className="grid grid-cols-3 gap-2 items-center bg-white p-2 rounded-lg border border-warm/50 text-xs">
                    <div>
                      <label className="label text-[10px] font-semibold text-charcoal">Quantity</label>
                      <input 
                        type="number" 
                        min="1" 
                        value={line.quantity} 
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 1;
                          updateActiveQuote(q => {
                            const l = (q.lines || []).find(item => item.id === line.id);
                            if (l) l.quantity = val;
                          });
                        }}
                        className="input py-1 px-1.5 text-xs text-center font-bold"
                      />
                    </div>

                    <div>
                      <label className="label text-[10px] font-semibold text-charcoal flex items-center justify-between">
                        <span>Discount %</span>
                        <span className="text-[9px] text-muted font-normal">Cap: {line.allowedDiscountPct}%</span>
                      </label>
                      <div className="relative">
                        <input 
                          type="number" 
                          min="0" 
                          max="100" 
                          value={line.discountPct} 
                          onChange={(e) => {
                            const val = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
                            updateActiveQuote(q => {
                              const l = (q.lines || []).find(item => item.id === line.id);
                              if (l) l.discountPct = val;
                            });
                          }}
                          className={`input py-1 px-1.5 text-xs text-center font-bold w-full ${
                            line.hasViolation 
                              ? 'border-amber-500 font-bold text-amber-900 bg-amber-50' 
                              : 'border-emerald-300 text-emerald-900 bg-emerald-50/20'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="text-right">
                      <label className="label text-[10px] font-semibold text-charcoal">Net Total</label>
                      <span className="font-bold text-sm text-charcoal block font-mono">
                        ${line.lineNetTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Risk & Margin Meter */}
            <div className="border-t border-warm pt-4 space-y-3 bg-charcoal-03 p-3.5 rounded-xl">
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>Quotation Net Total:</span>
                <span className="text-lg font-bold text-charcoal font-mono">${totalNetRevenue.toLocaleString()}</span>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-muted">
                    Pricing Governance Status: {' '}
                    <strong className={blendedRiskScore > 0 ? 'text-amber-700 font-bold' : 'text-emerald-700 font-bold'}>
                      {blendedRiskScore > 0 ? `Flagged (${blendedRiskScore} Risk Score)` : 'Tier Compliant'}
                    </strong>
                  </span>
                  <span className="text-muted font-mono">Gross Margin: <strong>{overallGrossMarginPct.toFixed(1)}%</strong></span>
                </div>
                <div className="risk-bar-container">
                  <div 
                    className={`risk-bar-fill ${blendedRiskScore > 12 ? 'bg-red-600' : blendedRiskScore > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                    style={{ width: `${Math.min(100, Math.max(5, overallGrossMarginPct))}%` }}
                  ></div>
                </div>
              </div>

              {requiresApproval ? (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Tier Ceilings Exceeded:</strong> One or more line items have discounts exceeding the customer's {tier} status ceiling ({maxSingleLineOverage}% over). Submit for Manager approval.
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Quotation strictly complies with {tier} badge policies & category limits. Ready for submission.</span>
                </div>
              )}

              {quote.status === 'Draft' && (
                <div className="pt-2">
                  {requiresApproval ? (
                    <button 
                      type="button"
                      onClick={() => {
                        updateActiveQuote(q => { q.status = 'Pending Approval'; });
                        addApprovalLog({
                          quoteId: quote.id,
                          user: quote.repName || currentUser?.name || 'Rahul',
                          role: 'sales_rep',
                          action: 'Routed Risky Quote for Approval',
                          blendedRiskScore,
                          reason: `Line discount exceeds ${tier} status ceiling by ${maxSingleLineOverage} points.`
                        });
                        showToast('Risky quotation submitted into Manager Approval Queue.', 'warning');
                      }}
                      className="btn btn-md btn-primary bg-amber-800 hover:bg-amber-900 border-amber-900 w-full flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    >
                      <ShieldAlert className="w-4 h-4" /> Submit Quote for Manager Approval
                    </button>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => {
                        updateActiveQuote(q => { q.status = 'Approved'; });
                        addApprovalLog({
                          quoteId: quote.id,
                          user: quote.repName || currentUser?.name || 'Rahul',
                          role: 'sales_rep',
                          action: 'Submitted Standard Quote',
                          blendedRiskScore: 0,
                          reason: `Quote adheres strictly to ${tier} status discount limits.`
                        });
                        showToast('Quotation submitted successfully!', 'success');
                      }}
                      className="btn btn-md btn-primary w-full flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    >
                      <Send className="w-4 h-4" /> Submit Quotation
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upsell Drawer (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="card bg-amber-50/10 border-amber-200/60">
            <div className="card-header border-b border-warm pb-2">
              <h3 className="text-sm font-bold text-charcoal flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" /> Live Upsell Drawer
              </h3>
            </div>

            <div className="space-y-3 mt-3">
              {applicableUpsells.length === 0 ? (
                <div className="text-xs text-muted py-6 text-center">
                  Laptop added to cart! Check recommendations.
                </div>
              ) : applicableUpsells.map(rule => {
                const sug = data.products.find(p => p.id === rule.suggestedProductId);
                if (!sug) return null;
                const sugAllowedDiscount = getAllowedDiscountForProduct(sug, tier);

                return (
                  <div key={rule.triggerProductId} className="p-3 bg-cream border border-warm rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="badge badge-warning text-[10px]">+{rule.marginDelta}% Margin Delta</span>
                      {rule.isPromoted && <span className="badge badge-info text-[10px]">🔥 Promoted</span>}
                    </div>

                    <h4 className="font-bold text-xs text-charcoal">{sug.name}</h4>
                    <p className="text-[11px] text-muted line-clamp-2">{rule.reason}</p>

                    <div className="flex items-center gap-1 pt-1">
                      <span className="font-bold text-xs text-charcoal mr-auto">${sug.listPrice}</span>
                      <button 
                        type="button"
                        onClick={() => {
                          handleAddProductToQuote(sug, sugAllowedDiscount);
                        }}
                        className="btn btn-sm btn-primary text-[11px] py-0.5 px-2 bg-emerald-800 hover:bg-emerald-900 border-emerald-800"
                        title={`Add with ${tier} discount (${sugAllowedDiscount}%)`}
                      >
                        + Add ({sugAllowedDiscount}%)
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.currentTarget.closest('.p-3').style.display = 'none';
                        }}
                        className="btn btn-sm btn-ghost text-[11px] py-0.5 px-2 text-muted hover:text-charcoal"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
