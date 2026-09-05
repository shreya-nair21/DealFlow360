import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, MessageSquare, Send } from 'lucide-react';

export const CustomerPortalView = () => {
  const { data, activeQuote, updateActiveQuote, addApprovalLog } = useApp();
  const [commentText, setCommentText] = useState('');
  const [counterDiscount, setCounterDiscount] = useState('');

  const customer = data.customers.find(c => c.id === activeQuote.customerId);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-cream border border-warm p-6 rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-warm pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="badge badge-neutral text-xs font-mono">Restricted Customer Portal</span>
              <span className="badge badge-warning text-xs">{activeQuote.status}</span>
            </div>
            <h2 className="text-2xl font-bold text-charcoal mt-1">Quotation {activeQuote.code}</h2>
            <p className="text-xs text-muted">Prepared for <strong>{customer?.name}</strong></p>
          </div>

          <button 
            onClick={() => {
              updateActiveQuote(q => { q.status = 'Confirmed'; });
              addApprovalLog({
                quoteId: activeQuote.id,
                user: customer?.name || 'Customer',
                role: 'customer',
                action: 'Confirmed Quote via Portal',
                blendedRiskScore: 0,
                reason: 'Customer accepted terms and confirmed quote online.'
              });
              alert('Thank you! Quotation confirmed successfully.');
            }}
            className="btn btn-primary btn-md"
          >
            <CheckCircle2 className="w-4 h-4" /> Confirm & Accept Quotation
          </button>
        </div>

        <p className="text-xs text-muted">You can request changes or confirm the quotation with one click.</p>
      </div>

      {/* Negotiation Panel */}
      <div className="card bg-cream border-warm space-y-4">
        <h3 className="text-base font-bold text-charcoal flex items-center gap-2 border-b border-warm pb-2">
          <MessageSquare className="w-4 h-4 text-charcoal" /> Live Negotiation & Line Comments
        </h3>

        <div className="space-y-2 max-h-[220px] overflow-y-auto">
          {activeQuote.comments.map(c => (
            <div key={c.id} className="p-2.5 rounded-lg border border-warm bg-charcoal-03 text-xs space-y-1">
              <div className="flex items-center justify-between font-semibold">
                <span>{c.sender}</span>
                <span className="text-[10px] text-muted font-mono">{new Date(c.timestamp).toLocaleTimeString()}</span>
              </div>
              <p className="text-charcoal">{c.text}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3 pt-3 border-t border-warm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="label text-[10px]">Add Note / Line Question</label>
              <input 
                type="text" 
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="input text-xs" 
                placeholder="e.g. Requesting 15% discount on deployment service line..."
              />
            </div>
            <div>
              <label className="label text-[10px]">Requested Counter Discount %</label>
              <input 
                type="number" 
                value={counterDiscount}
                onChange={(e) => setCounterDiscount(e.target.value)}
                className="input text-xs" 
                placeholder="e.g. 15"
              />
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button 
              onClick={() => {
                if (!commentText && !counterDiscount) {
                  alert('Please enter a comment or counter discount.');
                  return;
                }
                const fullText = commentText + (counterDiscount ? ` (Requested Counter Discount: ${counterDiscount}%)` : '');
                
                updateActiveQuote(q => {
                  q.comments.push({
                    id: 'cm-' + Date.now(),
                    sender: customer?.name || 'Customer',
                    role: 'customer',
                    text: fullText,
                    timestamp: new Date().toISOString()
                  });

                  if (parseFloat(counterDiscount) > 10) {
                    q.status = 'Pending Approval';
                    alert('Counter request submitted. Because it exceeds normal discount ceilings, it has been automatically routed to the Sales Manager for approval.');
                  } else {
                    q.status = 'In Negotiation';
                    alert('Negotiation request submitted to sales team.');
                  }
                });

                setCommentText('');
                setCounterDiscount('');
              }}
              className="btn btn-sm btn-outline"
            >
              <Send className="w-4 h-4" /> Submit Negotiation Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
