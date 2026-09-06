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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-[#e2e2e2] p-5 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-2xl font-bold text-black flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-black" /> Multi-Tier Discount Governance & Approval Queue
          </h2>
          <p className="text-sm text-[#5e5e5e] mt-1">
            Evaluates blended discount risk scores across product lines and auto-routes for Sales Manager or dual Sales Manager + Finance approval.
          </p>
        </div>

        <span className="badge bg-[#efefef] border border-black text-black text-sm px-4 py-1.5 font-mono font-bold shadow-xs">
          {reviewQuotes.length} Deals Pending In Review Queue
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sidebar Queue: Selectable Deals (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="card bg-white border border-[#e2e2e2] rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#e2e2e2] pb-2.5">
              <h3 className="text-sm font-bold text-black uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-black" />
                <span>Pending Review Queue</span>
              </h3>
              <span className="badge bg-black text-white text-xs font-mono font-bold">{reviewQuotes.length}</span>
            </div>

            <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
              {reviewQuotes.length === 0 ? (
                <div className="text-sm text-[#5e5e5e] py-10 text-center border border-dashed border-[#e2e2e2] rounded-xl">
                  No quotations currently pending approval. All quotes pass pricing governance.
                </div>
              ) : reviewQuotes.map(q => {
                const isSelected = displayQuote && q.id === displayQuote.id;
                const cust = data.customers.find(c => c.id === q.customerId);
                const hasCounter = q.comments && q.comments.some(c => c.role === 'customer');

                return (
                  <div
                    key={q.id}
                    onClick={() => setActiveQuoteId(q.id)}
                    className={`p-4 border rounded-xl cursor-pointer transition-all space-y-2 ${
                      isSelected 
                        ? 'border-black bg-white ring-2 ring-black shadow-sm' 
                        : 'border-[#e2e2e2] hover:border-black bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-sm text-black">{q.code}</span>
                      <span className="badge bg-black text-white text-xs font-semibold">
                        {q.status}
                      </span>
                    </div>

                    <p className="text-sm text-[#5e5e5e]">
                      Customer: <strong className="text-black">{cust?.name || q.customerName || 'Client'}</strong> ({cust?.tier || 'Bronze'})
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-[#e2e2e2] text-xs">
                      <span className="text-[#5e5e5e] font-mono">{(q.lines || []).length} Item{(q.lines || []).length !== 1 ? 's' : ''}</span>
                      {hasCounter && (
                        <span className="badge bg-[#efefef] text-black border border-black text-xs flex items-center gap-1 font-semibold">
                          <MessageSquare className="w-3 h-3 text-black" /> Counter-Offer
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
            <div className="card text-center py-16 text-[#5e5e5e] border border-dashed border-[#e2e2e2] rounded-2xl bg-white">
              <ShieldCheck className="w-12 h-12 text-[#afafaf] mx-auto mb-2 opacity-50" />
              <h4 className="font-bold text-base text-black">No Quotation Selected</h4>
              <p className="text-sm text-[#5e5e5e] mt-1">Select a quotation from the review queue on the left to inspect discount risk and counter-offers.</p>
            </div>
          ) : (
            <>
              {/* Quote Overview & Live Risk Badge Card */}
              <div className="card bg-white border border-[#e2e2e2] rounded-2xl p-6 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#e2e2e2] pb-5">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-black">{displayQuote.code} Commercial Risk Review</h3>
                      <span className="badge bg-[#efefef] border border-[#e2e2e2] text-black text-sm font-bold">{displayQuote.status}</span>
                    </div>
                    <p className="text-sm text-[#5e5e5e] mt-1">
                      Client: <strong className="text-black">{customer?.name || displayQuote.customerName || 'Corporate Client'}</strong> ({customerTier} Tier)
                    </p>
                  </div>

                  {/* Calculated Blended Risk Score Pill - Monochromatic */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-bold px-4 py-2 rounded-full border border-black bg-black text-white flex items-center gap-2 shadow-xs">
                      <ShieldAlert className="w-4 h-4 text-white" />
                      <span>Blended Risk Score: <strong>{riskAnalysis.score}</strong></span>
                    </span>
                  </div>
                </div>

                {/* ================= APPROVAL STEPS LIST: SALES MANAGER & FINANCE ================= */}
                <div className="p-5 bg-[#fafafa] border border-[#e2e2e2] rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold uppercase tracking-wider text-black flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-black" />
                      <span>Approval Chain Progression:</span>
                    </span>
                    <span className="text-xs text-[#5e5e5e]">
                      {riskAnalysis.requiresFinance 
                        ? 'High-Risk (>12.0) requires 2-Level Chain: Sales Manager + Finance' 
                        : 'Moderate Risk (≤12.0) requires 1-Level Chain: Sales Manager only'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Step 1: Sales Manager Review */}
                    <div className={`p-4 rounded-xl border transition-all ${
                      isManagerApproved 
                        ? 'bg-white border-black text-black shadow-xs' 
                        : 'bg-white border-2 border-black text-black shadow-xs'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm flex items-center gap-2">
                          <span>1.</span>
                          <span>Sales Manager Approval</span>
                        </span>
                        {isManagerApproved ? (
                          <span className="badge bg-black text-white text-xs font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                          </span>
                        ) : (
                          <span className="badge bg-[#efefef] border border-black text-black text-xs font-bold flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> Pending Review
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#5e5e5e]">
                        First level review of discounts exceeding product category ceilings.
                      </p>
                    </div>

                    {/* Step 2: Finance Review */}
                    <div className={`p-4 rounded-xl border transition-all ${
                      !riskAnalysis.requiresFinance 
                        ? 'bg-[#efefef]/60 border-[#e2e2e2] text-[#737373]'
                        : isFinanceApproved
                        ? 'bg-white border-black text-black shadow-xs'
                        : displayQuote.status === 'Pending Finance Approval'
                        ? 'bg-white border-2 border-black text-black shadow-xs'
                        : 'bg-white border-[#e2e2e2] text-[#737373]'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm flex items-center gap-2">
                          <span>2.</span>
                          <span>Finance Executive Review</span>
                        </span>
                        {!riskAnalysis.requiresFinance ? (
                          <span className="badge bg-[#efefef] border border-[#e2e2e2] text-[#737373] text-xs font-semibold">Not Required</span>
                        ) : isFinanceApproved ? (
                          <span className="badge bg-black text-white text-xs font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                          </span>
                        ) : displayQuote.status === 'Pending Finance Approval' ? (
                          <span className="badge bg-black text-white text-xs font-bold flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> Awaiting Finance Action
                          </span>
                        ) : (
                          <span className="badge bg-[#efefef] border border-[#e2e2e2] text-[#737373] text-xs">Awaiting Step 1</span>
                        )}
                      </div>
                      <p className="text-xs text-[#5e5e5e]">
                        Second level review for extreme margin erosion (Risk Score ≥ 12.0 or &gt;10% overage).
                      </p>
                    </div>

                  </div>
                </div>

                {/* Line Item Discount Audit Table */}
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-black block">
                    Product Line Ceiling & Overage Audit:
                  </span>
                  <div className="overflow-x-auto border border-[#e2e2e2] rounded-xl bg-white">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="border-b border-[#e2e2e2] bg-[#efefef] text-black font-bold text-xs uppercase tracking-wider">
                          <th className="py-3 px-4">Product Name</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4 text-right">Discount Given</th>
                          <th className="py-3 px-4 text-right">Allowed Ceiling</th>
                          <th className="py-3 px-4 text-right">Overage</th>
                          <th className="py-3 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e2e2e2]">
                        {riskAnalysis.lineAudits.map((item, idx) => (
                          <tr key={idx} className="hover:bg-[#f9f9f9]">
                            <td className="py-3 px-4 font-semibold text-black">{item.name}</td>
                            <td className="py-3 px-4 font-mono text-[#5e5e5e]">{item.category}</td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-black">
                              {item.discountGiven}%
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-[#5e5e5e]">
                              {item.allowedCeiling}%
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-black">
                              {item.overage > 0 ? `+${item.overage}%` : '0%'}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {item.isExceeded ? (
                                <span className="badge bg-black text-white text-xs font-bold">Over Limit</span>
                              ) : (
                                <span className="badge bg-[#efefef] border border-[#e2e2e2] text-black text-xs font-bold">Compliant</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Customer Negotiation & Counter-Offers Panel */}
                <div className="p-4 border border-[#e2e2e2] bg-[#fafafa] rounded-xl space-y-3">
                  <h4 className="font-bold text-xs text-black flex items-center gap-2 uppercase tracking-wider">
                    <MessageSquare className="w-4 h-4 text-black" />
                    <span>Customer Negotiation Thread & Counter-Proposals</span>
                  </h4>

                  {customerComments.length === 0 ? (
                    <p className="text-sm text-[#5e5e5e] italic">No customer negotiation comments posted on this quotation yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                      {customerComments.map(c => (
                        <div key={c.id} className="p-3 rounded-lg border border-[#e2e2e2] bg-white text-sm space-y-1 shadow-2xs">
                          <div className="flex items-center justify-between font-semibold">
                            <span className="text-black flex items-center gap-1.5">
                              <UserCheck className="w-4 h-4 text-black" /> {c.sender} ({c.role})
                            </span>
                            <span className="text-xs text-[#5e5e5e] font-mono">{new Date(c.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-black">{c.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reviewer Actions: Approve, Reject, Return for Revision */}
                <div className="border-t border-[#e2e2e2] pt-5 space-y-4">
                  <label className="label text-xs font-bold text-black">
                    Reviewer Decision Notes / Justification Reason:
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={2}
                    className="textarea text-sm w-full bg-white border-[#e2e2e2]"
                    placeholder="Add approval rationale, conditions, counter-offer adjustments, or rejection reason..."
                  />

                  <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                    
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
                      className="btn btn-sm btn-outline text-black border-black hover:bg-[#efefef] text-sm flex items-center gap-1.5 cursor-pointer"
                      title="Return quotation to Sales Rep to adjust pricing"
                    >
                      <RotateCcw className="w-4 h-4 text-black" />
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
                      className="btn btn-sm bg-black text-white hover:bg-[#282828] border border-black text-sm flex items-center gap-1.5 cursor-pointer"
                      title="Reject quotation"
                    >
                      <XCircle className="w-4 h-4 text-white" />
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
                          showToast('Finance Final Approval granted! Quotation is now Approved and ready for fulfillment.', 'success');
                        }}
                        className="btn btn-sm btn-primary bg-black hover:bg-[#282828] border-black text-white text-sm flex items-center gap-2 shadow-xs cursor-pointer"
                        title="Grant Finance final approval"
                      >
                        <CheckCircle className="w-4 h-4 text-white" />
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
                          showToast('Manager Approval Granted (Step 1). Quotation advanced to Finance Approval Queue (Step 2)!', 'success');
                        }}
                        className="btn btn-sm btn-primary bg-black hover:bg-[#282828] border-black text-white text-sm flex items-center gap-2 shadow-xs cursor-pointer"
                        title="Approve Step 1 and forward to Finance review"
                      >
                        <ArrowRight className="w-4 h-4 text-white" />
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
                        className="btn btn-sm btn-primary bg-black hover:bg-[#282828] border-black text-white text-sm flex items-center gap-2 shadow-xs cursor-pointer"
                      >
                        <CheckCircle className="w-4 h-4 text-white" />
                        <span>Approve Quotation</span>
                      </button>
                    )}

                  </div>
                </div>

              </div>

              {/* Historical Audit Trail Table */}
              <div className="card bg-white border border-[#e2e2e2] rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-black flex items-center gap-2 border-b border-[#e2e2e2] pb-3">
                  <History className="w-5 h-5 text-black" />
                  <span>Historical Audit Trail & Governance Log ({logs.length})</span>
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-[#e2e2e2] bg-[#efefef] text-black font-bold text-xs uppercase tracking-wider">
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">Reviewer</th>
                        <th className="py-3 px-4">Action</th>
                        <th className="py-3 px-4">Risk Score</th>
                        <th className="py-3 px-4">Reason / Governance Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e2e2e2]">
                      {logs.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center py-6 text-[#5e5e5e] text-sm">
                            No approval audit logs recorded for this deal yet.
                          </td>
                        </tr>
                      ) : logs.map(log => (
                        <tr key={log.id} className="hover:bg-[#f9f9f9]">
                          <td className="py-3 px-4 font-mono text-[#5e5e5e] text-xs">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-3 px-4 font-semibold text-black">
                            {log.user} <span className="text-[#5e5e5e] font-normal text-xs">({log.role})</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="badge bg-[#efefef] border border-[#e2e2e2] text-black text-xs font-semibold">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-black text-sm">
                            {log.blendedRiskScore !== undefined ? log.blendedRiskScore : '—'}
                          </td>
                          <td className="py-3 px-4 text-[#5e5e5e] text-xs max-w-xs">
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
