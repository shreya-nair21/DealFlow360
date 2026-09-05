import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CreditCard, FileCheck, Calculator } from 'lucide-react';

export const BillingView = () => {
  const { activeQuote } = useApp();
  const [oldQty, setOldQty] = useState(10);
  const [newQty, setNewQty] = useState(15);
  const [days, setDays] = useState(12);

  const pricePerMonth = 450;
  const originalCost = pricePerMonth * oldQty;
  const usedCost = ((pricePerMonth * oldQty) / 30) * days;
  const newRemainingCost = ((pricePerMonth * newQty) / 30) * (30 - days);
  const adjustedCost = usedCost + newRemainingCost;
  const adjustment = adjustedCost - originalCost;

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between bg-cream border border-warm p-4 rounded-xl">
        <div>
          <h2 class="text-xl font-bold text-charcoal flex items-center gap-2">
            <CreditCard class="w-6 h-6 text-emerald-600" /> Hybrid Billing & Subscription Reconciliation
          </h2>
          <p class="text-xs text-muted">Reconcile one-time hardware/service invoices with recurring subscription schedules on a single order.</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-8 space-y-6">
          <div class="card">
            <div class="card-header border-b border-warm pb-3">
              <h3 class="text-base font-bold text-charcoal">Generated 12-Month Billing Schedule</h3>
              <button onClick={() => alert('Invoice issued successfully.')} class="btn btn-sm btn-primary">
                <FileCheck class="w-4 h-4" /> Issue Initial Invoice
              </button>
            </div>

            <div class="table-container my-3">
              <table class="table">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>One-Time Amt</th>
                    <th>Recurring Amt</th>
                    <th>Total Invoice</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="font-semibold bg-emerald-50/20">
                    <td>Immediate (Month 1)</td>
                    <td>$45,000</td>
                    <td>$4,500</td>
                    <td class="font-bold text-charcoal">$49,500</td>
                    <td><span class="badge badge-success text-[10px]">Invoiced</span></td>
                  </tr>
                  {[2, 3, 4, 5, 6].map(m => (
                    <tr key={m}>
                      <td>Month {m}</td>
                      <td>$0</td>
                      <td>$4,500</td>
                      <td class="font-bold text-charcoal">$4,500</td>
                      <td><span class="badge badge-neutral text-[10px]">Scheduled</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div class="card bg-cream border-emerald-200">
            <div class="card-header border-b border-warm pb-3">
              <h3 class="text-base font-bold text-charcoal flex items-center gap-2">
                <Calculator class="w-4 h-4 text-emerald-600" /> Mid-Cycle Proration & Credit Note Engine
              </h3>
            </div>

            <div class="grid grid-cols-3 gap-3 my-4">
              <div>
                <label class="label text-[10px]">Old Qty</label>
                <input type="number" value={oldQty} onChange={(e) => setOldQty(parseInt(e.target.value)||0)} class="input text-xs" />
              </div>
              <div>
                <label class="label text-[10px]">New Qty</label>
                <input type="number" value={newQty} onChange={(e) => setNewQty(parseInt(e.target.value)||0)} class="input text-xs" />
              </div>
              <div>
                <label class="label text-[10px]">Days Elapsed</label>
                <input type="number" value={days} onChange={(e) => setDays(parseInt(e.target.value)||0)} class="input text-xs" />
              </div>
            </div>

            <div class="p-3 bg-charcoal-03 border border-warm rounded-lg text-xs space-y-1">
              <div class="flex justify-between"><span>Original Month Charge:</span><strong>${originalCost}</strong></div>
              <div class="flex justify-between"><span>Prorated Month Total:</span><strong>${adjustedCost.toFixed(2)}</strong></div>
              <div class="flex justify-between border-t border-warm pt-2 font-bold text-emerald-700">
                <span>Proration Adjustment:</span>
                <span>+${adjustment.toFixed(2)} Invoice Charge</span>
              </div>
            </div>
          </div>
        </div>

        <div class="lg:col-span-4">
          <div class="card">
            <h3 class="text-base font-bold text-charcoal mb-3">Hybrid Lines</h3>
            <p class="text-xs text-muted">Includes both one-time hardware lines and monthly subscription recurring lines.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
