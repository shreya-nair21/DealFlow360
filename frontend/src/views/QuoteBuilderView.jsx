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
  UserCheck
} from 'lucide-react';

export const QuoteBuilderView = () => {
  const { data, activeQuote, setActiveQuoteId, updateActiveQuote, addQuotation, addApprovalLog, setView, currentUser } = useApp();

  const customer = data.customers.find(c => c.id === activeQuote.customerId);
  const tier = customer ? customer.tier : 'Bronze';

  let totalListAmount = 0;
  let totalNetRevenue = 0;
  let totalCost = 0;
  let lineRiskSum = 0;
  let maxSingleLineOverage = 0;

  const lineDetails = activeQuote.lines.map(line => {
    const product = data.products.find(p => p.id === line.productId);
    if (!product) return null;

    const listUnitPrice = line.unitPrice || product.listPrice;
    const qty = line.quantity || 1;
    const discountPct = line.discountPct || 0;
    const costPrice = product.costPrice || (listUnitPrice * 0.6);

    const lineListTotal = listUnitPrice * qty;
    const lineNetTotal = listUnitPrice * (1 - discountPct / 100) * qty;
    const lineTotalCost = costPrice * qty;

    const categoryCeilings = data.discountRules.categoryCeilings[product.category] || data.discountRules.categoryCeilings['Hardware'];
    const allowedDiscountPct = categoryCeilings[tier] !== undefined ? categoryCeilings[tier] : 5;
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

  const cartProductIds = activeQuote.lines.map(l => l.productId);
  const applicableUpsells = data.upsellRules.filter(r => 
    cartProductIds.includes(r.triggerProductId) && !cartProductIds.includes(r.suggestedProductId)
  );

  return (
    <div className="space-y-6">
      {/* Sales Rep Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-cream border border-warm p-4 rounded-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <select 
            value={activeQuote.id}
            onChange={(e) => setActiveQuoteId(e.target.value)}
            className="select text-sm font-semibold border-warm bg-cream"
          >
            {data.quotations.map(q => (
              <option key={q.id} value={q.id}>
                {q.code} - {data.customers.find(c => c.id === q.customerId)?.name} ({q.status})
              </option>
            ))}
          </select>

          <span className="badge badge-warning text-xs">{activeQuote.status}</span>
          
          <span className="text-xs text-muted font-medium flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            Handling Rep: <strong>{activeQuote.repName || currentUser?.name || 'Rahul'}</strong>
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

          {requiresApproval && (
            <button 
              onClick={() => {
                updateActiveQuote(q => { q.status = 'Pending Approval'; });
                addApprovalLog({
                  quoteId: activeQuote.id,
                  user: 'Sales Rep (Rahul)',
                  role: 'sales_rep',
                  action: 'Routed Risky Quote for Approval',
                  blendedRiskScore,
                  reason: `Service line discount exceeds allowed ceiling by ${maxSingleLineOverage} points.`
                });
                alert('Risky quotation submitted into Manager Approval Queue.');
              }}
              className="btn btn-sm btn-primary bg-amber-800 hover:bg-amber-900 border-amber-900"
            >
              <ShieldAlert className="w-4 h-4" /> Submit Risky Quote for Approval
            </button>
          )}

          <button onClick={() => setView('fulfillment')} className="btn btn-sm btn-cream">
            <Truck className="w-4 h-4" /> Track Fulfillment Split
          </button>

          <button onClick={() => setView('portal')} className="btn btn-sm btn-cream">
            <Send className="w-4 h-4" /> Interact with Customer
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Product Catalog Picker (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="card">
            <h3 className="text-base font-bold text-charcoal mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" /> Product & Service Catalog
            </h3>
            
            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
              {data.products.map(product => (
                <div key={product.id} className="p-3 border border-warm rounded-lg hover:border-interactive transition-colors bg-cream">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-sm text-charcoal">{product.name}</h4>
                      <p className="text-xs text-muted font-mono">{product.sku} • {product.category}</p>
                    </div>
                    <span className="font-bold text-sm text-charcoal">${product.listPrice.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-muted mt-1 line-clamp-2">{product.description}</p>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs font-medium text-muted">Cost: ${product.costPrice}</span>
                    <button 
                      onClick={() => {
                        updateActiveQuote(q => {
                          const existing = q.lines.find(l => l.productId === product.id);
                          if (existing) {
                            existing.quantity += 1;
                          } else {
                            q.lines.push({
                              id: 'ql-' + Date.now(),
                              productId: product.id,
                              quantity: 1,
                              unitPrice: product.listPrice,
                              discountPct: 0
                            });
                          }
                        });
                      }}
                      className="btn btn-sm btn-outline py-1 px-2.5 text-xs"
                    >
                      + Add to Quote
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cart & Live Margin Meter (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="card">
            <div className="card-header border-b border-warm pb-3">
              <div>
                <h3 className="text-base font-bold text-charcoal">{customer?.name} Cart Lines</h3>
                <p className="text-xs text-muted">Customer Tier: <strong>{tier}</strong> • Adjust quantities & discounts</p>
              </div>
              <span className="text-xs font-mono font-bold text-charcoal">{activeQuote.lines.length} Line Items</span>
            </div>

            <div className="space-y-3 my-4 max-h-[380px] overflow-y-auto pr-1">
              {lineDetails.map(line => (
                <div key={line.id} className={`p-3 border ${line.hasViolation ? 'border-amber-300 bg-amber-50/30' : 'border-warm'} rounded-lg space-y-2`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-semibold text-sm text-charcoal">{line.product.name}</span>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted font-mono">${line.unitPrice} / {line.product.unit}</span>
                        {line.hasViolation ? (
                          <span className="badge badge-warning text-[10px]">
                            ⚠️ Allowed Ceiling: {line.allowedDiscountPct}% (+{line.overagePct}% Over Limit!)
                          </span>
                        ) : (
                          <span className="badge badge-success text-[10px]">
                            ✅ Allowed Ceiling: {line.allowedDiscountPct}%
                          </span>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        updateActiveQuote(q => {
                          q.lines = q.lines.filter(l => l.id !== line.id);
                        });
                      }}
                      className="text-muted hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 items-center bg-cream/50 p-2 rounded border border-warm/50 text-xs">
                    <div>
                      <label className="label text-[10px]">Qty</label>
                      <input 
                        type="number" 
                        min="1" 
                        value={line.quantity} 
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          updateActiveQuote(q => {
                            const l = q.lines.find(item => item.id === line.id);
                            if (l) l.quantity = val;
                          });
                        }}
                        className="input py-0.5 px-1.5 text-xs text-center"
                      />
                    </div>

                    <div>
                      <label className="label text-[10px]">Discount %</label>
                      <input 
                        type="number" 
                        min="0" 
                        max="100" 
                        value={line.discountPct} 
                        onChange={(e) => {
                          const val = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
                          updateActiveQuote(q => {
                            const l = q.lines.find(item => item.id === line.id);
                            if (l) l.discountPct = val;
                          });
                        }}
                        className={`input py-0.5 px-1.5 text-xs text-center ${line.hasViolation ? 'border-amber-500 font-bold text-amber-900 bg-amber-50' : ''}`}
                      />
                    </div>

                    <div className="text-right">
                      <label className="label text-[10px]">Net Total</label>
                      <span className="font-bold text-sm text-charcoal">${line.lineNetTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Risk & Margin Meter */}
            <div className="border-t border-warm pt-4 space-y-3 bg-charcoal-03 p-3 rounded-lg">
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>Quotation Net Total:</span>
                <span className="text-lg font-bold text-charcoal">${totalNetRevenue.toLocaleString()}</span>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-muted">Blended Risk Score: <strong className={blendedRiskScore > 0 ? 'text-amber-700' : 'text-emerald-700'}>{blendedRiskScore}</strong></span>
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
                <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Risky Discount Flagged:</strong> Service line discount exceeds allowed 10% ceiling. Submit quote for Manager approval.
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Quote passes pricing governance rules. Ready for fulfillment or customer send.</span>
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
                        onClick={() => {
                          updateActiveQuote(q => {
                            q.lines.push({
                              id: 'ql-' + Date.now(),
                              productId: sug.id,
                              quantity: activeQuote.lines.find(l => l.productId === 'p-laptop')?.quantity || 1,
                              unitPrice: sug.listPrice,
                              discountPct: 0
                            });
                          });
                        }}
                        className="btn btn-sm btn-primary text-[11px] py-0.5 px-2"
                      >
                        + Add
                      </button>
                      <button 
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
