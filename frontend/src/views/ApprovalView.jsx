import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, XCircle, CheckCircle, History } from 'lucide-react';

export const ApprovalView = () => {
  const { data, activeQuote, setActiveQuoteId, updateActiveQuote, addApprovalLog, currentRole } = useApp();
  const [reason, setReason] = useState('');

  const pendingQuotes = data.quotations.filter(q => q.status === 'Pending Approval');
  const logs = data.approvalLogs.filter(l => l.quoteId === activeQuote.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-cream border border-warm p-4 rounded-xl">
        <div>
          <h2 className="text-xl font-bold text-charcoal flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-600" /> Discount Governance & Approval Queue
          </h2>
          <p className="text-xs text-muted">Review quotations exceeding tier and category discount ceilings.</p>
        </div>

        <span className="badge badge-warning text-xs px-3 py-1">
          {pendingQuotes.length} Quotes Pending Approval
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar Queue */}
        <div className="lg:col-span-4 space-y-3">
          <div className="card">
            <h3 className="text-sm font-bold text-charcoal mb-3">Quotations Requiring Review</h3>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {pendingQuotes.length === 0 ? (
                <div className="text-xs text-muted py-8 text-center">No quotations currently pending approval.</div>
              ) : pendingQuotes.map(q => {
                const isSelected = q.id === activeQuote.id;
                const cust = data.customers.find(c => c.id === q.customerId);
                return (
                  <div
                    key={q.id}
                    onClick={() => setActiveQuoteId(q.id)}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${isSelected ? 'border-charcoal bg-charcoal-04 shadow-sm' : 'border-warm hover:border-interactive bg-cream'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-charcoal">{q.code}</span>
                      <span className="badge badge-warning text-[10px]">{q.status}</span>
                    </div>
                    <p className="text-xs text-muted mt-1">Customer: <strong>{cust?.name}</strong> ({cust?.tier})</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Review Panel */}
        <div className="lg:col-span-8 space-y-6">
          <div className="card bg-cream">
            <h3 className="text-lg font-bold text-charcoal border-b border-warm pb-3">{activeQuote.code} Approval Review</h3>

            <div className="my-4 p-3 rounded-lg border text-xs bg-amber-50 border-amber-200 text-amber-900">
              <strong>Approval Status:</strong> {activeQuote.status}
            </div>

            <div className="border-t border-warm pt-4 space-y-3">
              <label className="label">Reviewer Decision Notes / Justification</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="textarea text-xs"
                placeholder="Add approval rationale, conditions, or rejection reason..."
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    updateActiveQuote(q => { q.status = 'Draft'; });
                    addApprovalLog({
                      quoteId: activeQuote.id,
                      user: currentRole === 'finance' ? 'Finance Officer' : 'Sales Manager',
                      role: currentRole,
                      action: 'Quotation Rejected',
                      blendedRiskScore: 6.4,
                      reason: reason || 'Rejected due to excessive margin erosion.'
                    });
                    alert('Quotation rejected.');
                  }}
                  className="btn btn-sm btn-danger"
                >
                  <XCircle className="w-4 h-4" /> Reject Quote
                </button>

                <button
                  onClick={() => {
                    updateActiveQuote(q => { q.status = 'Approved'; });
                    addApprovalLog({
                      quoteId: activeQuote.id,
                      user: currentRole === 'finance' ? 'Finance Officer' : 'Sales Manager',
                      role: currentRole,
                      action: 'Quotation Approved',
                      blendedRiskScore: 6.4,
                      reason: reason || 'Approved within manager discretion threshold.'
                    });
                    alert('Quotation approved!');
                  }}
                  className="btn btn-sm btn-primary"
                >
                  <CheckCircle className="w-4 h-4" /> Approve Quotation
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-sm font-bold text-charcoal mb-3 flex items-center gap-2">
              <History className="w-4 h-4" /> Historical Audit Trail
            </h3>

            <div className="table-container">
              <table className="table">
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
