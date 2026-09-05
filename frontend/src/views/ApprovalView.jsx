import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, XCircle, CheckCircle, History, MessageSquare, RotateCcw, AlertTriangle, UserCheck } from 'lucide-react';

export const ApprovalView = () => {
  const { data, activeQuote, setActiveQuoteId, updateActiveQuote, addApprovalLog, currentRole, showToast } = useApp();
  const [reason, setReason] = useState('');

  const reviewQuotes = data.quotations.filter(q => 
    q.status === 'Pending Approval' || q.status === 'In Negotiation'
  );
  
  // Fallback if no pending quotes exist
  const displayQuote = activeQuote || data.quotations[0];
  const logs = data.approvalLogs.filter(l => l.quoteId === displayQuote.id);
  const customerComments = displayQuote.comments || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-cream border border-warm p-4 rounded-xl">
        <div>
          <h2 className="text-xl font-bold text-charcoal flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-600" /> Discount Governance & Approval Queue
          </h2>
          <p className="text-xs text-muted">Review risky quotations and customer counter-discount negotiation requests.</p>
        </div>

        <span className="badge badge-warning text-xs px-3 py-1 font-mono font-bold">
          {reviewQuotes.length} Deals Pending Review / Negotiation
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar Queue */}
        <div className="lg:col-span-4 space-y-3">
          <div className="card">
            <h3 className="text-sm font-bold text-charcoal mb-3 flex items-center justify-between">
              <span>Quotations Needing Review</span>
              <span className="badge badge-neutral text-[10px]">{reviewQuotes.length}</span>
            </h3>

            <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
              {reviewQuotes.length === 0 ? (
                <div className="text-xs text-muted py-8 text-center border border-dashed border-warm rounded-lg">
                  No quotations currently pending approval or negotiation.
                </div>
              ) : reviewQuotes.map(q => {
                const isSelected = q.id === displayQuote.id;
                const cust = data.customers.find(c => c.id === q.customerId);
                const hasCounter = q.comments && q.comments.some(c => c.role === 'customer');

                return (
                  <div
                    key={q.id}
                    onClick={() => setActiveQuoteId(q.id)}
                    className={`p-3 border rounded-lg cursor-pointer transition-all space-y-1.5 ${
                      isSelected ? 'border-charcoal bg-charcoal-04 shadow-sm' : 'border-warm hover:border-interactive bg-cream'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-charcoal">{q.code}</span>
                      <span className={`badge ${
                        q.status === 'Pending Approval' ? 'badge-warning' : 'badge-info'
                      } text-[10px]`}>
                        {q.status}
                      </span>
                    </div>

                    <p className="text-xs text-muted">Customer: <strong className="text-charcoal">{cust?.name}</strong> ({cust?.tier})</p>

                    {hasCounter && (
                      <span className="badge badge-warning text-[9px] flex items-center gap-1 w-fit">
                        <MessageSquare className="w-2.5 h-2.5" /> Customer Negotiation Request
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Review Panel */}
        <div className="lg:col-span-8 space-y-6">
          <div className="card bg-cream space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-warm pb-3">
              <div>
                <h3 className="text-lg font-bold text-charcoal">{displayQuote.code} Approval & Negotiation Review</h3>
                <p className="text-xs text-muted">Handling Rep: <strong>{displayQuote.repName || 'Rahul'}</strong> • Status: <strong className="text-amber-800">{displayQuote.status}</strong></p>
              </div>

              <span className="badge badge-warning text-xs px-3 py-1 font-mono">
                Risk Score: 6.3 Flagged
              </span>
            </div>

            {/* Customer Negotiation & Counter Offer Panel */}
            <div className="p-4 border border-amber-300 bg-amber-50/50 rounded-xl space-y-3">
              <h4 className="font-bold text-sm text-amber-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-700" /> Customer Negotiation Requests & Notes
              </h4>

              {customerComments.length === 0 ? (
                <p className="text-xs text-amber-800 italic">No customer negotiation comments posted on this quotation yet.</p>
              ) : (
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                  {customerComments.map(c => (
                    <div key={c.id} className="p-2.5 rounded-lg border border-amber-200 bg-cream text-xs space-y-1">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-charcoal flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> {c.sender} ({c.role})
                        </span>
                        <span className="text-[10px] text-muted font-mono">{new Date(c.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-charcoal font-medium">{c.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reviewer Action Controls */}
            <div className="border-t border-warm pt-4 space-y-3">
              <label className="label text-xs font-bold">Reviewer Decision Notes / Justification</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="textarea text-xs"
                placeholder="Add approval rationale, conditions, counter-offer adjustments, or rejection reason..."
              />

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    updateActiveQuote(q => { q.status = 'Draft'; });
                    addApprovalLog({
                      quoteId: displayQuote.id,
                      user: currentRole === 'finance' ? 'Finance Officer' : 'Sales Manager',
                      role: currentRole,
                      action: 'Returned for Revision',
                      blendedRiskScore: 6.3,
                      reason: reason || 'Returned to Sales Rep for discount adjustment.'
                    });
                    showToast('Quotation returned to Sales Rep for revision.', 'info');
                  }}
                  className="btn btn-sm btn-outline text-amber-800 border-amber-300 hover:bg-amber-50"
                >
                  <RotateCcw className="w-4 h-4" /> Return for Revision
                </button>

                <button
                  onClick={() => {
                    updateActiveQuote(q => { q.status = 'Draft'; });
                    addApprovalLog({
                      quoteId: displayQuote.id,
                      user: currentRole === 'finance' ? 'Finance Officer' : 'Sales Manager',
                      role: currentRole,
                      action: 'Quotation Rejected',
                      blendedRiskScore: 6.3,
                      reason: reason || 'Rejected due to excessive margin erosion.'
                    });
                    showToast('Quotation rejected.', 'error');
                  }}
                  className="btn btn-sm btn-danger"
                >
                  <XCircle className="w-4 h-4" /> Reject Quote
                </button>

                <button
                  onClick={() => {
                    updateActiveQuote(q => { q.status = 'Approved'; });
                    addApprovalLog({
                      quoteId: displayQuote.id,
                      user: currentRole === 'finance' ? 'Finance Officer' : 'Sales Manager',
                      role: currentRole,
                      action: 'Quotation Approved',
                      blendedRiskScore: 6.3,
                      reason: reason || 'Approved within manager discretion threshold.'
                    });
                    showToast('Quotation approved & confirmed!', 'success');
                  }}
                  className="btn btn-sm btn-primary"
                >
                  <CheckCircle className="w-4 h-4" /> Approve Quotation
                </button>
              </div>
            </div>
          </div>

          {/* Audit History Log */}
          <div className="card">
            <h3 className="text-sm font-bold text-charcoal mb-3 flex items-center gap-2">
              <History className="w-4 h-4 text-charcoal" /> Historical Audit Trail
            </h3>

            <div className="table-container">
              <table className="table text-xs">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Reason / Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr><td colSpan="4" className="text-center py-4 text-muted text-xs">No audit logs recorded for this quote yet.</td></tr>
                  ) : logs.map(log => (
                    <tr key={log.id}>
                      <td className="font-mono text-xs">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="font-medium">{log.user} ({log.role})</td>
                      <td><span className="badge badge-info text-[10px]">{log.action}</span></td>
                      <td className="text-xs text-muted">{log.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
