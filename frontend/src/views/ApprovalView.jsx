import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  XCircle, 
  CheckCircle, 
  History, 
  MessageSquare, 
  RotateCcw, 
  AlertTriangle, 
  UserCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  Sliders,
  DollarSign,
  Send
} from 'lucide-react';

export const ApprovalView = () => {
  const { 
    data, 
    activeQuote, 
    setActiveQuoteId, 
    updateActiveQuote, 
    addApprovalLog, 
    currentRole, 
    currentUser,
    showToast 
  } = useApp();

  const [reason, setReason] = useState('');

  // Quotations needing review (Pending Approval, Pending Finance Approval, In Negotiation)
  const reviewQuotes = useMemo(() => {
    return data.quotations.filter(q => 
      q.status === 'Pending Approval' || 
      q.status === 'Pending Finance Approval' || 
      q.status === 'In Negotiation'
    );
  }, [data.quotations]);
  
  // Selected quote for inspection
  const displayQuote = (data.quotations || []).find(q => q.id === activeQuote?.id) || reviewQuotes[0] || data.quotations[0] || null;
  const customer = displayQuote ? (data.customers || []).find(c => c.id === displayQuote.customerId) : null;
  const customerTier = customer?.tier || 'Bronze';

  // DYNAMIC BLENDED RISK SCORE & THRESHOLD CALCULATION (PDF Section A3, B4, 10)
  const riskAnalysis = useMemo(() => {
    if (!displayQuote || !displayQuote.lines) {
      return { score: 0, maxOverage: 0, requiresFinance: false, lineAudits: [] };
    }

    const categoryCeilings = data.discountRules?.categoryCeilings || {
      Hardware: { Standard: 3, Bronze: 5, Silver: 10, Gold: 15, Platinum: 20 },
      Service: { Standard: 2, Bronze: 3, Silver: 7, Gold: 10, Platinum: 15 },
      Subscription: { Standard: 3, Bronze: 5, Silver: 12, Gold: 20, Platinum: 25 }
    };

    let totalNet = 0;
    let lineRiskSum = 0;
    let maxOverage = 0;
    const lineAudits = [];

    displayQuote.lines.forEach(line => {
      const prod = data.products.find(p => p.id === line.productId) || {
        id: line.productId,
        name: line.name || 'Product',
        category: 'Hardware',
        listPrice: line.unitPrice || 1000
      };

      const category = prod.category || 'Hardware';
      const allowedCeiling = categoryCeilings[category]?.[customerTier] !== undefined 
        ? categoryCeilings[category][customerTier] 
        : (data.discountRules?.globalTierCeilings?.[customerTier] || 10);

      const discountGiven = line.discountPct !== undefined ? line.discountPct : (displayQuote.discountPct || 0);
      const overage = Math.max(0, discountGiven - allowedCeiling);
      const netLine = (line.unitPrice || prod.listPrice || 0) * (1 - discountGiven / 100) * (line.quantity || 1);

      totalNet += netLine;
      lineRiskSum += overage * netLine;
      if (overage > maxOverage) maxOverage = overage;

      lineAudits.push({
        lineId: line.id,
        name: prod.name,
        category,
        quantity: line.quantity,
        unitPrice: line.unitPrice || prod.listPrice,
        discountGiven,
        allowedCeiling,
        overage,
        isExceeded: overage > 0
      });
    });

    const score = totalNet > 0 
      ? parseFloat(((lineRiskSum / totalNet) * 10 + (maxOverage * 0.5)).toFixed(1))
      : (displayQuote.discountPct ? displayQuote.discountPct * 0.8 : 0);

    const financeThreshold = data.discountRules?.thresholds?.financeApprovalRiskScore || 12.0;
    const requiresFinance = score >= financeThreshold || maxOverage >= 10;

    return {
      score: Math.max(0, score),
      maxOverage,
      requiresFinance,
      lineAudits
    };
  }, [displayQuote, customerTier, data.products, data.discountRules]);

  const logs = displayQuote ? (data.approvalLogs || []).filter(l => l.quoteId === displayQuote.id) : [];
  const customerComments = displayQuote ? (displayQuote.comments || []) : [];

  // Approval step progress determination
  const isManagerApproved = displayQuote?.status === 'Pending Finance Approval' || displayQuote?.status === 'Approved' || displayQuote?.status === 'Confirmed';
  const isFinanceApproved = displayQuote?.status === 'Approved' || displayQuote?.status === 'Confirmed';

  return (
    <div className="space-y-6">
      
      {/* ================= TOP HEADER BANNER ================= */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-cream border border-warm p-4 rounded-2xl shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-charcoal flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-amber-600" /> B4) Multi-Tier Discount Governance & Approval Queue
            </h2>
            <span className="badge badge-warning text-[10px] font-bold">2-Tier Chain Active</span>
          </div>
          <p className="text-xs text-muted mt-0.5">
            Evaluates blended discount risk scores across product lines and auto-routes for Sales Manager or dual Sales Manager + Finance approval.
          </p>
        </div>

        <span className="badge badge-warning text-xs px-3 py-1 font-mono font-bold shadow-2xs">
          {reviewQuotes.length} Deals Pending In Review Queue
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sidebar Queue: Selectable Deals (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="card bg-white border border-warm rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-warm pb-2">
              <h3 className="text-xs font-bold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Pending Review Queue</span>
              </h3>
              <span className="badge badge-neutral text-[10px] font-mono">{reviewQuotes.length}</span>
            </div>

            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
              {reviewQuotes.length === 0 ? (
                <div className="text-xs text-muted py-8 text-center border border-dashed border-warm rounded-xl">
                  No quotations currently pending approval. All quotes pass pricing governance.
                </div>
              ) : reviewQuotes.map(q => {
                const isSelected = displayQuote && q.id === displayQuote.id;
                const cust = data.customers.find(c => c.id === q.customerId);
                const hasCounter = q.comments && q.comments.some(c => c.role === 'customer');
                const isFinanceStage = q.status === 'Pending Finance Approval';

                return (
                  <div
                    key={q.id}
                    onClick={() => setActiveQuoteId(q.id)}
                    className={`p-3.5 border rounded-xl cursor-pointer transition-all space-y-1.5 ${
                      isSelected 
                        ? 'border-charcoal bg-charcoal-03 ring-1 ring-charcoal/20 shadow-xs' 
                        : 'border-warm hover:border-interactive bg-cream/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-charcoal">{q.code}</span>
                      <span className={`badge ${
                        isFinanceStage ? 'badge-danger font-bold' : q.status === 'Pending Approval' ? 'badge-warning font-bold' : 'badge-info'
                      } text-[10px]`}>
                        {q.status}
                      </span>
                    </div>

                    <p className="text-xs text-muted">
                      Customer: <strong className="text-charcoal">{cust?.name || q.customerName || 'Client'}</strong> ({cust?.tier || 'Bronze'})
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-warm/40 text-[10px]">
                      <span className="text-muted">Rep: {q.repName || 'Rahul'}</span>
                      {hasCounter && (
                        <span className="badge badge-warning text-[9px] flex items-center gap-1 font-semibold">
                          <MessageSquare className="w-2.5 h-2.5" /> Customer Counter-Offer
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Review Panel: Risk Engine & Dual-Step Chain (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {!displayQuote ? (
            <div className="card text-center py-16 text-muted border border-dashed border-warm rounded-2xl bg-white">
              <ShieldCheck className="w-12 h-12 text-muted mx-auto mb-2 opacity-50" />
              <h4 className="font-bold text-sm text-charcoal">No Quotation Selected</h4>
              <p className="text-xs text-muted mt-1">Select a quotation from the review queue on the left to inspect discount risk and counter-offers.</p>
            </div>
          ) : (
            <>
              {/* Quote Overview & Live Risk Badge Card */}
              <div className="card bg-white border border-warm rounded-2xl p-5 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-warm pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-charcoal">{displayQuote.code} Commercial Risk Review</h3>
                      <span className="badge badge-warning text-xs font-mono font-bold">{displayQuote.status}</span>
                    </div>
                    <p className="text-xs text-muted mt-0.5">
                      Client: <strong>{customer?.name || displayQuote.customerName || 'Corporate Client'}</strong> ({customerTier} Tier) • Handling Rep: <strong>{displayQuote.repName || currentUser?.name || 'Rahul'}</strong>
                    </p>
                  </div>

                  {/* Calculated Blended Risk Score Pill */}
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 shadow-2xs ${
                      riskAnalysis.score >= 12 
                        ? 'bg-red-50 text-red-800 border-red-300' 
                        : riskAnalysis.score > 0 
                        ? 'bg-amber-50 text-amber-800 border-amber-300' 
                        : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    }`}>
                      <ShieldAlert className="w-4 h-4" />
                      <span>Blended Risk Score: <strong>{riskAnalysis.score}</strong></span>
                    </span>
                  </div>
                </div>

                {/* ================= APPROVAL STEPS LIST: SALES MANAGER & FINANCE (PDF Section A3 & B4) ================= */}
                <div className="p-4 bg-cream/60 border border-warm rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-charcoal flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-charcoal" />
                      <span>Approval Chain Progression:</span>
                    </span>
                    <span className="text-[11px] text-muted">
                      {riskAnalysis.requiresFinance 
                        ? 'High-Risk (>12.0) requires 2-Level Chain: Sales Manager + Finance' 
                        : 'Moderate Risk (≤12.0) requires 1-Level Chain: Sales Manager only'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    
                    {/* Step 1: Sales Manager Review */}
                    <div className={`p-3 rounded-xl border transition-all ${
                      isManagerApproved 
                        ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-2xs' 
                        : 'bg-white border-amber-300 text-amber-950 shadow-xs ring-1 ring-amber-300/40'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs flex items-center gap-1.5">
                          <span>1.</span>
                          <span>Sales Manager Approval</span>
                        </span>
                        {isManagerApproved ? (
                          <span className="badge badge-success text-[10px] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Approved
                          </span>
                        ) : (
                          <span className="badge badge-warning text-[10px] font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" /> Pending Review
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] opacity-80">
                        First level review of discounts exceeding product category ceilings.
                      </p>
                    </div>

                    {/* Step 2: Finance Review (Only shown / activated when required) */}
                    <div className={`p-3 rounded-xl border transition-all ${
                      !riskAnalysis.requiresFinance 
                        ? 'bg-white/50 border-warm/40 text-muted opacity-60'
                        : isFinanceApproved
                        ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-2xs'
                        : displayQuote.status === 'Pending Finance Approval'
                        ? 'bg-red-50/80 border-red-300 text-red-950 shadow-xs ring-1 ring-red-300/40'
                        : 'bg-white border-warm text-muted'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs flex items-center gap-1.5">
                          <span>2.</span>
                          <span>Finance Executive Review</span>
                        </span>
                        {!riskAnalysis.requiresFinance ? (
                          <span className="badge badge-neutral text-[10px]">Not Required</span>
                        ) : isFinanceApproved ? (
                          <span className="badge badge-success text-[10px] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Approved
                          </span>
                        ) : displayQuote.status === 'Pending Finance Approval' ? (
                          <span className="badge badge-danger text-[10px] font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Awaiting Finance Action
                          </span>
                        ) : (
                          <span className="badge badge-neutral text-[10px]">Awaiting Step 1</span>
                        )}
                      </div>
                      <p className="text-[11px] opacity-80">
                        Second level review for extreme margin erosion (Risk Score ≥ 12.0 or &gt;10% overage).
                      </p>
                    </div>

                  </div>
                </div>

                {/* Line Item Discount Audit Table */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted block">
                    Product Line Ceiling & Overage Audit:
                  </span>
                  <div className="overflow-x-auto border border-warm rounded-xl">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-warm bg-cream text-muted font-semibold text-[11px]">
                          <th className="py-2 px-3">Product Name</th>
                          <th className="py-2 px-3">Category</th>
                          <th className="py-2 px-3 text-right">Discount Given</th>
                          <th className="py-2 px-3 text-right">Allowed Ceiling</th>
                          <th className="py-2 px-3 text-right">Overage</th>
                          <th className="py-2 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-warm">
                        {riskAnalysis.lineAudits.map((item, idx) => (
                          <tr key={idx} className={item.isExceeded ? 'bg-amber-50/30' : 'bg-white'}>
                            <td className="py-2.5 px-3 font-semibold text-charcoal">{item.name}</td>
                            <td className="py-2.5 px-3 font-mono text-muted">{item.category}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-charcoal">
                              {item.discountGiven}%
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-muted">
                              {item.allowedCeiling}%
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-800">
                              {item.overage > 0 ? `+${item.overage}%` : '0%'}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {item.isExceeded ? (
                                <span className="badge badge-warning text-[9px] font-bold">⚠️ Over Limit</span>
                              ) : (
                                <span className="badge badge-success text-[9px] font-semibold">✅ Compliant</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Customer Negotiation & Counter-Offers Panel */}
                <div className="p-4 border border-amber-300 bg-amber-50/40 rounded-xl space-y-2.5">
                  <h4 className="font-bold text-xs text-amber-950 flex items-center gap-2 uppercase tracking-wider">
                    <MessageSquare className="w-4 h-4 text-amber-700" />
                    <span>Customer Negotiation Thread & Counter-Proposals</span>
                  </h4>

                  {customerComments.length === 0 ? (
                    <p className="text-xs text-amber-800 italic">No customer negotiation comments posted on this quotation yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {customerComments.map(c => (
                        <div key={c.id} className="p-2.5 rounded-lg border border-amber-200 bg-white text-xs space-y-1 shadow-2xs">
                          <div className="flex items-center justify-between font-semibold">
                            <span className="text-charcoal flex items-center gap-1">
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> {c.sender} ({c.role})
                            </span>
                            <span className="text-[10px] text-muted font-mono">{new Date(c.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-charcoal">{c.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reviewer Actions: Approve, Reject, Return for Revision */}
                <div className="border-t border-warm pt-4 space-y-3">
                  <label className="label text-xs font-bold text-charcoal">
                    Reviewer Decision Notes / Justification Reason:
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={2}
                    className="textarea text-xs w-full bg-white"
                    placeholder="Add approval rationale, conditions, counter-offer adjustments, or rejection reason..."
                  />

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                    
                    {/* Action 1: Return for Revision */}
                    <button
                      type="button"
                      onClick={() => {
                        updateActiveQuote(q => { q.status = 'Draft'; });
                        addApprovalLog({
                          quoteId: displayQuote.id,
                          user: currentUser?.name || (currentRole === 'finance' ? 'Finance Officer' : 'Sales Manager'),
                          role: currentRole,
                          action: 'Returned for Revision',
                          blendedRiskScore: riskAnalysis.score,
                          reason: reason || 'Returned to Sales Rep for discount adjustment.'
                        });
                        setReason('');
                        showToast('Quotation returned to Sales Rep for revision.', 'info');
                      }}
                      className="btn btn-sm btn-outline text-amber-800 border-amber-300 hover:bg-amber-50 text-xs flex items-center gap-1 cursor-pointer"
                      title="Return quotation to Sales Rep to adjust pricing"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Return for Revision</span>
                    </button>

                    {/* Action 2: Reject Quote */}
                    <button
                      type="button"
                      onClick={() => {
                        updateActiveQuote(q => { q.status = 'Draft'; });
                        addApprovalLog({
                          quoteId: displayQuote.id,
                          user: currentUser?.name || (currentRole === 'finance' ? 'Finance Officer' : 'Sales Manager'),
                          role: currentRole,
                          action: 'Quotation Rejected',
                          blendedRiskScore: riskAnalysis.score,
                          reason: reason || 'Rejected due to excessive margin erosion.'
                        });
                        setReason('');
                        showToast('Quotation rejected due to discount governance rules.', 'error');
                      }}
                      className="btn btn-sm btn-danger text-xs flex items-center gap-1 cursor-pointer"
                      title="Reject quotation"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject Quote</span>
                    </button>

                    {/* Action 3: Progressive Approve Action */}
                    {displayQuote.status === 'Pending Finance Approval' ? (
                      <button
                        type="button"
                        onClick={() => {
                          updateActiveQuote(q => { 
                            q.status = 'Approved'; 
                            q.fulfillmentStatus = 'Ready for Fulfillment';
                          });
                          addApprovalLog({
                            quoteId: displayQuote.id,
                            user: currentUser?.name || 'Finance Executive',
                            role: 'finance',
                            action: 'Finance Final Approval Confirmed (Step 2 of 2)',
                            blendedRiskScore: riskAnalysis.score,
                            reason: reason || 'Finance executive approval confirmed. Deal moved to Approved status.'
                          });
                          setReason('');
                          showToast('✅ Finance Final Approval granted! Quotation is now Approved and ready for fulfillment.', 'success');
                        }}
                        className="btn btn-sm btn-primary bg-emerald-800 hover:bg-emerald-900 border-emerald-800 text-white text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        title="Grant Finance final approval"
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span>Confirm Finance Approval (Step 2 of 2)</span>
                      </button>
                    ) : riskAnalysis.requiresFinance ? (
                      <button
                        type="button"
                        onClick={() => {
                          updateActiveQuote(q => { q.status = 'Pending Finance Approval'; });
                          addApprovalLog({
                            quoteId: displayQuote.id,
                            user: currentUser?.name || 'Sales Manager',
                            role: 'sales_manager',
                            action: 'Sales Manager Approved (Step 1 of 2) -> Routed to Finance',
                            blendedRiskScore: riskAnalysis.score,
                            reason: reason || `Sales Manager approved Step 1. Deal has blended risk score ${riskAnalysis.score} (>= 12.0) and requires Finance second-level sign-off.`
                          });
                          setReason('');
                          showToast('👔 Manager Approval Granted (Step 1). Quotation advanced to Finance Approval Queue (Step 2)!', 'success');
                        }}
                        className="btn btn-sm btn-primary bg-blue-800 hover:bg-blue-900 border-blue-800 text-white text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        title="Approve Step 1 and forward to Finance review"
                      >
                        <ArrowRight className="w-4 h-4" />
                        <span>Manager Approve & Route to Finance (Step 1 of 2)</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          updateActiveQuote(q => { 
                            q.status = 'Approved'; 
                            q.fulfillmentStatus = 'Ready for Fulfillment';
                          });
                          addApprovalLog({
                            quoteId: displayQuote.id,
                            user: currentUser?.name || 'Sales Manager',
                            role: 'sales_manager',
                            action: 'Sales Manager Final Approval',
                            blendedRiskScore: riskAnalysis.score,
                            reason: reason || 'Approved within Sales Manager discretion threshold.'
                          });
                          setReason('');
                          showToast('Quotation approved & confirmed by Sales Manager!', 'success');
                        }}
                        className="btn btn-sm btn-primary bg-emerald-800 hover:bg-emerald-900 border-emerald-800 text-white text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span>Approve Quotation</span>
                      </button>
                    )}

                  </div>
                </div>

              </div>

              {/* Historical Audit Trail Table */}
              <div className="card bg-white border border-warm rounded-2xl p-5 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-charcoal flex items-center gap-2 border-b border-warm pb-2">
                  <History className="w-4 h-4 text-charcoal" />
                  <span>Historical Audit Trail & Governance Log ({logs.length})</span>
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-warm bg-cream text-muted font-semibold text-[11px]">
                        <th className="py-2 px-3">Timestamp</th>
                        <th className="py-2 px-3">Reviewer</th>
                        <th className="py-2 px-3">Action</th>
                        <th className="py-2 px-3">Risk Score</th>
                        <th className="py-2 px-3">Reason / Governance Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-warm">
                      {logs.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center py-5 text-muted text-xs">
                            No approval audit logs recorded for this deal yet.
                          </td>
                        </tr>
                      ) : logs.map(log => (
                        <tr key={log.id} className="hover:bg-cream/40">
                          <td className="py-2.5 px-3 font-mono text-muted text-[11px]">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-charcoal">
                            {log.user} <span className="text-muted font-normal text-[10px]">({log.role})</span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="badge badge-info text-[10px] font-medium">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-charcoal text-xs">
                            {log.blendedRiskScore !== undefined ? log.blendedRiskScore : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-muted text-[11px] max-w-xs">
                            {log.reason}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

      </div>

    </div>
  );
};
