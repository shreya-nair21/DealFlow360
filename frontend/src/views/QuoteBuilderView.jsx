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
    badgeColor: 'bg-[#efefef] text-black border-[#e2e2e2]',
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

  return (
    <div className="space-y-6">
      {/* Sales Rep Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white border border-warm p-4 md:p-5 rounded-2xl shadow-2xs">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            value={quote.id}
            onChange={(e) => setActiveQuoteId(e.target.value)}
            className="select text-sm md:text-base font-semibold border-warm bg-[#efefef] py-2.5 px-4 rounded-xl text-black cursor-pointer w-full md:w-auto"
          >
            {data.quotations.map(q => (
              <option key={q.id} value={q.id}>
                {q.code} - {data.customers.find(c => c.id === q.customerId)?.name || 'Custom Deal'} ({q.status})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => {
              const newQ = {
                id: 'q-' + Date.now(),
                code: `QT-2026-ABC-${data.quotations.length + 1}`,
                customerId: 'c-abc',
                repId: currentUser?.id || 'u-rahul',
                repName: currentUser?.name || 'Sales Rep',
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
            className="btn btn-sm bg-white hover:bg-[#efefef] text-black border border-[#e2e2e2] rounded-full px-4 py-2 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Plus className="w-4 h-4 text-black" /> Create New Quote
          </button>

          {quote.status === 'Draft' ? (
            requiresApproval ? (
              <button 
                onClick={() => {
                  updateActiveQuote(q => { q.status = 'Pending Approval'; });
                  addApprovalLog({
                    quoteId: quote.id,
                    user: quote.repName || currentUser?.name || 'Sales Rep',
                    role: 'sales_rep',
                    action: 'Routed Risky Quote for Approval',
                    blendedRiskScore,
                    reason: `Service line discount exceeds allowed ceiling by ${maxSingleLineOverage} points.`
                  });
                  showToast('Risky quotation submitted into Manager Approval Queue.', 'warning');
                }}
                className="btn btn-sm bg-black hover:bg-[#282828] text-white border border-black rounded-full px-4 py-2 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <ShieldAlert className="w-4 h-4 text-white" /> Submit Risky Quote for Approval
              </button>
            ) : (
              <button 
                onClick={() => {
                  updateActiveQuote(q => { q.status = 'Approved'; });
                  addApprovalLog({
                    quoteId: quote.id,
                    user: quote.repName || currentUser?.name || 'Sales Rep',
                    role: 'sales_rep',
                    action: 'Submitted Standard Quote',
                    blendedRiskScore: 0,
                    reason: 'Quote passes pricing governance rules.'
                  });
                  showToast('Quotation submitted successfully!', 'success');
                }}
                className="btn btn-sm bg-black hover:bg-[#282828] text-white border border-black rounded-full px-4 py-2 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Send className="w-4 h-4 text-white" /> Submit Quotation
              </button>
            )
          ) : (
            <span className="badge bg-black text-white text-xs py-1.5 px-3.5 font-semibold rounded-full">
              Quotation Submitted ({quote.status})
            </span>
          )}
        </div>
      </div>

      {/* ================= CUSTOMER DETAILS ================= */}
      <div className="card bg-white border border-warm rounded-2xl p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-warm pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center font-bold text-sm shadow-2xs shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-black">
                  Customer Details
                </h3>
                {/* Dynamic Customer Badge according to orders */}
                <span className="badge bg-black text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                  <Shield className="w-3.5 h-3.5 text-white" />
                  <span>{tier.toUpperCase()} TIER</span>
                  <span className="text-white/80 font-mono font-normal">({customerOrders} {customerOrders === 1 ? 'Order' : 'Orders'})</span>
                </span>
                <span className="text-xs text-[#5e5e5e] bg-[#fafafa] border border-[#e2e2e2] px-2.5 py-0.5 rounded-full font-mono">
                  Ceiling: <strong>{tierMeta.discountCeiling}</strong>
                </span>
              </div>
              <p className="text-xs text-[#5e5e5e] mt-0.5">
                Select a saved account or enter customer information for this quotation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className="text-xs text-[#5e5e5e] font-semibold whitespace-nowrap shrink-0">Saved Accounts:</span>
            <select
              value={quote.customerId || ''}
              onChange={(e) => handleSelectCustomer(e.target.value)}
              className="select text-xs font-semibold border-warm bg-[#efefef] py-2 px-3.5 min-h-[38px] leading-normal rounded-xl cursor-pointer w-auto"
            >
              {(data.customers || []).map(c => {
                const cTier = calculateCustomerTier ? calculateCustomerTier(c.orderCount || 0) : (c.tier || 'Bronze');
                return (
                  <option key={c.id} value={c.id}>
                    {c.name} ({cTier} • {c.orderCount || 0} Orders)
                  </option>
                );
              })}
              <option value="new">+ Enter Custom / New Customer</option>
            </select>
          </div>
        </div>

        {/* Customer Fields: 3 Columns Grid with dedicated Tier Badge box */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-5">
            <label className="label text-xs font-bold text-black mb-1">Customer / Company Name</label>
            <input
              type="text"
              value={customer.name}
              onChange={(e) => handleCustomerFieldChange('name', e.target.value)}
              placeholder="e.g. Acme Global Corp"
              className="input text-sm py-2 px-3 w-full rounded-xl bg-[#efefef] border border-warm text-black"
            />
          </div>
          <div className="md:col-span-4">
            <label className="label text-xs font-bold text-black mb-1">Work Email Address</label>
            <input
              type="email"
              value={customer.email || ''}
              onChange={(e) => handleCustomerFieldChange('email', e.target.value)}
              placeholder="procurement@acme.com"
              className="input text-sm py-2 px-3 w-full rounded-xl bg-[#efefef] border border-warm text-black font-mono"
            />
          </div>
          <div className="md:col-span-3">
            <label className="label text-xs font-bold text-black mb-1">Customer Tier & Standing</label>
            <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-[#efefef] border border-warm rounded-xl min-h-[38px]">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black text-white text-xs font-bold shadow-2xs shrink-0">
                <Shield className="w-3 h-3 text-white" />
                <span>{tier}</span>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSetCustomerOrders(Math.max(0, customerOrders - 1))}
                  title="Decrease completed orders (-1 Order)"
                  className="w-5 h-5 rounded-full bg-white border border-[#e2e2e2] hover:bg-[#e2e2e2] flex items-center justify-center font-bold text-xs text-black cursor-pointer transition-all leading-none"
                >
                  -
                </button>
                <span className="font-mono text-xs font-bold text-black min-w-[20px] text-center" title={`${customerOrders} completed orders`}>
                  {customerOrders}
                </span>
                <button
                  type="button"
                  onClick={() => handleSetCustomerOrders(customerOrders + 1)}
                  title="Increase completed orders (+1 Order)"
                  className="w-5 h-5 rounded-full bg-black text-white hover:bg-[#282828] flex items-center justify-center font-bold text-xs cursor-pointer transition-all leading-none"
                >
                  +
                </button>
                <span className="text-xs text-[#5e5e5e] font-medium hidden xl:inline">Orders</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout Grid: Only 2 required cards: Product Catalog + Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Product Catalog Picker (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="card">
            <div className="card-header border-b border-warm pb-3">
              <div>
                <h3 className="text-base font-bold text-black flex items-center gap-2">
                  <Package className="w-4 h-4 text-black" /> Product & Service Catalog
                </h3>
                <p className="text-xs text-[#5e5e5e]">
                  Available hardware, software, and professional service lines
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-[#5e5e5e]">
                {data.products.length} Products
              </span>
            </div>
            
            <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1 mt-3">
              {data.products.map(product => {
                const prodAllowedDiscount = getAllowedDiscountForProduct(product, tier);

                return (
                  <div key={product.id} className="p-3.5 border border-warm rounded-2xl hover:border-black transition-all bg-white shadow-2xs space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-black">{product.name}</h4>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full border border-warm bg-[#efefef] text-black">
                            {product.category}
                          </span>
                        </div>
                        <p className="text-xs text-[#5e5e5e] font-mono mt-0.5">{product.sku}</p>
                      </div>
                      <span className="font-bold text-sm text-black bg-[#efefef] px-2.5 py-1 rounded-xl border border-warm font-mono">
                        ${product.listPrice.toLocaleString()}
                      </span>
                    </div>

                    <p className="text-xs text-[#5e5e5e] line-clamp-2 leading-relaxed">{product.description}</p>

                    {/* Status & Category Ceiling Info */}
                    <div className="flex items-center justify-between text-xs bg-[#efefef] p-2 rounded-xl border border-warm">
                      <span className="text-black font-medium flex items-center gap-1.5">
                        <span>Category Discount Limit ({product.category}):</span>
                      </span>
                      <strong className="text-black font-mono font-bold text-xs">
                        {prodAllowedDiscount}% max discount
                      </strong>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button 
                        type="button"
                        onClick={() => handleAddProductToQuote(product, 0)}
                        className="btn btn-sm btn-outline py-2 px-3 text-xs flex-1 text-black hover:bg-[#efefef] rounded-full font-semibold"
                        title="Add to quote without discount"
                      >
                        + Add (0%)
                      </button>

                      <button 
                        type="button"
                        onClick={() => handleAddProductToQuote(product, prodAllowedDiscount)}
                        className="btn btn-sm btn-primary py-2 px-3 text-xs flex-1 bg-black text-white hover:bg-[#282828] border-black flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer rounded-full font-semibold"
                        title={`Add with recommended ${prodAllowedDiscount}% discount`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Add ({prodAllowedDiscount}%)</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Cart & Pricing Governance (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="card">
            <div className="card-header border-b border-warm pb-3">
              <div>
                <h3 className="text-base font-bold text-black flex items-center gap-2">
                  <span>{customer?.name || 'Customer'} Cart</span>
                </h3>
                <p className="text-xs text-[#5e5e5e] mt-0.5">
                  Review line items, assign compliant discounts, and verify margins
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleApplyAllTierDiscounts}
                  className="btn btn-sm btn-outline py-1.5 px-3 text-xs flex items-center gap-1.5 rounded-full font-semibold"
                  title="Set all line items to maximum allowed tier discount"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Set All Max</span>
                </button>
                <span className="text-xs font-mono font-bold text-black bg-[#efefef] px-2.5 py-1 rounded-full border border-warm">
                  {(quote.lines || []).length} Items
                </span>
              </div>
            </div>

            <div className="space-y-3 my-4 max-h-[460px] overflow-y-auto pr-1">
              {(quote.lines || []).length === 0 ? (
                <div className="text-center py-10 text-[#5e5e5e] space-y-2">
                  <Package className="w-8 h-8 mx-auto text-[#afafaf]" />
                  <p className="text-sm font-semibold">No line items in this quotation.</p>
                  <p className="text-xs">Select a product from the catalog on the left to add items.</p>
                </div>
              ) : lineDetails.map(line => (
                <div 
                  key={line.id} 
                  className={`p-3.5 border rounded-xl space-y-2.5 transition-all shadow-2xs ${
                    line.hasViolation 
                      ? 'border-black bg-[#f3f3f3]' 
                      : 'border-warm bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-black">{line.product.name}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#efefef] text-black border border-warm">
                          {line.product.category}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs text-[#5e5e5e] font-mono">
                          ${line.unitPrice} / {line.product.unit || 'unit'}
                        </span>
                        
                        {line.hasViolation ? (
                          <span className="badge bg-black text-white text-xs py-0.5 px-2.5 font-bold flex items-center gap-1 rounded-full">
                            <AlertTriangle className="w-3 h-3 text-white" />
                            Over Limit: {line.allowedDiscountPct}% (+{line.overagePct}%)
                          </span>
                        ) : (
                          <span className="badge bg-[#efefef] text-black border border-[#e2e2e2] text-xs py-0.5 px-2.5 font-semibold flex items-center gap-1 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-black" />
                            Policy Limit: {line.allowedDiscountPct}%
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
                      className="text-[#5e5e5e] hover:text-black p-1 transition-colors cursor-pointer"
                      title="Remove product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quick Discount Assignment Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 p-2 bg-[#f8f8f8] rounded-xl border border-warm text-xs">
                    <span className="text-[#5e5e5e] font-semibold">Assign Discount:</span>
                    
                    <button
                      type="button"
                      onClick={() => {
                        updateActiveQuote(q => {
                          const l = (q.lines || []).find(item => item.id === line.id);
                          if (l) l.discountPct = 0;
                        });
                      }}
                      className={`px-2.5 py-1 rounded-full border transition-all cursor-pointer font-semibold ${
                        line.discountPct === 0 
                          ? 'bg-black text-white border-black font-bold shadow-2xs' 
                          : 'bg-white border-warm text-black hover:bg-[#efefef]'
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
                      className={`px-2.5 py-1 rounded-full border transition-all cursor-pointer font-semibold ${
                        line.discountPct === Math.round(line.allowedDiscountPct / 2) && line.discountPct > 0
                          ? 'bg-black text-white border-black font-bold shadow-2xs' 
                          : 'bg-white border-warm text-black hover:bg-[#efefef]'
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
                      className={`px-2.5 py-1 rounded-full border transition-all cursor-pointer flex items-center gap-1 font-semibold ${
                        line.discountPct === line.allowedDiscountPct
                          ? 'bg-black text-white border-black font-bold shadow-2xs' 
                          : 'bg-[#efefef] text-black border-[#e2e2e2] hover:bg-[#e2e2e2]'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Set Max ({line.allowedDiscountPct}%)</span>
                    </button>
                  </div>

                  {/* Quantity, Discount Input & Calculated Net Total */}
                  <div className="grid grid-cols-3 gap-3 items-center bg-white p-2.5 rounded-xl border border-[#e2e2e2] text-xs">
                    <div>
                      <label className="label text-xs font-semibold text-black mb-1">Quantity</label>
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
                        className="input py-1.5 px-2 text-sm text-center font-bold bg-[#fafafa] border border-[#e2e2e2] rounded-lg text-black"
                      />
                    </div>

                    <div>
                      <label className="label text-xs font-semibold text-black mb-1 flex items-center justify-between">
                        <span>Discount %</span>
                        <span className="text-xs text-[#5e5e5e] font-normal">Cap: {line.allowedDiscountPct}%</span>
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
                          className={`input py-1.5 px-2 text-sm text-center font-bold w-full rounded-lg ${
                            line.hasViolation 
                              ? 'border-2 border-black font-bold text-black bg-[#fafafa]' 
                              : 'border border-[#e2e2e2] text-black bg-white'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="text-right">
                      <label className="label text-xs font-semibold text-black mb-1">Net Total</label>
                      <span className="font-bold text-sm text-black block font-mono">
                        ${line.lineNetTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Risk & Margin Meter */}
            <div className="border-t border-warm pt-4 space-y-3 bg-[#f8f8f8] p-4 rounded-xl">
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>Quotation Net Total:</span>
                <span className="text-lg font-bold text-black font-mono">${totalNetRevenue.toLocaleString()}</span>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-black">
                    Pricing Governance Status:{' '}
                    <strong className="text-black font-bold">
                      {blendedRiskScore > 0 ? `Flagged (${blendedRiskScore} Risk Score)` : 'Policy Compliant'}
                    </strong>
                  </span>
                  <span className="text-[#5e5e5e] font-mono">Gross Margin: <strong className="text-black">{overallGrossMarginPct.toFixed(1)}%</strong></span>
                </div>
                <div className="risk-bar-container">
                  <div 
                    className={`risk-bar-fill ${blendedRiskScore > 0 ? 'bg-black' : 'bg-[#5e5e5e]'}`} 
                    style={{ width: `${Math.min(100, Math.max(5, overallGrossMarginPct))}%` }}
                  ></div>
                </div>
              </div>

              {requiresApproval ? (
                <div className="p-3 rounded-xl bg-[#efefef] border border-black text-xs text-black flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-black shrink-0 mt-0.5" />
                  <div>
                    <strong>Pricing Limits Exceeded:</strong> One or more line items have discounts exceeding allowed ceilings ({maxSingleLineOverage}% over). Submit for Manager approval.
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-[#fafafa] border border-[#e2e2e2] text-xs text-black flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
                  <span>Quotation strictly complies with pricing policies & category limits. Ready for submission.</span>
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
                          reason: `Line discount exceeds category ceiling by ${maxSingleLineOverage} points.`
                        });
                        showToast('Risky quotation submitted into Manager Approval Queue.', 'warning');
                      }}
                      className="btn btn-md btn-primary bg-black hover:bg-[#282828] border-black text-white w-full flex items-center justify-center gap-2 shadow-xs cursor-pointer rounded-full"
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
                          reason: `Quote adheres strictly to pricing discount limits.`
                        });
                        showToast('Quotation submitted successfully!', 'success');
                      }}
                      className="btn btn-md btn-primary bg-black hover:bg-[#282828] border-black text-white w-full flex items-center justify-center gap-2 shadow-xs cursor-pointer rounded-full"
                    >
                      <Send className="w-4 h-4" /> Submit Quotation
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
