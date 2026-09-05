import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, MessageSquare, Send } from 'lucide-react';

export const CustomerPortalView = () => {
  const { data, activeQuote, updateActiveQuote, addApprovalLog } = useApp();
  const [commentText, setCommentText] = useState('');
  const [counterDiscount, setCounterDiscount] = useState('');

  const customer = data.customers.find(c => c.id === activeQuote.customerId);

  return (
    <div class="space-y-6 max-w-4xl mx-auto">
      <div class="bg-cream border border-warm p-6 rounded-xl space-y-4">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-warm pb-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="badge badge-neutral text-xs font-mono">Restricted Customer Portal</span>
              <span class="badge badge-warning text-xs">{activeQuote.status}</span>
            </div>
            <h2 class="text-2xl font-bold text-charcoal mt-1">Quotation {activeQuote.code}</h2>
            <p class="text-xs text-muted">Prepared for <strong>{customer?.name}</strong></p>
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
            class="btn btn-primary btn-md"
          >
            <CheckCircle2 class="w-4 h-4" /> Confirm & Accept Quotation
          </button>
        </div>

        <p class="text-xs text-muted">You can request changes or confirm the quotation with one click.</p>
      </div>

      {/* Negotiation Panel */}
      <div class="card bg-cream border-warm space-y-4">
        <h3 class="text-base font-bold text-charcoal flex items-center gap-2 border-b border-warm pb-2">
          <MessageSquare class="w-4 h-4 text-charcoal" /> Live Negotiation & Line Comments
        </h3>

        <div class="space-y-2 max-h-[220px] overflow-y-auto">
          {activeQuote.comments.map(c => (
            <div key={c.id} class="p-2.5 rounded-lg border border-warm bg-charcoal-03 text-xs space-y-1">
              <div class="flex items-center justify-between font-semibold">
                <span>{c.sender}</span>
                <span class="text-[10px] text-muted font-mono">{new Date(c.timestamp).toLocaleTimeString()}</span>
              </div>
              <p class="text-charcoal">{c.text}</p>
            </div>
          ))}
        </div>

        <div class="space-y-3 pt-3 border-t border-warm">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="sm:col-span-2">
              <label class="label text-[10px]">Add Note / Line Question</label>
              <input 
                type="text" 
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                class="input text-xs" 
                placeholder="e.g. Requesting 15% discount on deployment service line..."
              />
            </div>
            <div>
              <label class="label text-[10px]">Requested Counter Discount %</label>
              <input 
                type="number" 
                value={counterDiscount}
                onChange={(e) => setCounterDiscount(e.target.value)}
                class="input text-xs" 
                placeholder="e.g. 15"
              />
            </div>
          </div>

          <div class="flex items-center justify-end">
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
              class="btn btn-sm btn-outline"
            >
              <Send class="w-4 h-4" /> Submit Negotiation Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
